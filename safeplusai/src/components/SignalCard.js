import React from 'react';
import './SignalCard.css';

export default function SignalCard({
  icon: Icon,
  title,
  isActive,
  riskContribution,
  maxContribution,
  statusLabel,
  statusColor,
  children,
  highlight,
}) {
  const pct = maxContribution > 0 ? Math.min(100, (riskContribution / maxContribution) * 100) : 0;

  const barColor = riskContribution === 0
    ? 'rgba(255,255,255,0.1)'
    : riskContribution >= maxContribution * 0.8
      ? 'var(--emergency)'
      : riskContribution >= maxContribution * 0.5
        ? 'var(--caution)'
        : 'var(--safe)';

  return (
    <div className={`signal-card glass-card ${isActive ? 'signal-card--active' : ''} ${highlight ? 'signal-card--highlight' : ''}`}>
      <div className="sc-header">
        <div className="sc-icon" style={{ '--icon-color': isActive ? (riskContribution > 0 ? barColor : 'var(--safe)') : 'var(--text-muted)' }}>
          {Icon && <Icon size={18} />}
        </div>
        <div className="sc-meta">
          <div className="sc-title">{title}</div>
          <div className="sc-status" style={{ color: isActive ? (statusColor || 'var(--safe)') : 'var(--text-muted)' }}>
            <span className={`status-dot ${isActive ? (riskContribution > 0 ? 'danger' : 'active') : 'inactive'}`} />
            {isActive ? statusLabel : 'Inactive'}
          </div>
        </div>
        <div className="sc-contribution">
          <span className="sc-risk-num" style={{ color: riskContribution > 0 ? barColor : 'var(--text-muted)' }}>
            +{riskContribution}
          </span>
          <span className="sc-risk-denom">/{maxContribution}</span>
        </div>
      </div>

      {/* Risk bar */}
      <div className="sc-bar-track">
        <div
          className="sc-bar-fill"
          style={{
            width: `${pct}%`,
            background: barColor,
            boxShadow: pct > 0 ? `0 0 8px ${barColor}60` : 'none',
          }}
        />
      </div>

      {/* Content slot */}
      {children && (
        <div className="sc-content">
          {children}
        </div>
      )}
    </div>
  );
}
