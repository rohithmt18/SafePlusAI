import React, { useEffect, useRef } from 'react';
import { Radio, Mic, Activity, Brain, MapPin, Smartphone, Play, StopCircle, AlertTriangle } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import SignalCard from '../components/SignalCard';
import RiskGauge from '../components/RiskGauge';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MonitorPage.css';

// Fix Leaflet default icon paths (broken by webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LiveGPSMap({ lat, lng, accuracy, address }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstanceRef.current) {
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Custom pulsing marker
      const pulseIcon = L.divIcon({
        className: '',
        html: `<div class="gps-pulse-marker"><div class="gps-dot"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      markerRef.current = L.marker([lat, lng], { icon: pulseIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`📍 ${address || 'Your location'}`);

      if (accuracy) {
        circleRef.current = L.circle([lat, lng], { radius: accuracy, color: '#6c63ff', fillColor: '#6c63ff', fillOpacity: 0.1, weight: 1 })
          .addTo(mapInstanceRef.current);
      }
    } else {
      // Update existing marker position
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(`📍 ${address || 'Your location'}`);
      }
      if (circleRef.current && accuracy) {
        circleRef.current.setLatLng([lat, lng]).setRadius(accuracy);
      }
    }
  }, [lat, lng, accuracy, address]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="gps-map" />;
}


function VolumeBar({ volumePct }) {
  const segments = 20;
  return (
    <div className="volume-bar">
      {Array.from({ length: segments }).map((_, i) => {
        const threshold = (i / segments) * 100;
        const active = volumePct > threshold;
        const color = i > 14 ? '#ff4757' : i > 9 ? '#ffa502' : '#2ed573';
        return (
          <div
            key={i}
            className="volume-segment"
            style={{
              background: active ? color : 'rgba(255,255,255,0.06)',
              boxShadow: active ? `0 0 4px ${color}80` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

function EmotionBadge({ emotion }) {
  const COLORS = {
    calm: 'var(--safe)',
    stressed: 'var(--caution)',
    anxious: 'var(--caution)',
    agitated: 'var(--danger)',
    fearful: 'var(--emergency)',
    analyzing: 'var(--text-muted)',
  };
  const color = COLORS[emotion] || 'var(--text-muted)';
  return (
    <span className="emotion-badge" style={{ color, borderColor: color, background: `${color}18` }}>
      {emotion?.toUpperCase() || 'ANALYZING'}
    </span>
  );
}

export default function MonitorPage() {
  const {
    isMonitoring, riskScore,
    speech, audio, emotion, gps, motion,
    startMonitoring, stopMonitoring, triggerManualSOS,
    micPermission, locationPermission,
  } = useSafety();

  return (
    <div className="monitor-page page-content">
      <div className="page-container">

        {/* Header */}
        <div className="monitor-header">
          <div>
            <h1 className="section-title" style={{ fontSize: '24px' }}><span /><Radio size={20} /> Live Monitoring Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Real-time analysis of all safety signals. Grant microphone & location permissions when prompted.
            </p>
          </div>
          <div className="monitor-actions">
            <button
              id="monitor-sos-btn"
              className="btn btn-danger"
              onClick={triggerManualSOS}
            >
              <AlertTriangle size={16} /> Manual SOS
            </button>
            <button
              id="monitor-toggle-btn"
              className={`btn ${isMonitoring ? 'btn-ghost' : 'btn-primary'}`}
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
            >
              {isMonitoring
                ? <><StopCircle size={16} /> Stop Monitoring</>
                : <><Play size={16} /> Start Monitoring</>
              }
            </button>
          </div>
        </div>

        {/* Permission warnings */}
        {isMonitoring && micPermission === 'denied' && (
          <div className="monitor-alert monitor-alert--error">
            🎤 Microphone permission denied. Speech, audio, and emotion detection are inactive.
            Please allow microphone access in your browser settings and refresh.
          </div>
        )}
        {isMonitoring && locationPermission === 'denied' && (
          <div className="monitor-alert monitor-alert--warn">
            📍 Location permission denied. GPS tracking is inactive.
          </div>
        )}

        <div className="monitor-layout">
          {/* Center gauge */}
          <div className="monitor-gauge-col">
            <div className="glass-card monitor-gauge-card elevated">
              <h3 className="section-title"><span />Risk Score</h3>
              <RiskGauge score={riskScore} isMonitoring={isMonitoring} />

              {/* Total breakdown */}
              <div className="monitor-breakdown">
                {[
                  { label: 'Speech', val: speech.riskContribution, max: 35, color: 'var(--brand-light)' },
                  { label: 'Audio', val: audio.riskContribution, max: 25, color: 'var(--caution)' },
                  { label: 'Emotion', val: emotion.riskContribution, max: 20, color: 'var(--danger)' },
                  { label: 'Motion', val: motion.riskContribution, max: 10, color: 'var(--safe)' },
                  { label: 'GPS', val: gps.riskContribution, max: 5, color: 'var(--text-secondary)' },
                ].map(({ label, val, max, color }) => (
                  <div key={label} className="monitor-bd-row">
                    <span className="monitor-bd-label">{label}</span>
                    <div className="monitor-bd-bar">
                      <div className="monitor-bd-fill" style={{ width: `${(val / max) * 100}%`, background: color }} />
                    </div>
                    <span className="monitor-bd-val" style={{ color: val > 0 ? color : 'var(--text-muted)' }}>
                      {val}/{max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signal cards */}
          <div className="monitor-signals-col">

            {/* Feature 4: Distress Speech */}
            <SignalCard
              icon={Mic}
              title="Distress Speech Detection"
              isActive={speech.isActive}
              riskContribution={speech.riskContribution}
              maxContribution={35}
              statusLabel={speech.keywords?.length > 0 ? 'DISTRESS DETECTED' : 'Listening'}
              highlight={speech.riskContribution > 20}
            >
              <div className="monitor-speech">
                {speech.transcript ? (
                  <div className="monitor-transcript">
                    "{speech.transcript}"
                  </div>
                ) : (
                  <div className="monitor-placeholder">
                    {isMonitoring ? '🎤 Listening for speech…' : 'Start monitoring to activate'}
                  </div>
                )}
                {speech.keywords?.length > 0 && (
                  <div className="monitor-keywords">
                    {speech.keywords.map((kw, i) => (
                      <span key={i} className={`monitor-keyword monitor-keyword--${kw.severity}`}>
                        {kw.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </SignalCard>

            {/* Feature 5: Audio Event */}
            <SignalCard
              icon={Activity}
              title="Audio Event Detection"
              isActive={audio.isActive}
              riskContribution={audio.riskContribution}
              maxContribution={25}
              statusLabel={audio.eventType === 'scream' ? 'SCREAM DETECTED' : audio.eventType === 'loud_sustained' ? 'LOUD SUSTAINED' : audio.eventType === 'loud' ? 'LOUD SOUND' : 'Normal'}
              highlight={audio.riskContribution >= 18}
            >
              <div className="monitor-audio">
                <div className="monitor-audio-header">
                  <span className="monitor-audio-label">Volume Level</span>
                  <span className={`monitor-audio-type monitor-audio-type--${audio.eventType}`}>
                    {audio.eventType?.replace('_', ' ').toUpperCase() || 'SILENCE'}
                  </span>
                </div>
                <VolumeBar volumePct={audio.volumePct || 0} />
                <div className="monitor-audio-pct">{audio.volumePct || 0}%</div>
              </div>
            </SignalCard>

            {/* Feature 6: Voice Emotion */}
            <SignalCard
              icon={Brain}
              title="Voice Emotion Detection"
              isActive={emotion.isActive}
              riskContribution={emotion.riskContribution}
              maxContribution={20}
              statusLabel={emotion.emotion ? emotion.emotion.toUpperCase() : 'Analyzing'}
              highlight={emotion.riskContribution >= 14}
            >
              <div className="monitor-emotion">
                <EmotionBadge emotion={emotion.emotion} />
                <div className="monitor-emotion-stats">
                  <div className="monitor-emotion-stat">
                    <span>Confidence</span>
                    <span className="monitor-emotion-val">{emotion.confidence || 0}%</span>
                  </div>
                  <div className="monitor-emotion-stat">
                    <span>Pitch</span>
                    <span className="monitor-emotion-val">{emotion.pitch || 0} Hz</span>
                  </div>
                </div>
              </div>
            </SignalCard>

            {/* Feature 7: GPS — Live Map */}
            <SignalCard
              icon={MapPin}
              title="Real-Time GPS Tracking"
              isActive={gps.isActive}
              riskContribution={gps.riskContribution}
              maxContribution={5}
              statusLabel={gps.lat ? 'Location Active' : 'Locating…'}
            >
              <div className="monitor-gps">
                {gps.lat ? (
                  <>
                    <div className="monitor-gps-address">{gps.address || 'Locating address…'}</div>
                    <div className="monitor-gps-coords">
                      {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                      {gps.accuracy && <span className="monitor-gps-acc"> ±{Math.round(gps.accuracy)}m</span>}
                    </div>
                    <LiveGPSMap lat={gps.lat} lng={gps.lng} accuracy={gps.accuracy} address={gps.address} />
                  </>
                ) : (
                  <div className="monitor-placeholder">
                    {isMonitoring ? '📍 Acquiring GPS signal…' : 'Start monitoring to get location'}
                  </div>
                )}
                {gps.riskContribution > 0 && (
                  <div className="monitor-gps-night">🌙 Night-time risk factor active (+{gps.riskContribution})</div>
                )}
              </div>
            </SignalCard>

            {/* Device Motion */}
            <SignalCard
              icon={Smartphone}
              title="Device Motion"
              isActive={motion.isActive}
              riskContribution={motion.riskContribution}
              maxContribution={10}
              statusLabel={motion.eventType === 'fall_detected' ? '⚠️ FALL DETECTED' : motion.eventType === 'shaking' ? 'SHAKING' : 'Normal'}
              highlight={motion.riskContribution >= 8}
            >
              <div className="monitor-motion">
                <div className="monitor-motion-type" style={{
                  color: motion.eventType === 'fall_detected' ? 'var(--emergency)' : motion.eventType === 'shaking' ? 'var(--caution)' : 'var(--safe)'
                }}>
                  {motion.eventType === 'fall_detected' ? '⚠️ Possible fall detected!' : motion.eventType === 'shaking' ? '📳 Abnormal shaking' : '✅ Normal movement'}
                </div>
                {motion.delta > 0 && (
                  <div className="monitor-motion-delta">Acceleration delta: {motion.delta} m/s²</div>
                )}
              </div>
            </SignalCard>

          </div>
        </div>
      </div>
    </div>
  );
}
