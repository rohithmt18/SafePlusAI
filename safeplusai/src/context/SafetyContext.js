import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import speechService from '../services/speechService';
import audioService from '../services/audioService';
import emotionService from '../services/emotionService';
import gpsService from '../services/gpsService';
import motionService from '../services/motionService';
import sosSound from '../services/sosSound';
import { calculateRiskScore, getRiskLevel, generateEmergencyReport } from '../services/riskEngine';
import { events as eventsAPI, notify as notifyAPI, contacts as contactsAPI } from '../services/apiService';

const SafetyContext = createContext(null);

const initialState = {
  isMonitoring: false,
  riskScore: 0,
  riskLevel: null,

  speech: { transcript: '', keywords: [], riskContribution: 0, isActive: false },
  audio: { volume: 0, volumePct: 0, eventType: 'silence', riskContribution: 0, isActive: false },
  emotion: { emotion: 'calm', confidence: 0, riskContribution: 0, pitch: 0, isActive: false },
  gps: { lat: null, lng: null, address: null, accuracy: null, timeRisk: 0, riskContribution: 0, isActive: false },
  motion: { eventType: 'normal', delta: 0, riskContribution: 0, isActive: false },

  emergencyMode: false,
  emergencyCountdown: 15,
  emergencyReport: null,
  showEmergencyModal: false,

  toasts: [],
  micPermission: 'unknown',
  locationPermission: 'unknown',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MONITORING':       return { ...state, isMonitoring: action.payload };
    case 'UPDATE_RISK':          return { ...state, riskScore: action.payload.score, riskLevel: action.payload.level };
    case 'UPDATE_SPEECH':        return { ...state, speech: { ...state.speech, ...action.payload, isActive: true } };
    case 'UPDATE_AUDIO':         return { ...state, audio: { ...state.audio, ...action.payload, isActive: true } };
    case 'UPDATE_EMOTION':       return { ...state, emotion: { ...state.emotion, ...action.payload, isActive: true } };
    case 'UPDATE_GPS':           return { ...state, gps: { ...state.gps, ...action.payload, isActive: true } };
    case 'UPDATE_MOTION':        return { ...state, motion: { ...state.motion, ...action.payload, isActive: true } };
    case 'SET_SIGNAL_INACTIVE':  return { ...state, [action.signal]: { ...state[action.signal], isActive: false } };
    case 'ENTER_EMERGENCY':      return { ...state, emergencyMode: true, showEmergencyModal: true, emergencyCountdown: 15 };
    case 'SET_COUNTDOWN':        return { ...state, emergencyCountdown: action.payload };
    case 'CANCEL_EMERGENCY':     return { ...state, emergencyMode: false, showEmergencyModal: false, emergencyCountdown: 15 };
    case 'CONFIRM_EMERGENCY':    return { ...state, emergencyMode: true, showEmergencyModal: false, emergencyReport: action.payload };
    case 'RESET_EMERGENCY':      return { ...state, emergencyMode: false, emergencyReport: null, showEmergencyModal: false };
    case 'ADD_TOAST':            return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':         return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_MIC_PERMISSION':   return { ...state, micPermission: action.payload };
    case 'SET_LOCATION_PERMISSION': return { ...state, locationPermission: action.payload };
    default: return state;
  }
}

