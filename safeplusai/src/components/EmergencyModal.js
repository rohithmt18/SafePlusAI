import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X, Phone, MapPin } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import './EmergencyModal.css';

export default function EmergencyModal() {
  const { showEmergencyModal, emergencyCountdown, cancelEmergency, riskScore, gps } = useSafety();
  const progressRef = useRef(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${(emergencyCountdown / 15) * 100}%`;
    }
  }, [emergencyCountdown]);

  if (!showEmergencyModal) return null;

  return (
    <div className="modal-overlay animate-fadeIn">
      <div className="emergency-modal animate-scaleIn">
        {/* Header */}
        <div className="em-header">
          <div className="em-icon-ring">
            <AlertTriangle size={32} color="#ff4757" />
          </div>
          <div className="em-header-text">
            <h2 className="em-title">⚠️ Emergency Detected</h2>
            <p className="em-subtitle">Risk score reached <strong>{riskScore}/100</strong></p>
          </div>
        </div>

        {/* Countdown */}
        <div className="em-countdown-wrapper">
          <div className="em-countdown-number">{emergencyCountdown}</div>
          <div className="em-countdown-label">seconds until alert</div>
          <div className="em-progress-track">
            <div className="em-progress-bar" ref={progressRef} />
          </div>
        </div>

        {/* Info */}
        <div className="em-info">
          {gps.address && (
            <div className="em-info-row">
              <MapPin size={14} />
              <span>{gps.address}</span>
            </div>
          )}
          <div className="em-info-row">
            <Phone size={14} />
            <span>Emergency contacts will be notified immediately</span>
          </div>
        </div>

        {/* Actions */}
        <div className="em-actions">
          <button className="btn btn-ghost em-cancel-btn" onClick={cancelEmergency}>
            <X size={16} />
            I am Safe — Cancel Alert
          </button>
          <p className="em-auto-text">
            Alert fires automatically if not cancelled
          </p>
        </div>
      </div>
    </div>
  );
}
