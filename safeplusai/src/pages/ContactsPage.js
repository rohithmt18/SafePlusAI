import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Pencil, Trash2, Phone, User, Heart, Shield, CheckCircle, Send, AlertCircle } from 'lucide-react';
import { contacts as contactsAPI, notify as notifyAPI } from '../services/apiService';
import { useSafety } from '../context/SafetyContext';
import './ContactsPage.css';

const RELATIONSHIPS = ['Family', 'Friend', 'Partner', 'Colleague', 'Neighbor', 'Medical', 'Other'];

const RELATION_ICONS = {
  Family: '👨‍👩‍👧', Friend: '🤝', Partner: '💑', Colleague: '👔',
  Neighbor: '🏠', Medical: '🏥', Other: '👤',
};

function ContactForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(
    initial || { name: '', phone: '', email: '', relationship: 'Family', notes: '' }
  );
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.phone.trim()) return setError('Phone number is required.');
    setError('');
    onSave(form);
  };

  return (
    <div className="contact-form-overlay animate-fadeIn">
      <div className="contact-form-modal glass-card animate-scaleIn">
        <h2 className="cf-title">{initial ? 'Edit Contact' : 'Add Emergency Contact'}</h2>
        {!initial && (
          <p className="cf-note">
            📱 A welcome SMS will be sent to this number when you save.
          </p>
        )}

        {error && (
          <div className="auth-error" style={{ marginBottom: 'var(--space-md)' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="cf-form">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cf-name">Full Name *</label>
              <input id="cf-name" name="name" type="text" className="form-input" value={form.name} onChange={handleChange} placeholder="Jane Smith" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cf-phone">Phone Number *</label>
              <input id="cf-phone" name="phone" type="tel" className="form-input" value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000" required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cf-email">Email (optional)</label>
              <input id="cf-email" name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="jane@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cf-rel">Relationship</label>
              <select id="cf-rel" name="relationship" className="form-input" value={form.relationship} onChange={handleChange}>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cf-notes">Notes (optional)</label>
            <textarea id="cf-notes" name="notes" className="form-input" value={form.notes} onChange={handleChange} placeholder="E.g., Call first before messaging" rows={2} style={{ resize: 'vertical' }} />
          </div>

          <div className="cf-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="cf-save-btn" disabled={loading}>
              {loading ? <><div className="spinner" /> Saving…</> : <><CheckCircle size={15} /> Save Contact</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete, onTestSMS }) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await onTestSMS(contact.phone);
    setTesting(false);
  };

  return (
    <div className="contact-card glass-card">
      <div className="contact-card-header">
        <div className="contact-avatar">
          <span>{RELATION_ICONS[contact.relationship] || '👤'}</span>
        </div>
        <div className="contact-info">
          <div className="contact-name">{contact.name}</div>
          <div className="contact-relation">{contact.relationship}</div>
        </div>
        <div className="contact-actions">
          <button className="btn btn-ghost btn-sm contact-action-btn" onClick={handleTest} disabled={testing} title="Test SMS">
            {testing ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Send size={13} />}
          </button>
          <button className="btn btn-ghost btn-sm contact-action-btn" onClick={() => onEdit(contact)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className="btn btn-ghost btn-sm contact-action-btn contact-action-delete" onClick={() => onDelete(contact._id || contact.id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="contact-card-body">
        <div className="contact-detail"><Phone size={13} /><span>{contact.phone}</span></div>
        {contact.email && <div className="contact-detail"><User size={13} /><span>{contact.email}</span></div>}
        {contact.notes && <div className="contact-notes">{contact.notes}</div>}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contactsList, setContactsList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToast } = useSafety();

  const fetchContacts = useCallback(async () => {
    try {
      const data = await contactsAPI.list();
      setContactsList(data.contacts || []);
    } catch (e) {
      setError('Could not load contacts — is the backend running?');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleSave = async (form) => {
    setFormLoading(true);
    try {
      if (editTarget) {
        await contactsAPI.update(editTarget._id || editTarget.id, form);
        addToast('✅ Contact updated', 'success');
      } else {
        const res = await contactsAPI.create(form);
        const smsSent = res.smsSent;
        addToast(
          smsSent
            ? `📱 Welcome SMS sent to ${form.name} (${form.phone})`
            : `👤 ${form.name} added — SMS logged (add Twilio for real SMS)`,
          smsSent ? 'success' : 'info', 5000
        );
      }
      await fetchContacts();
      setShowForm(false);
      setEditTarget(null);
    } catch (e) {
      addToast(`❌ ${e.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await contactsAPI.remove(id);
      setContactsList(prev => prev.filter(c => (c._id || c.id) !== id));
      addToast('Contact removed', 'info');
    } catch (e) {
      addToast(`❌ ${e.message}`, 'error');
    }
  };

  const handleTestSMS = async (phone) => {
    try {
      const res = await notifyAPI.test(phone);
      addToast(res.sent ? `📱 Test SMS sent to ${phone}!` : `📋 Test SMS logged to server console`, res.sent ? 'success' : 'info', 5000);
    } catch (e) {
      addToast(`❌ ${e.message}`, 'error');
    }
  };

  const handleEdit = (contact) => { setEditTarget(contact); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); setEditTarget(null); };

  return (
    <div className="contacts-page page-content">
      <div className="page-container">
        <div className="contacts-header">
          <div>
            <h1 className="section-title" style={{ fontSize: '24px' }}>
              <span /><Shield size={20} /> Emergency Contacts
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Contacts receive an SMS alert (with your GPS location) when an emergency is triggered. A welcome SMS is sent when you add a contact.
            </p>
          </div>
          <button id="add-contact-btn" className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            <UserPlus size={16} /> Add Contact
          </button>
        </div>

        {error && (
          <div className="monitor-alert monitor-alert--error" style={{ marginBottom: 'var(--space-lg)' }}>
            <AlertCircle size={14} /> {error} <br/>
            <small>Make sure the backend is running: <code>cd backend && node server.js</code></small>
          </div>
        )}

        {pageLoading ? (
          <div className="dash-empty">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <span>Loading contacts…</span>
          </div>
        ) : contactsList.length === 0 ? (
          <div className="contacts-empty">
            <Heart size={40} style={{ color: 'var(--emergency)', opacity: 0.5 }} />
            <h3>No Emergency Contacts Yet</h3>
            <p>Add at least one trusted contact so SafeplusAI can notify them in an emergency.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <UserPlus size={16} /> Add Your First Contact
            </button>
          </div>
        ) : (
          <>
            <div className="contacts-count-bar">
              <div className="badge badge-safe">
                <CheckCircle size={11} /> {contactsList.length} contact{contactsList.length !== 1 ? 's' : ''} configured
              </div>
              <p className="contacts-count-hint">
                Click <Send size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> to send a test SMS to any contact.
              </p>
            </div>
            <div className="contacts-grid">
              {contactsList.map(c => (
                <ContactCard key={c._id || c.id} contact={c} onEdit={handleEdit} onDelete={handleDelete} onTestSMS={handleTestSMS} />
              ))}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <ContactForm initial={editTarget} onSave={handleSave} onCancel={handleCancel} loading={formLoading} />
      )}
    </div>
  );
}
