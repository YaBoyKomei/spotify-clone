import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { registerServiceWorker, trackWebVitals, inlineCriticalCSS } from './utils/performance';

// Google OAuth Client ID - set this in your environment or replace with your actual client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '74620656042-YOUR_CLIENT_ID.apps.googleusercontent.com';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'white', background: '#000' }}>
          <h1>Something went wrong with Sonfy</h1>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Inline critical CSS for faster initial render
inlineCriticalCSS();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for offline functionality and caching
// registerServiceWorker(); // Temporarily disabled for debugging

// Track Web Vitals for performance monitoring
trackWebVitals();
