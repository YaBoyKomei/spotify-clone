// Direct YouTube Music API calls (no server needed)

const YOUTUBE_MUSIC_API = 'https://music.youtube.com/youtubei/v1';
const CLIENT_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20251015.03.00',
    hl: 'en',
    gl: 'US'
  }
};

const HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Origin': 'https://music.youtube.com',
  'Referer': 'https://music.youtube.com/'
};

// Parse songs from YouTube Music API response
function parseSongsFromData(data) {
  const sections = [];
  const seenIds = new Set();

  try {
    const sectionList = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    for (const section of sectionList) {
      const header = section?.musicCarouselShelfRenderer?.header?.musicCarouselShelfBasicHeaderRenderer;
      const sectionTitle = header?.title?.runs?.[0]?.text ||
        section?.musicShelfRenderer?.title?.runs?.[0]?.text ||
        'Recommended';

      const browseId = header?.moreContentButton?.buttonRenderer?.navigationEndpoint?.browseEndpoint?.browseId ||
        header?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;

      const items = section?.musicCarouselShelfRenderer?.contents ||
        section?.musicShelfRenderer?.contents || [];

      if (items.length === 0) continue;

      const sectionSongs = [];

      for (const item of items) {
        const renderer = item?.musicTwoRowItemRenderer ||
          item?.musicResponsiveListItemRenderer ||
          item?.musicMultiRowListItemRenderer;

        if (renderer) {
          const videoId = renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
            renderer?.playlistItemData?.videoId ||
            renderer?.navigationEndpoint?.watchEndpoint?.videoId ||
            renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

          if (videoId && !seenIds.has(videoId)) {
            seenIds.add(videoId);

            let title = 'Unknown Title';
            if (renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text) {
              title = renderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            } else if (renderer?.title?.runs?.[0]?.text) {
              title = renderer.title.runs[0].text;
            }

            let artist = 'Unknown Artist';
            if (renderer?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
              const runs = renderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
              artist = runs.find(r => r.text && r.text !== ' • ' && r.text !== ' · ')?.text || 'Unknown Artist';
            } else if (renderer?.subtitle?.runs) {
              artist = renderer.subtitle.runs.find(r => r.text && r.text !== ' • ')?.text || 'Unknown Artist';
            }

            const thumbnails = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
              renderer?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];

            let cover = thumbnails[thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            if (cover.startsWith('//')) cover = 'https:' + cover;

            sectionSongs.push({
              id: videoId,
              title,
              artist,
              album: 'YouTube Music',
              duration: '0:00',
              cover,
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
      }
    }

    return sections;
  } catch (error) {
    console.error('Error parsing songs:', error);
    return [];
  }
}

// Parse search results
function parseSearchResults(data) {
  const results = [];
  const seenIds = new Set();

  try {
    const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    for (const section of contents) {
      if (section.musicCardShelfRenderer) {
        const card = section.musicCardShelfRenderer;
        const videoId = card.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

        if (videoId && !seenIds.has(videoId)) {
          const title = card.title?.runs?.[0]?.text || '';
          const subtitleRuns = card.subtitle?.runs || [];
          const artist = subtitleRuns.find(r => r.navigationEndpoint)?.text || subtitleRuns[2]?.text || 'Unknown Artist';
          const thumbnail = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

          results.push({ id: videoId, youtubeId: videoId, title, artist, cover: thumbnail });
          seenIds.add(videoId);
        }

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

      if (section.musicShelfRenderer) {
        const shelfContents = section.musicShelfRenderer.contents || [];
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

    return results;
  } catch (error) {
    console.error('Error parsing search results:', error);
    return [];
  }
}

function parseSearchItem(item) {
  try {
    const videoId = item.playlistItemData?.videoId ||
      item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

    if (!videoId) return null;

    const flexColumns = item.flexColumns || [];
    const title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
    const artist = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Unknown Artist';
    const thumbnail = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

    return { id: videoId, youtubeId: videoId, title, artist, cover: thumbnail };
  } catch (error) {
    return null;
  }
}

// Parse browse songs
function parseBrowseSongs(data) {
  const songs = [];
  const seenIds = new Set();

  try {
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    for (const section of contents) {
      const items = section?.musicShelfRenderer?.contents ||
        section?.musicCarouselShelfRenderer?.contents ||
        section?.musicPlaylistShelfRenderer?.contents || [];

      for (const item of items) {
        const renderer = item?.musicTwoRowItemRenderer ||
          item?.musicResponsiveListItemRenderer;

        if (renderer) {
          const videoId = renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
            renderer?.playlistItemData?.videoId ||
            renderer?.navigationEndpoint?.watchEndpoint?.videoId;

          if (videoId && !seenIds.has(videoId)) {
            seenIds.add(videoId);

            let title = renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
              renderer?.title?.runs?.[0]?.text || 'Unknown Title';

            let artist = 'Unknown Artist';
            if (renderer?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
              const runs = renderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
              artist = runs.find(r => r.text && r.text !== ' • ')?.text || 'Unknown Artist';
            } else if (renderer?.subtitle?.runs) {
              artist = renderer.subtitle.runs.find(r => r.text && r.text !== ' • ')?.text || 'Unknown Artist';
            }

            const thumbnails = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
            let cover = thumbnails[thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

            songs.push({ id: videoId, title, artist, album: 'YouTube Music', duration: '0:00', cover, youtubeId: videoId });
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

// API Functions
export async function fetchSongs() {
  console.log('🎵 Fetching songs from YouTube Music...');
  
  const body = {
    context: CLIENT_CONTEXT,
    browseId: 'FEmusic_explore'
  };

  const response = await fetch(`${YOUTUBE_MUSIC_API}/browse?prettyPrint=false`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`Browse API error: ${response.status}`);

  const data = await response.json();
  const sections = parseSongsFromData(data);
  
  console.log(`✅ Got ${sections.length} sections`);
  return sections;
}

export async function searchSongs(query) {
  console.log(`🔍 Searching: ${query}`);
  
  const body = {
    context: CLIENT_CONTEXT,
    query: query
  };

  const response = await fetch(`${YOUTUBE_MUSIC_API}/search?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`Search API error: ${response.status}`);

  const data = await response.json();
  const songs = parseSearchResults(data);
  
  console.log(`✅ Found ${songs.length} results`);
  return songs.slice(0, 50);
}

export async function fetchSection(browseId) {
  console.log(`📁 Fetching section: ${browseId}`);
  
  const body = {
    context: CLIENT_CONTEXT,
    browseId: browseId
  };

  const response = await fetch(`${YOUTUBE_MUSIC_API}/browse?prettyPrint=false`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`Browse API error: ${response.status}`);

  const data = await response.json();
  return parseBrowseSongs(data);
}

export async function fetchNextSongs(videoId) {
  console.log(`⏭️ Fetching next songs for: ${videoId}`);
  
  // Step 1: Get radio playlist ID
  const firstPayload = {
    enablePersistentPlaylistPanel: true,
    videoId: videoId,
    isAudioOnly: true,
    context: CLIENT_CONTEXT
  };

  const firstResponse = await fetch(`${YOUTUBE_MUSIC_API}/next?prettyPrint=false`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(firstPayload)
  });

  if (!firstResponse.ok) throw new Error(`Next API error: ${firstResponse.status}`);

  const firstData = await firstResponse.json();

  // Extract radio playlist ID
  let radioPlaylistId = null;
  try {
    const contents = firstData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];

    for (const item of contents) {
      const menuItems = item?.playlistPanelVideoRenderer?.menu?.menuRenderer?.items || [];
      for (const menuItem of menuItems) {
        const navEndpoint = menuItem?.menuNavigationItemRenderer?.navigationEndpoint?.watchEndpoint;
        if (navEndpoint?.playlistId?.startsWith('RDAMVM')) {
          radioPlaylistId = navEndpoint.playlistId;
          break;
        }
      }
      if (radioPlaylistId) break;
    }
  } catch (err) {
    console.error('Error extracting radio playlist:', err);
  }

  if (!radioPlaylistId) {
    console.log('⚠️ No radio playlist found');
    return [];
  }

  // Step 2: Get queue with radio playlist
  const secondPayload = {
    enablePersistentPlaylistPanel: true,
    videoId: videoId,
    playlistId: radioPlaylistId,
    isAudioOnly: true,
    context: CLIENT_CONTEXT
  };

  const response = await fetch(`${YOUTUBE_MUSIC_API}/next?prettyPrint=false`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(secondPayload)
  });

  if (!response.ok) throw new Error(`Next API error: ${response.status}`);

  const data = await response.json();
  const queue = [];

  try {
    const panelRenderer = data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer;
    const contents = panelRenderer?.contents || [];

    for (const item of contents) {
      const renderer = item.playlistPanelVideoRenderer;
      if (!renderer || renderer.selected) continue;

      const itemVideoId = renderer.videoId;
      const title = renderer.title?.runs?.[0]?.text || '';
      const artist = renderer.longBylineText?.runs?.[0]?.text || 'Unknown Artist';
      const thumbnail = renderer.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';

      const musicVideoType = renderer.navigationEndpoint?.watchEndpoint?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType;
      const itemPlaylistId = renderer.navigationEndpoint?.watchEndpoint?.playlistId;
      const isMusic = musicVideoType || itemPlaylistId || title.length < 100;

      if (isMusic && itemVideoId && title) {
        queue.push({ id: itemVideoId, youtubeId: itemVideoId, title, artist, cover: thumbnail });
      }
    }

    console.log(`✅ Found ${queue.length} songs in queue`);
    return queue;
  } catch (parseError) {
    console.error('Error parsing queue:', parseError);
    return [];
  }
}
