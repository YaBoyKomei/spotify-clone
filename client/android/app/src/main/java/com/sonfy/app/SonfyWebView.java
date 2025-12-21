package com.sonfy.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * Custom WebView that keeps playing audio in background.
 * The key trick is overriding onWindowVisibilityChanged to always report VISIBLE,
 * which prevents Android from pausing the WebView's media playback.
 */
public class SonfyWebView extends WebView {

    public SonfyWebView(Context context) {
        super(context);
        init();
    }

    public SonfyWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public SonfyWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        WebSettings settings = getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        
        // Enable cookies
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(this, true);
        
        // Enable focus for keyboard input
        setFocusable(true);
        setFocusableInTouchMode(true);
        
        // Hardware acceleration for better performance
        setLayerType(View.LAYER_TYPE_HARDWARE, null);
    }

    /**
     * CRITICAL: Override this method to always report VISIBLE.
     * This prevents Android from pausing the WebView's media playback
     * when the app goes to background.
     */
    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        // Always call super with VISIBLE to keep WebView active
        super.onWindowVisibilityChanged(View.VISIBLE);
    }
}
