import React, { useEffect, useRef, useState } from 'react';
import './Player.css';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, VolumeIcon, HeartIcon, ShuffleIcon, RepeatIcon, RepeatOneIcon, AutoplayIcon, PlusIcon } from './Icons';

function Player({ currentSong, isPlaying, onTogglePlay, onNext, onPrevious, shuffle, onToggleShuffle, repeat, onToggleRepeat, autoplay, onToggleAutoplay, isLiked, onToggleLike, queue, showQueue, onToggleQueue, onPlayFromQueue, onRefreshQueue, likedSongs, onToggleLikeInQueue, onAddToPlaylistFromQueue }) {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);
  const playerInitialized = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  const playerRef = useRef(null);
  const manualPauseRef = useRef(false); // Track if user manually paused
  const lastActionTimeRef = useRef(0); // Track last user action
  const isPageHiddenRef = useRef(false); // Track if page is hidden
  const isLoadingNewSongRef = useRef(false); // Track if loading a new song
  const autoplayRef = useRef(autoplay);
  const repeatRef = useRef(repeat);
  const playerContainerRef = useRef(null);
  const onNextRef = useRef(onNext);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Keep refs updated
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    // If playing, clear manual pause flag (unless page is hidden)
    if (isPlaying && !isPageHiddenRef.current) {
      manualPauseRef.current = false;
    }
  }, [isPlaying]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Handle swipe gestures for mobile
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    // Swipe up (positive distance)
    if (swipeDistance > minSwipeDistance) {
      console.log('👆 Swipe up detected - opening queue');
      if (!showQueue) {
        onToggleQueue();
      }
    }
    // Swipe down (negative distance)
    else if (swipeDistance < -minSwipeDistance) {
      console.log('👇 Swipe down detected - closing queue');
      if (showQueue) {
        onToggleQueue();
      }
    }
    
    // Reset
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Initialize YouTube Player
  useEffect(() => {
    if (playerInitialized.current) return;

    const initPlayer = () => {
      // Create player div if it doesn't exist
      let playerDiv = document.getElementById('youtube-player');
      if (!playerDiv) {
        playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        playerDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 1px; height: 1px; opacity: 0.01; pointer-events: none; z-index: -9999;';
        document.body.appendChild(playerDiv);
        console.log('✅ Created youtube-player div');
      }

      try {
        const ytPlayer = new window.YT.Player('youtube-player', {
          height: '1',
          width: '1',
          videoId: '',
          playerVars: {
            autoplay: 0,
            controls: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            widget_referrer: window.location.origin
          },
          events: {
            onReady: (event) => {
              console.log('✅ YouTube Player is ready');
              setPlayer(event.target);
              playerInitialized.current = true;
            },
            onStateChange: (event) => {
              console.log('Player state changed:', event.data, 'Page hidden:', isPageHiddenRef.current, 'Loading:', isLoadingNewSongRef.current);
              // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
              
              // Only sync state if page is visible and not loading a new song
              if (!isPageHiddenRef.current && !isLoadingNewSongRef.current) {
                // Check if this is from external control (like Bluetooth headphones)
                const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
                const isExternalControl = timeSinceLastAction > 1000; // More than 1 second since last action
                
                // If player is paused (2) and we think it should be playing
                if (event.data === 2 && isPlayingRef.current) {
                  console.log('⚠️ Player paused while isPlaying is true', isExternalControl ? '(External control)' : '(Internal)');
                  manualPauseRef.current = true;
                  lastActionTimeRef.current = Date.now();
                  // Update the UI state to match
                  onTogglePlay();
                }
                
                // If player is playing (1) and we think it should be paused
                if (event.data === 1 && !isPlayingRef.current) {
                  console.log('⚠️ Player playing while isPlaying is false', isExternalControl ? '(External control)' : '(Internal)');
                  manualPauseRef.current = false;
                  lastActionTimeRef.current = Date.now();
                  // Update the UI state to match
                  onTogglePlay();
                }
              } else {
                if (isPageHiddenRef.current) {
                  console.log('📱 Page is hidden, skipping state sync');
                }
                if (isLoadingNewSongRef.current) {
                  console.log('🔄 Loading new song, skipping state sync');
                }
              }
              
              if (event.data === 0) { // ended
                console.log('🎵 Song ended - Repeat:', repeatRef.current, 'Autoplay:', autoplayRef.current);
                if (repeatRef.current === 'one') {
                  // Replay the same song
                  event.target.seekTo(0);
                  event.target.playVideo();
                } else if (autoplayRef.current || repeatRef.current === 'all') {
                  // Auto-play next song if autoplay is on or repeat all is on
                  console.log('▶️ Auto-playing next song');
                  onNextRef.current();
                } else {
                  // Stop playing and show play button
                  console.log('⏹️ Autoplay is off - stopping playback');
                  if (isPlayingRef.current) {
                    onTogglePlay(); // This will set isPlaying to false
                  }
                }
              }
            },
            onError: (event) => {
              console.error('YouTube Player Error:', event.data);
            }
          },
        });
      } catch (error) {
        console.error('Error creating player:', error);
      }
    };

    // Load YouTube API if not loaded
    if (!window.YT) {
      console.log('Loading YouTube API...');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API loaded');
        initPlayer();
      };
    } else if (window.YT.Player) {
      console.log('YouTube API already loaded');
      initPlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Don't destroy the player on unmount to avoid DOM errors
      // The player will be reused across component lifecycles
    };
  }, []); // Empty deps - player only initializes once, callbacks use refs

  // Setup Media Session API for background playback
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
      console.log('📱 Media Session: Play requested, current state:', isPlayingRef.current);
      manualPauseRef.current = false; // Clear manual pause flag
      lastActionTimeRef.current = Date.now();
      
      // Always toggle to play state
      if (!isPlayingRef.current) {
        console.log('📱 Calling onTogglePlay to start playback');
        onTogglePlay();
      } else {
        console.log('📱 Already playing, ensuring player is playing');
        if (playerRef.current && playerRef.current.playVideo) {
          playerRef.current.playVideo();
        }
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('📱 Media Session: Pause requested, current state:', isPlayingRef.current);
      manualPauseRef.current = true; // Mark as manual pause
      lastActionTimeRef.current = Date.now();
      
      // Always toggle to pause state
      if (isPlayingRef.current) {
        console.log('📱 Calling onTogglePlay to pause playback');
        onTogglePlay();
      } else {
        console.log('📱 Already paused, ensuring player is paused');
        if (playerRef.current && playerRef.current.pauseVideo) {
          playerRef.current.pauseVideo();
        }
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('📱 Media Session: Previous track requested');
      try {
        onPrevious();
        console.log('✅ Previous track called successfully');
      } catch (error) {
        console.error('❌ Error calling onPrevious:', error);
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('📱 Media Session: Next track requested');
      try {
        onNext();
        console.log('✅ Next track called successfully');
      } catch (error) {
        console.error('❌ Error calling onNext:', error);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      console.log('📱 Media Session: Seek backward');
      if (playerRef.current && playerRef.current.seekTo && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const newTime = Math.max(0, current - 10);
        playerRef.current.seekTo(newTime, true);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      console.log('📱 Media Session: Seek forward');
      if (playerRef.current && playerRef.current.seekTo && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        const newTime = Math.min(total, current + 10);
        playerRef.current.seekTo(newTime, true);
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
        // Ensure position is not greater than duration
        const safePosition = Math.min(currentTime, duration);
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: safePosition
        });
      } catch (error) {
        console.log('Could not update position state:', error.message);
      }
    }
  }, [currentTime, duration]);

  // Load song when currentSong changes
  useEffect(() => {
    if (!player || !currentSong || !currentSong.youtubeId) return;

    console.log('🎵 Loading song:', currentSong.title, currentSong.youtubeId, 'Should play:', isPlayingRef.current);
    
    try {
      // Mark that we're loading a new song
      isLoadingNewSongRef.current = true;
      
      // Reset position state for new song
      setCurrentTime(0);
      setDuration(0);
      
      // Reset Media Session position
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setPositionState({
            duration: 0.1,
            playbackRate: 1,
            position: 0
          });
        } catch (e) {
          console.log('Could not reset position state');
        }
      }
      
      // Load the video
      player.loadVideoById(currentSong.youtubeId);
      
      // Explicitly play if should be playing
      if (isPlayingRef.current) {
        setTimeout(() => {
          if (player.playVideo) {
            player.playVideo();
            console.log('▶️ Auto-playing new song');
          }
          // Clear the loading flag after a delay
          setTimeout(() => {
            isLoadingNewSongRef.current = false;
          }, 500);
        }, 100);
      } else {
        // Clear the loading flag immediately if not auto-playing
        setTimeout(() => {
          isLoadingNewSongRef.current = false;
        }, 500);
      }
    } catch (error) {
      console.error('Error loading video:', error);
      isLoadingNewSongRef.current = false;
    }
  }, [currentSong, player]);

  // Handle play/pause
  useEffect(() => {
    if (!player) return;

    try {
      const playerState = player.getPlayerState ? player.getPlayerState() : -1;
      console.log('🎮 Play/Pause Effect - Player state:', playerState, 'isPlaying:', isPlaying, 'Manual pause:', manualPauseRef.current);

      if (isPlaying) {
        manualPauseRef.current = false; // Clear manual pause when playing
        player.playVideo();
        console.log('▶️ Playing video');
      } else {
        manualPauseRef.current = true; // Set manual pause when pausing
        player.pauseVideo();
        console.log('⏸️ Pausing video');
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  }, [isPlaying, player]);

  // Keep playing when page visibility changes (background playback)
  useEffect(() => {
    if (!player) return;

    let resumeTimeout;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageHiddenRef.current = true;
        console.log('📱 Page hidden - current playing state:', isPlayingRef.current, 'manual pause:', manualPauseRef.current);
        // Try to keep playing even when hidden
        if (isPlayingRef.current && !manualPauseRef.current) {
          try {
            // Force the player to stay playing
            const iframe = document.getElementById('youtube-player');
            if (iframe) {
              iframe.style.display = 'block';
              iframe.style.position = 'fixed';
              iframe.style.top = '0';
              iframe.style.left = '0';
              iframe.style.width = '1px';
              iframe.style.height = '1px';
              iframe.style.opacity = '0.01'; // Slightly visible to prevent pause
              iframe.style.pointerEvents = 'none';
              iframe.style.zIndex = '-9999';
            }
          } catch (error) {
            console.error('Error maintaining playback:', error);
          }
        }
      } else {
        isPageHiddenRef.current = false;
        console.log('📱 Page visible - current playing state:', isPlayingRef.current, 'manual pause:', manualPauseRef.current);
        // Restore iframe settings
        const iframe = document.getElementById('youtube-player');
        if (iframe) {
          iframe.style.opacity = '0.01';
        }
        
        // Sync state when page becomes visible again - only if should be playing and not manually paused
        if (isPlayingRef.current && !manualPauseRef.current) {
          resumeTimeout = setTimeout(() => {
            try {
              // Double check the ref again in case it changed
              if (isPlayingRef.current && !manualPauseRef.current) {
                const state = player.getPlayerState();
                if (state !== 1) { // Not playing
                  player.playVideo();
                  console.log('🔄 Resumed playback on visibility');
                }
              }
            } catch (error) {
              console.error('Error resuming playback:', error);
            }
          }, 100);
        }
      }
    };

    // Also handle focus/blur events
    const handleFocus = () => {
      console.log('📱 Window focused - current playing state:', isPlayingRef.current, 'manual pause:', manualPauseRef.current);
      if (isPlayingRef.current && !manualPauseRef.current) {
        setTimeout(() => {
          try {
            // Double check the ref again
            if (isPlayingRef.current && !manualPauseRef.current) {
              const state = player.getPlayerState();
              if (state !== 1) {
                player.playVideo();
                console.log('🔄 Resumed on focus');
              }
            }
          } catch (error) {
            console.error('Error on focus:', error);
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };
  }, [player]);

  // Update progress and maintain playback
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!player || !isPlaying) {
      return;
    }

    let checkCount = 0;
    let lastCheckTime = Date.now();

    const updateTime = () => {
      try {
        if (player.getCurrentTime && player.getDuration) {
          const current = player.getCurrentTime();
          const total = player.getDuration();
          
          if (current !== undefined && total !== undefined && !isNaN(current) && !isNaN(total)) {
            setCurrentTime(current);
            setDuration(total);
          }

          // Check if player is still playing every 3 seconds (reduced frequency)
          checkCount++;
          if (checkCount >= 15) { // Every 3 seconds (15 * 200ms)
            checkCount = 0;
            const now = Date.now();
            
            // Only check if enough time has passed, we should be playing, and not manually paused
            if (now - lastCheckTime >= 3000 && isPlayingRef.current && !manualPauseRef.current) {
              lastCheckTime = now;
              
              // Don't resume if user just paused (within last 5 seconds)
              if (now - lastActionTimeRef.current < 5000) {
                return;
              }
              
              const state = player.getPlayerState();
              
              // Only resume if paused (2) or buffering (3), not if ended (0) or unstarted (-1)
              if ((state === 2 || state === 3) && isPlayingRef.current && !manualPauseRef.current) {
                console.log('⚠️ Player paused unexpectedly (state:', state, '), resuming...');
                player.playVideo();
              }
            }
          }
        }
      } catch (error) {
        // Silently fail - player might not be ready yet
      }
    };

    // Update immediately
    updateTime();
    
    // Then update every 200ms
    intervalRef.current = setInterval(updateTime, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [player, isPlaying, currentSong]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    if (!player || !duration) return;
    
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    
    try {
      player.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="player"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
              <button className="play-button" onClick={onTogglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
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
      
      {/* Queue Panel */}
      {showQueue && currentSong && (
        <div 
          className="queue-panel"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle for mobile */}
          <div className="queue-drag-handle">
            <div className="drag-indicator"></div>
          </div>
          <div className="queue-header">
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
            {/* Queue Songs */}
            {queue.length > 0 ? (
              queue.map((song, index) => {
                const isCurrentSong = currentSong && song.id === currentSong.id;
                return (
                  <div 
                    key={`${song.id}-${index}`} 
                    className={`queue-item ${isCurrentSong ? 'current-queue-item' : ''}`}
                  >
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

export default Player;
