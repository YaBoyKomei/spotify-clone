const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for user data sync

// Trust proxy for getting real IP behind reverse proxies (Render, Heroku, etc.)
app.set('trust proxy', true);

// ============================================
// GOOGLE AUTH & USER DATA SYNC
// ============================================

// In-memory user data store (use database in production)
const userDataStore = new Map();

// Google OAuth client ID (you need to set this)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '426758094719-c6vmj9lvp5bnp9db3ll6l5jabi1dbcte.apps.googleusercontent.com';

// Verify Google token and extract user info
async function verifyGoogleToken(credential) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Verify token with Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    
    const payload = await response.json();
    
    // Verify the token is for our app
    if (payload.aud !== GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) {
      console.warn('⚠️ Token audience mismatch, but allowing for development');
    }
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
}

// Simple JWT-like token generation (use proper JWT in production)
function generateToken(userId) {
  const payload = { userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }; // 30 days
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Verify our token
function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload.userId;
  } catch {
    return null;
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  const userId = verifyToken(token);
  
  if (!userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.userId = userId;
  next();
}

// Google login endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Missing credential' });
    }
    
    const user = await verifyGoogleToken(credential);
    const token = generateToken(user.id);
    
    // Initialize user data if not exists
    if (!userDataStore.has(user.id)) {
      userDataStore.set(user.id, {
        likedSongs: [],
        playlists: [],
        listeningHistory: [],
        lastSync: null
      });
    }
    
    console.log(`🔐 User logged in: ${user.email}`);
    
    res.json({
      user,
      token
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Sync user data to server
app.post('/api/user/sync', authMiddleware, (req, res) => {
  try {
    const { likedSongs, playlists, listeningHistory, playCount, recentItems } = req.body;
    
    userDataStore.set(req.userId, {
      likedSongs: likedSongs || [],
      playlists: playlists || [],
      listeningHistory: (listeningHistory || []).slice(-100), // Keep last 100
      playCount: playCount || {},
      recentItems: (recentItems || []).slice(0, 10), // Keep last 10
      lastSync: new Date().toISOString()
    });
    
    console.log(`☁️ Data synced for user: ${req.userId}`);
    
    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get user data from server
app.get('/api/user/data', authMiddleware, (req, res) => {
  try {
    const userData = userDataStore.get(req.userId);
    
    if (!userData) {
      return res.json({
        likedSongs: [],
        playlists: [],
        listeningHistory: [],
        playCount: {},
        recentItems: [],
        lastSync: null
      });
    }
    
    console.log(`📥 Data fetched for user: ${req.userId}`);
    
    res.json(userData);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// ============================================
// END AUTH SECTION
// ============================================

// Helper function to get country code from IP using free API
async function getCountryFromIP(ip) {
  try {
    // Skip for localhost/private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'US'; // Default for local development
    }
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    if (response.ok) {
      const data = await response.json();
      if (data.countryCode) {
        console.log(`🌍 Detected country from IP ${ip}: ${data.countryCode}`);
        return data.countryCode;
      }
    }
  } catch (error) {
    console.error('Error detecting country from IP:', error.message);
  }
  return 'US'; // Default fallback
}

// Helper to get client IP from request
function getClientIP(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         '127.0.0.1';
}

// Note: Static files will be served after API routes

// Parse songs from YouTube Music API response with sections
function parseSongsFromData(data) {
  const sections = [];
  const seenIds = new Set();

  try {
    // Navigate to sectionListRenderer
    const sectionList = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    console.log(`🔍 Found ${sectionList.length} sections`);

    for (const section of sectionList) {
      // Get section title and browse ID
      const header = section?.musicCarouselShelfRenderer?.header?.musicCarouselShelfBasicHeaderRenderer;
      const sectionTitle = header?.title?.runs?.[0]?.text ||
        section?.musicShelfRenderer?.title?.runs?.[0]?.text ||
        'Recommended';

      // Get browse ID for "More" button - prioritize moreContentButton
      const browseId = header?.moreContentButton?.buttonRenderer?.navigationEndpoint?.browseEndpoint?.browseId ||
        header?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;

      // Get items from carousel or shelf
      const items = section?.musicCarouselShelfRenderer?.contents ||
        section?.musicShelfRenderer?.contents || [];

      if (items.length === 0) continue;

      const sectionSongs = [];

      for (const item of items) {
        const renderer = item?.musicTwoRowItemRenderer ||
          item?.musicResponsiveListItemRenderer ||
          item?.musicMultiRowListItemRenderer ||
          item?.videoRenderer;

        if (renderer) {
          // Try multiple paths for video ID
          const videoId = renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
            renderer?.playlistItemData?.videoId ||
            renderer?.navigationEndpoint?.watchEndpoint?.videoId ||
            renderer?.videoId ||
            renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

          if (videoId && !seenIds.has(videoId)) {
            seenIds.add(videoId);

            // Extract title
            let title = 'Unknown Title';
            if (renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text) {
              title = renderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            } else if (renderer?.title?.runs?.[0]?.text) {
              title = renderer.title.runs[0].text;
            } else if (renderer?.title?.simpleText) {
              title = renderer.title.simpleText;
            }

            // Extract artist
            let artist = 'Unknown Artist';
            if (renderer?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
              const runs = renderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
              artist = runs.find(r => r.text && r.text !== ' • ' && r.text !== ' · ')?.text || 'Unknown Artist';
            } else if (renderer?.subtitle?.runs) {
              artist = renderer.subtitle.runs.find(r => r.text && r.text !== ' • ')?.text || 'Unknown Artist';
            } else if (renderer?.ownerText?.runs?.[0]?.text) {
              artist = renderer.ownerText.runs[0].text;
            }

            // Extract thumbnail
            const thumbnails = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
              renderer?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
              renderer?.thumbnail?.thumbnails || [];

            let cover = thumbnails[thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            if (cover.startsWith('//')) cover = 'https:' + cover;

            sectionSongs.push({
              id: videoId,
              title: title,
              artist: artist,
              album: 'YouTube Music',
              duration: '0:00',
              cover: cover,
              youtubeId: videoId
            });
          }
        }
      }

      if (sectionSongs.length > 0) {
        sections.push({
          title: sectionTitle,
          songs: sectionSongs,
          browseId: browseId || null
        });
        console.log(`  ✅ ${sectionTitle}: ${sectionSongs.length} items${browseId ? ' (has more)' : ''}`);
      }
    }

    console.log(`📊 Parsed ${sections.length} sections with ${seenIds.size} unique songs`);
    return sections;
  } catch (error) {
    console.error('Error parsing songs:', error);
    return [];
  }
}

// Get songs from YouTube Music Explore page
async function getLatestSongs(region = 'US') {
  try {
    const fetch = (await import('node-fetch')).default;

    console.log(`🌍 Fetching songs for region: ${region}`);

    const body = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20251015.03.00",
          hl: "en",
          gl: region // Use dynamic region
        }
      },
      browseId: "FEmusic_explore"
    };

    const response = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/',
        'X-Youtube-Client-Name': '67',
        'X-Youtube-Client-Version': '1.20251015.03.00'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Browse API error: ${response.status}`);
    }

    const data = await response.json();
    const songs = parseSongsFromData(data);

    console.log(`🎵 Got ${songs.length} songs from Explore page (${region})`);
    return songs;
  } catch (error) {
    console.error('Error fetching explore page:', error);
    throw error;
  }
}

// Search YouTube Music
// Parse search results - now includes albums
function parseSearchResults(data) {
  const results = {
    songs: [],
    albums: []
  };
  const seenSongIds = new Set();
  const seenAlbumIds = new Set();

  try {
    const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    console.log(`🔍 Found ${contents.length} search sections`);

    for (const section of contents) {
      // Get section title to identify type
      const sectionTitle = section?.musicShelfRenderer?.title?.runs?.[0]?.text || '';
      console.log(`  📁 Section: ${sectionTitle}`);

      // Handle top result (musicCardShelfRenderer)
      if (section.musicCardShelfRenderer) {
        const card = section.musicCardShelfRenderer;
        const videoId = card.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
        const browseId = card.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;

        // Check if it's an album (browseId starts with MPREb_)
        if (browseId && browseId.startsWith('MPREb_') && !seenAlbumIds.has(browseId)) {
          const title = card.title?.runs?.[0]?.text || '';
          const subtitleRuns = card.subtitle?.runs || [];
          const artist = subtitleRuns.find(r => r.navigationEndpoint)?.text || subtitleRuns[2]?.text || 'Unknown Artist';
          const thumbnail = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

          results.albums.push({
            id: browseId,
            browseId: browseId,
            title,
            artist,
            cover: thumbnail,
            type: 'album'
          });
          seenAlbumIds.add(browseId);
          console.log(`    ✅ Album: ${title} by ${artist}`);
        } else if (videoId && !seenSongIds.has(videoId)) {
          const title = card.title?.runs?.[0]?.text || '';
          const subtitleRuns = card.subtitle?.runs || [];
          const artist = subtitleRuns.find(r => r.navigationEndpoint)?.text || subtitleRuns[2]?.text || 'Unknown Artist';
          const thumbnail = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

          results.songs.push({
            id: videoId,
            youtubeId: videoId,
            title,
            artist,
            cover: thumbnail,
            type: 'song'
          });
          seenSongIds.add(videoId);
        }

        // Also check contents for more results
        const cardContents = card.contents || [];
        for (const item of cardContents) {
          if (item.musicResponsiveListItemRenderer) {
            const parsed = parseSearchItem(item.musicResponsiveListItemRenderer);
            if (parsed) {
              if (parsed.type === 'album' && !seenAlbumIds.has(parsed.id)) {
                results.albums.push(parsed);
                seenAlbumIds.add(parsed.id);
              } else if (parsed.type === 'song' && !seenSongIds.has(parsed.id)) {
                results.songs.push(parsed);
                seenSongIds.add(parsed.id);
              }
            }
          }
        }
      }

      // Handle shelf renderer (sections like Songs, Videos, Albums, etc.)
      if (section.musicShelfRenderer) {
        const shelf = section.musicShelfRenderer;
        const shelfContents = shelf.contents || [];
        const isAlbumSection = sectionTitle.toLowerCase().includes('album');

        for (const item of shelfContents) {
          if (item.musicResponsiveListItemRenderer) {
            const parsed = parseSearchItem(item.musicResponsiveListItemRenderer, isAlbumSection);
            if (parsed) {
              if (parsed.type === 'album' && !seenAlbumIds.has(parsed.id)) {
                results.albums.push(parsed);
                seenAlbumIds.add(parsed.id);
                console.log(`    ✅ Album: ${parsed.title}`);
              } else if (parsed.type === 'song' && !seenSongIds.has(parsed.id)) {
                results.songs.push(parsed);
                seenSongIds.add(parsed.id);
              }
            }
          }
        }
      }
    }

    console.log(`✅ Parsed ${results.songs.length} songs and ${results.albums.length} albums`);
    return results;
  } catch (error) {
    console.error('Error parsing search results:', error);
    return { songs: [], albums: [] };
  }
}

// Parse individual search item
function parseSearchItem(item, isAlbumSection = false) {
  try {
    // Check for album first (has browseId, no videoId)
    const browseId = item.navigationEndpoint?.browseEndpoint?.browseId ||
      item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchPlaylistEndpoint?.playlistId;
    
    const videoId = item.playlistItemData?.videoId ||
      item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

    const flexColumns = item.flexColumns || [];
    const title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
    const secondColumn = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
    const artist = secondColumn.find(r => r.text && r.text !== ' • ' && r.text !== ' · ' && r.text !== 'Album')?.text || 'Unknown Artist';

    const thumbnail = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

    // Determine if this is an album
    const isAlbum = (browseId && browseId.startsWith('MPREb_')) || 
                   (isAlbumSection && browseId) ||
                   secondColumn.some(r => r.text === 'Album');

    if (isAlbum && browseId) {
      return {
        id: browseId,
        browseId: browseId,
        title,
        artist,
        cover: thumbnail,
        type: 'album'
      };
    }

    if (!videoId) return null;

    return {
      id: videoId,
      youtubeId: videoId,
      title,
      artist,
      cover: thumbnail,
      type: 'song'
    };
  } catch (error) {
    return null;
  }
}

async function searchYouTubeMusic(query, maxResults = 50, region = 'US') {
  try {
    const fetch = (await import('node-fetch')).default;
    const body = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20251215.03.00",
          hl: "en",
          gl: region, // Use dynamic region
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
        }
      },
      query: query
    };

    console.log(`🔍 Searching "${query}" in region: ${region}`);

    const response = await fetch('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/search'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    const results = parseSearchResults(data);

    // Limit results
    return {
      songs: results.songs.slice(0, maxResults),
      albums: results.albums.slice(0, 20)
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

// Get latest songs organized by sections
app.get('/api/songs', async (req, res) => {
  try {
    // Get region from query param, or detect from IP
    let region = req.query.region;
    
    if (!region) {
      const clientIP = getClientIP(req);
      region = await getCountryFromIP(clientIP);
    }
    
    const sections = await getLatestSongs(region);

    if (sections.length === 0) {
      throw new Error('No songs found');
    }

    console.log(`✅ Returning ${sections.length} sections for region: ${region}`);
    res.json(sections);
  } catch (error) {
    console.error('Error fetching songs:', error);
    // Fallback to sample data with sections
    res.json([
      {
        title: "Popular Songs",
        songs: [
          {
            id: "dQw4w9WgXcQ",
            title: "Never Gonna Give You Up",
            artist: "Rick Astley",
            album: "YouTube Music",
            duration: "3:33",
            cover: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            youtubeId: "dQw4w9WgXcQ"
          },
          {
            id: "kJQP7kiw5Fk",
            title: "Despacito",
            artist: "Luis Fonsi",
            album: "YouTube Music",
            duration: "3:47",
            cover: "https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
            youtubeId: "kJQP7kiw5Fk"
          },
          {
            id: "9bZkp7q19f0",
            title: "Gangnam Style",
            artist: "PSY",
            album: "YouTube Music",
            duration: "4:13",
            cover: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
            youtubeId: "9bZkp7q19f0"
          }
        ]
      },
      {
        title: "Chill Vibes",
        songs: [
          {
            id: "jfKfPfyJRdk",
            title: "Lofi Hip Hop Radio",
            artist: "Lofi Girl",
            album: "YouTube Music",
            duration: "0:00",
            cover: "https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg",
            youtubeId: "jfKfPfyJRdk"
          },
          {
            id: "5qap5aO4i9A",
            title: "Lofi Study Music",
            artist: "ChilledCow",
            album: "YouTube Music",
            duration: "0:00",
            cover: "https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg",
            youtubeId: "5qap5aO4i9A"
          }
        ]
      }
    ]);
  }
});

// Parse songs from browse response (different structure)
function parseBrowseSongs(data) {
  const songs = [];
  const seenIds = new Set();

  try {
    // Try multiple paths for browse responses
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
      data?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents ||
      [];

    console.log(`🔍 Browse response has ${contents.length} sections`);

    for (const section of contents) {
      const sectionType = Object.keys(section)[0];
      console.log(`  📁 Section type: ${sectionType}`);

      // Handle different section types
      const items = section?.musicShelfRenderer?.contents ||
        section?.musicCarouselShelfRenderer?.contents ||
        section?.musicPlaylistShelfRenderer?.contents ||
        section?.gridRenderer?.items || [];

      console.log(`  📦 Section has ${items.length} items`);

      for (const item of items) {
        const itemType = Object.keys(item)[0];

        const renderer = item?.musicTwoRowItemRenderer ||
          item?.musicResponsiveListItemRenderer ||
          item?.musicMultiRowListItemRenderer ||
          item?.gridVideoRenderer;

        if (renderer) {
          const videoId = renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
            renderer?.playlistItemData?.videoId ||
            renderer?.navigationEndpoint?.watchEndpoint?.videoId ||
            renderer?.videoId;

          if (!videoId) {
            console.log(`    ⚠️ No videoId found in ${itemType}`);
          }

          if (videoId && !seenIds.has(videoId)) {
            seenIds.add(videoId);

            let title = 'Unknown Title';
            if (renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text) {
              title = renderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            } else if (renderer?.title?.runs?.[0]?.text) {
              title = renderer.title.runs[0].text;
            } else if (renderer?.title?.simpleText) {
              title = renderer.title.simpleText;
            }

            let artist = 'Unknown Artist';
            if (renderer?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
              const runs = renderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
              artist = runs.find(r => r.text && r.text !== ' • ' && r.text !== ' · ')?.text || 'Unknown Artist';
            } else if (renderer?.subtitle?.runs) {
              artist = renderer.subtitle.runs.find(r => r.text && r.text !== ' • ')?.text || 'Unknown Artist';
            } else if (renderer?.shortBylineText?.runs?.[0]?.text) {
              artist = renderer.shortBylineText.runs[0].text;
            }

            const thumbnails = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
              renderer?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
              renderer?.thumbnail?.thumbnails || [];

            let cover = thumbnails[thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            if (cover.startsWith('//')) cover = 'https:' + cover;

            songs.push({
              id: videoId,
              title: title,
              artist: artist,
              album: 'YouTube Music',
              duration: '0:00',
              cover: cover,
              youtubeId: videoId
            });

            console.log(`    ✅ ${title} by ${artist}`);
          }
        }
      }
    }

    return songs;
  } catch (error) {
    console.error('Error parsing browse songs:', error);
    return [];
  }
}

// Get section details by browse ID
app.get('/api/section/:browseId', async (req, res) => {
  const { browseId } = req.params;

  try {
    const fetch = (await import('node-fetch')).default;

    const body = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20251015.03.00",
          hl: "en",
          gl: "IN"
        }
      },
      browseId: browseId
    };

    console.log(`📡 Fetching browse ID: ${browseId}`);

    const response = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/explore',
        'X-Youtube-Client-Name': '67',
        'X-Youtube-Client-Version': '1.20251015.03.00'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Browse API error: ${response.status}`);
    }

    const data = await response.json();
    const songs = parseBrowseSongs(data);

    console.log(`✅ Got ${songs.length} songs for browse ID: ${browseId}`);
    res.json(songs);
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

// Get next songs in queue for a video
app.get('/api/next/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const url = 'https://music.youtube.com/youtubei/v1/next?prettyPrint=false';

    // Step 1: Get radio playlist ID
    console.log(`🎵 Step 1: Fetching radio playlist for videoId: ${videoId}`);
    const firstPayload = {
      enablePersistentPlaylistPanel: true,
      videoId: videoId,
      isAudioOnly: true,
      context: {
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: '1.20251015.03.00',
          hl: 'en',
          gl: 'US',
        }
      }
    };

    const firstResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(firstPayload)
    });

    if (!firstResponse.ok) {
      throw new Error(`Next API error: ${firstResponse.status}`);
    }

    const firstData = await firstResponse.json();

    // Extract radio playlist ID from "Start radio" menu item
    let radioPlaylistId = null;
    try {
      const contents = firstData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];

      for (const item of contents) {
        const menuItems = item?.playlistPanelVideoRenderer?.menu?.menuRenderer?.items || [];
        for (const menuItem of menuItems) {
          const navEndpoint = menuItem?.menuNavigationItemRenderer?.navigationEndpoint?.watchEndpoint;
          if (navEndpoint && navEndpoint.playlistId && navEndpoint.playlistId.startsWith('RDAMVM')) {
            radioPlaylistId = navEndpoint.playlistId;
            console.log(`📻 Found radio playlist: ${radioPlaylistId}`);
            break;
          }
        }
        if (radioPlaylistId) break;
      }
    } catch (err) {
      console.error('Error extracting radio playlist:', err);
    }

    // If no radio playlist found, return empty queue
    if (!radioPlaylistId) {
      console.log('⚠️ No radio playlist found');
      return res.json([]);
    }

    // Step 2: Get queue with radio playlist ID
    console.log(`🎵 Step 2: Fetching queue with playlistId: ${radioPlaylistId}`);
    const secondPayload = {
      enablePersistentPlaylistPanel: true,
      videoId: videoId,
      playlistId: radioPlaylistId,
      isAudioOnly: true,
      context: {
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: '1.20251015.03.00',
          hl: 'en',
          gl: 'US',
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(secondPayload)
    });

    if (!response.ok) {
      throw new Error(`Next API error: ${response.status}`);
    }

    const data = await response.json();
    const queue = [];

    try {
      const panelRenderer = data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer;
      const contents = panelRenderer?.contents || [];
      let playlistId = panelRenderer?.playlistId;

      console.log(`🔍 Processing ${contents.length} items from queue for videoId: ${videoId}`);
      console.log(`📋 PlaylistId: ${playlistId || 'none'}`);

      for (const item of contents) {
        const renderer = item.playlistPanelVideoRenderer;

        // Check for automix preview
        if (!renderer && item.automixPreviewVideoRenderer) {
          const automixPlaylistId = item.automixPreviewVideoRenderer?.content?.automixPlaylistVideoRenderer?.navigationEndpoint?.watchPlaylistEndpoint?.playlistId;
          if (automixPlaylistId) {
            console.log(`  🎵 Found automix playlist: ${automixPlaylistId}`);
            playlistId = automixPlaylistId;
          }
          continue;
        }

        if (!renderer) {
          console.log('  ⚠️ No playlistPanelVideoRenderer found');
          continue;
        }

        const itemVideoId = renderer.videoId;
        const title = renderer.title?.runs?.[0]?.text || '';
        const artist = renderer.longBylineText?.runs?.[0]?.text || 'Unknown Artist';
        const thumbnail = renderer.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

        console.log(`  📝 Item: "${title}" by ${artist}`);
        console.log(`     - videoId: ${itemVideoId}`);
        console.log(`     - selected: ${renderer.selected}`);

        // Skip the currently playing song (marked as selected)
        if (renderer.selected) {
          console.log(`     ⏭️ SKIPPED: Current song`);
          continue;
        }

        // Filter out non-music items
        const musicVideoType = renderer.navigationEndpoint?.watchEndpoint?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType;
        const itemPlaylistId = renderer.navigationEndpoint?.watchEndpoint?.playlistId;

        console.log(`     - musicVideoType: ${musicVideoType || 'none'}`);
        console.log(`     - playlistId: ${itemPlaylistId || 'none'}`);
        console.log(`     - title length: ${title.length}`);

        // Check if it's a music item
        const isMusic = musicVideoType || itemPlaylistId || title.length < 100;

        if (!isMusic) {
          console.log(`     🚫 FILTERED OUT: Not music (no musicVideoType, no playlistId, title too long)`);
          continue;
        }

        if (itemVideoId && title) {
          console.log(`     ✅ ADDED to queue`);
          queue.push({
            id: itemVideoId,
            youtubeId: itemVideoId,
            title,
            artist,
            cover: thumbnail
          });
        } else {
          console.log(`     ⚠️ SKIPPED: Missing videoId or title`);
        }
      }

      // If queue is empty but we have a playlistId, fetch songs from the playlist
      if (queue.length === 0 && playlistId) {
        console.log(`📋 Queue empty, fetching songs from playlist: ${playlistId}`);
        try {
          const playlistPayload = {
            context: {
              client: {
                clientName: 'WEB_REMIX',
                clientVersion: '1.20251015.03.00',
                hl: 'en',
                gl: 'US',
              }
            },
            browseId: `VL${playlistId}`
          };

          const playlistResponse = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify(playlistPayload)
          });

          if (playlistResponse.ok) {
            const playlistData = await playlistResponse.json();
            const playlistSongs = parseBrowseSongs(playlistData);
            console.log(`✅ Fetched ${playlistSongs.length} songs from playlist`);

            // Filter out the current song
            const filteredSongs = playlistSongs.filter(s => s.id !== videoId);
            queue.push(...filteredSongs.slice(0, 20)); // Limit to 20 songs
          }
        } catch (playlistError) {
          console.error('Error fetching playlist:', playlistError);
        }
      }

      console.log(`✅ Found ${queue.length} music songs in queue for ${videoId}`);
      res.json(queue);
    } catch (parseError) {
      console.error('Error parsing queue:', parseError);
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching next songs:', error);
    res.status(500).json({ error: 'Failed to fetch next songs' });
  }
});

