import express from 'express';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import FocusSession from '../models/FocusSession.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected by auth middleware
router.use(protect);

// ================= TASKS API =================

// @route   GET /api/productivity/tasks
// @desc    Get all tasks for the current user
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching tasks', error: error.message });
  }
});

// @route   POST /api/productivity/tasks
// @desc    Create a new task
router.post('/tasks', async (req, res) => {
  try {
    const { title, category, priority, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Please add a title for the task' });
    }

    const task = await Task.create({
      user: req.user.id,
      title,
      category,
      priority,
      dueDate: dueDate || null
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating task', error: error.message });
  }
});

// @route   PUT /api/productivity/tasks/:id
// @desc    Update a task status, title, category, etc.
router.put('/tasks/:id', async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Ensure user owns task
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this task' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating task', error: error.message });
  }
});

// @route   DELETE /api/productivity/tasks/:id
// @desc    Delete a task
router.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Ensure user owns task
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.status(200).json({ success: true, message: 'Task removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting task', error: error.message });
  }
});

// ================= NOTES API =================

// @route   GET /api/productivity/notes
// @desc    Get all journal notes for the current user
router.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching notes', error: error.message });
  }
});

// @route   POST /api/productivity/notes
// @desc    Create a new study note
router.post('/notes', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Please add a note title' });
    }

    const note = await Note.create({
      user: req.user.id,
      title,
      content: content || '',
      color: color || '#8b5cf6'
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating note', error: error.message });
  }
});

// @route   PUT /api/productivity/notes/:id
// @desc    Update a note content or color
router.put('/notes/:id', async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Ensure user owns note
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this note' });
    }

    note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating note', error: error.message });
  }
});

// @route   DELETE /api/productivity/notes/:id
// @desc    Delete a note
router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Ensure user owns note
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.status(200).json({ success: true, message: 'Note removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting note', error: error.message });
  }
});

// ================= POMODORO FOCUS SESSIONS API =================

// @route   GET /api/productivity/focus
// @desc    Get focus session logs and aggregate totals
router.get('/focus', async (req, res) => {
  try {
    const sessions = await FocusSession.find({ user: req.user.id }).sort({ date: -1 });
    
    // Aggregate calculations (e.g. today's focus, total focus)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const todaySessions = sessions.filter(s => new Date(s.date) >= today);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        stats: {
          todayMinutes,
          totalMinutes,
          sessionCount: sessions.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching focus sessions', error: error.message });
  }
});

// @route   POST /api/productivity/focus
// @desc    Log a focus session
router.post('/focus', async (req, res) => {
  try {
    const { duration, category } = req.body;
    if (!duration || duration <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide session focus duration' });
    }

    const session = await FocusSession.create({
      user: req.user.id,
      duration,
      category: category || 'Study'
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error logging focus session', error: error.message });
  }
});

export default router;
