import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Tracks from './pages/Tracks';
import Artists from './pages/Artists';
import Playlists from './pages/Playlists';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Collaboration from './pages/Collaboration';
import './App.scss';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <Navigation />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tracks" element={<Tracks />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/collaboration" element={<Collaboration />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
