import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Radio, AlertTriangle, CheckCircle, TrendingUp,
  Mic, Activity, Brain, MapPin, Smartphone, Users, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSafety } from '../context/SafetyContext';
import { getEmergencyEvents } from '../services/riskEngine'; // Fallback
import { events as eventsAPI, contacts as contactsAPI } from '../services/apiService';
import RiskGauge from '../components/RiskGauge';
import './Dashboard.css';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="dash-stat glass-card">
      <div className="dash-stat-icon" style={{ '--sc': color }}>
        <Icon size={18} />
      </div>
      <div className="dash-stat-body">
        <div className="dash-stat-value" style={{ color }}>{value}</div>
        <div className="dash-stat-label">{label}</div>
        {sub && <div className="dash-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function SignalStatus({ label, icon: Icon, isActive, riskContribution, maxContrib }) {
  const pct = Math.min(100, (riskContribution / maxContrib) * 100);
  const color = riskContribution > maxContrib * 0.5 ? 'var(--emergency)' : riskContribution > 0 ? 'var(--caution)' : isActive ? 'var(--safe)' : 'var(--text-muted)';
  return (
    <div className="dash-signal-row">
      <div className="dash-signal-icon" style={{ color }}>
        <Icon size={15} />
      </div>
      <div className="dash-signal-info">
        <div className="dash-signal-label">{label}</div>
        <div className="dash-signal-bar">
          <div className="dash-signal-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <div className="dash-signal-score" style={{ color }}>+{riskContribution}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isMonitoring, riskScore, riskLevel, speech, audio, emotion, gps, motion, triggerManualSOS, startMonitoring, stopMonitoring } = useSafety();

  const [events, setEvents] = React.useState([]);
  const [contacts, setContacts] = React.useState([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const eventsData = await eventsAPI.list();
        setEvents(eventsData.events || []);
      } catch {
        setEvents(getEmergencyEvents());
      }
      try {
        const contactsData = await contactsAPI.list();
        setContacts(contactsData.contacts || []);
      } catch {
        try { setContacts(JSON.parse(localStorage.getItem('safeplusai_contacts')) || []); } catch {}
      }
    }
    loadData();
  }, []);

  const recentEvents = events.slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard page-content">
      <div className="page-container">

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="dash-subheading">
              {isMonitoring
                ? `SafeplusAI is actively monitoring you — Risk level: ${riskLevel?.label || 'Safe'}`
                : 'Your personal AI safety system is ready to activate'}
            </p>
          </div>
          <div className="dash-header-actions">
            <button
              id="sos-btn"
              className="btn btn-danger dash-sos-btn"
              onClick={triggerManualSOS}
            >
              <AlertTriangle size={18} />
              SOS
            </button>
            <button
              id="monitoring-toggle-btn"
              className={`btn ${isMonitoring ? 'btn-ghost' : 'btn-primary'}`}
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
            >
              <Radio size={16} />
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
          </div>
        </div>

        <div className="dash-layout">
          {/* Left — Gauge + signals */}
          <div className="dash-left">
            {/* Risk gauge card */}
            <div className="dash-gauge-card glass-card elevated">
              <div className="dash-gauge-header">
                <h2 className="section-title"><span />AI Risk Score</h2>
                <div className={`badge ${isMonitoring ? (riskScore >= 81 ? 'badge-emergency' : riskScore >= 61 ? 'badge-danger' : riskScore >= 31 ? 'badge-caution' : 'badge-safe') : 'badge-inactive'}`}>
                  {isMonitoring ? (riskLevel?.label || 'Safe') : 'Monitoring Off'}
                </div>
              </div>
              <RiskGauge score={riskScore} isMonitoring={isMonitoring} />
              <div className="dash-risk-scale">
                {[
                  { label: 'Safe', color: 'var(--safe)', range: '0–30' },
                  { label: 'Caution', color: 'var(--caution)', range: '31–60' },
                  { label: 'Danger', color: 'var(--danger)', range: '61–80' },
                  { label: 'Emergency', color: 'var(--emergency)', range: '81+' },
                ].map(({ label, color, range }) => (
                  <div key={label} className="dash-risk-scale-item">
                    <div className="dash-risk-scale-dot" style={{ background: color }} />
                    <div>
                      <div className="dash-risk-scale-label">{label}</div>
                      <div className="dash-risk-scale-range">{range}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signal breakdown */}
            <div className="glass-card dash-signals-card">
              <h3 className="section-title"><span />Signal Breakdown</h3>
              <div className="dash-signals-list">
                <SignalStatus label="Distress Speech" icon={Mic} isActive={speech.isActive} riskContribution={speech.riskContribution} maxContrib={35} />
                <SignalStatus label="Audio Event" icon={Activity} isActive={audio.isActive} riskContribution={audio.riskContribution} maxContrib={25} />
                <SignalStatus label="Voice Emotion" icon={Brain} isActive={emotion.isActive} riskContribution={emotion.riskContribution} maxContrib={20} />
                <SignalStatus label="Device Motion" icon={Smartphone} isActive={motion.isActive} riskContribution={motion.riskContribution} maxContrib={10} />
                <SignalStatus label="GPS / Time Risk" icon={MapPin} isActive={gps.isActive} riskContribution={gps.riskContribution} maxContrib={5} />
              </div>
            </div>
          </div>

          {/* Right — Stats + quick info */}
          <div className="dash-right">
            {/* Stats */}
            <div className="dash-stats-grid">
              <StatCard icon={AlertTriangle} label="Total Alerts" value={events.length} color="var(--emergency)" sub="All time" />
              <StatCard icon={Users} label="Contacts" value={contacts.length} color="var(--brand-light)" sub="Configured" />
              <StatCard icon={Shield} label="Status" value={isMonitoring ? 'ACTIVE' : 'IDLE'} color={isMonitoring ? 'var(--safe)' : 'var(--text-muted)'} sub={isMonitoring ? 'Monitoring' : 'Not monitoring'} />
              <StatCard icon={TrendingUp} label="Risk Score" value={riskScore} color={riskScore > 75 ? 'var(--emergency)' : riskScore > 50 ? 'var(--caution)' : 'var(--safe)'} sub="Current" />
            </div>

            {/* Location */}
            {gps.isActive && gps.lat && (
              <div className="glass-card dash-location-card">
                <h3 className="section-title"><span /><MapPin size={16} /> Live Location</h3>
                <div className="dash-location-address">{gps.address || 'Locating…'}</div>
                {gps.lat && (
                  <div className="dash-location-coords">
                    {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                  </div>
                )}
                <div className={`badge ${new Date().getHours() < 6 || new Date().getHours() >= 21 ? 'badge-caution' : 'badge-safe'} dash-location-badge`}>
                  {new Date().getHours() < 6 || new Date().getHours() >= 21 ? '🌙 Nighttime — Higher Risk' : '☀️ Daytime'}
                </div>
              </div>
            )}

            {/* Recent Events */}
            <div className="glass-card dash-events-card">
              <div className="dash-events-header">
                <h3 className="section-title"><span />Recent Alerts</h3>
                <Link to="/history" className="dash-events-viewall">View all <ChevronRight size={12} /></Link>
              </div>
              {recentEvents.length === 0 ? (
                <div className="dash-empty">
                  <CheckCircle size={24} style={{ color: 'var(--safe)' }} />
                  <span>No emergency events recorded</span>
                </div>
              ) : (
                <div className="dash-event-list">
                  {recentEvents.map(ev => (
                    <div key={ev.id} className="dash-event-row">
                      <div className={`dash-event-dot ${ev.riskScore >= 81 ? 'danger' : ev.riskScore >= 61 ? 'warning' : 'active'}`} />
                      <div className="dash-event-info">
                        <div className="dash-event-level">{ev.riskLevel} — Score {ev.riskScore}</div>
                        <div className="dash-event-time">{new Date(ev.timestamp).toLocaleString()}</div>
                      </div>
                      <div className={`badge badge-${ev.riskScore >= 81 ? 'emergency' : ev.riskScore >= 61 ? 'danger' : 'caution'}`}>
                        {ev.status || 'active'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            {!isMonitoring && (
              <div className="glass-card dash-quickstart">
                <h3 className="section-title"><span /><Zap size={16} /> Quick Start</h3>
                <div className="dash-qs-list">
                  {contacts.length === 0 && (
                    <Link to="/contacts" className="dash-qs-item">
                      <Users size={15} />
                      <span>Add emergency contacts</span>
                      <ChevronRight size={12} />
                    </Link>
                  )}
                  <Link to="/monitor" className="dash-qs-item">
                    <Radio size={15} />
                    <span>Open full monitoring panel</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
