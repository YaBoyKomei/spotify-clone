package com.sonfy.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.webkit.WebView;

/**
 * Custom WebView that keeps playing audio in background.
 * 
 * The key trick is overriding onWindowVisibilityChanged to always report VISIBLE,
 * which prevents Android from pausing the WebView's media playback when the app
 * goes to background.
 * 
 * This is the same approach used by NouTube and other YouTube background players.
 */
public class BackgroundWebView extends WebView {

    public BackgroundWebView(Context context) {
        super(context);
        init();
    }

    public BackgroundWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public BackgroundWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        // Enable JavaScript and media playback
        getSettings().setJavaScriptEnabled(true);
        getSettings().setDomStorageEnabled(true);
        getSettings().setMediaPlaybackRequiresUserGesture(false);
        getSettings().setDatabaseEnabled(true);
        
        // Enable focus
        setFocusable(true);
        setFocusableInTouchMode(true);
        
        // Hardware acceleration
        setLayerType(View.LAYER_TYPE_HARDWARE, null);
    }

    /**
     * CRITICAL: Override this method to always report VISIBLE.
     * 
     * When Android detects that the app is in background, it calls this method
     * with INVISIBLE or GONE. By always calling super with VISIBLE, we trick
     * the WebView into thinking it's always visible, preventing it from pausing
     * media playback.
     */
    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        // Always report as VISIBLE to keep media playing
        super.onWindowVisibilityChanged(View.VISIBLE);
    }
}
