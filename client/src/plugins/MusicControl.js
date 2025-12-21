import { registerPlugin } from '@capacitor/core';

const MusicControl = registerPlugin('MusicControl');

// Add notifyProgress method if not available
if (!MusicControl.notifyProgress) {
  MusicControl.notifyProgress = async (options) => {
    // Fallback - do nothing if method doesn't exist
    return Promise.resolve();
  };
}

export default MusicControl;
