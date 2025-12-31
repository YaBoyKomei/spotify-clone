import React from 'react';
import './BottomNav.css';
import { HomeIcon, SearchIcon, HeartIcon } from './Icons';

function BottomNav({ currentView, onViewChange }) {
  return (
    <nav className="bottom-nav">
      <div
        className={`bottom-nav-item ${currentView === 'home' ? 'active' : ''}`}
        onClick={() => onViewChange('home')}
      >
        <HomeIcon />
        <span>Home</span>
      </div>
      <div
        className={`bottom-nav-item ${currentView === 'search' ? 'active' : ''}`}
        onClick={() => onViewChange('search')}
      >
        <SearchIcon />
        <span>Search</span>
      </div>
      <div
        className={`bottom-nav-item ${currentView === 'liked' ? 'active' : ''}`}
        onClick={() => onViewChange('liked')}
      >
        <HeartIcon filled={currentView === 'liked'} />
        <span>Liked</span>
      </div>
      <div
        className={`bottom-nav-item ${currentView === 'history' ? 'active' : ''}`}
        onClick={() => onViewChange('history')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
        <span>History</span>
      </div>
      <div
        className={`bottom-nav-item ${currentView === 'library' || currentView.startsWith('playlist-') ? 'active' : ''}`}
        onClick={() => onViewChange('library')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
        </svg>
        <span>Library</span>
      </div>
    </nav>
  );
}

export default BottomNav;
