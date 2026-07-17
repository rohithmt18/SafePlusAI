import React from 'react';
import './RiskGauge.css';

const STROKE_WIDTH = 12;
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(score) {
  if (score >= 81) return '#ff4757';
  if (score >= 61) return '#ff6b35';
  if (score >= 31) return '#ffa502';
  return '#2ed573';
}

function getLabel(score) {
  if (score >= 81) return 'EMERGENCY';
  if (score >= 61) return 'DANGER';
  if (score >= 31) return 'CAUTION';
  return 'SAFE';
}

export default function RiskGauge({ score = 0, isMonitoring = false }) {
  const color = getScoreColor(score);
  const label = getLabel(score);
  const isEmergency = score >= 81;

  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div className={`risk-gauge ${isEmergency && isMonitoring ? 'risk-gauge--emergency' : ''}`}>
      <div className="risk-gauge-svg-wrapper">
        {/* Pulse rings for emergency */}
        {isEmergency && isMonitoring && (
          <>
            <div className="risk-gauge-pulse" style={{ '--pcolor': color }} />
            <div className="risk-gauge-pulse risk-gauge-pulse--delay" style={{ '--pcolor': color }} />
          </>
        )}

        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="risk-gauge-svg"
        >
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE_WIDTH}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const angle = (pct / 100) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + (RADIUS - 8) * Math.cos(rad);
            const y1 = 100 + (RADIUS - 8) * Math.sin(rad);
            const x2 = 100 + (RADIUS + 4) * Math.cos(rad);
            const y2 = 100 + (RADIUS + 4) * Math.sin(rad);
            return (
              <line
                key={pct}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Progress arc */}
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.6s ease',
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />

          {/* Glow dot at tip */}
          {isMonitoring && score > 0 && (() => {
            const angle = (score / 100) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = 100 + RADIUS * Math.cos(rad);
            const y = 100 + RADIUS * Math.sin(rad);
            return (
              <circle
                cx={x}
                cy={y}
                r={6}
                fill={color}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            );
          })()}
        </svg>

        {/* Center content */}
        <div className="risk-gauge-center">
          <div className="risk-gauge-score" style={{ color }}>
            {score}
          </div>
          <div className="risk-gauge-label" style={{ color }}>
            {isMonitoring ? label : 'INACTIVE'}
          </div>
          <div className="risk-gauge-sublabel">Risk Score</div>
        </div>
      </div>
    </div>
  );
}
