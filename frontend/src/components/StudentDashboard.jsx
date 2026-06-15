import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NoticeBoard from './NoticeBoard';
import {
  User, Award, CheckSquare, Megaphone, Edit, Save, X, Phone, MapPin, BookOpen, Layers,
  ListTodo, Timer, StickyNote, Calendar, Play, Pause, RotateCcw, Plus, Trash, Clock, Sparkles, AlertCircle, GraduationCap, LogOut
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [studentData, setStudentData] = useState(null);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile form state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    course: '',
    semester: 1,
    phone: '',
    address: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ================= PRODUCTIVITY STATES =================
  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'general',
    priority: 'medium',
    dueDate: ''
  });
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('all');

  // Focus Timer State
  const [timerMode, setTimerMode] = useState('focus'); // focus, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [focusCategory, setFocusCategory] = useState('Study');
  const [customMinutes, setCustomMinutes] = useState('25');
  const [focusStats, setFocusStats] = useState({ todayMinutes: 0, totalMinutes: 0, sessionCount: 0 });
  const [focusSessions, setFocusSessions] = useState([]);

  // Study Journal Notes State
  const [notes, setNotes] = useState([]);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    _id: '',
    title: '',
    content: '',
    color: '#8b5cf6'
  });

  // Load basic data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch productivity stats/items based on active tab
  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    } else if (activeTab === 'focus') {
      fetchFocusData();
    } else if (activeTab === 'notes') {
      fetchNotes();
    }
  }, [activeTab]);

  // Pomodoro ticking effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      clearInterval(interval);
      handleTimerCompletion();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Reset timer duration when timerMode changes
  useEffect(() => {
    let mins = 25;
    if (timerMode === 'shortBreak') mins = 5;
    if (timerMode === 'longBreak') mins = 15;

    setTimeLeft(mins * 60);
    setTotalDuration(mins * 60);
    setCustomMinutes(mins.toString());
    setTimerActive(false);
  }, [timerMode]);

  // ================= GENERAL API CALLS =================
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchMarks(),
        fetchAttendance()
      ]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/students/profile');
      setStudentData(res.data.data);
      if (res.data.data) {
        setEditForm({
          course: res.data.data.course || '',
          semester: res.data.data.semester || 1,
          phone: res.data.data.phone || '',
          address: res.data.data.address || ''
        });
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
    }
  };

  const fetchMarks = async () => {
    try {
      const res = await axios.get('/students/marks');
      setMarks(res.data.data || []);
    } catch (err) {
      console.error('Error fetching marks:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('/students/attendance');
      setAttendance(res.data.data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const res = await axios.put('/students/profile', editForm);
      if (res.data.success) {
        setStudentData(res.data.data);
        setIsEditing(false);
        setFormSuccess('Profile updated successfully!');
        setTimeout(() => setFormSuccess(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // GPA calculation helper
  const calculateGPA = () => {
    if (marks.length === 0) return '0.00';
    const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    const totalPoints = marks.reduce((sum, subject) => sum + (gradePoints[subject.grade] || 0), 0);
    return (totalPoints / marks.length).toFixed(2);
  };

  const calculateAveragePercentage = () => {
    if (marks.length === 0) return 0;
    const totalMarks = marks.reduce((sum, s) => sum + s.marks, 0);
    return Math.round(totalMarks / marks.length);
  };

  // ================= TASKS API CALLS =================
  const fetchTasks = async () => {
    try {
      setTaskLoading(true);
      const res = await axios.get('/productivity/tasks');
      setTasks(res.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const res = await axios.post('/productivity/tasks', newTask);
      if (res.data.success) {
        setTasks([res.data.data, ...tasks]);
        setNewTask({
          title: '',
          category: 'general',
          priority: 'medium',
          dueDate: ''
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      const res = await axios.put(`/productivity/tasks/${task._id}`, { status: nextStatus });
      if (res.data.success) {
        setTasks(tasks.map(t => t._id === task._id ? res.data.data : t));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await axios.delete(`/productivity/tasks/${id}`);
      if (res.data.success) {
        setTasks(tasks.filter(t => t._id !== id));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // ================= FOCUS SESSIONS API CALLS =================
  const fetchFocusData = async () => {
    try {
      const res = await axios.get('/productivity/focus');
      if (res.data.success) {
        setFocusSessions(res.data.data.sessions || []);
        setFocusStats(res.data.data.stats || { todayMinutes: 0, totalMinutes: 0, sessionCount: 0 });
      }
    } catch (error) {
      console.error('Error fetching focus data:', error);
    }
  };

  const logFocusSession = async (mins) => {
    try {
      const res = await axios.post('/productivity/focus', {
        duration: mins,
        category: focusCategory
      });
      if (res.data.success) {
        fetchFocusData();
      }
    } catch (error) {
      console.error('Error logging focus session:', error);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(520, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  };

  const handleTimerCompletion = () => {
    setTimerActive(false);
    playBeep();

    if (timerMode === 'focus') {
      const minsFocused = Math.round(totalDuration / 60);
      logFocusSession(minsFocused);
      alert(`🎉 Focus session complete! You focused for ${minsFocused} minutes. Time for a short break!`);
      setTimerMode('shortBreak');
    } else {
      alert(`⏳ Break is over! Ready to focus again?`);
      setTimerMode('focus');
    }
  };

  const handleCustomMinutesChange = (e) => {
    const val = e.target.value;
    setCustomMinutes(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      setTimeLeft(parsed * 60);
      setTotalDuration(parsed * 60);
    }
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(totalDuration);
  };

  // ================= NOTES API CALLS =================
  const fetchNotes = async () => {
    try {
      setNoteLoading(true);
      const res = await axios.get('/productivity/notes');
      setNotes(res.data.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!currentNote.title.trim()) return;

    try {
      if (currentNote._id) {
        // Edit existing
        const res = await axios.put(`/productivity/notes/${currentNote._id}`, {
          title: currentNote.title,
          content: currentNote.content,
          color: currentNote.color
        });
        if (res.data.success) {
          setNotes(notes.map(n => n._id === currentNote._id ? res.data.data : n));
        }
      } else {
        // Create new
        const res = await axios.post('/productivity/notes', {
          title: currentNote.title,
          content: currentNote.content,
          color: currentNote.color
        });
        if (res.data.success) {
          setNotes([res.data.data, ...notes]);
        }
      }
      setIsNoteModalOpen(false);
      setCurrentNote({ _id: '', title: '', content: '', color: '#8b5cf6' });
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await axios.delete(`/productivity/notes/${id}`);
      if (res.data.success) {
        setNotes(notes.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const openNoteEditor = (note = null) => {
    if (note) {
      setCurrentNote({
        _id: note._id,
        title: note.title,
        content: note.content,
        color: note.color || '#8b5cf6'
      });
    } else {
      setCurrentNote({
        _id: '',
        title: '',
        content: '',
        color: '#8b5cf6'
      });
    }
    setIsNoteModalOpen(true);
  };

  const getNoteColorClass = (color) => {
    switch (color) {
      case '#8b5cf6': return 'note-theme-violet';
      case '#10b981': return 'note-theme-emerald';
      case '#6366f1': return 'note-theme-indigo';
      case '#f59e0b': return 'note-theme-amber';
      case '#ef4444': return 'note-theme-rose';
      default: return 'note-theme-violet';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div className="radial-percentage" style={{ fontSize: '16px' }}>Syncing student database...</div>
        </div>
      </div>
    );
  }

  const attendancePercentage = attendance ? Number(attendance.statistics.attendancePercentage) : 0;
  const averagePercentage = calculateAveragePercentage();

  // Task lists filtration
  const filteredTasks = tasks.filter(t => {
    const matchStatus = taskFilter === 'all' ||
      (taskFilter === 'todo' && t.status === 'todo') ||
      (taskFilter === 'in-progress' && t.status === 'in-progress') ||
      (taskFilter === 'completed' && t.status === 'completed');
    const matchCategory = taskCategoryFilter === 'all' || t.category === taskCategoryFilter;
    return matchStatus && matchCategory;
  });

  // Notes filtering
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
    n.content.toLowerCase().includes(noteSearch.toLowerCase())
  );

  // Formatting remaining time
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer SVG parameters
  const timerRadius = 120;
  const timerCircumference = 2 * Math.PI * timerRadius; // ~754
  const strokeDashoffset = timerCircumference - (timeLeft / totalDuration) * timerCircumference;

  return (
    <div className="dashboard">

      {/* Main dashboard content container */}
      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <div className="sidebar">
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <User /> Profile
          </button>
          <button
            className={activeTab === 'marks' ? 'active' : ''}
            onClick={() => setActiveTab('marks')}
          >
            <Award /> Academic Marks
          </button>
          <button
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
          >
            <CheckSquare /> Attendance
          </button>
          <button
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            <ListTodo /> Task Planner
          </button>
          <button
            className={activeTab === 'focus' ? 'active' : ''}
            onClick={() => setActiveTab('focus')}
          >
            <Timer /> Focus Timer
          </button>
          <button
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            <StickyNote /> Study Journal
          </button>
          <button
            className={activeTab === 'notices' ? 'active' : ''}
            onClick={() => setActiveTab('notices')}
          >
            <Megaphone /> Notice Board
          </button>
        </div>

        {/* Main Content Pane */}
        <div className="content">

          {/* PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div>
              <div className="section-header">
                <div>
                  <h2>Student Profile</h2>
                  <p className="section-subtitle">Manage your personal and academic record</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '10px 20px' }}
                  >
                    <Edit size={16} /> Edit Profile
                  </button>
                )}
              </div>

              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

              <div className="grid-2">
                <div className="glass-panel details-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                      {user?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '22px', fontWeight: '700' }}>{user?.name}</h3>
                      <span className="role-tag" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                        Student Account
                      </span>
                    </div>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleEditSubmit}>
                      {formError && <div className="alert alert-error">{formError}</div>}
                      <div className="form-group">
                        <label htmlFor="course">Course Program</label>
                        <input
                          type="text"
                          id="course"
                          name="course"
                          value={editForm.course}
                          onChange={handleEditChange}
                          placeholder="e.g. Computer Science & Engineering"
                          style={{ paddingLeft: '16px' }}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="semester">Current Semester</label>
                        <select
                          id="semester"
                          name="semester"
                          value={editForm.semester}
                          onChange={handleEditChange}
                          style={{ paddingLeft: '16px' }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={editForm.phone}
                          onChange={handleEditChange}
                          placeholder="e.g. +1 (555) 000-0000"
                          style={{ paddingLeft: '16px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="address">Residential Address</label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={editForm.address}
                          onChange={handleEditChange}
                          placeholder="Street Address, City, ZIP"
                          style={{ paddingLeft: '16px' }}
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="btn-secondary"
                        >
                          <X size={16} style={{ display: 'inline', marginRight: '4px' }} /> Cancel
                        </button>
                        <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                          <Save size={16} /> Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="info-list">
                      <div className="info-item">
                        <span className="info-label"><User size={12} style={{ display: 'inline', marginRight: '4px' }} /> Roll Number</span>
                        <span className="info-value">{user?.rollNumber || studentData?.rollNumber || 'Not set'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><Layers size={12} style={{ display: 'inline', marginRight: '4px' }} /> Current Grade</span>
                        <span className="info-value">{user?.grade || studentData?.grade || 'Not set'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><BookOpen size={12} style={{ display: 'inline', marginRight: '4px' }} /> Registered Course</span>
                        <span className="info-value">{studentData?.course || 'Not set'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><Layers size={12} style={{ display: 'inline', marginRight: '4px' }} /> Semester Term</span>
                        <span className="info-value">Semester {studentData?.semester || 1}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} /> Phone Contact</span>
                        <span className="info-value">{studentData?.phone || 'Not set'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> Location Address</span>
                        <span className="info-value">{studentData?.address || 'Not set'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance Indicator Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '1px' }}>Academic GPA</h4>
                      <p style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0 0 0', background: 'linear-gradient(135deg, #a7f3d0, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {calculateGPA()} / 4.00
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Based on {marks.length} courses graded</span>
                    </div>
                    <Award size={48} style={{ color: 'var(--success)', opacity: 0.8 }} />
                  </div>

                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '1px' }}>Attendance Rate</h4>
                      <p style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0 0 0', background: 'linear-gradient(135deg, #c084fc, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {attendancePercentage}%
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {attendance?.statistics.presentDays || 0} / {attendance?.statistics.totalDays || 0} classes attended
                      </span>
                    </div>
                    <CheckSquare size={48} style={{ color: 'var(--accent-purple)', opacity: 0.8 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACADEMIC MARKS VIEW */}
          {activeTab === 'marks' && (
            <div>
              <div className="section-header">
                <div>
                  <h2>Academic Marks & Reports</h2>
                  <p className="section-subtitle">View detailed records of courses and grades</p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="glass-panel stat-card card-purple">
                  <div className="stat-icon"><BookOpen /></div>
                  <div className="stat-info">
                    <h3>Enrolled Subjects</h3>
                    <p>{marks.length}</p>
                  </div>
                </div>
                <div className="glass-panel stat-card card-indigo">
                  <div className="stat-icon"><Award /></div>
                  <div className="stat-info">
                    <h3>Average Marks</h3>
                    <p>{averagePercentage}%</p>
                  </div>
                </div>
                <div className="glass-panel stat-card card-success">
                  <div className="stat-icon"><Layers /></div>
                  <div className="stat-info">
                    <h3>GPA Index</h3>
                    <p>{calculateGPA()}</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                {marks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <Award size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p>No academic scores released yet.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Subject Title</th>
                          <th>Subject Code</th>
                          <th>Obtained Score</th>
                          <th>Evaluation Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks.map((subject, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '600' }}>{subject.name}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{subject.code}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{subject.marks}</span>
                                <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${subject.marks}%`, height: '100%', background: subject.marks >= 60 ? 'var(--success)' : 'var(--error)' }}></div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-grade-${subject.grade.toLowerCase()}`}>
                                Grade {subject.grade}
                              </span>
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

          {/* ATTENDANCE VIEW */}
          {activeTab === 'attendance' && (
            <div>
              <div className="section-header">
                <div>
                  <h2>Attendance Analytics</h2>
                  <p className="section-subtitle">Track your classroom session logins</p>
                </div>
              </div>

              <div className="grid-2">
                {/* Gauges & Indicators */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3>Overall Rate</h3>
                  <div className="progress-container">
                    <div className="radial-progress" style={{ '--percentage': attendancePercentage }}>
                      <div className="radial-percentage">{attendancePercentage}%</div>
                    </div>
                  </div>
                  <div className="info-list" style={{ width: '100%', marginTop: '20px', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
                    <div className="info-item">
                      <span className="info-label">Active Days</span>
                      <span className="info-value">{attendance?.statistics.totalDays || 0}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Present</span>
                      <span className="info-value" style={{ color: 'var(--success)' }}>{attendance?.statistics.presentDays || 0}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Absent</span>
                      <span className="info-value" style={{ color: 'var(--error)' }}>
                        {(attendance?.statistics.totalDays || 0) - (attendance?.statistics.presentDays || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Records listing */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3>Recent Attendance History</h3>
                  <div style={{ marginTop: '20px', maxHeight: '280px', overflowY: 'auto', paddingRight: '8px' }}>
                    {!attendance || attendance.attendance.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <CheckSquare size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p>No logs recorded.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {attendance.attendance.slice().reverse().map((record, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px'
                          }}>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>
                              {new Date(record.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className={`badge ${record.status === 'present' ? 'badge-present' : record.status === 'absent' ? 'badge-absent' : 'badge-late'
                              }`}>
                              {record.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASK PLANNER VIEW */}
          {activeTab === 'tasks' && (
            <div className="task-planner-container">
              <div className="section-header">
                <div>
                  <h2>Task Planner</h2>
                  <p className="section-subtitle">Organize and schedule your study milestones</p>
                </div>
              </div>

              <div className="grid-2">
                {/* Form Card */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} style={{ color: 'var(--accent-purple)' }} /> Create Study Task
                  </h3>
                  <form onSubmit={handleTaskSubmit}>
                    <div className="form-group">
                      <label htmlFor="taskTitle">Task Name</label>
                      <input
                        type="text"
                        id="taskTitle"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="e.g. Complete Calculus Assignment 3"
                        style={{ paddingLeft: '16px' }}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="taskCategory">Category</label>
                        <select
                          id="taskCategory"
                          value={newTask.category}
                          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                          style={{ paddingLeft: '16px' }}
                        >
                          <option value="general">General</option>
                          <option value="assignment">Assignment</option>
                          <option value="exam">Exam Prep</option>
                          <option value="project">Project Work</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="taskPriority">Priority</label>
                        <select
                          id="taskPriority"
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          style={{ paddingLeft: '16px' }}
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="taskDueDate">Target Date</label>
                      <input
                        type="date"
                        id="taskDueDate"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                      <Plus size={16} /> Add to Checklist
                    </button>
                  </form>
                </div>

                {/* Filter and Tasks List Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="task-filters">
                    <div className="filter-group">
                      <button
                        className={`btn-filter ${taskFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTaskFilter('all')}
                      >
                        All
                      </button>
                      <button
                        className={`btn-filter ${taskFilter === 'todo' ? 'active' : ''}`}
                        onClick={() => setTaskFilter('todo')}
                      >
                        Todo
                      </button>
                      <button
                        className={`btn-filter ${taskFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setTaskFilter('completed')}
                      >
                        Done
                      </button>
                    </div>

                    <select
                      value={taskCategoryFilter}
                      onChange={(e) => setTaskCategoryFilter(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                    >
                      <option value="all">All Categories</option>
                      <option value="general">General</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam Prep</option>
                      <option value="project">Project Work</option>
                    </select>
                  </div>

                  <div className="glass-panel" style={{ padding: '24px', flex: 1, maxHeight: '420px', overflowY: 'auto' }}>
                    {taskLoading ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading planner tasks...</p>
                    ) : filteredTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <ListTodo size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p>No study tasks found matching filters.</p>
                      </div>
                    ) : (
                      <div className="task-list">
                        {filteredTasks.map((t) => {
                          const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
                          return (
                            <div key={t._id} className={`task-item ${t.status === 'completed' ? 'completed' : ''}`}>
                              <div className="task-left">
                                <label className="task-checkbox-container">
                                  <input
                                    type="checkbox"
                                    checked={t.status === 'completed'}
                                    onChange={() => handleToggleTask(t)}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                                <div className="task-details">
                                  <span className="task-title">{t.title}</span>
                                  <div className="task-meta">
                                    <span className="task-category">{t.category}</span>
                                    {t.dueDate && (
                                      <span className={`task-date ${isOverdue ? 'overdue' : ''}`}>
                                        <Calendar size={12} />
                                        {isOverdue && <AlertCircle size={12} style={{ display: 'inline', marginRight: '2px' }} />}
                                        {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        {isOverdue && ' (Overdue)'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="task-right">
                                <span className={`priority-tag priority-${t.priority}`}>
                                  {t.priority}
                                </span>
                                <button
                                  className="btn-note-action"
                                  onClick={() => handleDeleteTask(t._id)}
                                  style={{ color: '#ef4444' }}
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOCUS TIMER VIEW */}
          {activeTab === 'focus' && (
            <div className="timer-container">
              <div className="section-header" style={{ width: '100%' }}>
                <div>
                  <h2>Focus Timer</h2>
                  <p className="section-subtitle">Block distractions and log high-efficiency study hours</p>
                </div>
              </div>

              <div className="grid-2" style={{ width: '100%', alignItems: 'stretch' }}>
                {/* Visual Timer panel */}
                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="timer-modes">
                    <button
                      className={`btn-mode ${timerMode === 'focus' ? 'active' : ''}`}
                      onClick={() => setTimerMode('focus')}
                    >
                      Focus
                    </button>
                    <button
                      className={`btn-mode ${timerMode === 'shortBreak' ? 'active' : ''}`}
                      onClick={() => setTimerMode('shortBreak')}
                    >
                      Short Break
                    </button>
                    <button
                      className={`btn-mode ${timerMode === 'longBreak' ? 'active' : ''}`}
                      onClick={() => setTimerMode('longBreak')}
                    >
                      Long Break
                    </button>
                  </div>

                  <div className="timer-display-wrapper">
                    <svg className="timer-svg">
                      <circle
                        className="timer-bg-circle"
                        cx="130"
                        cy="130"
                        r={timerRadius}
                      />
                      <circle
                        className={`timer-progress-circle ${timerMode}`}
                        cx="130"
                        cy="130"
                        r={timerRadius}
                        strokeDasharray={timerCircumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <span className="timer-numbers">{formatTime(timeLeft)}</span>
                    <span className="timer-status-text">
                      {timerActive ? 'Focusing' : 'Paused'}
                    </span>
                  </div>

                  <div className="timer-controls">
                    <button className="btn-timer-sub" onClick={resetTimer} title="Reset Timer">
                      <RotateCcw size={18} />
                    </button>
                    <button className="btn-timer-main" onClick={toggleTimer} style={{ color: 'var(--bg-primary)' }}>
                      {timerActive ? <Pause size={24} fill="var(--bg-primary)" /> : <Play size={24} fill="var(--bg-primary)" style={{ marginLeft: '4px' }} />}
                    </button>
                    <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {timerActive && (
                        <div className="timer-soundwave">
                          <div className="soundwave-bar"></div>
                          <div className="soundwave-bar"></div>
                          <div className="soundwave-bar"></div>
                          <div className="soundwave-bar"></div>
                          <div className="soundwave-bar"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Focus Goal</label>
                      <select
                        value={focusCategory}
                        onChange={(e) => setFocusCategory(e.target.value)}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', fontSize: '12px' }}
                      >
                        <option value="Study">Study Book</option>
                        <option value="Homework">Homework</option>
                        <option value="Coding">Coding</option>
                        <option value="Research">Research</option>
                        <option value="Exam Prep">Exam Prep</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Set Mins</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={customMinutes}
                        onChange={handleCustomMinutesChange}
                        disabled={timerActive}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', width: '80px', textAlign: 'center', fontSize: '12px', paddingLeft: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Focus statistics and history logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="focus-stats-mini">
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span className="info-label" style={{ fontSize: '10px' }}>Today</span>
                      <p style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: 'var(--accent-purple)' }}>{focusStats.todayMinutes}m</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span className="info-label" style={{ fontSize: '10px' }}>Total Focus</span>
                      <p style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: 'var(--success)' }}>{focusStats.totalMinutes}m</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span className="info-label" style={{ fontSize: '10px' }}>Sessions</span>
                      <p style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: 'var(--info)' }}>{focusStats.sessionCount}</p>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '24px', flex: 1, maxHeight: '280px', overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} /> Focus Session Log
                    </h3>

                    {focusSessions.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No focus sessions logged yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {focusSessions.slice(0, 10).map((session, idx) => (
                          <div key={session._id || idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}>
                            <div>
                              <span style={{ fontWeight: '600' }}>{session.category}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                                {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <span style={{ color: 'var(--accent-purple)', fontWeight: '700' }}>+{session.duration} mins</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDY JOURNAL STICKY NOTES VIEW */}
          {activeTab === 'notes' && (
            <div>
              <div className="section-header">
                <div>
                  <h2>Study Journal</h2>
                  <p className="section-subtitle">Jot down math formulas, reminders, or code lectures</p>
                </div>
                <button className="btn-primary" onClick={() => openNoteEditor()} style={{ width: 'auto', padding: '10px 20px' }}>
                  <Plus size={16} /> New Memo
                </button>
              </div>

              {/* Notes Actions / Search */}
              <div className="roster-actions">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search titles or contents..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                  />
                </div>
              </div>

              {/* Notes Grid */}
              {noteLoading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading memos...</p>
              ) : filteredNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                  <StickyNote size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p>No notes found. Create your first study card memo!</p>
                </div>
              ) : (
                <div className="notes-grid">
                  {filteredNotes.map((note) => (
                    <div key={note._id} className={`note-card ${getNoteColorClass(note.color)}`}>
                      <h4 className="note-card-title">{note.title}</h4>
                      <div className="note-card-content">{note.content}</div>
                      <div className="note-card-footer">
                        <span>
                          {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <div className="note-actions">
                          <button className="btn-note-action" onClick={() => openNoteEditor(note)} title="Edit Note">
                            <Edit size={12} />
                          </button>
                          <button className="btn-note-action" onClick={() => handleDeleteNote(note._id)} title="Delete Note" style={{ color: '#ef4444' }}>
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sticky Note Editor Modal */}
              {isNoteModalOpen && (
                <div className="modal-overlay" onClick={() => setIsNoteModalOpen(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '20px' }}>{currentNote._id ? 'Edit Study Memo' : 'Create New Memo'}</h3>
                      <button className="btn-note-action" onClick={() => setIsNoteModalOpen(false)}>
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleNoteSubmit}>
                      <div className="form-group">
                        <label>Memo Title</label>
                        <input
                          type="text"
                          value={currentNote.title}
                          onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                          placeholder="e.g. Physics Formula Cheat Sheet"
                          style={{ paddingLeft: '16px' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Content Text</label>
                        <textarea
                          value={currentNote.content}
                          onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                          placeholder="Write key equations, points, or codes..."
                          rows={6}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '10px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        ></textarea>
                      </div>

                      {/* Color Picker selection */}
                      <div className="form-group">
                        <label>Card Visual Color</label>
                        <div className="color-picker">
                          {[
                            { hex: '#8b5cf6', name: 'violet' },
                            { hex: '#10b981', name: 'emerald' },
                            { hex: '#6366f1', name: 'indigo' },
                            { hex: '#f59e0b', name: 'amber' },
                            { hex: '#ef4444', name: 'rose' }
                          ].map((theme) => (
                            <span
                              key={theme.hex}
                              className={`color-option ${currentNote.color === theme.hex ? 'selected' : ''}`}
                              onClick={() => setCurrentNote({ ...currentNote, color: theme.hex })}
                              style={{
                                background: theme.hex,
                                '--color': theme.hex,
                                boxShadow: currentNote.color === theme.hex ? `0 0 10px ${theme.hex}` : 'none'
                              }}
                              title={theme.name}
                            ></span>
                          ))}
                        </div>
                      </div>

                      <div className="form-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setIsNoteModalOpen(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                          <Save size={16} /> Save Memo
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTICE BOARD VIEW */}
          {activeTab === 'notices' && (
            <NoticeBoard />
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
