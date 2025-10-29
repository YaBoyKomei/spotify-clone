package com.sonfy.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView for background audio
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable background audio
            settings.setMediaPlaybackRequiresUserGesture(false);
            
            // Enable JavaScript (should already be enabled)
            settings.setJavaScriptEnabled(true);
            
            // Enable DOM storage
            settings.setDomStorageEnabled(true);
            
            // Allow mixed content (HTTP and HTTPS)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
            
            // Keep WebView alive in background
            webView.setKeepScreenOn(false); // Don't force screen on
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        }
        
        // Start foreground service immediately
        Intent serviceIntent = new Intent(this, MusicService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        
        // Resume WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        
        // DON'T pause WebView - keep it running for background audio
        // Normally you would call webView.onPause() here, but we skip it
        // to allow background playback
        
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Keep timers running for background playback
            // webView.pauseTimers(); // DON'T call this
            // webView.onPause(); // DON'T call this
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        
        // Stop service when app is destroyed
        Intent serviceIntent = new Intent(this, MusicService.class);
        stopService(serviceIntent);
    }
}
