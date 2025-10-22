import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import { HeartIcon, SearchIcon } from './components/Icons';
import { ChevronLeftIcon, ChevronRightIcon } from './components/ScrollButton';

function App() {
  const [songs, setSongs] = useState([]);
  const [sections, setSections] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [likedSongs, setLikedSongs] = useState([]);
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
    }
  }, [sections, currentView]);

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

  const playSong = async (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setQueueIndex(0);
    
    // Fetch next songs in queue
    if (song.youtubeId) {
      try {
        const response = await fetch(`/api/next/${song.youtubeId}`);
        const nextSongs = await response.json();
        setQueue(nextSongs);
        console.log(`📋 Queue loaded: ${nextSongs.length} songs`);
      } catch (error) {
        console.error('Error loading queue:', error);
        setQueue([]);
      }
    }
  };

  const togglePlay = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = async () => {
    if (!currentSong) return;
    
    if (repeat === 'one') {
      // Replay the same song
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 100);
      return;
    }
    
    // Try to play from queue first
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      const nextSong = queue[nextIndex];
      setCurrentSong(nextSong);
      setIsPlaying(true);
      
      // Fetch queue for the new song
      try {
        const response = await fetch(`/api/next/${nextSong.youtubeId}`);
        const nextSongs = await response.json();
        setQueue(nextSongs);
        setQueueIndex(0);
        console.log(`📋 Queue updated: ${nextSongs.length} songs`);
      } catch (error) {
        console.error('Error loading queue:', error);
      }
      return;
    }
    
    // Fallback to shuffle or sequential play
    if (songs.length === 0) return;
    
    if (shuffle) {
      // Play random song
      const randomIndex = Math.floor(Math.random() * songs.length);
      await playSong(songs[randomIndex]);
    } else {
      // Play next song from current list
      const currentIndex = songs.findIndex(s => s.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % songs.length;
      await playSong(songs[nextIndex]);
    }
  };

  const playPrevious = () => {
    if (!currentSong || songs.length === 0) return;
    
    if (shuffle) {
      // Play random song
      const randomIndex = Math.floor(Math.random() * songs.length);
      setCurrentSong(songs[randomIndex]);
    } else {
      // Play previous song
      const currentIndex = songs.findIndex(s => s.id === currentSong.id);
      const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
      setCurrentSong(songs[prevIndex]);
    }
    setIsPlaying(true);
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

  const toggleLike = (song) => {
    if (likedSongs.find(s => s.id === song.id)) {
      setLikedSongs(likedSongs.filter(s => s.id !== song.id));
    } else {
      setLikedSongs([...likedSongs, song]);
    }
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

    return (
      <div className="home-view">
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
                    <div
                      key={song.id}
                      className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
                    >
                      <button 
                        className={`like-button ${likedSongs.find(s => s.id === song.id) ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        title={likedSongs.find(s => s.id === song.id) ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                      >
                        <HeartIcon filled={!!likedSongs.find(s => s.id === song.id)} />
                      </button>
                      <div className="song-card-content" onClick={() => playSong(song)}>
                        <img src={song.cover} alt={song.title} />
                        <div className="song-info">
                          <h3>{song.title}</h3>
                          <p>{song.artist}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
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
                  <div
                    key={song.id}
                    className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
                  >
                    <button 
                      className={`like-button ${likedSongs.find(s => s.id === song.id) ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      title="Remove from Liked Songs"
                    >
                      <HeartIcon filled={true} />
                    </button>
                    <div className="song-card-content" onClick={() => playSong(song)}>
                      <img src={song.cover} alt={song.title} />
                      <div className="song-info">
                        <h3>{song.title}</h3>
                        <p>{song.artist}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                <div
                  key={song.id}
                  className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
                >
                  <button 
                    className={`like-button ${likedSongs.find(s => s.id === song.id) ? 'liked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    title={likedSongs.find(s => s.id === song.id) ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                  >
                    <HeartIcon filled={!!likedSongs.find(s => s.id === song.id)} />
                  </button>
                  <div className="song-card-content" onClick={() => playSong(song)}>
                    <img src={song.cover} alt={song.title} />
                    <div className="song-info">
                      <h3>{song.title}</h3>
                      <p>{song.artist}</p>
                    </div>
                  </div>
                </div>
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
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      <div className="main-content">
        {currentView === 'search' ? (
          <div className="search-view">
            <div className="search-header">
              <h1>Search</h1>
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
                    <div
                      key={song.id}
                      className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
                    >
                      <button 
                        className={`like-button ${likedSongs.find(s => s.id === song.id) ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        title={likedSongs.find(s => s.id === song.id) ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                      >
                        <HeartIcon filled={!!likedSongs.find(s => s.id === song.id)} />
                      </button>
                      <div className="song-card-content" onClick={() => playSong(song)}>
                        <img src={song.cover} alt={song.title} />
                        <div className="song-info">
                          <h3>{song.title}</h3>
                          <p>{song.artist}</p>
                        </div>
                      </div>
                    </div>
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
      />
    </div>
  );
}

export default App;