// Get audio URL for YouTube video (for native player)
app.get('/api/audio/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }
  
  try {
    const ytdl = require('ytdl-core');
    
    console.log(`🎵 Getting audio URL for: ${videoId}`);
    
    const info = await ytdl.getInfo(videoId);
    
    // Get audio-only format with best quality
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (audioFormats.length === 0) {
      throw new Error('No audio formats available');
    }
    
    // Sort by quality and get best
    const bestAudio = audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];
    
    console.log(`✅ Found audio URL: ${bestAudio.audioBitrate}kbps`);
    
    res.json({
      url: bestAudio.url,
      bitrate: bestAudio.audioBitrate,
      mimeType: bestAudio.mimeType,
      duration: info.videoDetails.lengthSeconds,
      title: info.videoDetails.title,
      artist: info.videoDetails.author.name
    });
    
  } catch (error) {
    console.error('❌ Error getting audio URL:', error.message);
    res.status(500).json({ error: 'Failed to get audio URL' });
  }
});

// Search songs
app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Get region from query param, or detect from IP
    let region = req.query.region;
    
    if (!region) {
      const clientIP = getClientIP(req);
      region = await getCountryFromIP(clientIP);
    }

    const results = await searchYouTubeMusic(query, 50, region);

    console.log(`✅ Found ${results.songs.length} songs and ${results.albums.length} albums for "${query}" (${region})`);
    res.json(results);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// Get album tracks by browse ID
