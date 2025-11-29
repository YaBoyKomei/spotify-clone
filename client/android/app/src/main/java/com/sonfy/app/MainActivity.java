package com.sonfy.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView to act like a browser for YouTube Music
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable all browser features
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            
            // Set user agent to desktop Chrome for better compatibility
            settings.setUserAgentString(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );
            
            // Enable caching
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setAppCacheEnabled(true);
            
            // Allow mixed content
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                
                // Enable cookies
                CookieManager.getInstance().setAcceptCookie(true);
                CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
            }
            
            // Hardware acceleration for better performance
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
            
            // Set WebView clients
            webView.setWebViewClient(new WebViewClient());
            webView.setWebChromeClient(new WebChromeClient());
            
            // Keep WebView alive in background
            webView.setKeepScreenOn(false);
        }
        
        // Start foreground service for background playback
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
        
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        
        // DON'T pause WebView - keep it running for background playback
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Keep running in background
            // webView.onPause(); // DON'T call this
            // webView.pauseTimers(); // DON'T call this
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // Keep WebView active even when app is stopped
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        
        Intent serviceIntent = new Intent(this, MusicService.class);
        stopService(serviceIntent);
    }
    
    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
