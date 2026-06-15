import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Award, Key, UserCheck, Layers } from 'lucide-react';

const TEACHER_ACCESS_CODE = 'VERTROWD2026'; // Predefined access code for teachers

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    rollNumber: '',
    grade: '',
    accessCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Teacher Access Code Validation
    if (formData.role === 'teacher' && formData.accessCode !== TEACHER_ACCESS_CODE) {
      setError('Invalid Teacher Access Code. Please contact administration.');
      return;
    }

    setLoading(true);

    const { confirmPassword, accessCode, ...userData } = formData;
    
    // If user is registering as a teacher, we don't need rollNumber/grade
    if (userData.role === 'teacher') {
      delete userData.rollNumber;
      delete userData.grade;
    }

    const result = await register(userData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join the Vertrowd Academic portal</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-container">
              <User className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-container">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="name@university.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Register As</label>
              <div className="input-container">
                <UserCheck className="input-icon" />
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>
          </div>

          {formData.role === 'student' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rollNumber">Roll Number</label>
                <div className="input-container">
                  <Award className="input-icon" />
                  <input
                    type="text"
                    id="rollNumber"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 2026-CS-04"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="grade">Class / Grade</label>
                <div className="input-container">
                  <Layers className="input-icon" />
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Grade 12"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'teacher' && (
            <div className="form-group">
              <label htmlFor="accessCode">Teacher Access Code</label>
              <div className="input-container">
                <Key className="input-icon" />
                <input
                  type="password"
                  id="accessCode"
                  name="accessCode"
                  value={formData.accessCode}
                  onChange={handleChange}
                  required
                  placeholder="Enter administrator code"
                />
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Use demo code: <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{TEACHER_ACCESS_CODE}</span>
              </small>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min 6 characters"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-container">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '20px' }}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;