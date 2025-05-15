import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to set auth header
const setAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Async thunks
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/notes?page=${page}&limit=${limit}`,
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createNote = createAsyncThunk(
  'notes/createNote',
  async ({ title, content }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/notes`,
        { title, content },
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, title, content }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/notes/${id}`,
        { title, content },
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/notes/${id}`, setAuthHeader());
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const shareNote = createAsyncThunk(
  'notes/shareNote',
  async ({ id, email, permission }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/notes/${id}/share`,
        { email, permission },
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeCollaborator = createAsyncThunk(
  'notes/removeCollaborator',
  async ({ noteId, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_URL}/notes/${noteId}/collaborators/${userId}`,
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  notes: [],
  currentNote: null,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setCurrentNote: (state, action) => {
      state.currentNote = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateNoteInRealtime: (state, action) => {
      const updatedNote = action.payload;
      const index = state.notes.findIndex((note) => note._id === updatedNote._id);
      if (index !== -1) {
        state.notes[index] = updatedNote;
      }
      if (state.currentNote?._id === updatedNote._id) {
        state.currentNote = updatedNote;
      }
    },
    removeNoteInRealtime: (state, action) => {
      const noteId = action.payload;
      state.notes = state.notes.filter((note) => note._id !== noteId);
      if (state.currentNote?._id === noteId) {
        state.currentNote = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.notes;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch notes';
      })
      // Create note
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes.unshift(action.payload);
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create note';
      })
      // Update note
      .addCase(updateNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex(
          (note) => note._id === action.payload._id
        );
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
        if (state.currentNote?._id === action.payload._id) {
          state.currentNote = action.payload;
        }
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update note';
      })
      // Delete note
      .addCase(deleteNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note._id !== action.payload);
        if (state.currentNote?._id === action.payload) {
          state.currentNote = null;
        }
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete note';
      })
      // Share note
      .addCase(shareNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shareNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex(
          (note) => note._id === action.payload._id
        );
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
        if (state.currentNote?._id === action.payload._id) {
          state.currentNote = action.payload;
        }
      })
      .addCase(shareNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to share note';
      })
      // Remove collaborator
      .addCase(removeCollaborator.fulfilled, (state, action) => {
        const index = state.notes.findIndex(
          (note) => note._id === action.payload._id
        );
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
        if (state.currentNote?._id === action.payload._id) {
          state.currentNote = action.payload;
        }
      });
  },
});

export const {
  setCurrentNote,
  clearError,
  updateNoteInRealtime,
  removeNoteInRealtime,
} = notesSlice.actions;

export default notesSlice.reducer; 