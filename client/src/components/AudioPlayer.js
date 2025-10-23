import React, { useEffect, useRef, useState } from 'react';
import './Player.css';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, VolumeIcon, HeartIcon, ShuffleIcon, RepeatIcon, RepeatOneIcon, AutoplayIcon, PlusIcon, RefreshIcon } from './Icons';

function AudioPlayer({ currentSong, isPlaying, onTogglePlay, onNext, onPrevious, shuffle, onToggleShuffle, repeat, onToggleRepeat, autoplay, onToggleAutoplay, isLiked, onToggleLike, queue, showQueue, onToggleQueue, onPlayFromQueue, onRefreshQueue, likedSongs, onToggleLikeInQueue, onAddToPlaylistFromQueue, onReorderQueue }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songEnded, setSongEnded] = useState(false);
  const [volume, setVolume] = useState(1);
  const isPlayingRef = useRef(isPlaying);
  const autoplayRef = useRef(autoplay);
  const repeatRef = useRef(repeat);
  const onNextRef = useRef(onNext);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [touchDragActive, setTouchDragActive] = useState(false);
  const touchStartYPos = useRef(0);
  const touchCurrentYPos = useRef(0);
  const longPressTimer = useRef(null);
  const isDraggingTouch = useRef(false);
  const draggedElement = useRef(null);

  // Keep refs updated
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Setup audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      console.log('🎵 Song ended - Repeat:', repeatRef.current, 'Autoplay:', autoplayRef.current);
      if (repeatRef.current === 'one') {
        audio.currentTime = 0;
        audio.play();
        setSongEnded(false);
      } else if (autoplayRef.current || repeatRef.current === 'all') {
        console.log('▶️ Auto-playing next song');
        setSongEnded(false);
        onNextRef.current();
      } else {
        console.log('⏹️ Autoplay is off - stopping playback');
        setSongEnded(true);
        onTogglePlay();
      }
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onTogglePlay]);

  // Load song
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    console.log('🎵 Loading song:', currentSong.title);
    
    // For YouTube Music, we'll need to get the audio stream URL
    // This is a placeholder - you'll need to implement the actual audio URL fetching
    const audioUrl = `https://www.youtube.com/watch?v=${currentSong.youtubeId}`;
    
    audio.src = audioUrl;
    setSongEnded(false);
    
    if (isPlaying) {
      audio.play().catch(err => console.error('Play error:', err));
    }
  }, [currentSong, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      setSongEnded(false);
      audio.play().catch(err => console.error('Play error:', err));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Setup Media Session API
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;

    console.log('🎵 Updating Media Session metadata for:', currentSong.title);
    
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: 'YouTube Music',
        artwork: [
          { src: currentSong.cover, sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '128x128', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '192x192', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '256x256', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '384x384', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '512x512', type: 'image/jpeg' },
        ]
      });
    } catch (error) {
      console.error('Error setting Media Session metadata:', error);
    }

    navigator.mediaSession.setActionHandler('play', () => {
      console.log('📱 Media Session: Play');
      if (!isPlayingRef.current) {
        onTogglePlay();
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('📱 Media Session: Pause');
      if (isPlayingRef.current) {
        onTogglePlay();
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('📱 Media Session: Previous');
      onPrevious();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('📱 Media Session: Next');
      onNext();
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
      }
    });

    console.log('📱 Media Session API initialized');
  }, [currentSong, onTogglePlay, onNext, onPrevious]);

  // Update Media Session playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Update Media Session position
  useEffect(() => {
    if ('mediaSession' in navigator && duration > 0) {
      try {
        const safePosition = Math.min(currentTime, duration);
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: safePosition
        });
      } catch (error) {
        // Ignore position state errors
      }
    }
  }, [currentTime, duration]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Player touch handlers (same as before)
  const handlePlayerTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) {
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
  };

  const handlePlayerTouchMove = (e) => {
    if (touchStartY.current !== 0) {
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handlePlayerTouchEnd = () => {
    if (touchStartY.current === 0) {
      return;
    }
    
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;
    
    if (swipeDistance > minSwipeDistance) {
      console.log('👆 Swipe up detected on player - opening queue');
      if (!showQueue) {
        onToggleQueue();
      }
    }
    
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  const handleQueueHeaderTouchStart = (e) => {
    if (e.target.closest('button')) {
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleQueueHeaderTouchMove = (e) => {
    if (touchStartY.current !== 0) {
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handleQueueHeaderTouchEnd = () => {
    if (touchStartY.current === 0) {
      return;
    }
    
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;
    
    if (swipeDistance < -minSwipeDistance) {
      console.log('👇 Swipe down detected on header - closing queue');
      if (showQueue) {
        onToggleQueue();
      }
    }
    
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Drag handle touch handlers (same as before)
  const handleDragHandleTouchStart = (e, index) => {
    e.stopPropagation();
    const touch = e.touches[0];
    touchStartYPos.current = touch.clientY;
    touchCurrentYPos.current = touch.clientY;
    
    longPressTimer.current = setTimeout(() => {
      console.log('🔒 Long press detected on drag handle - starting drag');
      setDraggedIndex(index);
      setTouchDragActive(true);
      isDraggingTouch.current = true;
      
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 300);
  };

  const handleDragHandleTouchMove = (e) => {
    if (!isDraggingTouch.current) {
      if (longPressTimer.current) {
        const touch = e.touches[0];
        const moveDistance = Math.abs(touch.clientY - touchStartYPos.current);
        if (moveDistance > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    touchCurrentYPos.current = touch.clientY;
    
    const queueList = document.querySelector('.queue-list');
    if (!queueList) return;
    
    const items = Array.from(queueList.querySelectorAll('.queue-item'));
    let newDragOverIndex = null;
    
    items.forEach((item, idx) => {
      const rect = item.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        newDragOverIndex = idx;
      }
    });
    
    if (newDragOverIndex !== null && newDragOverIndex !== dragOverIndex) {
      setDragOverIndex(newDragOverIndex);
    }
  };

  const handleDragHandleTouchEnd = (e, index) => {
    e.stopPropagation();
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isDraggingTouch.current) return;
    
    e.preventDefault();
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      console.log(`🔄 Touch reorder: ${draggedIndex} → ${dragOverIndex}`);
      onReorderQueue(draggedIndex, dragOverIndex);
      
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchDragActive(false);
    isDraggingTouch.current = false;
    draggedElement.current = null;
  };

  return (
    <div 
      className="player"
      onTouchStart={handlePlayerTouchStart}
      onTouchMove={handlePlayerTouchMove}
      onTouchEnd={handlePlayerTouchEnd}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />
      
      {/* Swipe Up Indicator */}
      {!showQueue && currentSong && (
        <div className="swipe-up-indicator">
          <svg className="swipe-gradient-def" width="0" height="0">
            <defs>
              <linearGradient id="chevronGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="swipe-chevrons">
            <div className="swipe-chevron">
              <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {currentSong ? (
        <>
          {/* Time display above progress bar */}
          <div className="time-display-top">
            <span className="time">{formatTime(currentTime)}</span>
            <span className="time">{formatTime(duration)}</span>
          </div>

          {/* Progress bar at the top */}
          <div className="progress-bar-top">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSeek}
              className="progress-input"
            />
            <div className="progress-fill-top" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="player-content">
            <div className="player-song-info">
              <img src={currentSong.cover} alt={currentSong.title} />
              <div className="song-details">
                <div className="player-song-title">{currentSong.title}</div>
                <div className="player-song-artist">{currentSong.artist}</div>
              </div>
              <button 
                className={`player-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={onToggleLike}
                title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
              >
                <HeartIcon filled={isLiked} />
              </button>
            </div>
            
            <div className="player-controls">
              <div className="control-buttons">
              <button 
                onClick={onToggleShuffle} 
                title={shuffle ? 'Shuffle Off' : 'Shuffle On'} 
                className={`control-btn ${shuffle ? 'active' : ''}`}
              >
                <ShuffleIcon />
              </button>
              <button onClick={onPrevious} title="Previous" className="control-btn">
                <SkipBackIcon />
              </button>
              <button 
                className="play-button" 
                onClick={() => {
                  if (songEnded && audioRef.current) {
                    audioRef.current.currentTime = 0;
                    setSongEnded(false);
                    if (!isPlaying) {
                      onTogglePlay();
                    }
                  } else {
                    onTogglePlay();
                  }
                }} 
                title={songEnded ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon /> : songEnded ? <RefreshIcon /> : <PlayIcon />}
              </button>
              <button onClick={onNext} title="Next" className="control-btn">
                <SkipForwardIcon />
              </button>
              <button 
                onClick={onToggleRepeat} 
                title={repeat === 'off' ? 'Repeat Off' : repeat === 'all' ? 'Repeat All' : 'Repeat One'} 
                className={`control-btn ${repeat !== 'off' ? 'active' : ''}`}
              >
                {repeat === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
              </button>
              <button 
                onClick={onToggleAutoplay} 
                title={autoplay ? 'Autoplay On' : 'Autoplay Off'} 
                className={`control-btn ${autoplay ? 'active' : ''}`}
              >
                <AutoplayIcon />
              </button>
            </div>
            </div>
            
            <div className="player-volume">
              <button className="volume-btn" title="Volume">
                <VolumeIcon />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                style={{ width: '100px', marginLeft: '8px' }}
              />
              <button 
                className="queue-toggle-btn" 
                onClick={onToggleQueue}
                title={showQueue ? "Hide Queue" : "Show Queue"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={showQueue ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                </svg>
              </button>
            </div>
          </div>

        </>
      ) : (
        <div className="player-song-info">
          <div className="player-song-title">Select a song to play</div>
        </div>
      )}
      
      {/* Queue Panel - Same as before */}
      {showQueue && currentSong && (
        <div className="queue-panel">
          <div 
            className="queue-drag-handle"
            onTouchStart={handleQueueHeaderTouchStart}
            onTouchMove={handleQueueHeaderTouchMove}
            onTouchEnd={handleQueueHeaderTouchEnd}
          >
            <div className="drag-indicator"></div>
          </div>
          <div 
            className="queue-header"
            onTouchStart={handleQueueHeaderTouchStart}
            onTouchMove={handleQueueHeaderTouchMove}
            onTouchEnd={handleQueueHeaderTouchEnd}
          >
            <h3>Up Next</h3>
            <div className="queue-header-actions">
              <button 
                className="queue-refresh-btn" 
                onClick={onRefreshQueue}
                title="Refresh Queue"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </button>
              <button className="queue-close-btn" onClick={onToggleQueue}>✕</button>
            </div>
          </div>
          <div className="queue-list">
            {queue.length > 0 ? (
              queue.map((song, index) => {
                const isCurrentSong = currentSong && song.id === currentSong.id;
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                
                return (
                  <div 
                    key={`${song.id}-${index}`} 
                    className={`queue-item ${isCurrentSong ? 'current-queue-item' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    draggable={!isCurrentSong}
                    onDragStart={(e) => {
                      if (!isCurrentSong) {
                        setDraggedIndex(index);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/html', e.currentTarget);
                      }
                    }}
                    onDragOver={(e) => {
                      if (!isCurrentSong && draggedIndex !== null) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverIndex(index);
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== index && !isCurrentSong) {
                        onReorderQueue(draggedIndex, index);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                  >
                    {!isCurrentSong && (
                      <div 
                        className="drag-handle" 
                        title="Hold to reorder"
                        onTouchStart={(e) => handleDragHandleTouchStart(e, index)}
                        onTouchMove={(e) => handleDragHandleTouchMove(e)}
                        onTouchEnd={(e) => handleDragHandleTouchEnd(e, index)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                        </svg>
                      </div>
                    )}
                    <img 
                      src={song.cover} 
                      alt={song.title}
                      onClick={() => {
                        if (!isCurrentSong) {
                          onPlayFromQueue(song);
                          onToggleQueue();
                        }
                      }}
                      style={{ cursor: isCurrentSong ? 'default' : 'pointer' }}
                    />
                    <div 
                      className="queue-item-info"
                      onClick={() => {
                        if (!isCurrentSong) {
                          onPlayFromQueue(song);
                          onToggleQueue();
                        }
                      }}
                      style={{ cursor: isCurrentSong ? 'default' : 'pointer' }}
                    >
                      <div className="queue-item-title">{song.title}</div>
                      <div className="queue-item-artist">{song.artist}</div>
                    </div>
                    <div className="queue-item-actions">
                      <button
                        className={`queue-action-btn ${likedSongs?.find(s => s.id === song.id) ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLikeInQueue(song);
                        }}
                        title={likedSongs?.find(s => s.id === song.id) ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                      >
                        <HeartIcon filled={!!likedSongs?.find(s => s.id === song.id)} />
                      </button>
                      <button
                        className="queue-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlaylistFromQueue(song);
                        }}
                        title="Add to Playlist"
                      >
                        <PlusIcon />
                      </button>
                      {isCurrentSong ? (
                        <span className="now-playing-badge">Now Playing</span>
                      ) : (
                        <span className="queue-item-number">{index + 1}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="queue-empty">
                <p>No songs in queue</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;
