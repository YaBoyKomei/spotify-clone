import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonfy.app',
  appName: 'Sonfy',
  webDir: 'build',
  // Remove server.url to load app locally
  // API calls will go to the server defined in the React app
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000'
  }
};

export default config;
