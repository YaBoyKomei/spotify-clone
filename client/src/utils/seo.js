// SEO utility functions for dynamic meta tag updates

export const updatePageTitle = (title) => {
  document.title = title ? `${title} | Sonfy` : 'Sonfy - Free Music Streaming App | Listen to Songs Online';
};

export const updateMetaDescription = (description) => {
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
};

export const updateCanonicalUrl = (path = '') => {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `https://sonfy.onrender.com${path}`;
};

export const updateOpenGraphTags = (data) => {
  const { title, description, image, url } = data;
  
  // Update OG title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && title) {
    ogTitle.setAttribute('content', title);
  }
  
  // Update OG description
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription && description) {
    ogDescription.setAttribute('content', description);
  }
  
  // Update OG image
  let ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && image) {
    ogImage.setAttribute('content', image);
  }
  
  // Update OG URL
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl && url) {
    ogUrl.setAttribute('content', url);
  }
};

export const addStructuredData = (data) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]#dynamic-structured-data');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'dynamic-structured-data';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

export const updateSEOForView = (view, data = {}) => {
  switch (view) {
    case 'search':
      updatePageTitle('Search Music');
      updateMetaDescription('Search for your favorite songs, artists, and albums on Sonfy. Discover new music and create playlists with millions of tracks available.');
      updateCanonicalUrl('/?view=search');
      updateOpenGraphTags({
        title: 'Search Music | Sonfy',
        description: 'Search for your favorite songs, artists, and albums on Sonfy. Discover new music and create playlists with millions of tracks available.',
        url: 'https://sonfy.onrender.com/?view=search'
      });
      break;
      
    case 'liked':
      updatePageTitle('Liked Songs');
      updateMetaDescription('Access your favorite songs collection on Sonfy. All your liked tracks in one place for easy listening and playlist creation.');
      updateCanonicalUrl('/?view=liked');
      updateOpenGraphTags({
        title: 'Liked Songs | Sonfy',
        description: 'Access your favorite songs collection on Sonfy. All your liked tracks in one place for easy listening and playlist creation.',
        url: 'https://sonfy.onrender.com/?view=liked'
      });
      break;
      
    case 'history':
      updatePageTitle('Listening History');
      updateMetaDescription('View your music listening history on Sonfy. Rediscover songs you\'ve played and track your musical journey.');
      updateCanonicalUrl('/?view=history');
      updateOpenGraphTags({
        title: 'Listening History | Sonfy',
        description: 'View your music listening history on Sonfy. Rediscover songs you\'ve played and track your musical journey.',
        url: 'https://sonfy.onrender.com/?view=history'
      });
      break;
      
    case 'playlist':
      const playlistName = data.playlistName || 'Playlist';
      updatePageTitle(`${playlistName} - Playlist`);
      updateMetaDescription(`Listen to ${playlistName} playlist on Sonfy. Enjoy curated music collections and discover new songs.`);
      updateCanonicalUrl(`/?view=playlist&id=${data.playlistId}`);
      updateOpenGraphTags({
        title: `${playlistName} - Playlist | Sonfy`,
        description: `Listen to ${playlistName} playlist on Sonfy. Enjoy curated music collections and discover new songs.`,
        url: `https://sonfy.onrender.com/?view=playlist&id=${data.playlistId}`
      });
      break;
      
    default: // home
      updatePageTitle();
      updateMetaDescription('Stream millions of songs for free with Sonfy. Discover new music, create playlists, and enjoy high-quality audio streaming. No ads, no limits - just pure music experience.');
      updateCanonicalUrl('/');
      updateOpenGraphTags({
        title: 'Sonfy - Free Music Streaming App | Listen to Songs Online',
        description: 'Stream millions of songs for free with Sonfy. Discover new music, create playlists, and enjoy high-quality audio streaming. No ads, no limits - just pure music experience.',
        url: 'https://sonfy.onrender.com/'
      });
      break;
  }
};

export const addSongStructuredData = (song) => {
  if (!song) return;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": song.title,
    "byArtist": {
      "@type": "MusicGroup",
      "name": song.artist
    },
    "duration": song.duration || "PT3M30S",
    "url": `https://sonfy.onrender.com/?song=${song.id}`,
    "image": song.thumbnail,
    "genre": "Music",
    "inAlbum": song.album ? {
      "@type": "MusicAlbum",
      "name": song.album
    } : undefined
  };
  
  addStructuredData(structuredData);
};

export const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.as = 'style';
  criticalCSS.href = '/static/css/main.css';
  document.head.appendChild(criticalCSS);
  
  // Preload critical JavaScript
  const criticalJS = document.createElement('link');
  criticalJS.rel = 'preload';
  criticalJS.as = 'script';
  criticalJS.href = '/static/js/main.js';
  document.head.appendChild(criticalJS);
};