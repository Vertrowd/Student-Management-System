import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  course: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  subjects: [{
    name: String,
    code: String,
    marks: Number,
    grade: String
  }],
  attendance: [{
    date: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Student', studentSchema);