app.get('/api/album/:browseId', async (req, res) => {
  const { browseId } = req.params;

  if (!browseId) {
    return res.status(400).json({ error: 'Browse ID is required' });
  }

  try {
    const fetch = (await import('node-fetch')).default;

    // Get region from query param, or detect from IP
    let region = req.query.region;
    
    if (!region) {
      const clientIP = getClientIP(req);
      region = await getCountryFromIP(clientIP);
    }

    const body = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20251215.03.00",
          hl: "en",
          gl: region
        }
      },
      browseId: browseId
    };

    console.log(`📀 Fetching album: ${browseId}`);

    const response = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/',
        'X-Youtube-Client-Name': '67',
        'X-Youtube-Client-Version': '1.20251215.03.00'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Album API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse album info and tracks
    const album = parseAlbumData(data);
    
    console.log(`✅ Got album "${album.title}" with ${album.tracks.length} tracks`);
    res.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Parse album data from browse response
function parseAlbumData(data) {
  const album = {
    title: '',
    artist: '',
    cover: '',
    year: '',
    tracks: []
  };

  try {
    // Get album header info from different possible locations
    // For twoColumnBrowseResultsRenderer, header is in tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicResponsiveHeaderRenderer
    const twoColumnContents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    const responsiveHeader = twoColumnContents.find(c => c.musicResponsiveHeaderRenderer)?.musicResponsiveHeaderRenderer;
    
    const header = data?.header?.musicDetailHeaderRenderer || 
                   data?.header?.musicImmersiveHeaderRenderer ||
                   responsiveHeader;
    
    if (header) {
      album.title = header.title?.runs?.[0]?.text || '';
      
      // For musicResponsiveHeaderRenderer, artist is in straplineTextOne
      // For others, it's in subtitle
      if (header.straplineTextOne?.runs) {
        album.artist = header.straplineTextOne.runs.find(r => r.navigationEndpoint)?.text || 
                       header.straplineTextOne.runs[0]?.text || 'Unknown Artist';
      } else {
        album.artist = header.subtitle?.runs?.find(r => r.navigationEndpoint)?.text || 
                       header.subtitle?.runs?.[2]?.text || 'Unknown Artist';
      }
      
      // Year is typically in subtitle runs
      const subtitleRuns = header.subtitle?.runs || [];
      album.year = subtitleRuns.find(r => /^\d{4}$/.test(r.text))?.text || 
                   subtitleRuns.slice(-1)?.[0]?.text || '';
      
      const thumbnails = header.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                        header.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails || [];
      album.cover = thumbnails.slice(-1)[0]?.url || '';
      
      console.log(`📀 Album header: "${album.title}" by ${album.artist} (${album.year})`);
    }

    // Get tracks from twoColumnBrowseResultsRenderer -> secondaryContents
    const secondaryContents = data?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents || [];
    
    console.log(`📀 Found ${secondaryContents.length} secondary content sections`);

    for (const section of secondaryContents) {
      const shelfContents = section?.musicShelfRenderer?.contents || [];
      console.log(`  📁 Section has ${shelfContents.length} items`);
      
      for (const item of shelfContents) {
        const renderer = item?.musicResponsiveListItemRenderer;
        if (!renderer) continue;

        // Get videoId from multiple possible locations
        // Primary: overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchEndpoint.videoId
        // Fallback: playlistItemData.videoId or flexColumns navigation
        const videoId = renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
          renderer.playlistItemData?.videoId ||
          renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

        if (!videoId) {
          console.log(`    ⚠️ No videoId found`);
          continue;
        }

        const flexColumns = renderer.flexColumns || [];
        
        // Get title from first flex column
        const title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
        
        // Get artist from second flex column - join all artist names
        const artistRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        const artistNames = artistRuns
          .filter(r => r.navigationEndpoint && r.text)
          .map(r => r.text);
        const artist = artistNames.length > 0 ? artistNames.join(', ') : album.artist;
        
        // Get duration from fixed columns
        const fixedColumns = renderer.fixedColumns || [];
        const duration = fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || '';

        // Get track index if available
        const trackIndex = renderer.index?.runs?.[0]?.text || '';

        // Use album cover for all tracks (album tracks typically share the same cover)
        const cover = album.cover || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        album.tracks.push({
          id: videoId,
          youtubeId: videoId,
          title,
          artist,
          album: album.title,
          duration,
          cover,
          trackNumber: trackIndex
        });

        console.log(`    ✅ Track ${trackIndex}: ${title} by ${artist} (${duration})`);
      }
    }

    // Fallback: try singleColumnBrowseResultsRenderer if no tracks found
    if (album.tracks.length === 0) {
      console.log(`📀 No tracks in secondaryContents, trying singleColumnBrowseResultsRenderer`);
      const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
      
      for (const section of contents) {
        const shelfContents = section?.musicShelfRenderer?.contents || [];
        
        for (const item of shelfContents) {
          const renderer = item?.musicResponsiveListItemRenderer;
          if (!renderer) continue;

          const videoId = renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
            renderer.playlistItemData?.videoId;

          if (!videoId) continue;

          const flexColumns = renderer.flexColumns || [];
          const title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
          
          const artistRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
          const artistNames = artistRuns
            .filter(r => r.navigationEndpoint && r.text)
            .map(r => r.text);
          const artist = artistNames.length > 0 ? artistNames.join(', ') : album.artist;
          
          const fixedColumns = renderer.fixedColumns || [];
          const duration = fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || '';
          const trackIndex = renderer.index?.runs?.[0]?.text || '';

          album.tracks.push({
            id: videoId,
            youtubeId: videoId,
            title,
            artist,
            album: album.title,
            duration,
            cover: album.cover,
            trackNumber: trackIndex
          });
        }
      }
    }

    console.log(`📀 Parsed album "${album.title}" with ${album.tracks.length} tracks`);
    return album;
  } catch (error) {
    console.error('Error parsing album data:', error);
    return album;
  }
}

