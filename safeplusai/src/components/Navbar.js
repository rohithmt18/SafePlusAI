import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Radio, Users, History, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSafety } from '../context/SafetyContext';
import './Navbar.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/monitor', label: 'Monitor', Icon: Radio },
  { path: '/contacts', label: 'Contacts', Icon: Users },
  { path: '/history', label: 'History', Icon: History },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isMonitoring, riskScore, riskLevel } = useSafety();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRiskColor = () => {
    if (!isMonitoring) return 'var(--text-muted)';
    if (riskScore >= 81) return 'var(--emergency)';
    if (riskScore >= 61) return 'var(--danger)';
    if (riskScore >= 31) return 'var(--caution)';
    return 'var(--safe)';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner page-container">
        {/* Logo */}
        <NavLink to="/dashboard" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Shield size={20} />
          </div>
          <div className="navbar-logo-text">
            <span className="navbar-brand">Safeplus</span>
            <span className="navbar-brand-ai">AI</span>
          </div>
        </NavLink>

        {/* Nav Links */}
        <ul className="navbar-links">
          {NAV_ITEMS.map(({ path, label, Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right section */}
        <div className="navbar-right">
          {/* Risk indicator */}
          {isMonitoring && (
            <div className="navbar-risk-badge" style={{ '--risk-color': getRiskColor() }}>
              <AlertTriangle size={12} />
              <span>{riskScore}</span>
              <span className="navbar-risk-label">{riskLevel?.label || 'Safe'}</span>
            </div>
          )}

          {/* User */}
          <div className="navbar-user">
            <div className="navbar-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="navbar-user-name hide-mobile">{user?.name}</span>
          </div>

          <button onClick={handleLogout} className="navbar-logout btn btn-ghost btn-sm">
            <LogOut size={15} />
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
