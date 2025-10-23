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
      updatePageTitle('Search Music on Sonfy');
      updateMetaDescription('Search for your favorite songs, artists, and albums on Sonfy. Discover new music and create playlists with millions of tracks available on the Sonfy music platform.');
      updateCanonicalUrl('/?view=search');
      updateOpenGraphTags({
        title: 'Search Music on Sonfy | Free Music Streaming',
        description: 'Search for your favorite songs, artists, and albums on Sonfy. Discover new music and create playlists with millions of tracks available on the Sonfy music platform.',
        url: 'https://sonfy.onrender.com/?view=search'
      });
      break;
      
    case 'liked':
      updatePageTitle('My Liked Songs - Sonfy Music');
      updateMetaDescription('Access your favorite songs collection on Sonfy. All your liked tracks in one place for easy listening and playlist creation on the Sonfy music streaming platform.');
      updateCanonicalUrl('/?view=liked');
      updateOpenGraphTags({
        title: 'My Liked Songs - Sonfy Music | Free Streaming',
        description: 'Access your favorite songs collection on Sonfy. All your liked tracks in one place for easy listening and playlist creation on the Sonfy music streaming platform.',
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
      
    case 'about':
      updatePageTitle('About Sonfy - Free Music Streaming Platform');
      updateMetaDescription('Learn about Sonfy, the ultimate free music streaming platform. Discover how Sonfy revolutionizes online music with unlimited streaming, playlist creation, and high-quality audio.');
      updateCanonicalUrl('/?view=about');
      updateOpenGraphTags({
        title: 'About Sonfy - Free Music Streaming Platform',
        description: 'Learn about Sonfy, the ultimate free music streaming platform. Discover how Sonfy revolutionizes online music with unlimited streaming, playlist creation, and high-quality audio.',
        url: 'https://sonfy.onrender.com/?view=about'
      });
      break;
      
    default: // home
      updatePageTitle();
      updateMetaDescription('Sonfy is the ultimate free music streaming platform. Stream millions of songs, create playlists, and discover new music with Sonfy\'s high-quality audio streaming. The official Sonfy music app - no ads, no limits.');
      updateCanonicalUrl('/');
      updateOpenGraphTags({
        title: 'Sonfy - Official Music Streaming App | Free Online Music Player',
        description: 'Sonfy is the ultimate free music streaming platform. Stream millions of songs, create playlists, and discover new music with Sonfy\'s high-quality audio streaming. The official Sonfy music app.',
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