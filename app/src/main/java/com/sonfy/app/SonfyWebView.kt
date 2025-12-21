package com.sonfy.app

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebSettings
import android.webkit.WebView

/**
 * Custom WebView that keeps playing audio in background.
 * 
 * The key trick is overriding onWindowVisibilityChanged to always report VISIBLE,
 * which prevents Android from pausing the WebView's media playback when the app
 * goes to background.
 * 
 * This is the same approach used by NouTube.
 */
class SonfyWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : WebView(context, attrs, defStyleAttr) {

    init {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        // Enable cookies
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(this@SonfyWebView, true)
        }
        
        // Enable focus for keyboard input
        isFocusable = true
        isFocusableInTouchMode = true
        
        // Hardware acceleration
        setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }

    /**
     * CRITICAL: Override this method to always report VISIBLE.
     * 
     * When Android detects that the app is in background, it calls this method
     * with INVISIBLE or GONE. By always calling super with VISIBLE, we trick
     * the WebView into thinking it's always visible, preventing it from pausing
     * media playback.
     */
    override fun onWindowVisibilityChanged(visibility: Int) {
        // Always report as VISIBLE to keep media playing in background
        super.onWindowVisibilityChanged(View.VISIBLE)
    }
}
