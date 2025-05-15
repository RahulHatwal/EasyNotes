const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
noteSchema.index({ createdBy: 1, lastUpdated: -1 });
noteSchema.index({ 'collaborators.userId': 1 });

// Method to check if a user has write permission
noteSchema.methods.hasWritePermission = function(userId) {
  if (this.createdBy.equals(userId)) return true;
  
  const collaborator = this.collaborators.find(c => c.userId.equals(userId));
  return collaborator && collaborator.permission === 'write';
};

// Method to check if a user has read permission
noteSchema.methods.hasReadPermission = function(userId) {
  if (this.createdBy.equals(userId)) return true;
  
  return this.collaborators.some(c => c.userId.equals(userId));
};

// Pre-save middleware to update lastUpdated
noteSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note; 