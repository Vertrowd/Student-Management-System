import express from 'express';
import Notice from '../models/Notice.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notices
// @desc    Get notices for the current user role
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const role = req.user.role;
    // Show notices meant for 'all' or specifically for their role
    const notices = await Notice.find({
      targetRole: { $in: ['all', role] }
    })
      .populate('author', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/notices
// @desc    Create a notice
// @access  Private (Teacher, Admin only)
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, content, targetRole } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Please provide a title and content' });
    }

    const notice = await Notice.create({
      title,
      content,
      targetRole: targetRole || 'all',
      author: req.user.id
    });

    res.status(201).json({
      success: true,
      data: notice
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/notices/:id
// @desc    Delete a notice
// @access  Private (Teacher, Admin only)
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Optional: check if the teacher is the author (or is admin)
    if (notice.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this notice' });
    }

    await notice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notice removed'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
