import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!form.name.trim()) throw new Error('Full name is required.');
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match.');
        await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb--1" />
        <div className="auth-bg-orb auth-bg-orb--2" />
      </div>

      <div className="auth-container">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={24} />
          </div>
          <div className="auth-logo-text">
            <span>Safeplus</span><span style={{ color: 'var(--emergency)' }}>AI</span>
          </div>
        </Link>

        {/* Card */}
        <div className="auth-card glass-card animate-scaleIn">
          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              <LogIn size={14} /> Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              <UserPlus size={14} /> Create Account
            </button>
          </div>

          <div className="auth-card-body">
            <h1 className="auth-heading">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="auth-subheading">
              {mode === 'login'
                ? 'Sign in to access your safety dashboard'
                : 'Set up SafeplusAI to protect yourself'}
            </p>

            {error && (
              <div className="auth-error">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoFocus={mode === 'login'}
                />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number (optional)</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="auth-pw-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(p => !p)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block auth-submit"
                disabled={loading}
                id="auth-submit-btn"
              >
                {loading ? (
                  <><div className="spinner" /> Processing…</>
                ) : mode === 'login' ? (
                  <><LogIn size={16} /> Sign In</>
                ) : (
                  <><UserPlus size={16} /> Create Account</>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
