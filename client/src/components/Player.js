import React, { useEffect, useRef, useState } from 'react';
import './Player.css';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, VolumeIcon, HeartIcon, ShuffleIcon, RepeatIcon, RepeatOneIcon, AutoplayIcon, PlusIcon, RefreshIcon } from './Icons';

function Player({ currentSong, isPlaying, onTogglePlay, onNext, onPrevious, shuffle, onToggleShuffle, repeat, onToggleRepeat, autoplay, onToggleAutoplay, isLiked, onToggleLike, queue, showQueue, onToggleQueue, onPlayFromQueue, onRefreshQueue, likedSongs, onToggleLikeInQueue, onAddToPlaylistFromQueue, onReorderQueue }) {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songEnded, setSongEnded] = useState(false);
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
  const onPreviousRef = useRef(onPrevious);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Touch drag state
  const [touchDragActive, setTouchDragActive] = useState(false);
  const touchStartYPos = useRef(0);
  const touchCurrentYPos = useRef(0);
  const longPressTimer = useRef(null);
  const isDraggingTouch = useRef(false);
  const draggedElement = useRef(null);

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

  useEffect(() => {
    onPreviousRef.current = onPrevious;
  }, [onPrevious]);

  // Handle swipe gestures for mobile (only for player and queue header)
  const handlePlayerTouchStart = (e) => {
    // Don't trigger on buttons or interactive elements
    if (e.target.closest('button') || e.target.closest('input')) {
      return;
    }
    
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY; // Initialize to same value
  };

  const handlePlayerTouchMove = (e) => {
    // Only update if we have a valid start position
    if (touchStartY.current !== 0) {
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handlePlayerTouchEnd = () => {
    // Only process if we have valid touch positions
    if (touchStartY.current === 0) {
      return;
    }
    
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    // Swipe up (positive distance) - only open queue if not already open
    if (swipeDistance > minSwipeDistance) {
      console.log('👆 Swipe up detected on player - opening queue');
      if (!showQueue) {
        onToggleQueue();
      }
    }
    
    // Reset
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Handle swipe down on queue header/drag handle to close
  const handleQueueHeaderTouchStart = (e) => {
    // Don't trigger on buttons
    if (e.target.closest('button')) {
      return;
    }
    
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY; // Initialize to same value
  };

  const handleQueueHeaderTouchMove = (e) => {
    // Only update if we have a valid start position
    if (touchStartY.current !== 0) {
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handleQueueHeaderTouchEnd = () => {
    // Only process if we have valid touch positions
    if (touchStartY.current === 0) {
      return;
    }
    
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    // Swipe down (negative distance) - close queue
    if (swipeDistance < -minSwipeDistance) {
      console.log('👇 Swipe down detected on header - closing queue');
      if (showQueue) {
        onToggleQueue();
      }
    }
    
    // Reset
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Touch drag handlers for queue reordering (only on drag handle)
  const handleDragHandleTouchStart = (e, index) => {
    e.stopPropagation(); // Prevent event bubbling
    
    const touch = e.touches[0];
    touchStartYPos.current = touch.clientY;
    touchCurrentYPos.current = touch.clientY;
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      console.log('🔒 Long press detected on drag handle - starting drag');
      setDraggedIndex(index);
      setTouchDragActive(true);
      isDraggingTouch.current = true;
      
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 300); // 300ms long press (shorter for better UX)
  };

  const handleDragHandleTouchMove = (e) => {
    if (!isDraggingTouch.current) {
      // Cancel long press if user moves before timer completes
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
    
    // Find which item we're over
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
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isDraggingTouch.current) return;
    
    e.preventDefault();
    
    // Perform reorder if we have valid indices
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      console.log(`🔄 Touch reorder: ${draggedIndex} → ${dragOverIndex}`);
      onReorderQueue(draggedIndex, dragOverIndex);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
    
    // Reset state
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchDragActive(false);
    isDraggingTouch.current = false;
    draggedElement.current = null;
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
                  setSongEnded(false);
                } else if (autoplayRef.current || repeatRef.current === 'all') {
                  // Auto-play next song if autoplay is on or repeat all is on
                  console.log('▶️ Auto-playing next song');
                  setSongEnded(false);
                  onNextRef.current();
                } else {
                  // Stop playing and show refresh button
                  console.log('⏹️ Autoplay is off - stopping playback');
                  if (isPlayingRef.current) {
                    onTogglePlay(); // This will set isPlaying to false
                  }
                  // Set songEnded after a small delay to ensure state updates
                  setTimeout(() => {
                    setSongEnded(true);
                  }, 100);
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

  // Setup Media Session API handlers (always, even without a song)
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      console.warn('⚠️ Media Session API not supported');
      return;
    }

    console.log('🎵 Setting up Media Session handlers');

    // Always set up action handlers so buttons aren't grayed out
    navigator.mediaSession.setActionHandler('play', () => {
      console.log('📱 Media Session: Play');
      manualPauseRef.current = false;
      lastActionTimeRef.current = Date.now();
      if (playerRef.current && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
      if (!isPlayingRef.current) {
        onTogglePlay();
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('📱 Media Session: Pause');
      manualPauseRef.current = true;
      lastActionTimeRef.current = Date.now();
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      if (isPlayingRef.current) {
        onTogglePlay();
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('🔥🔥🔥 PREVIOUS BUTTON CLICKED! 🔥🔥🔥');
      console.log('onPreviousRef:', onPreviousRef.current);
      lastActionTimeRef.current = Date.now();
      manualPauseRef.current = false;
      try {
        if (typeof onPreviousRef.current === 'function') {
          console.log('Calling onPrevious...');
          onPreviousRef.current();
          console.log('✅ Previous track executed');
        } else {
          console.error('❌ onPreviousRef.current is NOT a function!', typeof onPreviousRef.current);
        }
      } catch (error) {
        console.error('❌ Error calling onPrevious:', error);
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('🔥🔥🔥 NEXT BUTTON CLICKED! 🔥🔥🔥');
      console.log('onNextRef:', onNextRef.current);
      lastActionTimeRef.current = Date.now();
      manualPauseRef.current = false;
      try {
        if (typeof onNextRef.current === 'function') {
          console.log('Calling onNext...');
          onNextRef.current();
          console.log('✅ Next track executed');
        } else {
          console.error('❌ onNextRef.current is NOT a function!', typeof onNextRef.current);
        }
      } catch (error) {
        console.error('❌ Error calling onNext:', error);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (playerRef.current && playerRef.current.seekTo && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(Math.max(0, current - 10), true);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (playerRef.current && playerRef.current.seekTo && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        playerRef.current.seekTo(Math.min(total, current + 10), true);
      }
    });

    console.log('✅ Media Session handlers registered');
  }, [onTogglePlay]); // Only depend on onTogglePlay, handlers use refs

  // Update Media Session metadata when song changes
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
    // Set position state to enable previous/next buttons
    try {
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: 0
        });
      }
    } catch (error) {
      console.log('Could not set position state:', error);
    }

    console.log('📱 Media Session API initialized with handlers');
  }, [currentSong, onTogglePlay, duration]);

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
      
      // Reset songEnded when loading new song
      setSongEnded(false);
      
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
        setSongEnded(false); // Reset songEnded when user plays
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
    let keepAliveInterval;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageHiddenRef.current = true;
        console.log('📱 Page hidden - current playing state:', isPlayingRef.current, 'manual pause:', manualPauseRef.current);
        
        // Keep playing in background
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
              iframe.style.opacity = '0.01';
              iframe.style.pointerEvents = 'none';
              iframe.style.zIndex = '-9999';
            }
            
            // Disabled keep-alive to prevent auto-resume issues
            // Background playback will work naturally with Media Session API
            
          } catch (error) {
            console.error('Error maintaining playback:', error);
          }
        }
      } else {
        isPageHiddenRef.current = false;
        console.log('📱 Page visible - current playing state:', isPlayingRef.current, 'manual pause:', manualPauseRef.current);
        
        // Clear keep-alive interval
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
        
        // Restore iframe settings
        const iframe = document.getElementById('youtube-player');
        if (iframe) {
          iframe.style.opacity = '0.01';
        }
        
        // Sync state when page becomes visible again
        if (isPlayingRef.current && !manualPauseRef.current) {
          resumeTimeout = setTimeout(() => {
            try {
              if (isPlayingRef.current && !manualPauseRef.current) {
                const state = player.getPlayerState();
                if (state !== 1) {
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
      if (keepAliveInterval) clearInterval(keepAliveInterval);
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

    const updateTime = () => {
      try {
        if (player.getCurrentTime && player.getDuration) {
          const current = player.getCurrentTime();
          const total = player.getDuration();
          
          if (current !== undefined && total !== undefined && !isNaN(current) && !isNaN(total)) {
            setCurrentTime(current);
            setDuration(total);
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
      onTouchStart={handlePlayerTouchStart}
      onTouchMove={handlePlayerTouchMove}
      onTouchEnd={handlePlayerTouchEnd}
    >
      {/* Swipe Up Indicator */}
      {!showQueue && currentSong && (
        <div className="swipe-up-indicator">
          {/* SVG Gradient Definition */}
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
                  if (songEnded && player) {
                    // Replay from beginning
                    player.seekTo(0);
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
        <div className="queue-panel">
          {/* Drag handle for mobile */}
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
            {/* Queue Songs */}
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

export default Player;
