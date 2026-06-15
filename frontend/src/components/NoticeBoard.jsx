import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Megaphone, Calendar, Trash2, Plus, Send } from 'lucide-react';

const NoticeBoard = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'all'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/notices');
      setNotices(res.data.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.content) {
      setError('Please fill out all fields');
      return;
    }

    try {
      const res = await axios.post('/notices', formData);
      if (res.data.success) {
        setSuccess('Notice posted successfully!');
        setFormData({ title: '', content: '', targetRole: 'all' });
        setShowForm(false);
        fetchNotices();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await axios.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
  };

  return (
    <div className="notices-section">
      <div className="section-header">
        <div>
          <h2>Notice Board</h2>
          <p className="section-subtitle">Important announcements and updates</p>
        </div>
        {isTeacher && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            <Plus size={18} /> {showForm ? 'Cancel' : 'Post Announcement'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel details-card" style={{ marginBottom: '24px' }}>
          <h3>Post New Notice</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter announcement title"
                required
                style={{ paddingLeft: '16px' }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="targetRole">Target Audience</label>
                <select
                  id="targetRole"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleChange}
                  style={{ paddingLeft: '16px' }}
                >
                  <option value="all">All Users</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Teachers Only</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                name="content"
                rows="4"
                value={formData.content}
                onChange={handleChange}
                placeholder="Type the announcement details here..."
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  resize: 'vertical',
                  fontFamily: 'var(--font-outfit)'
                }}
              ></textarea>
            </div>
            <div className="form-actions" style={{ margin: 0 }}>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                <Send size={16} /> Send Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading announcements...
        </div>
      ) : notices.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Megaphone size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>No announcements posted yet.</p>
        </div>
      ) : (
        <div className="notices-list">
          {notices.map((notice) => (
            <div key={notice._id} className="glass-panel notice-item">
              <div className="notice-header">
                <div>
                  <h4>{notice.title}</h4>
                  <div className="notice-author" style={{ marginTop: '4px', fontSize: '12px' }}>
                    Posted by: <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{notice.author?.name}</span> ({notice.author?.role})
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="notice-date">
                    <Calendar size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    {new Date(notice.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  {isTeacher && (notice.author?._id === user?.id || user?.role === 'admin') && (
                    <button 
                      onClick={() => handleDelete(notice._id)} 
                      className="btn-action btn-delete"
                      style={{ padding: '4px', borderRadius: '50%', border: 'none' }}
                      title="Delete notice"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="notice-content" style={{ whiteSpace: 'pre-wrap' }}>{notice.content}</p>
              <div className="notice-footer">
                <span className="notice-target" style={{
                  color: notice.targetRole === 'all' ? '#a7f3d0' : notice.targetRole === 'student' ? '#c084fc' : '#93c5fd',
                  background: notice.targetRole === 'all' ? 'rgba(16, 185, 129, 0.1)' : notice.targetRole === 'student' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                }}>
                  Target: {notice.targetRole}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
