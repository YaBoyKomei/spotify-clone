package com.sonfy.app;

import android.content.Context;
import android.os.Bundle;
import android.util.AttributeSet;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import java.lang.reflect.Field;

/**
 * Custom BridgeActivity that modifies WebView behavior for background playback.
 * The key is to prevent the WebView from being paused when the app goes to background.
 */
public class SonfyBridgeActivity extends BridgeActivity {
    
    private boolean keepWebViewActive = true;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // After bridge is created, modify the WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Ensure media can play without user gesture
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            android.util.Log.d("Sonfy", "WebView configured in SonfyBridgeActivity");
        }
    }
    
    /**
     * Override onPause to prevent WebView from pausing
     */
    @Override
    public void onPause() {
        if (keepWebViewActive) {
            // Get the WebView before calling super
            final WebView webView = getBridge().getWebView();
            
            // Call super which will pause the WebView
            super.onPause();
            
            // Immediately resume the WebView
            if (webView != null) {
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        webView.onResume();
                        webView.resumeTimers();
                        android.util.Log.d("Sonfy", "WebView resumed after pause");
                    }
                });
            }
        } else {
            super.onPause();
        }
    }
    
    /**
     * Override onStop to prevent WebView from stopping
     */
    @Override
    public void onStop() {
        if (keepWebViewActive) {
            final WebView webView = getBridge().getWebView();
            
            super.onStop();
            
            if (webView != null) {
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        webView.onResume();
                        webView.resumeTimers();
                        android.util.Log.d("Sonfy", "WebView resumed after stop");
                    }
                });
            }
        } else {
            super.onStop();
        }
    }
    
    public void setKeepWebViewActive(boolean keep) {
        this.keepWebViewActive = keep;
    }
}
