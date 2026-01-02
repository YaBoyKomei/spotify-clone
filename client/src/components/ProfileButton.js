import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './ProfileButton.css';

const ProfileButton = ({ onSync, onFetch }) => {
  const { user, login, logout, syncing, isLoggedIn } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse);
      setShowLoginModal(false);
      // Fetch data from server after login
      if (onFetch) {
        onFetch();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleSync = async () => {
    if (onSync) {
      await onSync();
    }
    setShowMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  if (!isLoggedIn) {
    return (
      <>
        <button 
          className="profile-button login-btn"
          onClick={() => setShowLoginModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span>Sign In</span>
        </button>

        {showLoginModal && (
          <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
            <div className="login-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setShowLoginModal(false)}>×</button>
              <div className="login-modal-content">
                <div className="login-header">
                  <h2>Sign in to Sonfy</h2>
                  <p>Sync your liked songs and playlists across devices</p>
                </div>
                <div className="google-login-wrapper">
                  <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={() => console.log('Login Failed')}
                    theme="filled_black"
                    size="large"
                    text="signin_with"
                    shape="pill"
                  />
                </div>
                <p className="login-note">
                  Your music preferences will be securely stored and synced
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="profile-container">
      <button 
        className="profile-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {showMenu && (
        <>
          <div className="profile-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="profile-menu">
            <div className="profile-menu-header">
              <img src={user.picture} alt={user.name} className="menu-avatar" />
              <div className="menu-user-info">
                <span className="menu-user-name">{user.name}</span>
                <span className="menu-user-email">{user.email}</span>
              </div>
            </div>
            <div className="profile-menu-divider" />
            <button className="profile-menu-item" onClick={handleSync} disabled={syncing}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button className="profile-menu-item logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileButton;