export function SafetyProvider({ children, user }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const countdownTimerRef = useRef(null);
  const riskRecalcIntervalRef = useRef(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    dispatch({ type: 'ADD_TOAST', payload: { id, message, toastType: type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), duration);
  }, []);

  const recalculateRisk = useCallback(() => { // eslint-disable-line react-hooks/exhaustive-deps
    const s = stateRef.current;
    const signals = {
      speechRisk: s.speech.riskContribution,
      audioRisk: s.audio.riskContribution,
      emotionRisk: s.emotion.riskContribution,
      motionRisk: s.motion.riskContribution,
      timeRisk: s.gps.riskContribution,
      locationRisk: 0,
      keywords: s.speech.keywords,
      audioEventType: s.audio.eventType,
      emotion: s.emotion.emotion,
      emotionConfidence: s.emotion.confidence,
      motionEventType: s.motion.eventType,
    };
    const score = calculateRiskScore(signals);
    const level = getRiskLevel(score);
    dispatch({ type: 'UPDATE_RISK', payload: { score, level } });

    const threshold = user?.settings?.riskThreshold ?? 75;
    if (score >= threshold && !stateRef.current.emergencyMode) {
      dispatch({ type: 'ENTER_EMERGENCY' });
      sosSound.playSOSBeeps();
      startEmergencyCountdown(signals);
    }
  }, [user]); // eslint-disable-line

  const startEmergencyCountdown = useCallback((signals) => { // eslint-disable-line react-hooks/exhaustive-deps
    let count = 15;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      dispatch({ type: 'SET_COUNTDOWN', payload: count });
      if (count <= 0) {
        clearInterval(countdownTimerRef.current);
        triggerEmergency(signals);
      }
    }, 1000);
  }, []);

  const triggerEmergency = useCallback(async (signals, isManual = false) => {
    const s = stateRef.current;

    // Get contacts from API
    let contactsList = [];
    try {
      const data = await contactsAPI.list();
      contactsList = data.contacts || [];
    } catch { /* backend offline */ }

    const report = generateEmergencyReport(
      { ...signals, score: s.riskScore },
      s.gps,
      s.gps.address,
      user,
      contactsList
    );

    // 1. Play SOS siren
    sosSound.startSiren(20);

    // 2. Send SMS via backend + get DB id
    let savedEvent = report;
    try {
      const notifyData = await notifyAPI.sos({
        riskScore: s.riskScore,
        riskLevel: s.riskLevel?.label,
        location: s.gps,
        aiSummary: report.aiSummary,
        triggeredBy: isManual ? 'manual' : 'auto',
      });

      const sentCount = notifyData.sent || 0;
      const totalCount = notifyData.total || contactsList.length;
      addToast(
        sentCount > 0
          ? `📱 SMS sent to ${sentCount}/${totalCount} contacts`
          : `📋 ${totalCount} contacts logged (add Twilio for real SMS)`,
        'warning', 8000
      );
    } catch (e) {
      addToast('⚠️ Backend offline — SMS not sent', 'error', 6000);
    }

    // 3. Save event to MongoDB
    try {
      const eventData = await eventsAPI.save({
        riskScore: s.riskScore,
        riskLevel: s.riskLevel?.label || 'Emergency',
        location: s.gps,
        signals: { ...signals, score: s.riskScore },
        timeline: report.timeline,
        aiSummary: report.aiSummary,
        contactsNotified: contactsList.map(c => ({ name: c.name, phone: c.phone, relationship: c.relationship })),
        triggeredBy: isManual ? 'manual' : 'auto',
      });
      savedEvent = { ...report, id: eventData.event?._id || report.id };
    } catch (e) {
      // Fallback: save to localStorage
      const { saveEmergencyEvent } = await import('../services/riskEngine');
      saveEmergencyEvent(report);
    }

    dispatch({ type: 'CONFIRM_EMERGENCY', payload: savedEvent });
    addToast('🚨 Emergency alert triggered! Contacts notified.', 'emergency', 8000);
  }, [user, addToast]); // eslint-disable-line

  const cancelEmergency = useCallback(() => {
    clearInterval(countdownTimerRef.current);
    sosSound.stopSiren();
    dispatch({ type: 'CANCEL_EMERGENCY' });
    addToast('✅ Emergency cancelled. Stay safe!', 'success');
  }, [addToast]);

  const startMonitoring = useCallback(async () => {
    dispatch({ type: 'SET_MONITORING', payload: true });
    addToast('🔍 SafeplusAI monitoring activated', 'info');

    const speechInit = speechService.init(
      (result) => dispatch({ type: 'UPDATE_SPEECH', payload: { transcript: result.transcript, keywords: result.keywords, riskContribution: result.riskScore } }),
      (status) => {
        if (status === 'permission_denied') {
          dispatch({ type: 'SET_MIC_PERMISSION', payload: 'denied' });
          addToast('🎤 Microphone permission denied', 'error');
        }
      }
    );
    if (speechInit) {
      speechService.start();
      dispatch({ type: 'SET_MIC_PERMISSION', payload: 'granted' });
    }

    const audioOk = await audioService.start((data) =>
      dispatch({ type: 'UPDATE_AUDIO', payload: { volume: data.volume, volumePct: data.volumePct, eventType: data.eventType, riskContribution: data.riskScore } })
    );
    if (!audioOk) dispatch({ type: 'SET_MIC_PERMISSION', payload: 'denied' });

    await emotionService.start((data) =>
      dispatch({ type: 'UPDATE_EMOTION', payload: { emotion: data.emotion, confidence: data.confidence, riskContribution: data.riskScore, pitch: data.pitch } })
    );

    await gpsService.start((data) => {
      if (data.error) { dispatch({ type: 'SET_LOCATION_PERMISSION', payload: 'denied' }); return; }
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: 'granted' });
      dispatch({ type: 'UPDATE_GPS', payload: { lat: data.lat, lng: data.lng, address: data.address, accuracy: data.accuracy, riskContribution: data.riskScore } });
    });

    await motionService.start((data) =>
      dispatch({ type: 'UPDATE_MOTION', payload: { eventType: data.eventType, delta: data.delta, riskContribution: data.riskScore } })
    );

    riskRecalcIntervalRef.current = setInterval(recalculateRisk, 1000);
  }, [addToast, recalculateRisk]);

  const stopMonitoring = useCallback(() => {
    dispatch({ type: 'SET_MONITORING', payload: false });
    speechService.stop();
    audioService.stop();
    emotionService.stop();
    gpsService.stop();
    motionService.stop();
    sosSound.stopSiren();
    clearInterval(riskRecalcIntervalRef.current);
    clearInterval(countdownTimerRef.current);
    ['speech', 'audio', 'emotion', 'gps', 'motion'].forEach(sig =>
      dispatch({ type: 'SET_SIGNAL_INACTIVE', signal: sig })
    );
    dispatch({ type: 'UPDATE_RISK', payload: { score: 0, level: getRiskLevel(0) } });
    addToast('⏹️ Monitoring stopped', 'info');
  }, [addToast]);

  const triggerManualSOS = useCallback(() => {
    const s = stateRef.current;
    const signals = {
      speechRisk: s.speech.riskContribution,
      audioRisk: s.audio.riskContribution,
      emotionRisk: s.emotion.riskContribution,
      motionRisk: s.motion.riskContribution,
      timeRisk: s.gps.riskContribution,
      locationRisk: 0,
      keywords: s.speech.keywords,
      audioEventType: s.audio.eventType,
      emotion: s.emotion.emotion,
      emotionConfidence: s.emotion.confidence,
      motionEventType: s.motion.eventType,
    };
    // Play SOS alert sound immediately
    sosSound.playSOSAlert();
    dispatch({ type: 'ENTER_EMERGENCY' });
    startEmergencyCountdown(signals);
  }, [startEmergencyCountdown]);

  useEffect(() => {
    return () => {
      speechService.stop();
      audioService.stop();
      emotionService.stop();
      gpsService.stop();
      motionService.stop();
      sosSound.stopSiren();
      clearInterval(riskRecalcIntervalRef.current);
      clearInterval(countdownTimerRef.current);
    };
  }, []);

  return (
    <SafetyContext.Provider value={{
      ...state,
      startMonitoring,
      stopMonitoring,
      cancelEmergency,
      triggerManualSOS,
      addToast,
    }}>
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider');
  return ctx;
}
