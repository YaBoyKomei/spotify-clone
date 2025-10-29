import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonfy.app',
  appName: 'Sonfy',
  webDir: 'build',
  server: {
    // For production, use your deployed API
    url: 'https://sonfy.onrender.com',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000'
  }
};

export default config;
