import React, { useRef, useEffect } from 'react';
import { HeartIcon, PlusIcon } from './Icons';
import { getOptimizedImageUrl, lazyLoadImage } from '../utils/performance';

function SongCard({ song, currentSong, isLiked, onPlay, onToggleLike, onAddToPlaylist, onRemoveFromPlaylist, showRemove }) {
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current) {
      lazyLoadImage(imgRef.current);
    }
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPlay(song);
    }
  };

  return (
    <article
      className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label={`Play ${song.title} by ${song.artist}`}
      itemScope
      itemType="https://schema.org/MusicRecording"
    >
      <button 
        className={`like-button ${isLiked ? 'liked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike(song);
        }}
        title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
        aria-label={isLiked ? `Remove ${song.title} from liked songs` : `Add ${song.title} to liked songs`}
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
          aria-label={`Remove ${song.title} from playlist`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
          aria-label={`Add ${song.title} to playlist`}
        >
          <PlusIcon />
        </button>
      )}
      <div className="song-card-content" onClick={() => onPlay(song)}>
        <img 
          ref={imgRef}
          data-src={getOptimizedImageUrl(song.cover, 300)}
          alt={`${song.title} album cover`}
          className="lazy"
          loading="lazy"
          itemProp="image"
          onLoad={(e) => e.target.classList.add('loaded')}
        />
        <div className="song-info">
          <h3 itemProp="name">{song.title}</h3>
          <p itemProp="byArtist" itemScope itemType="https://schema.org/MusicGroup">
            <span itemProp="name">{song.artist}</span>
          </p>
          {song.duration && (
            <meta itemProp="duration" content={song.duration} />
          )}
          {song.album && (
            <meta itemProp="inAlbum" content={song.album} />
          )}
        </div>
      </div>
    </article>
  );
}

export default SongCard;
