import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StudentDashboard from '../components/StudentDashboard';
import TeacherDashboard from '../components/TeacherDashboard';
import { GraduationCap, LogOut, Sun, Moon } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="dashboard">
      {/* Global Header Navigation */}
      <nav className="dashboard-nav">
        <div className="brand-section">
          <GraduationCap className="brand-icon" />
          <h1>Vertrowd Academics</h1>
        </div>
        <div className="nav-right">
          <div className="user-badge">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.name}</span>
            <span className="role-tag">
              {user?.role}
            </span>
          </div>
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className="theme-toggle-track">
              <Sun className="theme-icon sun-icon" size={14} />
              <Moon className="theme-icon moon-icon" size={14} />
              <div className="theme-toggle-thumb" />
            </div>
          </button>
          <button onClick={logout} className="btn-logout">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Render sub-dashboards based on access role */}
      {isTeacher ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
};

export default Dashboard;