import React from 'react';
import './Sidebar.css';
import { HomeIcon, SearchIcon, LibraryIcon, PlusIcon, HeartIcon, MusicIcon } from './Icons';

function Sidebar({ currentView, onViewChange, likedCount, isOpen, onClose, playlists, historyCount, onCreatePlaylist }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo logo">
        <MusicIcon />
        <div className="logo-text">
          <h2>Sonfy</h2>
          <span className="logo-subtitle">Music Streaming</span>
        </div>
      </div>
      <nav className="sidebar-nav nav-menu">
        <div 
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => onViewChange('home')}
        >
          <HomeIcon /> Home
        </div>
        <div 
          className={`nav-item ${currentView === 'search' ? 'active' : ''}`}
          onClick={() => onViewChange('search')}
        >
          <SearchIcon /> Search
        </div>
        <div 
          className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => onViewChange('library')}
        >
          <LibraryIcon /> Your Library
        </div>
      </nav>
      <div className="playlists">
        <div 
          className="nav-item"
          onClick={onCreatePlaylist}
        >
          <PlusIcon /> Create Playlist
        </div>
        <div 
          className={`nav-item ${currentView === 'liked' ? 'active' : ''}`}
          onClick={() => onViewChange('liked')}
        >
          <HeartIcon filled={false} /> 
          <span>Liked Songs {likedCount > 0 && <span className="count">({likedCount})</span>}</span>
        </div>
        <div 
          className={`nav-item ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => onViewChange('history')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          <span>History {historyCount > 0 && <span className="count">({historyCount})</span>}</span>
        </div>
        
        {playlists && playlists.length > 0 && (
          <div className="playlist-divider"></div>
        )}
        
        {playlists && playlists.map(playlist => (
          <div 
            key={playlist.id}
            className={`nav-item ${currentView === `playlist-${playlist.id}` ? 'active' : ''}`}
            onClick={() => onViewChange(`playlist-${playlist.id}`)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
            <span>{playlist.name}</span>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}

export default Sidebar;
