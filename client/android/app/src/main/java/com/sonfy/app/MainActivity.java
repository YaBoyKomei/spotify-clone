package com.sonfy.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable background audio
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Start foreground service when app is active
        Intent serviceIntent = new Intent(this, MusicService.class);
        startForegroundService(serviceIntent);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Keep service running when app goes to background
        // Service will be stopped when music actually stops
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Stop service when app is destroyed
        Intent serviceIntent = new Intent(this, MusicService.class);
        stopService(serviceIntent);
    }
}
