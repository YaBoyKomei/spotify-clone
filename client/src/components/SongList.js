import React from 'react';
import './SongList.css';
import { HeartIcon } from './Icons';

function SongList({ songs, onSongClick, currentSong, likedSongs, onToggleLike, viewTitle }) {
  const isLiked = (song) => likedSongs.find(s => s.id === song.id);

  return (
    <div className="song-list">
      <h1>{viewTitle}</h1>
      {songs.length === 0 ? (
        <div className="empty-state">
          <p>No songs here yet. {viewTitle === 'Liked Songs' ? 'Like some songs to see them here!' : ''}</p>
        </div>
      ) : (
        <div className="songs-grid">
          {songs.map(song => (
            <div
              key={song.id}
              className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
            >
              <div className="song-card-content" onClick={() => onSongClick(song)}>
                <img src={song.cover} alt={song.title} />
                <div className="song-info">
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                </div>
              </div>
              <button 
                className={`like-button ${isLiked(song) ? 'liked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(song);
                }}
                title={isLiked(song) ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
              >
                <HeartIcon filled={isLiked(song)} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SongList;
