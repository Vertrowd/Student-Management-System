import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: {
    type: String,
    enum: ['all', 'student', 'teacher'],
    default: 'all'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notice', noticeSchema);
