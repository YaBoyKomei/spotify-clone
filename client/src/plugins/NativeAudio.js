// Native Audio Player Plugin
import { registerPlugin } from '@capacitor/core';

const NativeAudio = registerPlugin('NativeAudio');

export default NativeAudio;

// Usage example:
// import NativeAudio from './plugins/NativeAudio';
//
// // Load audio
// await NativeAudio.loadAudio({
//   url: 'https://example.com/song.mp3',
//   title: 'Song Title',
//   artist: 'Artist Name'
// });
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
// await NativeAudio.seekTo({ position: 30000 }); // 30 seconds
