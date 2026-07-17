import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SafetyProvider } from './context/SafetyContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import EmergencyModal from './components/EmergencyModal';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MonitorPage from './pages/MonitorPage';
import ContactsPage from './pages/ContactsPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

// Layout wrapper for authenticated pages
function AppLayout() {
  const { user } = useAuth();
  return (
    <SafetyProvider user={user}>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Outlet />
        </main>
        <EmergencyModal />
        <Toast />
      </div>
    </SafetyProvider>
  );
}

// Protected route guard
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="app-loading">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <span>Loading SafeplusAI…</span>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout />;
}

// Public route: redirect to dashboard if already logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-bg" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={
            <PublicRoute><AuthPage /></PublicRoute>
          } />

          {/* Protected */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
