// Background Mode Plugin for Capacitor
import { Capacitor } from '@capacitor/core';

export const BackgroundMode = {
  enable: () => {
    if (Capacitor.isNativePlatform()) {
      console.log('🎵 Background mode enabled');
      // Service is automatically started by MainActivity
      return Promise.resolve();
    }
    return Promise.resolve();
  },

  disable: () => {
    if (Capacitor.isNativePlatform()) {
      console.log('🎵 Background mode disabled');
      // Service will be stopped when app is destroyed
      return Promise.resolve();
    }
    return Promise.resolve();
  },

  isEnabled: () => {
    return Promise.resolve(Capacitor.isNativePlatform());
  }
};
