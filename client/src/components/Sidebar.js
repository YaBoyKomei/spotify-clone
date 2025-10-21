import React from 'react';
import './Sidebar.css';
import { HomeIcon, SearchIcon, LibraryIcon, PlusIcon, HeartIcon, MusicIcon } from './Icons';

function Sidebar({ currentView, onViewChange, likedCount, isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo logo">
        <MusicIcon />
        <h2>Spotify Clone</h2>
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
          className={`nav-item ${currentView === 'create' ? 'active' : ''}`}
          onClick={() => {
            onViewChange('create');
            alert('Create Playlist feature - Coming soon!');
          }}
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
      </div>
      </div>
    </>
  );
}

export default Sidebar;
