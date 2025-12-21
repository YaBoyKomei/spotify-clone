package com.sonfy.app;

import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewTreeObserver;
import android.webkit.WebView;

/**
 * Helper class to keep WebView active in background.
 * 
 * This class monitors the WebView and ensures it stays active
 * even when the app goes to background.
 */
public class WebViewBackgroundHelper {
    
    private WebView webView;
    private Handler handler;
    private boolean isEnabled = true;
    private boolean isInBackground = false;
    private Runnable keepAliveRunnable;
    
    // Interval to check and resume WebView (in milliseconds)
    private static final int KEEP_ALIVE_INTERVAL = 500;
    
    public WebViewBackgroundHelper(WebView webView) {
        this.webView = webView;
        this.handler = new Handler(Looper.getMainLooper());
        
        // Create keep-alive runnable
        keepAliveRunnable = new Runnable() {
            @Override
            public void run() {
                if (isEnabled && isInBackground && WebViewBackgroundHelper.this.webView != null) {
                    try {
                        // Resume WebView
                        WebViewBackgroundHelper.this.webView.onResume();
                        WebViewBackgroundHelper.this.webView.resumeTimers();
                        
                        // Execute a small script to keep JS context alive
                        WebViewBackgroundHelper.this.webView.evaluateJavascript(
                            "if(typeof window !== 'undefined') { window.__keepAlive = Date.now(); }",
                            null
                        );
                    } catch (Exception e) {
                        // Ignore errors
                    }
                    
                    // Schedule next check
                    handler.postDelayed(this, KEEP_ALIVE_INTERVAL);
                }
            }
        };
        
        // Add visibility listener
        setupVisibilityListener();
    }
    
    private void setupVisibilityListener() {
        if (webView == null) return;
        
        webView.getViewTreeObserver().addOnGlobalLayoutListener(
            new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    // Check if WebView is visible
                    if (webView.getVisibility() != View.VISIBLE) {
                        // WebView was hidden, resume it
                        resumeWebView();
                    }
                }
            }
        );
    }
    
    /**
     * Call this when app goes to background
     */
    public void onBackground() {
        isInBackground = true;
        
        // Start keep-alive loop
        handler.removeCallbacks(keepAliveRunnable);
        handler.post(keepAliveRunnable);
        
        // Immediately resume WebView
        resumeWebView();
    }
    
    /**
     * Call this when app comes to foreground
     */
    public void onForeground() {
        isInBackground = false;
        
        // Stop keep-alive loop
        handler.removeCallbacks(keepAliveRunnable);
        
        // Resume WebView
        resumeWebView();
    }
    
    /**
     * Resume WebView to keep it active
     */
    public void resumeWebView() {
        if (webView != null) {
            try {
                webView.onResume();
                webView.resumeTimers();
            } catch (Exception e) {
                // Ignore
            }
        }
    }
    
    /**
     * Enable or disable background playback
     */
    public void setEnabled(boolean enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            handler.removeCallbacks(keepAliveRunnable);
        }
    }
    
    /**
     * Clean up resources
     */
    public void destroy() {
        isEnabled = false;
        handler.removeCallbacks(keepAliveRunnable);
        webView = null;
    }
}
