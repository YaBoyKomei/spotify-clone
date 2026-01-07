import { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Handle OAuth redirect callback (for Android app)
  const handleOAuthCallback = async (accessToken) => {
    try {
      console.log('🔐 Processing OAuth callback...');
      
      // Get user info from Google using access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info');
      }
      
      const userInfo = await userInfoResponse.json();
      console.log('👤 User info from callback:', userInfo);
      
      const userData = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        token: accessToken
      };

      setUser(userData);
      localStorage.setItem('sonfy_user', JSON.stringify(userData));
      console.log('✅ Logged in via redirect as:', userData.name);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return userData;
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      return null;
    }
  };

  // Load user from localStorage on mount AND check for OAuth redirect
  useEffect(() => {
    const init = async () => {
      // Check for OAuth redirect (access_token in URL hash)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('📱 Detected OAuth redirect callback');
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          await handleOAuthCallback(accessToken);
          setLoading(false);
          return;
        }
      }
      
      // Load from localStorage
      const savedUser = localStorage.getItem('sonfy_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log('👤 User loaded from storage:', userData.name);
        } catch (e) {
          localStorage.removeItem('sonfy_user');
        }
      }
      setLoading(false);
    };
    
    init();
  }, []);

  const login = async (credentialResponse) => {
    try {
      console.log('🔐 Processing Google login...');
      
      // If we have userInfo directly (from useGoogleLogin flow)
      if (credentialResponse.userInfo) {
        const userInfo = credentialResponse.userInfo;
        const userData = {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          token: credentialResponse.credential // access token
        };

        setUser(userData);
        localStorage.setItem('sonfy_user', JSON.stringify(userData));
        console.log('✅ Logged in as:', userData.name);
        return userData;
      }
      
      // Fallback: Send credential to server for verification (old flow)
      const response = await fetch(getApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        picture: data.user.picture,
        token: data.token
      };

      setUser(userData);
      localStorage.setItem('sonfy_user', JSON.stringify(userData));
      console.log('✅ Logged in as:', userData.name);

      return userData;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sonfy_user');
    console.log('👋 Logged out');
  };

  // Sync user data to server
  const syncToServer = async (likedSongs, playlists, listeningHistory, playCount, recentItems) => {
    if (!user) return false;

    setSyncing(true);
    try {
      const response = await fetch(getApiUrl('/api/user/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          likedSongs,
          playlists,
          listeningHistory,
          playCount,
          recentItems
        })
      });

      if (!response.ok) throw new Error('Sync failed');
      
      console.log('☁️ Data synced to server');
      return true;
    } catch (error) {
      console.error('❌ Sync error:', error);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  // Fetch user data from server
  const fetchFromServer = async () => {
    if (!user) return null;

    try {
      const response = await fetch(getApiUrl('/api/user/data'), {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) throw new Error('Fetch failed');
      
      const data = await response.json();
      console.log('📥 Data fetched from server');
      return data;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      syncing,
      login,
      logout,
      syncToServer,
      fetchFromServer,
      isLoggedIn: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
