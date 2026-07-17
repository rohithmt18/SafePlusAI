import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import './Toast.css';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  emergency: AlertTriangle,
};

const COLORS = {
  success: 'var(--safe)',
  error: 'var(--emergency)',
  info: 'var(--brand-light)',
  warning: 'var(--caution)',
  emergency: 'var(--emergency)',
};

function ToastItem({ message, toastType = 'info' }) {
  const Icon = ICONS[toastType] || Info;
  const color = COLORS[toastType] || 'var(--brand-light)';
  return (
    <div className={`toast toast--${toastType}`}>
      <div className="toast-icon" style={{ color }}>
        <Icon size={16} />
      </div>
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useSafety();
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}
