import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PasswordInput from './PasswordInput';
import AppLogo from './AppLogo';
import './Layout.css';

export default function Layout() {
  const { admin, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!admin?.name) return '?';
    const parts = admin.name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return admin.name.slice(0, 2).toUpperCase();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="layout">
      <header className="top-nav">
        <div className="top-nav__brand">
          <NavLink to="/" className="top-nav__logo">
            <AppLogo variant="nav" />
          </NavLink>
        </div>
        <nav className="top-nav__links">
          <NavLink to="/" end className="top-nav__link">
            <span className="top-nav__icon">📊</span>
            Overview
          </NavLink>
          <NavLink to="/projects" className="top-nav__link">
            <span className="top-nav__icon">📁</span>
            Projects & Services
          </NavLink>
          <NavLink to="/usage" className="top-nav__link">
            <span className="top-nav__icon">📈</span>
            Usage
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className="top-nav__link">
              <span className="top-nav__icon">👥</span>
              Users
            </NavLink>
          )}
        </nav>
        <div className="top-nav__right">
          <div className="profile-trigger" ref={dropdownRef}>
            <button
              className="avatar-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Profile menu"
            >
              <span className="avatar">{getInitials()}</span>
            </button>
            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-user">
                  <span className="dropdown-name">{admin?.name}</span>
                  <span className="dropdown-role">
                    {admin?.role === 'admin' || admin?.role === 'owner' ? 'Admin' : 'User'}
                  </span>
                </div>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    setPasswordModalOpen(true);
                  }}
                >
                  Change password
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>

      {passwordModalOpen && (
        <div className="modal-overlay" onClick={() => setPasswordModalOpen(false)}>
          <div className="modal password-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Change password</h2>
            <form onSubmit={handleChangePassword}>
              {passwordError && <div className="alert alert-error">{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
              <label>
                Current password
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>
              <label>
                New password
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </label>
              <label>
                Confirm new password
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setPasswordModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
