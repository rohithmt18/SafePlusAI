import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mic, Activity, MapPin, Zap, Users, ChevronRight, Brain, Radio } from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  { icon: Mic, title: 'Distress Speech Detection', desc: 'Continuously listens for distress keywords like "help", "call police" and triggers alerts automatically.' },
  { icon: Activity, title: 'Audio Event Detection', desc: 'Detects sudden screams or sustained loud sounds using real-time audio analysis.' },
  { icon: Brain, title: 'Voice Emotion Analysis', desc: 'Analyzes pitch and vocal patterns to detect fear, stress, or distress in your voice.' },
  { icon: MapPin, title: 'Live GPS Tracking', desc: 'Captures your precise location including address for emergency responders.' },
  { icon: Zap, title: 'AI Risk Scoring', desc: 'Aggregates all signals into a 0-100 risk score with 4 alert levels.' },
  { icon: Users, title: 'Emergency Contacts', desc: 'Notifies your trusted contacts instantly with location and AI-generated emergency report.' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="landing-bg-orb landing-bg-orb--1" />
        <div className="landing-bg-orb landing-bg-orb--2" />
        <div className="landing-bg-orb landing-bg-orb--3" />
        <div className="landing-grid-overlay" />
      </div>

      {/* Nav */}
      <header className="landing-header">
        <div className="page-container landing-header-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon"><Shield size={20} /></div>
            <span className="landing-logo-text">Safeplus<span>AI</span></span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/auth" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="page-container">
          <div className="landing-badge">
            <Radio size={12} />
            AI-Powered Personal Safety
          </div>
          <h1 className="landing-headline">
            Safety That Responds<br />
            <span className="text-gradient">Even When You Can't</span>
          </h1>
          <p className="landing-subheadline">
            SafeplusAI detects danger through speech, audio, emotion, GPS & motion signals —
            and automatically alerts your emergency contacts before it's too late.
          </p>
          <div className="landing-cta-group">
            <Link to="/auth" className="btn btn-primary btn-lg" id="landing-cta-primary">
              Start Protecting Yourself
              <ChevronRight size={18} />
            </Link>
            <a href="#features" className="btn btn-ghost btn-lg">
              See How It Works
            </a>
          </div>

          {/* Hero Stats */}
          <div className="landing-stats">
            {[
              { value: '6+', label: 'AI Signals' },
              { value: '15s', label: 'Cancel Window' },
              { value: '0-100', label: 'Risk Score' },
              { value: '24/7', label: 'Monitoring' },
            ].map(({ value, label }) => (
              <div key={label} className="landing-stat">
                <div className="landing-stat-value">{value}</div>
                <div className="landing-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Score Visual */}
      <section className="landing-demo">
        <div className="page-container">
          <div className="landing-demo-card glass-card">
            <div className="landing-demo-signals">
              {[
                { label: 'Distress Speech', val: 78, color: '#ff4757' },
                { label: 'Audio Event', val: 55, color: '#ffa502' },
                { label: 'Voice Emotion', val: 40, color: '#ffa502' },
                { label: 'Device Motion', val: 20, color: '#2ed573' },
                { label: 'GPS / Time Risk', val: 35, color: '#ffa502' },
              ].map(({ label, val, color }) => (
                <div key={label} className="landing-demo-row">
                  <span className="landing-demo-row-label">{label}</span>
                  <div className="landing-demo-bar-track">
                    <div
                      className="landing-demo-bar-fill"
                      style={{ width: `${val}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
                    />
                  </div>
                  <span className="landing-demo-row-val" style={{ color }}>{val}%</span>
                </div>
              ))}
            </div>
            <div className="landing-demo-score">
              <div className="landing-demo-score-num">82</div>
              <div className="landing-demo-score-label">Risk Score</div>
              <div className="landing-demo-score-badge">🚨 EMERGENCY</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-features">
        <div className="page-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Intelligent Multi-Signal Detection</h2>
            <p className="landing-section-sub">
              Six sensor streams work together to build a real-time picture of your safety situation
            </p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="landing-feature-card glass-card">
                <div className="landing-feature-icon">
                  <Icon size={22} />
                </div>
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <div className="page-container">
          <h2 className="landing-section-title" style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            How Emergency Mode Works
          </h2>
          <div className="landing-steps">
            {[
              { step: '01', title: 'AI Detects Danger', desc: 'Risk score crosses the configured threshold (default: 75/100)' },
              { step: '02', title: '15-Second Window', desc: 'A countdown gives you time to cancel if it\'s a false alarm' },
              { step: '03', title: 'Alert Triggered', desc: 'GPS captured, AI report generated, contacts notified instantly' },
              { step: '04', title: 'Event Logged', desc: 'Full explainable timeline saved to your emergency history' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="landing-step">
                <div className="landing-step-num">{step}</div>
                <div className="landing-step-connector" />
                <h4 className="landing-step-title">{title}</h4>
                <p className="landing-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-final-cta">
        <div className="page-container">
          <div className="landing-cta-card">
            <Shield size={40} style={{ color: 'var(--brand-light)' }} />
            <h2>Start Your Protection Today</h2>
            <p>Free to use. No account fee. Your safety, powered by AI.</p>
            <Link to="/auth" className="btn btn-primary btn-lg" id="landing-cta-bottom">
              Create Free Account <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="page-container">
          <span>© 2025 SafeplusAI — Crisis Management & Emergency Response</span>
          <span>Built with AI for personal safety</span>
        </div>
      </footer>
    </div>
  );
}
