import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonfy.app',
  appName: 'Sonfy',
  webDir: 'build',
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
    webContentsDebuggingEnabled: true,
    // Keep WebView running in background
    loggingBehavior: 'debug'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    // Prevent app from being suspended
    BackgroundTask: {
      enabled: true
    }
  }
};

export default config;
