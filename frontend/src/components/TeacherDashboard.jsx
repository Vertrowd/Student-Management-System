import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NoticeBoard from './NoticeBoard';
import { Users, Award, CheckSquare, Megaphone, Search, Plus, Trash2, Edit, Save, X, BookOpen, Calendar, Info, Layers } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Selected student for details/marks/edit
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Forms state
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    grade: '',
    course: '',
    semester: 1,
    phone: '',
    address: ''
  });

  const [marksForm, setMarksForm] = useState({
    name: '',
    code: '',
    marks: ''
  });

  // Batch attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'present'|'absent'|'late' }

  // Status message states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Attendance history filter
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/students');
      setStudents(res.data.data);
      
      // Initialize batch attendance records with 'present' for all students
      const initialRecords = {};
      res.data.data.forEach(s => {
        initialRecords[s._id] = 'present';
      });
      setAttendanceRecords(initialRecords);
    } catch (err) {
      console.error('Error fetching student roster:', err);
      setError('Failed to fetch student records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('WARNING: Are you sure you want to delete this student profile and user account? This cannot be undone.')) return;
    
    try {
      const res = await axios.delete(`/students/admin/${studentId}`);
      if (res.data.success) {
        setSuccess('Student account deleted successfully');
        if (selectedStudent?._id === studentId) setSelectedStudent(null);
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setIsEditingStudent(true);
    setEditForm({
      name: student.user?.name || '',
      email: student.user?.email || '',
      rollNumber: student.rollNumber || '',
      grade: student.user?.grade || '',
      course: student.course || '',
      semester: student.semester || 1,
      phone: student.phone || '',
      address: student.address || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await axios.put(`/students/admin/${selectedStudent._id}`, editForm);
      if (res.data.success) {
        setSuccess('Student profile updated successfully');
        setIsEditingStudent(false);
        setSelectedStudent(res.data.data);
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student profile');
    }
  };

  const handleAddMarks = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!marksForm.name || !marksForm.code || marksForm.marks === '') {
      setError('Please fill in all subject details');
      return;
    }

    try {
      const res = await axios.post(`/students/${selectedStudent._id}/marks`, marksForm);
      if (res.data.success) {
        setSuccess('Marks updated successfully!');
        setMarksForm({ name: '', code: '', marks: '' });
        // Refresh selected student to show new marks
        const updatedStudent = { ...selectedStudent, subjects: res.data.data };
        setSelectedStudent(updatedStudent);
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add marks');
    }
  };

  const handleDeleteMarks = async (code) => {
    if (!window.confirm(`Remove subject ${code} from student?`)) return;
    try {
      const res = await axios.delete(`/students/${selectedStudent._id}/marks/${code}`);
      if (res.data.success) {
        setSuccess('Subject removed successfully');
        const updatedStudent = { ...selectedStudent, subjects: res.data.data };
        setSelectedStudent(updatedStudent);
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete marks');
    }
  };

  const handleAttendanceStatusChange = (studentId, status) => {
    setAttendanceRecords({
      ...attendanceRecords,
      [studentId]: status
    });
  };

  const handleBatchAttendanceSubmit = async () => {
    setError('');
    setSuccess('');

    const records = Object.keys(attendanceRecords).map(studentId => ({
      studentId,
      status: attendanceRecords[studentId]
    }));

    try {
      const res = await axios.post('/students/attendance/batch', {
        date: attendanceDate,
        records
      });

      if (res.data.success) {
        setSuccess(`Batch attendance logged successfully for ${res.data.count} students!`);
        fetchStudents();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit batch attendance');
    }
  };

  // Class analytics calculations
  const calculateClassAnalytics = () => {
    if (students.length === 0) return { avgPercentage: 0, avgAttendance: 0 };
    
    // Average Grade Percentage
    let totalMarksSum = 0;
    let totalSubjectsCount = 0;
    
    // Attendance
    let grandTotalDays = 0;
    let grandPresentDays = 0;

    students.forEach(s => {
      s.subjects.forEach(sub => {
        totalMarksSum += sub.marks;
        totalSubjectsCount++;
      });

      grandTotalDays += s.attendance.length;
      grandPresentDays += s.attendance.filter(a => a.status === 'present').length;
    });

    const avgPercentage = totalSubjectsCount > 0 ? Math.round(totalMarksSum / totalSubjectsCount) : 0;
    const avgAttendance = grandTotalDays > 0 ? Math.round((grandPresentDays / grandTotalDays) * 100) : 0;

    return { avgPercentage, avgAttendance };
  };

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      (s.user?.name || '').toLowerCase().includes(term) ||
      (s.user?.email || '').toLowerCase().includes(term) ||
      (s.rollNumber || '').toLowerCase().includes(term) ||
      (s.course || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div className="radial-percentage" style={{ fontSize: '16px' }}>Syncing student database...</div>
        </div>
      </div>
    );
  }

  const { avgPercentage, avgAttendance } = calculateClassAnalytics();

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => { setActiveTab('analytics'); setSelectedStudent(null); setIsEditingStudent(false); }}
        >
          <Layers /> Analytics Overview
        </button>
        <button 
          className={activeTab === 'roster' ? 'active' : ''} 
          onClick={() => { setActiveTab('roster'); setSelectedStudent(null); setIsEditingStudent(false); }}
        >
          <Users /> Student Roster
        </button>
        <button 
          className={activeTab === 'attendance' ? 'active' : ''} 
          onClick={() => { setActiveTab('attendance'); setSelectedStudent(null); setIsEditingStudent(false); }}
        >
          <CheckSquare /> Log Attendance
        </button>
        <button 
          className={activeTab === 'notices' ? 'active' : ''} 
          onClick={() => { setActiveTab('notices'); setSelectedStudent(null); setIsEditingStudent(false); }}
        >
          <Megaphone /> Notice Board
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === 'analytics' && (
          <div>
            <div className="section-header">
              <div>
                <h2>Analytics Overview</h2>
                <p className="section-subtitle">Classroom performance and statistics dashboard</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="glass-panel stat-card card-purple">
                <div className="stat-icon"><Users /></div>
                <div className="stat-info">
                  <h3>Total Enrolled</h3>
                  <p>{students.length}</p>
                </div>
              </div>
              <div className="glass-panel stat-card card-indigo">
                <div className="stat-icon"><Award /></div>
                <div className="stat-info">
                  <h3>Class Average</h3>
                  <p>{avgPercentage}%</p>
                </div>
              </div>
              <div className="glass-panel stat-card card-success">
                <div className="stat-icon"><CheckSquare /></div>
                <div className="stat-info">
                  <h3>Class Attendance</h3>
                  <p>{avgAttendance}%</p>
                </div>
              </div>
            </div>

            <div className="grid-2">
              {/* Left Column: Welcome Info */}
              <div className="glass-panel details-card">
                <h3>Teacher Portal</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '12px' }}>
                  Welcome back, <strong>{user?.name}</strong>. You have permissions to record daily class attendance logs, upload/edit test marks and subjects, and publish official notices on the student board.
                </p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => setActiveTab('roster')} className="btn-primary" style={{ width: 'auto', fontSize: '14px' }}>
                    Manage Roster
                  </button>
                  <button onClick={() => setActiveTab('attendance')} className="btn-secondary" style={{ fontSize: '14px' }}>
                    Record Attendance
                  </button>
                </div>
              </div>

              {/* Right Column: Performance insights */}
              <div className="glass-panel details-card">
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                    <span>Need to post an alert?</span>
                    <button onClick={() => setActiveTab('notices')} className="btn-action btn-edit">Post Notice</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                    <span>Need to grade a student?</span>
                    <button onClick={() => { setActiveTab('roster'); }} className="btn-action btn-edit">Grade Roster</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roster' && !selectedStudent && (
          <div>
            <div className="section-header">
              <div>
                <h2>Student Roster</h2>
                <p className="section-subtitle">Manage, grade, and review students</p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div className="roster-actions">
                <div className="search-input-wrapper">
                  <Search className="input-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, roll number, or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p>No students match the search criteria.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll Number</th>
                        <th>Course</th>
                        <th>Semester</th>
                        <th>Class/Grade</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s._id}>
                          <td style={{ fontWeight: '600' }}>
                            <div>{s.user?.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{s.user?.email}</div>
                          </td>
                          <td>{s.rollNumber}</td>
                          <td>{s.course || 'Not specified'}</td>
                          <td>Semester {s.semester}</td>
                          <td><span className="role-tag" style={{ background: 'rgba(236,72,153,0.1)', color: '#f472b6' }}>{s.user?.grade || 'N/A'}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => setSelectedStudent(s)} 
                                className="btn-action btn-edit"
                                title="Grades & Info"
                              >
                                <Award size={14} /> Grades & Info
                              </button>
                              <button 
                                onClick={() => handleEditClick(s)} 
                                className="btn-action btn-edit"
                                title="Edit Profile"
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(s._id)} 
                                className="btn-action btn-delete"
                                title="Delete User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Student Details Panel */}
        {activeTab === 'roster' && selectedStudent && (
          <div>
            <div className="section-header">
              <button 
                onClick={() => { setSelectedStudent(null); setIsEditingStudent(false); }} 
                className="btn-secondary"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={16} /> Back to Roster
              </button>
              <h2>Student File: {selectedStudent.user?.name}</h2>
            </div>

            {isEditingStudent ? (
              <div className="glass-panel details-card">
                <h3>Edit Profile Data</h3>
                <form onSubmit={handleEditSubmit} style={{ marginTop: '20px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editName">Full Name</label>
                      <input
                        type="text"
                        id="editName"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editEmail">Email</label>
                      <input
                        type="email"
                        id="editEmail"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editRoll">Roll Number</label>
                      <input
                        type="text"
                        id="editRoll"
                        value={editForm.rollNumber}
                        onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editGrade">Class/Grade</label>
                      <input
                        type="text"
                        id="editGrade"
                        value={editForm.grade}
                        onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editCourse">Course</label>
                      <input
                        type="text"
                        id="editCourse"
                        value={editForm.course}
                        onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editSem">Semester</label>
                      <select
                        id="editSem"
                        value={editForm.semester}
                        onChange={(e) => setEditForm({ ...editForm, semester: Number(e.target.value) })}
                        style={{ paddingLeft: '16px' }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editPhone">Phone</label>
                      <input
                        type="text"
                        id="editPhone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editAddress">Address</label>
                      <input
                        type="text"
                        id="editAddress"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setIsEditingStudent(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="grid-2">
                  {/* Profile Overview */}
                  <div className="glass-panel details-card">
                    <h3>Roster details</h3>
                    <div className="info-list" style={{ marginTop: '20px' }}>
                      <div className="info-item">
                        <span className="info-label">Name</span>
                        <span className="info-value">{selectedStudent.user?.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{selectedStudent.user?.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Roll Number</span>
                        <span className="info-value">{selectedStudent.rollNumber}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Class/Grade</span>
                        <span className="info-value">{selectedStudent.user?.grade || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Course</span>
                        <span className="info-value">{selectedStudent.course || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Semester</span>
                        <span className="info-value">Semester {selectedStudent.semester}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingStudent(true)} 
                      className="btn-primary" 
                      style={{ width: 'auto', marginTop: '24px' }}
                    >
                      <Edit size={16} /> Edit Profile Info
                    </button>
                  </div>

                  {/* Academic Grading Panel */}
                  <div className="glass-panel details-card">
                    <h3>Subject Grades & Grading</h3>
                    
                    {/* Enter grades Form */}
                    <form onSubmit={handleAddMarks} style={{ marginTop: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '20px' }}>
                      <div className="form-row">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label htmlFor="subName">Subject Title</label>
                          <input
                            type="text"
                            id="subName"
                            placeholder="e.g. Database Systems"
                            value={marksForm.name}
                            onChange={(e) => setMarksForm({ ...marksForm, name: e.target.value })}
                            style={{ paddingLeft: '16px' }}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label htmlFor="subCode">Subject Code</label>
                          <input
                            type="text"
                            id="subCode"
                            placeholder="CS-302"
                            value={marksForm.code}
                            onChange={(e) => setMarksForm({ ...marksForm, code: e.target.value })}
                            style={{ paddingLeft: '16px' }}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label htmlFor="subMarks">Marks (0-100)</label>
                          <input
                            type="number"
                            id="subMarks"
                            min="0"
                            max="100"
                            placeholder="85"
                            value={marksForm.marks}
                            onChange={(e) => setMarksForm({ ...marksForm, marks: e.target.value })}
                            style={{ paddingLeft: '16px' }}
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary" style={{ width: 'auto', marginTop: '12px' }}>
                        <Plus size={16} /> Record Grade
                      </button>
                    </form>

                    {/* List of current subject grades */}
                    <div style={{ marginTop: '20px' }}>
                      <h4>Current Academic Log</h4>
                      {selectedStudent.subjects.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '10px' }}>No academic records on file.</p>
                      ) : (
                        <div className="table-container" style={{ marginTop: '10px' }}>
                          <table className="custom-table" style={{ fontSize: '14px' }}>
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Score</th>
                                <th>Grade</th>
                                <th>Remove</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStudent.subjects.map((s, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: '600' }}>{s.name} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({s.code})</span></td>
                                  <td>{s.marks}%</td>
                                  <td>
                                    <span className={`badge badge-grade-${s.grade.toLowerCase()}`}>{s.grade}</span>
                                  </td>
                                  <td>
                                    <button 
                                      onClick={() => handleDeleteMarks(s.code)}
                                      className="btn-action btn-delete"
                                      style={{ padding: '4px' }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance History Panel */}
                <div className="glass-panel details-card" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3>Attendance Log & History</h3>
                    <div className="attendance-options" style={{ margin: 0 }}>
                      {['all', 'present', 'absent', 'late'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setAttendanceFilter(mode)}
                          className={`attendance-option-btn ${attendanceFilter === mode ? (mode === 'present' ? 'selected-present' : mode === 'absent' ? 'selected-absent' : mode === 'late' ? 'selected-late' : 'selected-all') : ''}`}
                          style={{ textTransform: 'capitalize', fontSize: '12px', padding: '6px 12px' }}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {(() => {
                    const totalDays = selectedStudent.attendance?.length || 0;
                    const presentDays = selectedStudent.attendance?.filter(a => a.status === 'present').length || 0;
                    const lateDays = selectedStudent.attendance?.filter(a => a.status === 'late').length || 0;
                    const absentDays = totalDays - presentDays - lateDays;
                    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                    
                    const filteredRecords = (selectedStudent.attendance || []).filter(record => {
                      if (attendanceFilter === 'all') return true;
                      return record.status === attendanceFilter;
                    });
                    
                    return (
                      <>
                        <div className="info-list" style={{ width: '100%', marginTop: '16px', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                          <div className="info-item">
                            <span className="info-label">Total Classes</span>
                            <span className="info-value">{totalDays}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Present</span>
                            <span className="info-value" style={{ color: 'var(--success)' }}>{presentDays}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Late</span>
                            <span className="info-value" style={{ color: '#f59e0b' }}>{lateDays}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Absent</span>
                            <span className="info-value" style={{ color: '#ef4444' }}>{absentDays}</span>
                          </div>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                          <h4 style={{ marginBottom: '10px' }}>
                            Detailed Log {attendanceFilter !== 'all' ? `(${attendanceFilter})` : ''}
                          </h4>
                          {filteredRecords.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '10px' }}>
                              No {attendanceFilter !== 'all' ? attendanceFilter : ''} attendance logs on file.
                            </p>
                          ) : (
                            <div className="table-container" style={{ marginTop: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                              <table className="custom-table" style={{ fontSize: '14px' }}>
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredRecords.slice().reverse().map((record, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: '600' }}>
                                        {new Date(record.date).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </td>
                                      <td style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          record.status === 'present' ? 'badge-present' : record.status === 'absent' ? 'badge-absent' : 'badge-late'
                                        }`}>
                                          {record.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <div className="section-header">
              <div>
                <h2>Log Attendance</h2>
                <p className="section-subtitle">Record class attendance sheet for today or previous dates</p>
              </div>
            </div>

            <div className="glass-panel details-card">
              <div className="form-row" style={{ alignItems: 'center', marginBottom: '24px' }}>
                <div className="form-group" style={{ margin: 0, maxWidth: '280px' }}>
                  <label htmlFor="attDate"><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> Record Date</label>
                  <input
                    type="date"
                    id="attDate"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    onClick={() => {
                      const allPresent = {};
                      students.forEach(s => { allPresent[s._id] = 'present'; });
                      setAttendanceRecords(allPresent);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '13px' }}
                  >
                    Mark All Present
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p>No student accounts created to mark attendance.</p>
                </div>
              ) : (
                <div>
                  <div className="attendance-grid">
                    {students.map((student) => {
                      const selectedStatus = attendanceRecords[student._id] || 'present';
                      return (
                        <div key={student._id} className="attendance-row">
                          <div className="student-info-small">
                            <span className="student-name-small">{student.user?.name}</span>
                            <span className="student-roll-small">Roll: {student.rollNumber} | Class: {student.user?.grade || 'N/A'}</span>
                          </div>
                          
                          <div className="attendance-options">
                            <button
                              type="button"
                              onClick={() => handleAttendanceStatusChange(student._id, 'present')}
                              className={`attendance-option-btn ${selectedStatus === 'present' ? 'selected-present' : ''}`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttendanceStatusChange(student._id, 'absent')}
                              className={`attendance-option-btn ${selectedStatus === 'absent' ? 'selected-absent' : ''}`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttendanceStatusChange(student._id, 'late')}
                              className={`attendance-option-btn ${selectedStatus === 'late' ? 'selected-late' : ''}`}
                            >
                              Late
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="form-actions" style={{ margin: 0 }}>
                    <button onClick={handleBatchAttendanceSubmit} className="btn-primary" style={{ width: 'auto' }}>
                      <CheckSquare size={16} /> Submit Attendance Sheet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notices' && (
          <NoticeBoard />
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
