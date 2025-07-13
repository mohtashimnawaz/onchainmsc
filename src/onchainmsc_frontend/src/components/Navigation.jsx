import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Music, 
  Users, 
  PlaySquare, 
  User, 
  Settings, 
  BarChart3, 
  UserCheck,
  Menu,
  X,
  LogOut,
  LogIn
} from 'lucide-react';

const Navigation = () => {
  const { isAuthenticated, artist, login, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, auth: true },
    { name: 'Tracks', href: '/tracks', icon: Music },
    { name: 'Artists', href: '/artists', icon: Users },
    { name: 'Playlists', href: '/playlists', icon: PlaySquare },
    { name: 'Collaboration', href: '/collaboration', icon: UserCheck, auth: true },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, auth: true },
    { name: 'Profile', href: '/profile', icon: User, auth: true },
    { name: 'Admin', href: '/admin', icon: Settings, auth: true, admin: true },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (item.auth && !isAuthenticated) return false;
    if (item.admin && !artist?.role === 'Admin') return false;
    return true;
  });

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Music className="logo-icon" />
            <span className="logo-text">OnChain Music</span>
          </div>
        </div>

        <div className="sidebar-content">
          <ul className="nav-list">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sidebar-footer">
          {isAuthenticated ? (
            <div className="user-info">
              <div className="user-avatar">
                {artist?.name?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <p className="user-name">{artist?.name || 'User'}</p>
                <p className="user-balance">{artist?.royalty_balance || 0} tokens</p>
              </div>
              <button onClick={logout} className="logout-btn">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={login} className="btn btn-primary login-btn">
              <LogIn size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-btn"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="mobile-logo">
          <Music size={24} />
          <span>OnChain Music</span>
        </div>

        {isAuthenticated ? (
          <div className="mobile-user">
            <div className="user-avatar">
              {artist?.name?.charAt(0) || 'U'}
            </div>
          </div>
        ) : (
          <button onClick={login} className="btn btn-primary">
            <LogIn size={16} />
          </button>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            <ul className="mobile-nav-list">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`mobile-nav-link ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            
            {isAuthenticated && (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <div className="user-avatar">
                    {artist?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="user-name">{artist?.name || 'User'}</p>
                    <p className="user-balance">{artist?.royalty_balance || 0} tokens</p>
                  </div>
                </div>
                <button onClick={logout} className="btn btn-secondary">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 250px;
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          color: var(--primary-color);
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .sidebar-content {
          flex: 1;
          padding: 1rem 0;
        }

        .nav-list {
          list-style: none;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s;
        }

        .nav-link:hover,
        .nav-link.active {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .nav-link.active {
          border-right: 3px solid var(--primary-color);
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.875rem;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
        }

        .user-balance {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .logout-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          color: var(--error-color);
          background: rgba(239, 68, 68, 0.1);
        }

        .login-btn {
          width: 100%;
        }

        .mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .mobile-menu-btn {
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.5rem;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .mobile-user {
          display: flex;
          align-items: center;
        }

        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 200;
          display: flex;
        }

        .mobile-menu {
          width: 250px;
          background: var(--bg-secondary);
          height: 100%;
          padding: 1rem 0;
          display: flex;
          flex-direction: column;
        }

        .mobile-nav-list {
          list-style: none;
          flex: 1;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s;
        }

        .mobile-nav-link:hover,
        .mobile-nav-link.active {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .mobile-user-section {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }

          .mobile-header {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default Navigation;