// AI-powered recommendations
app.post('/api/recommendations', async (req, res) => {
  const { likedSongs, listeningHistory } = req.body;

  try {
    const fetch = (await import('node-fetch')).default;

    // Prepare user preferences for AI
    const recentSongs = listeningHistory?.slice(-10) || [];
    const topLiked = likedSongs?.slice(-10) || [];

    // Build context for AI
    let userContext = "Based on the user's music preferences:\n\n";

    if (topLiked.length > 0) {
      userContext += "Liked songs:\n";
      topLiked.forEach(song => {
        userContext += `- "${song.title}" by ${song.artist}\n`;
      });
      userContext += "\n";
    }

    if (recentSongs.length > 0) {
      userContext += "Recently played:\n";
      recentSongs.forEach(song => {
        userContext += `- "${song.title}" by ${song.artist}\n`;
      });
      userContext += "\n";
    }

    userContext += "Please recommend exactly 10 songs (with artist names) that match this user's taste. Format each recommendation EXACTLY as: 'Song Title by Artist Name' on separate lines. Provide ONLY the 10 song recommendations, nothing else - no explanations, no numbering, no extra text.";

    console.log('🤖 Requesting AI recommendations...');

    // Call DeepAI API
    const boundary = "----WebKitFormBoundary2EZaPVKzInbQDlEI";
    const messages = [{ role: "user", content: userContext }];

    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="chat_style"\r\n',
      'chat',
      `--${boundary}`,
      'Content-Disposition: form-data; name="chatHistory"\r\n',
      JSON.stringify(messages),
      `--${boundary}`,
      'Content-Disposition: form-data; name="model"\r\n',
      'standard',
      `--${boundary}`,
      'Content-Disposition: form-data; name="hacker_is_stinky"\r\n',
      'very_stinky',
      `--${boundary}--`
    ].join('\r\n');

    const aiResponse = await fetch('https://api.deepai.org/hacking_is_a_serious_crime', {
      method: 'POST',
      headers: {
        'Api-Key': 'tryit-69244861019-9ebc4eeb1aa323e195fa7bb7a0fcc026',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      },
      body: body
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    // AI API returns plain text, not JSON
    const recommendations = await aiResponse.text();

    console.log('🤖 AI Response:', recommendations);
    console.log('🤖 AI Response length:', recommendations.length);

    if (!recommendations || recommendations.length < 10) {
      console.warn('⚠️ AI returned empty or very short response');
      return res.json([]);
    }

    // Parse AI recommendations and search for each song
    const lines = recommendations.split('\n').filter(line => line.trim());
    console.log(`📝 Parsed ${lines.length} lines from AI response`);

    const searchPromises = [];

    for (const line of lines) {
      // Extract song info from various formats
      const match = line.match(/(?:^\d+\.\s*)?["']?(.+?)["']?\s+by\s+(.+?)$/i) ||
        line.match(/(?:^\d+\.\s*)?(.+?)\s*-\s*(.+?)$/);

      if (match) {
        const [, title, artist] = match;
        const query = `${title.trim()} ${artist.trim()}`;
        console.log(`🔍 Searching for: "${query}"`);
        searchPromises.push(searchYouTubeMusic(query, 1));
      } else {
        console.log(`⚠️ Could not parse line: "${line}"`);
      }
    }

    console.log(`🔍 Searching for ${searchPromises.length} songs...`);

    const searchResults = await Promise.all(searchPromises);
    const recommendedSongs = searchResults
      .filter(results => results.songs && results.songs.length > 0)
      .map(results => results.songs[0]);

    console.log(`✅ Found ${recommendedSongs.length} AI-recommended songs`);

    if (recommendedSongs.length === 0) {
      console.warn('⚠️ No songs found from AI recommendations');
    }

    res.json(recommendedSongs);

  } catch (error) {
    console.error('❌ Error getting AI recommendations:', error);
    // Fallback to empty array
    res.json([]);
  }
});

// Production configuration
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  console.log('📁 Serving static files from:', buildPath);

  // Add logging middleware
  app.use((req, res, next) => {
    console.log(`📥 Request: ${req.method} ${req.path}`);
    next();
  });

  // Debug routes (remove these after fixing)
  app.get('/debug-build', (req, res) => {
    const fs = require('fs');
    try {
      const files = fs.readdirSync(buildPath, { recursive: true });
      const indexContent = fs.readFileSync(path.join(buildPath, 'index.html'), 'utf8');
      res.json({
        buildPath,
        files: files.slice(0, 20),
        indexHtmlPreview: indexContent.substring(0, 1000)
      });
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  app.get('/test', (req, res) => {
    res.send('<h1>🎵 Sonfy Server Works!</h1><script>console.log("JS works!");</script>');
  });

  // Test if JS file is served correctly
  app.get('/test-js', (req, res) => {
    const fs = require('fs');
    const jsFiles = fs.readdirSync(path.join(buildPath, 'static/js'));
    const mainJsFile = jsFiles.find(f => f.startsWith('main.') && f.endsWith('.js'));

    if (mainJsFile) {
      const jsPath = path.join(buildPath, 'static/js', mainJsFile);
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      res.json({
        fileName: mainJsFile,
        fileSize: jsContent.length,
        firstChars: jsContent.substring(0, 100),
        isJavaScript: jsContent.startsWith('!function') || jsContent.startsWith('(function') || jsContent.includes('React')
      });
    } else {
      res.json({ error: 'No main JS file found' });
    }
  });

  // Serve static files FIRST - this is crucial
  app.use(express.static(buildPath, {
    maxAge: 0, // Disable caching for debugging
    setHeaders: (res, filePath) => {
      // Force no cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
    }
  }));

  // Catch-all for React Router (ONLY for non-file requests)
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    console.log('📄 Serving index.html for:', req.path);
    res.sendFile(indexPath);
  });

} else {
  // Development mode
  app.get('/', (req, res) => {
    res.json({
      message: 'Server is running in development mode',
      note: 'Run the React app separately with: cd client && npm start'
    });
  });
}

// SEO middleware for production
if (process.env.NODE_ENV === 'production') {
  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // Add caching headers for static assets
  app.use('/static', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  });

  // Serve sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/sitemap.xml'));
  });

  // Serve robots.txt
  app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/robots.txt'));
  });

  // Add compression for better performance
  app.use(compression());
}

app.listen(PORT, () => {
  console.log(`🎵 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
