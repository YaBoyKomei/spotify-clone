// Native Audio Player Plugin with YouTube Proxy
import { registerPlugin } from '@capacitor/core';
import { getApiUrl } from '../config';

const NativeAudioPlugin = registerPlugin('NativeAudio');

const NativeAudio = {
  // Load YouTube video as audio
  async loadYouTubeAudio(videoId, title, artist) {
    try {
      console.log('🎵 Loading YouTube audio:', videoId);
      
      // Get audio URL from proxy server
      const response = await fetch(getApiUrl(`/api/audio/${videoId}`));
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('No audio URL received');
      }
      
      console.log('✅ Got audio URL, loading in native player');
      
      // Load in native player
      await NativeAudioPlugin.loadAudio({
        url: data.url,
        title: title || data.title,
        artist: artist || data.artist
      });
      
      return data;
    } catch (error) {
      console.error('❌ Error loading YouTube audio:', error);
      throw error;
    }
  },

  // Direct methods
  async play() {
    return NativeAudioPlugin.play();
  },

  async pause() {
    return NativeAudioPlugin.pause();
  },

  async stop() {
    return NativeAudioPlugin.stop();
  },

  async isPlaying() {
    return NativeAudioPlugin.isPlaying();
  },

  async getCurrentPosition() {
    return NativeAudioPlugin.getCurrentPosition();
  },

  async getDuration() {
    return NativeAudioPlugin.getDuration();
  },

  async seekTo(position) {
    return NativeAudioPlugin.seekTo({ position });
  }
};

export default NativeAudio;

// Usage example:
// import NativeAudio from './plugins/NativeAudio';
//
// // Load YouTube video as audio
// await NativeAudio.loadYouTubeAudio('dQw4w9WgXcQ', 'Song Title', 'Artist Name');
//
// // Play
// await NativeAudio.play();
//
// // Pause
// await NativeAudio.pause();
//
// // Get current position
// const { position } = await NativeAudio.getCurrentPosition();
//
// // Seek
// await NativeAudio.seekTo(30000); // 30 seconds
