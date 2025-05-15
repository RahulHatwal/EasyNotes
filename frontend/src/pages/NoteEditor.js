import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import { updateNote, setCurrentNote } from '../store/slices/notesSlice';
import ShareNoteDialog from '../components/ShareNoteDialog';

const AUTOSAVE_DELAY = 1000;

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [socket, setSocket] = useState(null);
  const [localNote, setLocalNote] = useState({ title: '', content: '' });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const { currentNote } = useSelector((state) => state.notes);
  const { user } = useSelector((state) => state.auth);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('join_note', id);
    });

    newSocket.on('note_updated', (updatedNote) => {
      if (updatedNote._id === id && updatedNote.lastUpdated !== currentNote?.lastUpdated) {
        setLocalNote({
          title: updatedNote.title,
          content: updatedNote.content,
        });
        dispatch(setCurrentNote(updatedNote));
        setNotification({
          type: 'info',
          message: `Note updated by ${updatedNote.lastModifiedBy?.name || 'another user'}`,
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_note', id);
      newSocket.disconnect();
    };
  }, [id, dispatch, currentNote?.lastUpdated]);

  // Fetch note data
  useEffect(() => {
    if (currentNote?._id === id) {
      setLocalNote({
        title: currentNote.title,
        content: currentNote.content,
      });
    }
  }, [currentNote, id]);

  // Autosave functionality
  const saveChanges = useCallback(() => {
    if (currentNote && (localNote.title !== currentNote.title || localNote.content !== currentNote.content)) {
      dispatch(updateNote({
        id,
        title: localNote.title,
        content: localNote.content,
      }));
    }
  }, [dispatch, id, localNote, currentNote]);

  useEffect(() => {
    const timer = setTimeout(saveChanges, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [localNote, saveChanges]);

  const handleChange = (field) => (event) => {
    setLocalNote((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const canEdit = currentNote?.createdBy._id === user._id ||
    currentNote?.collaborators.some(c => c.userId._id === user._id && c.permission === 'write');

  if (!currentNote) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            variant="standard"
            value={localNote.title}
            onChange={handleChange('title')}
            disabled={!canEdit}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '2rem',
                fontWeight: 'bold',
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={`Owner: ${currentNote.createdBy.name}`}
              size="small"
            />
            {currentNote.collaborators.map((collab) => (
              <Chip
                key={collab.userId._id}
                label={`${collab.userId.name} (${collab.permission})`}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
        {currentNote.createdBy._id === user._id && (
          <Tooltip title="Share">
            <IconButton onClick={() => setShareDialogOpen(true)}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          minHeight: '60vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <TextField
          fullWidth
          multiline
          variant="standard"
          value={localNote.content}
          onChange={handleChange('content')}
          disabled={!canEdit}
          InputProps={{
            disableUnderline: true,
          }}
          sx={{
            '& .MuiInputBase-input': {
              lineHeight: 1.8,
            },
          }}
        />
      </Paper>

      {!canEdit && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          You have read-only access to this note
        </Typography>
      )}

      {currentNote && (
        <ShareNoteDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          note={currentNote}
        />
      )}

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert
            onClose={() => setNotification(null)}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default NoteEditor; 