import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonfy.app',
  appName: 'Sonfy',
  webDir: 'build',
  server: {
    // Load YouTube Music directly
    url: 'https://music.youtube.com',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
