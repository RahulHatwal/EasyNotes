const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const Note = require('../models/Note');
const User = require('../models/User');

const router = express.Router();

// Get single note by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('collaborators.userId', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user has permission to view this note
    const isCreator = note.createdBy._id.equals(req.user._id);
    const isCollaborator = note.collaborators.some(c => c.userId._id.equals(req.user._id));

    if (!isCreator && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to view this note' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all notes (with pagination)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notes = await Note.find({
      $or: [
        { createdBy: req.user._id },
        { 'collaborators.userId': req.user._id }
      ],
      isArchived: false
    })
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('collaborators.userId', 'name email');

    const total = await Note.countDocuments({
      $or: [
        { createdBy: req.user._id },
        { 'collaborators.userId': req.user._id }
      ],
      isArchived: false
    });

    res.json({
      notes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotes: total
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create note
router.post('/',
  auth,
  rateLimiter,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content } = req.body;

      const note = new Note({
        title,
        content,
        createdBy: req.user._id
      });

      await note.save();

      // Populate user information
      await note.populate('createdBy', 'name email');

      res.status(201).json(note);
    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update note
router.put('/:id',
  auth,
  rateLimiter,
  [
    body('title').trim().optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').trim().optional().notEmpty().withMessage('Content cannot be empty')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const note = await Note.findById(req.params.id);
      
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      if (!note.hasWritePermission(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to update this note' });
      }

      const { title, content } = req.body;

      if (title) note.title = title;
      if (content) note.content = content;
      note.lastUpdated = Date.now();
      note.lastModifiedBy = req.user._id;

      await note.save();
      await note.populate('createdBy', 'name email');
      await note.populate('collaborators.userId', 'name email');
      await note.populate('lastModifiedBy', 'name email');

      // Emit socket event for real-time updates
      req.app.get('io').to(note._id.toString()).emit('note_updated', {
        ...note.toObject(),
        updatedByUserId: req.user._id
      });

      res.json(note);
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (!note.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await Note.findByIdAndDelete(req.params.id);

    // Emit socket event for real-time updates
    req.app.get('io').to(note._id.toString()).emit('note_deleted', note._id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share note
router.post('/:id/share',
  auth,
  rateLimiter,
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email'),
    body('permission').isIn(['read', 'write']).withMessage('Invalid permission type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const note = await Note.findById(req.params.id);
      
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      if (!note.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to share this note' });
      }

      const { email, permission } = req.body;

      // Find user to share with
      const userToShare = await User.findOne({ email });
      if (!userToShare) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if already shared
      const existingCollaborator = note.collaborators.find(c => 
        c.userId.equals(userToShare._id)
      );

      if (existingCollaborator) {
        existingCollaborator.permission = permission;
      } else {
        note.collaborators.push({
          userId: userToShare._id,
          permission
        });
      }

      await note.save();
      await note.populate('collaborators.userId', 'name email');

      // Emit socket event for real-time updates
      req.app.get('io').to(note._id.toString()).emit('note_shared', {
        noteId: note._id,
        sharedWith: {
          userId: userToShare._id,
          name: userToShare.name,
          email: userToShare.email,
          permission
        }
      });

      res.json(note);
    } catch (error) {
      console.error('Share note error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Remove collaborator
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (!note.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to modify collaborators' });
    }

    note.collaborators = note.collaborators.filter(
      c => !c.userId.equals(req.params.userId)
    );

    await note.save();

    // Emit socket event for real-time updates
    req.app.get('io').to(note._id.toString()).emit('collaborator_removed', {
      noteId: note._id,
      userId: req.params.userId
    });

    res.json(note);
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 