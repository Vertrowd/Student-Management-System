import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#8b5cf6' // Default to purple hex or glow class name
  }
}, {
  timestamps: true
});

export default mongoose.model('Note', noteSchema);
