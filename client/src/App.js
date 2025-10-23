import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
// import AudioPlayer from './components/AudioPlayer';
import SongCard from './components/SongCard';
import { HeartIcon, SearchIcon } from './components/Icons';
import { ChevronLeftIcon, ChevronRightIcon } from './components/ScrollButton';
import { updateSEOForView, addSongStructuredData, preloadCriticalResources } from './utils/seo';

function App() {
  const [songs, setSongs] = useState([]);
  const [sections, setSections] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem('likedSongs');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [scrollStates, setScrollStates] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSongs, setExpandedSongs] = useState([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
  const [autoplay, setAutoplay] = useState(true); // Auto-play next song
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [queue, setQueue] = useState([]); // Queue of next songs
  const [queueIndex, setQueueIndex] = useState(0); // Current position in queue
  const [playHistory, setPlayHistory] = useState(() => {
    const saved = localStorage.getItem('playHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history
  const [showQueue, setShowQueue] = useState(false); // Show queue panel
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('playlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [listeningHistory, setListeningHistory] = useState(() => {
    const saved = localStorage.getItem('listeningHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [playCount, setPlayCount] = useState(() => {
    const saved = localStorage.getItem('playCount');
    return saved ? JSON.parse(saved) : {};
  });
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [showDeletePlaylist, setShowDeletePlaylist] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [showClearHistory, setShowClearHistory] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    // Keep only last 100 songs in listening history
    const limitedHistory = listeningHistory.slice(-100);
    if (limitedHistory.length !== listeningHistory.length) {
      setListeningHistory(limitedHistory);
    }
    localStorage.setItem('listeningHistory', JSON.stringify(limitedHistory));
  }, [listeningHistory]);

  useEffect(() => {
    localStorage.setItem('playCount', JSON.stringify(playCount));
  }, [playCount]);

  useEffect(() => {
    if (currentView === 'home') {
      setLoading(true);
      fetch('/api/songs')
        .then(res => res.json())
        .then(data => {
          setSections(data);
          const allSongs = data.flatMap(section => section.songs || []);
          setSongs(allSongs);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching songs:', err);
          setLoading(false);
        });
    }
  }, [currentView]);

  // SEO optimization: Update meta tags when view changes
  useEffect(() => {
    const currentPlaylist = currentView.startsWith('playlist-') 
      ? playlists.find(p => p.id === currentView.replace('playlist-', ''))
      : null;
    
    updateSEOForView(
      currentView.startsWith('playlist-') ? 'playlist' : currentView,
      currentPlaylist ? { 
        playlistName: currentPlaylist.name, 
        playlistId: currentPlaylist.id 
      } : {}
    );
  }, [currentView, playlists]);

  // SEO optimization: Add structured data when song changes
  useEffect(() => {
    if (currentSong) {
      addSongStructuredData(currentSong);
    }
  }, [currentSong]);

  // SEO optimization: Preload critical resources on mount
  useEffect(() => {
    preloadCriticalResources();
  }, []);

  // Initialize scroll states for carousels
  useEffect(() => {
    if (sections.length > 0 && currentView === 'home') {
      const filteredSections = sections.filter(section =>
        !section.title.toLowerCase().includes('episode') &&
        !section.title.toLowerCase().includes('podcast')
      );

      filteredSections.forEach((_, index) => {
        const carousel = document.getElementById(`carousel-${index}`);
        if (carousel) {
          const updateScrollState = () => {
            const isAtStart = carousel.scrollLeft <= 0;
            const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;

            setScrollStates(prev => ({
              ...prev,
              [index]: { isAtStart, isAtEnd }
            }));
          };

          updateScrollState();
          carousel.addEventListener('scroll', updateScrollState);

          return () => carousel.removeEventListener('scroll', updateScrollState);
        }
      });

      // Also initialize Most Played carousel
      const mostPlayedCarousel = document.getElementById('carousel-most-played');
      if (mostPlayedCarousel) {
        const updateMostPlayedScrollState = () => {
          const isAtStart = mostPlayedCarousel.scrollLeft <= 0;
          const isAtEnd = mostPlayedCarousel.scrollLeft + mostPlayedCarousel.clientWidth >= mostPlayedCarousel.scrollWidth - 1;

          setScrollStates(prev => ({
            ...prev,
            'most-played': { isAtStart, isAtEnd }
          }));
        };

        updateMostPlayedScrollState();
        mostPlayedCarousel.addEventListener('scroll', updateMostPlayedScrollState);

        return () => mostPlayedCarousel.removeEventListener('scroll', updateMostPlayedScrollState);
      }
    }
  }, [sections, currentView, playCount]);

  const updateScrollState = (index) => {
    const carousel = document.getElementById(`carousel-${index}`);
    if (carousel) {
      const isAtStart = carousel.scrollLeft <= 0;
      const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;

      setScrollStates(prev => ({
        ...prev,
        [index]: { isAtStart, isAtEnd }
      }));
    }
  };

  const scrollCarousel = (index, direction) => {
    const carousel = document.getElementById(`carousel-${index}`);
    if (carousel) {
      const scrollAmount = 400;
      carousel.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });

      setTimeout(() => updateScrollState(index), 300);
    }
  };

  const playSong = async (song, addToHistory = true, fetchNewQueue = true) => {
    console.log(`🎵 Playing song: "${song.title}" by ${song.artist} (ID: ${song.youtubeId})`);
    setCurrentSong(song);
    setIsPlaying(true);

    // Add to play history (unless we're navigating history)
    if (addToHistory) {
      setPlayHistory(prev => {
        // Remove any songs after current position (if user went back then played new song)
        const newHistory = prev.slice(0, historyIndex + 1);
        // Add current song
        newHistory.push(song);
        console.log(`📚 Added to history. History length: ${newHistory.length}`);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);

      // Add to listening history (persistent) - unique songs only
      setListeningHistory(prev => {
        // Check if song already exists in recent history
        const existingIndex = prev.findIndex(s => s.id === song.id);
        let newHistory = [...prev];

        if (existingIndex !== -1) {
          // Remove old entry
          newHistory.splice(existingIndex, 1);
        }

        // Add to end (most recent)
        newHistory.push({
          ...song,
          playedAt: new Date().toISOString()
        });

        // Keep only last 100
        return newHistory.slice(-100);
      });

      // Track play count separately
      setPlayCount(prev => ({
        ...prev,
        [song.id]: {
          song: song,
          count: (prev[song.id]?.count || 0) + 1
        }
      }));
    }

    // Fetch next songs in queue only if requested
    if (fetchNewQueue && song.youtubeId) {
      try {
        console.log(`📡 Fetching queue for video ID: ${song.youtubeId}`);
        const response = await fetch(`/api/next/${song.youtubeId}`);
        const nextSongs = await response.json();
        // Add current song at the beginning of the queue
        const fullQueue = [song, ...nextSongs];
        setQueue(fullQueue);
        setQueueIndex(0); // Current song is at index 0
        console.log(`📋 Queue loaded: ${fullQueue.length} songs (including current)`);
        if (nextSongs.length > 0) {
          console.log(`🎵 Next songs in queue:`);
          nextSongs.slice(0, 5).forEach((s, i) => {
            console.log(`  ${i + 1}. "${s.title}" by ${s.artist}`);
          });
          if (nextSongs.length > 5) {
            console.log(`  ... and ${nextSongs.length - 5} more`);
          }
        } else {
          console.warn('⚠️ Queue is empty - no next songs found!');
        }
      } catch (error) {
        console.error('❌ Error loading queue:', error);
        setQueue([song]); // At least keep the current song
      }
    } else if (!fetchNewQueue) {
      console.log('🔒 Keeping current queue');
    }
  };

  const togglePlay = () => {
    console.log('🎮 togglePlay called');
    setIsPlaying(prev => {
      console.log('🎮 Toggling isPlaying from', prev, 'to', !prev);
      return !prev;
    });
  };

  const playNext = async () => {
    console.log('🎵 playNext called');
    console.log('  - Current song:', currentSong?.title || 'null');
    console.log('  - Queue length:', queue.length);
    console.log('  - Queue index:', queueIndex);
    console.log('  - Repeat:', repeat);
    console.log('  - Shuffle:', shuffle);

    if (!currentSong) {
      console.warn('⚠️ No current song, cannot play next');
      console.warn('  - This might be a stale closure issue');
      return;
    }

    if (repeat === 'one') {
      // Replay the same song
      console.log('🔁 Repeat one - replaying current song');
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 100);
      return;
    }

    // Try to play from queue first
    // Find current song index in queue
    const currentSongIndex = queue.findIndex(s => s.id === currentSong.id);
    const nextIndex = currentSongIndex + 1;

    console.log(`📍 Current song at index ${currentSongIndex}, next index: ${nextIndex}`);

    if (queue.length > 0 && nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      console.log(`▶️ Playing from queue: index ${nextIndex}/${queue.length - 1}`);
      console.log(`🎵 Next song: "${nextSong.title}" by ${nextSong.artist}`);
      setQueueIndex(nextIndex);
      setCurrentSong(nextSong);
      setIsPlaying(true);

      // Add to history
      setPlayHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(nextSong);
        console.log(`📚 Added to history. History length: ${newHistory.length}`);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);

      // If we've reached the end of the queue, fetch a new queue
      if (nextIndex >= queue.length - 1) {
        try {
          console.log(`📡 End of queue reached, fetching new queue for: ${nextSong.youtubeId}`);
          const response = await fetch(`/api/next/${nextSong.youtubeId}`);
          const nextSongs = await response.json();
          const fullQueue = [nextSong, ...nextSongs];
          setQueue(fullQueue);
          setQueueIndex(0);
          console.log(`📋 Queue updated: ${fullQueue.length} songs`);
          if (nextSongs.length > 0) {
            console.log(`  Next up: "${nextSongs[0].title}" by ${nextSongs[0].artist}`);
          }
        } catch (error) {
          console.error('❌ Error loading queue:', error);
        }
      }
      return;
    }

    // Fallback to shuffle or sequential play
    console.log('📋 Queue empty or ended, using fallback');
    if (songs.length === 0) {
      console.warn('⚠️ No songs available for fallback');
      return;
    }

    if (shuffle) {
      // Play random song
      console.log('🔀 Shuffle mode - playing random song');
      const randomIndex = Math.floor(Math.random() * songs.length);
      await playSong(songs[randomIndex]);
    } else {
      // Play next song from current list
      console.log('➡️ Sequential mode - playing next from list');
      const currentIndex = songs.findIndex(s => s.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % songs.length;
      await playSong(songs[nextIndex]);
    }
  };

  const playPrevious = async () => {
    console.log('⏮️ playPrevious called - History index:', historyIndex, 'History length:', playHistory.length);

    if (!currentSong) {
      console.warn('⚠️ No current song');
      return;
    }

    // If we have history, go back
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevSong = playHistory[prevIndex];
      console.log(`⏮️ Playing from history: "${prevSong.title}" (index ${prevIndex})`);
      setHistoryIndex(prevIndex);
      setCurrentSong(prevSong);
      setIsPlaying(true);

      // Fetch queue for the previous song
      try {
        const response = await fetch(`/api/next/${prevSong.youtubeId}`);
        const nextSongs = await response.json();
        // Add previous song at the beginning
        const fullQueue = [prevSong, ...nextSongs];
        setQueue(fullQueue);
        setQueueIndex(0);
        console.log(`📋 Queue loaded for previous song: ${fullQueue.length} songs (including current)`);
      } catch (error) {
        console.error('❌ Error loading queue:', error);
      }
    } else {
      console.log('⚠️ No previous song in history');
      // Fallback: replay current song from beginning
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 100);
    }
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    if (repeat === 'off') setRepeat('all');
    else if (repeat === 'all') setRepeat('one');
    else setRepeat('off');
  };

  const toggleAutoplay = () => {
    setAutoplay(!autoplay);
  };

  const toggleQueue = () => {
    setShowQueue(!showQueue);
  };

  const playFromQueue = async (song) => {
    console.log(`🎵 Playing from queue without changing playlist: "${song.title}"`);
    // Play song but don't fetch new queue
    await playSong(song, true, false);
    // Find the song's position in current queue and update index
    const songIndex = queue.findIndex(s => s.id === song.id);
    if (songIndex !== -1) {
      setQueueIndex(songIndex + 1);
      console.log(`📍 Updated queue index to ${songIndex + 1}`);
    }
  };

  const refreshQueue = async () => {
    if (!currentSong || !currentSong.youtubeId) return;

    console.log(`🔄 Refreshing queue for: "${currentSong.title}"`);
    try {
      const response = await fetch(`/api/next/${currentSong.youtubeId}`);
      const nextSongs = await response.json();
      // Add current song at the beginning
      const fullQueue = [currentSong, ...nextSongs];
      setQueue(fullQueue);
      setQueueIndex(0);
      console.log(`✅ Queue refreshed: ${fullQueue.length} songs (including current)`);
    } catch (error) {
      console.error('❌ Error refreshing queue:', error);
    }
  };

  const reorderQueue = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const newQueue = [...queue];
    const [movedSong] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedSong);

    setQueue(newQueue);
    console.log(`🔄 Reordered queue: moved song from position ${fromIndex + 1} to ${toIndex + 1}`);
  };

  const toggleLike = (song) => {
    if (likedSongs.find(s => s.id === song.id)) {
      setLikedSongs(likedSongs.filter(s => s.id !== song.id));
      console.log(`💔 Removed from liked songs: ${song.title}`);
    } else {
      setLikedSongs([...likedSongs, { ...song, likedAt: new Date().toISOString() }]);
      console.log(`❤️ Added to liked songs: ${song.title}`);
    }
  };

  const createPlaylist = (name) => {
    const newPlaylist = {
      id: Date.now().toString(),
      name: name,
      songs: [],
      createdAt: new Date().toISOString()
    };
    setPlaylists([...playlists, newPlaylist]);
    console.log(`📝 Created playlist: ${name}`);
    return newPlaylist;
  };

  const addToPlaylist = (playlistId, song) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if song already exists
        if (playlist.songs.find(s => s.id === song.id)) {
          console.log(`⚠️ Song already in playlist: ${song.title}`);
          return playlist;
        }
        console.log(`➕ Added to playlist "${playlist.name}": ${song.title}`);
        return {
          ...playlist,
          songs: [...playlist.songs, song]
        };
      }
      return playlist;
    }));
  };

  const removeFromPlaylist = (playlistId, songId) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(s => s.id !== songId)
        };
      }
      return playlist;
    }));
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    console.log(`🗑️ Deleted playlist`);
  };

  const loadMoreSection = async (section) => {
    if (!section.browseId) return;

    setLoading(true);
    setExpandedSection(section);

    try {
      const response = await fetch(`/api/section/${section.browseId}`);
      const data = await response.json();
      setExpandedSongs(data);
    } catch (error) {
      console.error('Error loading section:', error);
      setExpandedSongs(section.songs);
    } finally {
      setLoading(false);
    }
  };

  const closeExpandedSection = () => {
    setExpandedSection(null);
    setExpandedSongs([]);
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderHomeView = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    const filteredSections = sections.filter(section =>
      !section.title.toLowerCase().includes('episode') &&
      !section.title.toLowerCase().includes('podcast')
    );

    // Get most played songs from play count tracker
    const getMostPlayedSongs = () => {
      // Convert to array and sort by count
      const sortedSongs = Object.values(playCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 songs

      return sortedSongs;
    };

    const mostPlayedSongs = getMostPlayedSongs();

    return (
      <div className="home-view">
        <div className="welcome-section">
          <h2 className="welcome-title">Welcome to Sonfy</h2>
          <p className="welcome-subtitle">Discover millions of songs, create playlists, and enjoy high-quality music streaming - all for free!</p>
        </div>
        
        {filteredSections.map((section, index) => {
          const scrollState = scrollStates[index] || { isAtStart: true, isAtEnd: false };

          return (
            <div key={index} className="music-section">
              <div className="section-header">
                <h2 className="section-title">{section.title}</h2>
                {section.browseId && (
                  <button
                    className="more-button"
                    onClick={() => loadMoreSection(section)}
                  >
                    More
                  </button>
                )}
              </div>
              <div className="section-carousel">
                {!scrollState.isAtStart && (
                  <button
                    className="scroll-button left"
                    onClick={() => scrollCarousel(index, 'left')}
                    aria-label="Scroll left"
                  >
                    <ChevronLeftIcon />
                  </button>
                )}
                {!scrollState.isAtEnd && (
                  <button
                    className="scroll-button right"
                    onClick={() => scrollCarousel(index, 'right')}
                    aria-label="Scroll right"
                  >
                    <ChevronRightIcon />
                  </button>
                )}
                <div className="songs-carousel" id={`carousel-${index}`}>
                  {section.songs.map(song => (
                    <SongCard
                      key={song.id}
                      song={song}
                      currentSong={currentSong}
                      isLiked={!!likedSongs.find(s => s.id === song.id)}
                      onPlay={playSong}
                      onToggleLike={toggleLike}
                      onAddToPlaylist={(song) => {
                        setSelectedSongForPlaylist(song);
                        setShowAddToPlaylist(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Most Played Section */}
        {mostPlayedSongs.length > 0 && (
          <div className="music-section">
            <div className="section-header">
              <h2 className="section-title">Most Played</h2>
            </div>
            <div className="section-carousel">
              {scrollStates['most-played'] && !scrollStates['most-played'].isAtStart && (
                <button
                  className="scroll-button left"
                  onClick={() => scrollCarousel('most-played', 'left')}
                  aria-label="Scroll left"
                >
                  <ChevronLeftIcon />
                </button>
              )}
              {scrollStates['most-played'] && !scrollStates['most-played'].isAtEnd && (
                <button
                  className="scroll-button right"
                  onClick={() => scrollCarousel('most-played', 'right')}
                  aria-label="Scroll right"
                >
                  <ChevronRightIcon />
                </button>
              )}
              <div className="songs-carousel" id="carousel-most-played">
                {mostPlayedSongs.map(({ song, count }) => (
                  <div key={song.id} className="song-card-wrapper">
                    <div className="play-count-badge">{count}× played</div>
                    <SongCard
                      song={song}
                      currentSong={currentSong}
                      isLiked={!!likedSongs.find(s => s.id === song.id)}
                      onPlay={playSong}
                      onToggleLike={toggleLike}
                      onAddToPlaylist={(song) => {
                        setSelectedSongForPlaylist(song);
                        setShowAddToPlaylist(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLikedView = () => {
    return (
      <div className="home-view">
        <div className="music-section">
          <div className="section-header">
            <h2 className="section-title">Liked Songs</h2>
          </div>
          {likedSongs.length === 0 ? (
            <div className="empty-state">
              <p>No liked songs yet. Start liking some songs!</p>
            </div>
          ) : (
            <div className="section-carousel">
              <div className="songs-carousel">
                {likedSongs.map(song => (
                  <SongCard
                    key={song.id}
                    song={song}
                    currentSong={currentSong}
                    isLiked={true}
                    onPlay={playSong}
                    onToggleLike={toggleLike}
                    onAddToPlaylist={(song) => {
                      setSelectedSongForPlaylist(song);
                      setShowAddToPlaylist(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    // Reverse to show most recent first
    const reversedHistory = [...listeningHistory].reverse();

    return (
      <div className="home-view">
        <div className="music-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">Listening History</h2>
              <span className="section-subtitle">Last 100 songs</span>
            </div>
            {listeningHistory.length > 0 && (
              <button
                className="delete-playlist-btn"
                onClick={() => setShowClearHistory(true)}
                title="Clear History"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Clear History
              </button>
            )}
          </div>
          {listeningHistory.length === 0 ? (
            <div className="empty-state">
              <p>No listening history yet. Start playing some songs!</p>
            </div>
          ) : (
            <div className="songs-grid-full">
              {reversedHistory.map((song, index) => (
                <SongCard
                  key={`${song.id}-${index}`}
                  song={song}
                  currentSong={currentSong}
                  isLiked={!!likedSongs.find(s => s.id === song.id)}
                  onPlay={playSong}
                  onToggleLike={toggleLike}
                  onAddToPlaylist={(song) => {
                    setSelectedSongForPlaylist(song);
                    setShowAddToPlaylist(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlaylistView = (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) {
      return (
        <div className="home-view">
          <div className="empty-state">
            <p>Playlist not found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="home-view">
        <div className="music-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">{playlist.name}</h2>
              <span className="section-subtitle">{playlist.songs.length} songs</span>
            </div>
            <button
              className="delete-playlist-btn"
              onClick={() => {
                setPlaylistToDelete(playlist);
                setShowDeletePlaylist(true);
              }}
              title="Delete Playlist"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete Playlist
            </button>
          </div>
          {playlist.songs.length === 0 ? (
            <div className="empty-state">
              <p>No songs in this playlist yet</p>
            </div>
          ) : (
            <div className="songs-grid-full">
              {playlist.songs.map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  currentSong={currentSong}
                  isLiked={!!likedSongs.find(s => s.id === song.id)}
                  onPlay={playSong}
                  onToggleLike={toggleLike}
                  showRemove={true}
                  onRemoveFromPlaylist={(song) => {
                    removeFromPlaylist(playlistId, song.id);
                  }}
                  onAddToPlaylist={(song) => {
                    setSelectedSongForPlaylist(song);
                    setShowAddToPlaylist(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExpandedSection = () => {
    return (
      <div className="home-view">
        <div className="music-section">
          <div className="section-header">
            <button className="back-button" onClick={closeExpandedSection}>
              ← Back
            </button>
            <h2 className="section-title">{expandedSection.title}</h2>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <div className="songs-grid-full">
              {expandedSongs.map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  currentSong={currentSong}
                  isLiked={!!likedSongs.find(s => s.id === song.id)}
                  onPlay={playSong}
                  onToggleLike={toggleLike}
                  onAddToPlaylist={(song) => {
                    setSelectedSongForPlaylist(song);
                    setShowAddToPlaylist(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app">
      <button className="hamburger-menu" onClick={toggleSidebar} aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          closeExpandedSection();
          closeSidebar();
        }}
        likedCount={likedSongs.length}
        historyCount={listeningHistory.length}
        playlists={playlists}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onCreatePlaylist={() => {
          setShowCreatePlaylist(true);
          closeSidebar();
        }}
      />
      <div className="main-content">
        {/* Sonfy Header */}
        <div className="main-header">
          <div className="sonfy-brand">
            <h1 className="sonfy-title">
              <span className="sonfy-logo">🎵</span>
              Sonfy
            </h1>
            <p className="sonfy-tagline">Your Ultimate Music Streaming Experience</p>
          </div>
        </div>

        {currentView === 'search' ? (
          <div className="search-view">
            <div className="search-header">
              <h1>Search on Sonfy</h1>
              <div className="search-input-wrapper">
                <div className="search-input-container">
                  <SearchIcon />
                  <input
                    type="text"
                    placeholder="What do you want to listen to?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="search-input"
                    autoFocus
                  />
                  {searchQuery && (
                    <button className="clear-search-btn" onClick={clearSearch} title="Clear">
                      ✕
                    </button>
                  )}
                </div>
                <button
                  className="search-button"
                  onClick={performSearch}
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {isSearching ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="search-results">
                <h2 className="section-title">Search Results</h2>
                <div className="songs-grid-full">
                  {searchResults.map(song => (
                    <SongCard
                      key={song.id}
                      song={song}
                      currentSong={currentSong}
                      isLiked={!!likedSongs.find(s => s.id === song.id)}
                      onPlay={playSong}
                      onToggleLike={toggleLike}
                      onAddToPlaylist={(song) => {
                        setSelectedSongForPlaylist(song);
                        setShowAddToPlaylist(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="empty-state">
                <p>No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="empty-state">
                <p>Start typing to search for songs, artists, and albums</p>
              </div>
            )}
          </div>
        ) : expandedSection ? renderExpandedSection() : (
          <>
            {currentView === 'home' && renderHomeView()}
            {currentView === 'liked' && renderLikedView()}
            {currentView === 'history' && renderHistoryView()}
            {currentView.startsWith('playlist-') && renderPlaylistView(currentView.replace('playlist-', ''))}
          </>
        )}
      </div>
      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={playNext}
        onPrevious={playPrevious}
        shuffle={shuffle}
        onToggleShuffle={toggleShuffle}
        repeat={repeat}
        onToggleRepeat={toggleRepeat}
        autoplay={autoplay}
        onToggleAutoplay={toggleAutoplay}
        isLiked={currentSong ? !!likedSongs.find(s => s.id === currentSong.id) : false}
        onToggleLike={() => currentSong && toggleLike(currentSong)}
        queue={queue}
        showQueue={showQueue}
        onToggleQueue={toggleQueue}
        onPlayFromQueue={playFromQueue}
        onRefreshQueue={refreshQueue}
        onReorderQueue={reorderQueue}
        likedSongs={likedSongs}
        onToggleLikeInQueue={toggleLike}
        onAddToPlaylistFromQueue={(song) => {
          setSelectedSongForPlaylist(song);
          setShowAddToPlaylist(true);
        }}
      />

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="modal-overlay" onClick={() => setShowCreatePlaylist(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Playlist</h2>
            <input
              type="text"
              placeholder="Playlist name"
              id="playlist-name-input"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const name = e.target.value.trim();
                  if (name) {
                    const newPlaylist = createPlaylist(name);
                    setShowCreatePlaylist(false);
                    setCurrentView(`playlist-${newPlaylist.id}`);
                  }
                }
              }}
            />
            <div className="modal-buttons">
              <button onClick={() => setShowCreatePlaylist(false)}>Cancel</button>
              <button
                className="primary"
                onClick={() => {
                  const input = document.getElementById('playlist-name-input');
                  const name = input.value.trim();
                  if (name) {
                    const newPlaylist = createPlaylist(name);
                    setShowCreatePlaylist(false);
                    setCurrentView(`playlist-${newPlaylist.id}`);
                  }
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showAddToPlaylist && selectedSongForPlaylist && (
        <div className="modal-overlay" onClick={() => setShowAddToPlaylist(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add to Playlist</h2>
            <p className="modal-subtitle">"{selectedSongForPlaylist.title}"</p>
            {playlists.length === 0 ? (
              <div className="empty-state">
                <p>No playlists yet. Create one first!</p>
              </div>
            ) : (
              <div className="playlist-list">
                {playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    className="playlist-item"
                    onClick={() => {
                      addToPlaylist(playlist.id, selectedSongForPlaylist);
                      setShowAddToPlaylist(false);
                      setSelectedSongForPlaylist(null);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                    </svg>
                    <span>{playlist.name}</span>
                    <span className="song-count">({playlist.songs.length})</span>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-buttons">
              <button onClick={() => {
                setShowAddToPlaylist(false);
                setSelectedSongForPlaylist(null);
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Playlist Confirmation Modal */}
      {showDeletePlaylist && playlistToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeletePlaylist(false)}>
          <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Playlist?</h2>
            <p className="modal-subtitle">
              Are you sure you want to delete "{playlistToDelete.name}"? This action cannot be undone.
            </p>
            <div className="modal-info">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <p>{playlistToDelete.songs.length} songs will be removed from this playlist</p>
            </div>
            <div className="modal-buttons">
              <button onClick={() => {
                setShowDeletePlaylist(false);
                setPlaylistToDelete(null);
              }}>
                Cancel
              </button>
              <button
                className="primary danger"
                onClick={() => {
                  deletePlaylist(playlistToDelete.id);
                  setShowDeletePlaylist(false);
                  setPlaylistToDelete(null);
                  setCurrentView('home');
                }}
              >
                Delete Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearHistory && (
        <div className="modal-overlay" onClick={() => setShowClearHistory(false)}>
          <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Clear Listening History?</h2>
            <p className="modal-subtitle">
              Are you sure you want to clear all listening history? This action cannot be undone.
            </p>
            <div className="modal-info">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <p>{listeningHistory.length} songs will be removed from your history</p>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowClearHistory(false)}>
                Cancel
              </button>
              <button
                className="primary danger"
                onClick={() => {
                  setListeningHistory([]);
                  setShowClearHistory(false);
                }}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
