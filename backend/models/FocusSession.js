import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number, // duration in minutes
    required: true
  },
  category: {
    type: String,
    default: 'Study'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('FocusSession', focusSessionSchema);
