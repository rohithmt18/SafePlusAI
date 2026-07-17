import React, { useState, useEffect, useCallback } from 'react';
import { History, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, MapPin, Phone, Clock, Brain, Mic, Activity, Smartphone, AlertCircle } from 'lucide-react';
import { events as eventsAPI } from '../services/apiService';
import { useSafety } from '../context/SafetyContext';
import './HistoryPage.css';

const SIGNAL_ICONS = {
  'Distress Speech': Mic,
  'Audio Event': Activity,
  'Voice Emotion': Brain,
  'Device Motion': Smartphone,
  'Time of Day': Clock,
};

function TimelineItem({ item }) {
  const Icon = SIGNAL_ICONS[item.signal] || AlertTriangle;
  const severityColor = {
    critical: 'var(--emergency)',
    high: 'var(--danger)',
    medium: 'var(--caution)',
    low: 'var(--text-muted)',
  }[item.severity] || 'var(--text-muted)';

  return (
    <div className="timeline-item">
      <div className="timeline-dot" style={{ background: severityColor, boxShadow: `0 0 8px ${severityColor}80` }} />
      <div className="timeline-content">
        <div className="timeline-header">
          <div className="timeline-signal">
            <Icon size={13} style={{ color: severityColor }} />
            <span style={{ color: severityColor }}>{item.signal}</span>
          </div>
          <div className="timeline-severity badge" style={{
            background: `${severityColor}18`,
            color: severityColor,
            border: `1px solid ${severityColor}40`,
          }}>
            {item.severity}
          </div>
        </div>
        <div className="timeline-detail">{item.detail}</div>
        {item.keywords?.length > 0 && (
          <div className="timeline-keywords">
            {item.keywords.map((kw, i) => (
              <span key={i} className="timeline-kw">"{kw.word}"</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, onMarkResolved }) {
  const [expanded, setExpanded] = useState(false);
  const isEmergency = event.riskScore >= 81;
  const levelColor = isEmergency ? 'var(--emergency)' : event.riskScore >= 61 ? 'var(--danger)' : 'var(--caution)';
  const date = new Date(event.createdAt || event.timestamp);

  return (
    <div className={`event-card glass-card ${isEmergency ? 'event-card--emergency' : ''}`}>
      {/* Header */}
      <div className="event-card-header" onClick={() => setExpanded(e => !e)} role="button" tabIndex={0}>
        <div className="event-card-left">
          <div className="event-score-badge" style={{ '--level-color': levelColor }}>
            <AlertTriangle size={14} />
            <span>{event.riskScore}</span>
          </div>
          <div>
            <div className="event-level-label" style={{ color: levelColor }}>{event.riskLevel}</div>
            <div className="event-timestamp">{date.toLocaleDateString()} {date.toLocaleTimeString()}</div>
          </div>
        </div>
        <div className="event-card-right">
          <span className={`badge ${event.status === 'resolved' ? 'badge-safe' : 'badge-emergency'}`}>
            {event.status || 'active'}
          </span>
          <button className="btn btn-ghost btn-sm">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="event-summary-row">
        {event.location?.address && (
          <div className="event-meta-item">
            <MapPin size={12} />
            <span>{event.location.address}</span>
          </div>
        )}
        <div className="event-meta-item">
          <Phone size={12} />
          <span>{event.contactsNotified?.length || 0} contacts notified</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="event-expanded animate-slideInUp">
          {/* AI Summary */}
          <div className="event-ai-summary">
            <div className="event-ai-label">🤖 AI Emergency Report</div>
            <p>{event.aiSummary}</p>
          </div>

          {/* Timeline */}
          {event.timeline?.length > 0 && (
            <div className="event-timeline">
              <h4 className="event-timeline-title">Explainable Alert Timeline</h4>
              <div className="timeline-track">
                {event.timeline.map((item, i) => (
                  <TimelineItem key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Contacts notified */}
          {event.contactsNotified?.length > 0 && (
            <div className="event-contacts">
              <h4 className="event-timeline-title">Contacts Notified</h4>
              <div className="event-contact-list">
                {event.contactsNotified.map((c, i) => (
                  <div key={i} className="event-contact-chip">
                    <Phone size={11} />
                    {c.name} ({c.relationship}) — {c.phone}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location details */}
          {event.location?.lat && (
            <div className="event-location-detail">
              <MapPin size={12} />
              <span>
                {event.location.address} — {event.location.lat.toFixed(5)}, {event.location.lng.toFixed(5)}
              </span>
            </div>
          )}

          {/* Resolve button */}
          {event.status !== 'resolved' && (
            <button
              className="btn btn-safe btn-sm event-resolve-btn"
              onClick={() => onMarkResolved(event._id || event.id)}
            >
              <CheckCircle size={13} /> Mark as Resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, avgRiskScore: 0 });
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'resolved'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToast } = useSafety();

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventsAPI.list();
      setEvents(data.events || []);
      const statsData = await eventsAPI.stats();
      setStats(statsData || { total: 0, active: 0, resolved: 0, avgRiskScore: 0 });
    } catch (e) {
      // Fallback for when backend is offline
      setError('Backend offline — could not fetch full history.');
      const { getEmergencyEvents } = await import('../services/riskEngine');
      const localEvents = getEmergencyEvents();
      setEvents(localEvents);
      setStats({
        total: localEvents.length,
        active: localEvents.filter(e => (e.status || 'active') === 'active').length,
        resolved: localEvents.filter(e => e.status === 'resolved').length,
        avgRiskScore: localEvents.length ? Math.round(localEvents.reduce((s, e) => s + e.riskScore, 0) / localEvents.length) : 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleMarkResolved = async (id) => {
    try {
      if (error) {
        // Backend offline fallback
        const { updateEventStatus } = await import('../services/riskEngine');
        updateEventStatus(id, 'resolved');
        fetchEvents();
        return;
      }
      await eventsAPI.updateStatus(id, 'resolved');
      addToast('Event marked as resolved', 'success');
      fetchEvents();
    } catch (e) {
      addToast(`❌ ${e.message}`, 'error');
    }
  };

  const filtered = filter === 'all' ? events
    : events.filter(e => (e.status || 'active') === filter);

  return (
    <div className="history-page page-content">
      <div className="page-container">

        {/* Header */}
        <div className="history-header">
          <div>
            <h1 className="section-title" style={{ fontSize: '24px' }}>
              <span /><History size={20} /> Emergency History
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Complete log of all detected emergency events with explainable AI timelines.
            </p>
          </div>
          <div className="history-filters">
            {['all', 'active', 'resolved'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="monitor-alert monitor-alert--warn" style={{ marginBottom: 'var(--space-lg)' }}>
            <AlertCircle size={14} /> {error} <br/>
            <small>Showing local fallback data.</small>
          </div>
        )}

        {/* Stats row */}
        <div className="history-stats">
          <div className="glass-card history-stat">
            <div className="history-stat-num text-emergency">{stats.total}</div>
            <div className="history-stat-label">Total Events</div>
          </div>
          <div className="glass-card history-stat">
            <div className="history-stat-num text-caution">{stats.active}</div>
            <div className="history-stat-label">Active</div>
          </div>
          <div className="glass-card history-stat">
            <div className="history-stat-num text-safe">{stats.resolved}</div>
            <div className="history-stat-label">Resolved</div>
          </div>
          <div className="glass-card history-stat">
            <div className="history-stat-num" style={{ color: 'var(--brand-light)' }}>
              {stats.avgRiskScore}
            </div>
            <div className="history-stat-label">Avg Risk Score</div>
          </div>
        </div>

        {/* Event list */}
        {loading ? (
          <div className="dash-empty">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <span>Loading history…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="history-empty">
            <CheckCircle size={40} style={{ color: 'var(--safe)', opacity: 0.5 }} />
            <h3>{filter === 'all' ? 'No Emergency Events' : `No ${filter} events`}</h3>
            <p>
              {filter === 'all'
                ? 'When SafeplusAI detects a dangerous situation, the event will be recorded here with a full explainable timeline.'
                : `No ${filter} events to display.`}
            </p>
          </div>
        ) : (
          <div className="history-list">
            {filtered.map(event => (
              <EventCard key={event._id || event.id} event={event} onMarkResolved={handleMarkResolved} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
