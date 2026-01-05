import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './ProfileButton.css';

const ProfileButton = ({ onSync, onFetch }) => {
  const { user, login, logout, syncing, isLoggedIn } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoginError(null);
        // Get user info from Google using access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoResponse.json();
        
        // Create a credential-like object for our auth context
        await login({
          credential: tokenResponse.access_token,
          userInfo: userInfo
        });
        setShowLoginModal(false);
        if (onFetch) {
          onFetch();
        }
      } catch (error) {
        console.error('Login failed:', error);
        setLoginError('Login failed. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setLoginError('Google sign-in failed. Please try again.');
    }
  });

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
                  <h2>Sign in to Komei</h2>
                  <p>Sync your liked songs and playlists across devices</p>
                </div>
                <div className="google-login-wrapper">
                  <button className="google-signin-btn" onClick={() => googleLogin()}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
                {loginError && <p className="login-error">{loginError}</p>}
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
