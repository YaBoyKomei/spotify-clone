const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
async function getLatestSongs() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const body = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20251015.03.00",
          hl: "en",
          gl: "US"
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
    
    console.log(`🎵 Got ${songs.length} songs from Explore page`);
    return songs;
  } catch (error) {
    console.error('Error fetching explore page:', error);
    throw error;
  }
}

// Search YouTube Music
// Parse search results
function parseSearchResults(data) {
  const results = [];
  const seenIds = new Set();
  
  try {
    const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    
    console.log(`🔍 Found ${contents.length} search sections`);
    
    for (const section of contents) {
      // Handle top result (musicCardShelfRenderer)
      if (section.musicCardShelfRenderer) {
        const card = section.musicCardShelfRenderer;
        const videoId = card.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
        
        if (videoId && !seenIds.has(videoId)) {
          const title = card.title?.runs?.[0]?.text || '';
          const subtitleRuns = card.subtitle?.runs || [];
          const artist = subtitleRuns.find(r => r.navigationEndpoint)?.text || subtitleRuns[2]?.text || 'Unknown Artist';
          const thumbnail = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

          results.push({
            id: videoId,
            youtubeId: videoId,
            title,
            artist,
            cover: thumbnail
          });
          seenIds.add(videoId);
        }

        // Also check contents for more results
        const cardContents = card.contents || [];
        for (const item of cardContents) {
          if (item.musicResponsiveListItemRenderer) {
            const parsed = parseSearchItem(item.musicResponsiveListItemRenderer);
            if (parsed && !seenIds.has(parsed.id)) {
              results.push(parsed);
              seenIds.add(parsed.id);
            }
          }
        }
      }

      // Handle shelf renderer (sections like Songs, Videos, Albums, etc.)
      if (section.musicShelfRenderer) {
        const shelf = section.musicShelfRenderer;
        const shelfContents = shelf.contents || [];
        
        for (const item of shelfContents) {
          if (item.musicResponsiveListItemRenderer) {
            const parsed = parseSearchItem(item.musicResponsiveListItemRenderer);
            if (parsed && !seenIds.has(parsed.id)) {
              results.push(parsed);
              seenIds.add(parsed.id);
            }
          }
        }
      }
    }
    
    console.log(`✅ Parsed ${results.length} search results`);
    return results;
  } catch (error) {
    console.error('Error parsing search results:', error);
    return [];
  }
}

// Parse individual search item
function parseSearchItem(item) {
  try {
    const videoId = item.playlistItemData?.videoId || 
                    item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
    
    if (!videoId) return null;

    const flexColumns = item.flexColumns || [];
    const title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
    const artist = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Unknown Artist';
    
    const thumbnail = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

    return {
      id: videoId,
      youtubeId: videoId,
      title,
      artist,
      cover: thumbnail
    };
  } catch (error) {
    return null;
  }
}

async function searchYouTubeMusic(query, maxResults = 50) {
  try {
    const fetch = (await import('node-fetch')).default;
    const body = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20251015.03.00",
          hl: "en",
          gl: "US",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
        }
      },
      query: query
    };

    const response = await fetch('https://music.youtube.com/youtubei/v1/search?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
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
    const songs = parseSearchResults(data);
    
    // Limit results
    return songs.slice(0, maxResults);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

// Get latest songs organized by sections
app.get('/api/songs', async (req, res) => {
  try {
    const sections = await getLatestSongs();
    
    if (sections.length === 0) {
      throw new Error('No songs found');
    }
    
    console.log(`✅ Returning ${sections.length} sections`);
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

// Search songs
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const songs = await searchYouTubeMusic(query);
    
    console.log(`✅ Found ${songs.length} results for "${query}"`);
    res.json(songs);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  console.log('📁 Serving static files from:', buildPath);
  
  // Add logging middleware to debug static file requests
  app.use((req, res, next) => {
    console.log(`📥 Request: ${req.method} ${req.path}`);
    next();
  });
  
  // Debug route to check build files
  app.get('/debug-build', (req, res) => {
    const fs = require('fs');
    const buildPath = path.join(__dirname, '../client/build');
    
    try {
      const files = fs.readdirSync(buildPath, { recursive: true });
      const indexContent = fs.readFileSync(path.join(buildPath, 'index.html'), 'utf8');
      
      res.json({
        buildPath,
        files: files.slice(0, 20), // First 20 files
        indexHtmlPreview: indexContent.substring(0, 1000)
      });
    } catch (error) {
      res.json({ error: error.message });
    }
  });
  
  // Simple test route
  app.get('/test', (req, res) => {
    res.send(`
      <html>
        <head><title>Sonfy Test</title></head>
        <body>
          <h1>🎵 Sonfy Server is Working!</h1>
          <p>If you see this, the server is running correctly.</p>
          <script>console.log('Test JavaScript is working!');</script>
        </body>
      </html>
    `);
  });
  
  // Serve static files with proper headers
  app.use(express.static(buildPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
  
  // Catch-all route to serve React app for non-static routes
  app.get('*', (req, res) => {
    // Only serve index.html for non-static file requests
    if (req.path.startsWith('/static/') || req.path.includes('.')) {
      console.log(`❌ Static file not found: ${req.path}`);
      return res.status(404).send('Static file not found');
    }
    
    const indexPath = path.join(__dirname, '../client/build/index.html');
    console.log('📄 Serving index.html for route:', req.path);
    
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('❌ Error serving index.html:', err);
        res.status(500).send('Error loading application. Please check server logs.');
      }
    });
  });
} else {
  // Development mode - just show a message
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
