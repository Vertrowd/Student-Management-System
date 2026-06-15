import express from 'express';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const calculateGrade = (marks) => {
  if (marks >= 90) return 'A';
  if (marks >= 80) return 'B';
  if (marks >= 70) return 'C';
  if (marks >= 60) return 'D';
  return 'F';
};

// @route   GET /api/students/profile
// @desc    Get student profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    let student = await Student.findOne({ user: req.user.id }).populate('user', 'name email rollNumber grade');
    
    if (!student && req.user.role === 'student') {
      // Create student profile if not exists
      student = await Student.create({
        user: req.user.id,
        rollNumber: req.user.rollNumber || 'N/A',
        course: 'Not specified',
        semester: 1
      });
      student = await Student.findOne({ user: req.user.id }).populate('user', 'name email rollNumber grade');
    }
    
    res.status(200).json({
      success: true,
      data: student || req.user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { course, semester, phone, address } = req.body;
    
    let student = await Student.findOne({ user: req.user.id });
    
    if (student) {
      student = await Student.findOneAndUpdate(
        { user: req.user.id },
        { course, semester, phone, address },
        { new: true, runValidators: true }
      );
    } else {
      student = await Student.create({
        user: req.user.id,
        rollNumber: req.user.rollNumber || 'N/A',
        course,
        semester,
        phone,
        address
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/marks
// @desc    Get student marks
// @access  Private
router.get('/marks', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    res.status(200).json({
      success: true,
      data: student.subjects
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/attendance
// @desc    Get student attendance
// @access  Private
router.get('/attendance', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    const totalDays = student.attendance.length;
    const presentDays = student.attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    res.status(200).json({
      success: true,
      data: {
        attendance: student.attendance,
        statistics: {
          totalDays,
          presentDays,
          attendancePercentage: attendancePercentage.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ================= TEACHER ADMIN ROUTES =================

// @route   GET /api/students
// @desc    Get all students
// @access  Private (Teacher, Admin only)
router.get('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    // Automatically create profiles for student users who don't have one
    const studentUsers = await User.find({ role: 'student' });
    for (const u of studentUsers) {
      const profileExists = await Student.findOne({ user: u._id });
      if (!profileExists) {
        await Student.create({
          user: u._id,
          rollNumber: u.rollNumber || 'N/A',
          course: 'Not specified',
          semester: 1
        });
      }
    }

    const students = await Student.find().populate('user', 'name email role rollNumber grade');
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/:id/marks
// @desc    Add or update student marks
// @access  Private (Teacher, Admin only)
router.post('/:id/marks', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { name, code, marks } = req.body;
    if (!name || !code || marks === undefined) {
      return res.status(400).json({ message: 'Please provide subject name, code, and marks' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const numericMarks = Number(marks);
    const grade = calculateGrade(numericMarks);

    const subjectIndex = student.subjects.findIndex(s => s.code.toLowerCase() === code.toLowerCase());

    if (subjectIndex > -1) {
      student.subjects[subjectIndex].name = name;
      student.subjects[subjectIndex].marks = numericMarks;
      student.subjects[subjectIndex].grade = grade;
    } else {
      student.subjects.push({
        name,
        code,
        marks: numericMarks,
        grade
      });
    }

    await student.save();
    res.status(200).json({
      success: true,
      data: student.subjects
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/:id/marks/:code
// @desc    Remove subject marks from a student
// @access  Private (Teacher, Admin only)
router.delete('/:id/marks/:code', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    student.subjects = student.subjects.filter(s => s.code.toLowerCase() !== req.params.code.toLowerCase());
    await student.save();
    
    res.status(200).json({
      success: true,
      data: student.subjects
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/:id/attendance
// @desc    Add/Update single student attendance
// @access  Private (Teacher, Admin only)
router.post('/:id/attendance', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { date, status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Please provide attendance status' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const existingIndex = student.attendance.findIndex(a => {
      const d = new Date(a.date);
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime() === attendanceDate.getTime();
    });

    if (existingIndex > -1) {
      student.attendance[existingIndex].status = status;
    } else {
      student.attendance.push({
        date: attendanceDate,
        status
      });
    }

    await student.save();
    res.status(200).json({
      success: true,
      data: student.attendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/attendance/batch
// @desc    Batch log attendance for multiple students
// @access  Private (Teacher, Admin only)
router.post('/attendance/batch', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { date, records } = req.body; // records = [{ studentId, status }]
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Please provide attendance records array' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const updatedStudents = [];

    for (const record of records) {
      const { studentId, status } = record;
      const student = await Student.findById(studentId);
      if (student) {
        const existingIndex = student.attendance.findIndex(a => {
          const d = new Date(a.date);
          d.setUTCHours(0, 0, 0, 0);
          return d.getTime() === attendanceDate.getTime();
        });

        if (existingIndex > -1) {
          student.attendance[existingIndex].status = status;
        } else {
          student.attendance.push({
            date: attendanceDate,
            status
          });
        }
        await student.save();
        updatedStudents.push(student);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Batch attendance logged successfully',
      count: updatedStudents.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/students/admin/:id
// @desc    Administrative update of student profile
// @access  Private (Teacher, Admin only)
router.put('/admin/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { name, email, rollNumber, grade, course, semester, phone, address } = req.body;

    // --- Update Student document fields ---
    const studentUpdates = {};
    if (course !== undefined) studentUpdates.course = course;
    if (semester !== undefined) studentUpdates.semester = semester;
    if (phone !== undefined) studentUpdates.phone = phone;
    if (address !== undefined) studentUpdates.address = address;
    if (rollNumber !== undefined) studentUpdates.rollNumber = rollNumber;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      studentUpdates,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // --- Update User document fields ---
    // Use findByIdAndUpdate (NOT .save()) to avoid triggering the
    // bcrypt pre-save hook which would corrupt the user's password.
    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (grade !== undefined) userUpdates.grade = grade;
    if (rollNumber !== undefined) userUpdates.rollNumber = rollNumber;

    // Only update email if it actually changed to avoid duplicate key errors
    if (email !== undefined) {
      const existingUser = await User.findById(student.user);
      if (existingUser && existingUser.email !== email.toLowerCase()) {
        userUpdates.email = email;
      }
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(
        student.user,
        userUpdates,
        { new: true, runValidators: true }
      );
    }

    const updatedProfile = await Student.findById(req.params.id).populate('user', 'name email role rollNumber grade');

    res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    // Surface duplicate key errors clearly
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `A user with that ${field} already exists. Please use a different value.`,
        error: error.message
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/admin/:id
// @desc    Delete student profile and user account
// @access  Private (Teacher, Admin only)
router.delete('/admin/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    await User.findByIdAndDelete(student.user);
    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Student profile and account successfully deleted'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
