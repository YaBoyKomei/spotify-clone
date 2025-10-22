import React from 'react';
import { HeartIcon, PlusIcon } from './Icons';

function SongCard({ song, currentSong, isLiked, onPlay, onToggleLike, onAddToPlaylist, onRemoveFromPlaylist, showRemove }) {
  return (
    <div
      className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
    >
      <button 
        className={`like-button ${isLiked ? 'liked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike(song);
        }}
        title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
      >
        <HeartIcon filled={isLiked} />
      </button>
      {showRemove ? (
        <button
          className="remove-from-playlist-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromPlaylist(song);
          }}
          title="Remove from Playlist"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      ) : (
        <button
          className="add-to-playlist-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist(song);
          }}
          title="Add to Playlist"
        >
          <PlusIcon />
        </button>
      )}
      <div className="song-card-content" onClick={() => onPlay(song)}>
        <img src={song.cover} alt={song.title} />
        <div className="song-info">
          <h3>{song.title}</h3>
          <p>{song.artist}</p>
        </div>
      </div>
    </div>
  );
}

export default SongCard;
