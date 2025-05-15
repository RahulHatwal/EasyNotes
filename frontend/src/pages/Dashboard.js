import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { fetchNotes, createNote, deleteNote } from '../store/slices/notesSlice';
import ShareNoteDialog from '../components/ShareNoteDialog';

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notes, totalPages, loading } = useSelector((state) => state.notes);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchNotes({ page }));
  }, [dispatch, page]);

  const handleCreateNote = () => {
    dispatch(createNote(newNote)).then(() => {
      setOpen(false);
      setNewNote({ title: '', content: '' });
    });
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      dispatch(deleteNote(noteId));
    }
  };

  const handleShareNote = (note) => {
    setSelectedNote(note);
    setShareDialogOpen(true);
  };

  const filterNotes = () => {
    if (currentTab === 0) {
      return notes.filter((note) => note.createdBy._id === user._id);
    }
    return notes.filter((note) =>
      note.collaborators.some((collab) => collab.userId._id === user._id)
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Notes
        </Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Box>

      <Tabs
        value={currentTab}
        onChange={(e, newValue) => setCurrentTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="My Notes" />
        <Tab label="Shared with Me" />
      </Tabs>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {filterNotes().map((note) => (
              <Grid item xs={12} sm={6} md={4} key={note._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {note.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {note.content}
                    </Typography>
                    <Box
                      sx={{
                        mt: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {new Date(note.lastUpdated).toLocaleDateString()}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/notes/${note._id}`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {note.createdBy._id === user._id && (
                          <>
                            <Tooltip title="Share">
                              <IconButton
                                size="small"
                                onClick={() => handleShareNote(note)}
                              >
                                <ShareIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteNote(note._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Note Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={4}
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateNote}
            variant="contained"
            disabled={!newNote.title || !newNote.content}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Note Dialog */}
      {selectedNote && (
        <ShareNoteDialog
          open={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setSelectedNote(null);
          }}
          note={selectedNote}
        />
      )}
    </Box>
  );
};

export default Dashboard; 