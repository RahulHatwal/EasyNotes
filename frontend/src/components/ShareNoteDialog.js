import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { shareNote, removeCollaborator } from '../store/slices/notesSlice';

const ShareNoteDialog = ({ open, onClose, note }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const dispatch = useDispatch();

  const handleShare = () => {
    dispatch(shareNote({
      id: note._id,
      email,
      permission
    })).then(() => {
      setEmail('');
      setPermission('read');
    });
  };

  const handleRemoveCollaborator = (userId) => {
    dispatch(removeCollaborator({
      noteId: note._id,
      userId
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Note</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Share "{note.title}" with others
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Permission</InputLabel>
              <Select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                label="Permission"
              >
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="write">Write</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleShare}
              disabled={!email}
            >
              Share
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          People with access
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary={note.createdBy.name}
              secondary={note.createdBy.email}
            />
            <ListItemText
              primary="Owner"
              sx={{ textAlign: 'right' }}
            />
          </ListItem>
          {note.collaborators.map((collaborator) => (
            <ListItem key={collaborator.userId._id}>
              <ListItemText
                primary={collaborator.userId.name}
                secondary={collaborator.userId.email}
              />
              <ListItemText
                primary={collaborator.permission === 'write' ? 'Can edit' : 'Can view'}
                sx={{ textAlign: 'right' }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveCollaborator(collaborator.userId._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareNoteDialog; 