package com.sonfy.app

import android.Manifest
import android.app.Dialog
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ImageButton
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "Sonfy"
        private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 1001
        private const val SONFY_URL = "https://sonfy.onrender.com"
    }
    
    internal lateinit var webView: SonfyWebView
    private var service: SonfyService? = null
    private var serviceBound = false
    private var wakeLock: PowerManager.WakeLock? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var authDialog: Dialog? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable edge-to-edge but keep status bar visible
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // Set status bar color to match app theme (dark)
        window.statusBarColor = Color.parseColor("#121212")
        window.navigationBarColor = Color.parseColor("#121212")
        
        // Make status bar icons light (for dark background)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Create WebView
        webView = SonfyWebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        
        // Setup WebView
        setupWebView()
        
        // Set content view with proper insets handling
        val container = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#121212"))
            addView(webView)
            
            // Apply padding for system bars (top and bottom)
            ViewCompat.setOnApplyWindowInsetsListener(this) { view, windowInsets ->
                val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
                view.setPadding(0, insets.top, 0, insets.bottom)
                windowInsets
            }
        }
        setContentView(container)
        
        // Initialize service
        initService()
        
        // Handle back button
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    moveTaskToBack(true)
                }
            }
        })
        
        // Setup audio focus
        setupAudioFocus()
        
        // Acquire wake lock
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Sonfy::MusicPlayback"
        )
        wakeLock?.acquire()
        
        // Request notification permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_REQUEST_CODE
                )
            }
        }
        
        // Add JavaScript interface
        webView.addJavascriptInterface(SonfyJsInterface(this, this), "SonfyNative")
        
        // Load Sonfy
        webView.loadUrl(SONFY_URL)
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Don't reload - just bring the activity to front
        // The WebView state is preserved
        Log.d(TAG, "onNewIntent called - keeping WebView state")
    }

    private fun setupWebView() {
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                injectControlScript()
            }
            
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                Log.d(TAG, "Page finished: $url")
            }
            
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                val url = uri.toString()
                val host = uri.host ?: return false
                
                // Open Google OAuth in a dialog WebView
                if (host.contains("accounts.google.com") || 
                    url.contains("oauth2/v2/auth")) {
                    Log.d(TAG, "Opening OAuth in dialog: $url")
                    showAuthDialog(url)
                    return true
                }
                
                // Allow YouTube and Google domains in WebView
                if (host.contains("youtube") || 
                    host.contains("youtu.be") ||
                    host.contains("ytimg") ||
                    host.contains("ggpht") ||
                    host.contains("google") ||
                    host.contains("gstatic") ||
                    host.contains("sonfy") ||
                    host.contains("onrender.com")) {
                    return false
                }
                
                startActivity(Intent(Intent.ACTION_VIEW, uri))
                return true
            }
        }
        
        webView.webChromeClient = object : WebChromeClient() {
            private var customView: View? = null
            private var customViewCallback: CustomViewCallback? = null
            
            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                customView = view
                customViewCallback = callback
                
                val decorView = window.decorView as FrameLayout
                decorView.addView(view, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ))
                
                WindowCompat.getInsetsController(window, decorView).apply {
                    hide(WindowInsetsCompat.Type.systemBars())
                    systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            }
            
            override fun onHideCustomView() {
                customView?.let { view ->
                    val decorView = window.decorView as FrameLayout
                    decorView.removeView(view)
                    customViewCallback?.onCustomViewHidden()
                    
                    WindowCompat.getInsetsController(window, decorView).apply {
                        show(WindowInsetsCompat.Type.systemBars())
                    }
                }
                customView = null
                customViewCallback = null
            }
            
            // Support window.open() for OAuth popups
            override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message?): Boolean {
                // Get the URL from the message
                val href = view?.handler?.obtainMessage()
                view?.requestFocusNodeHref(href)
                val url = href?.data?.getString("url") ?: ""
                
                if (url.contains("accounts.google.com") || url.contains("oauth")) {
                    showAuthDialog(url)
                    return false
                }
                
                val newWebView = WebView(this@MainActivity)
                newWebView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                        val reqUrl = request.url.toString()
                        Log.d(TAG, "Popup URL: $reqUrl")
                        if (reqUrl.contains("accounts.google.com") || reqUrl.contains("oauth")) {
                            showAuthDialog(reqUrl)
                            return true
                        }
                        return false
                    }
                }
                val transport = resultMsg?.obj as? WebView.WebViewTransport
                transport?.webView = newWebView
                resultMsg?.sendToTarget()
                return true
            }
        }
    }
    
    private fun showAuthDialog(url: String) {
        Log.d(TAG, "Showing auth dialog for: $url")
        
        authDialog?.dismiss()
        
        val dialog = Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        authDialog = dialog
        
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
        }
        
        // Close button bar
        val toolbar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(Color.parseColor("#4285F4"))
            setPadding(16, 8, 16, 8)
        }
        
        val closeButton = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.WHITE)
            setOnClickListener {
                dialog.dismiss()
                authDialog = null
            }
        }
        toolbar.addView(closeButton)
        container.addView(toolbar)
        
        // Auth WebView
        val authWebView = WebView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }
        }
        
        // Enable cookies
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(authWebView, true)
        }
        
        authWebView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                Log.d(TAG, "Auth page finished: $url")
                
                // Check if we've been redirected back to Sonfy with token
                // The token is in the URL fragment (after #)
                if (url.startsWith(SONFY_URL)) {
                    Log.d(TAG, "OAuth redirect to Sonfy detected, checking for token...")
                    
                    // Use JavaScript to get the full URL including fragment
                    view.evaluateJavascript(
                        "(function() { return window.location.href; })()"
                    ) { result ->
                        val fullUrl = result?.trim('"') ?: url
                        Log.d(TAG, "Full URL with fragment: $fullUrl")
                        
                        if (fullUrl.contains("access_token")) {
                            Log.d(TAG, "OAuth success! Token found, redirecting to main WebView")
                            runOnUiThread {
                                dialog.dismiss()
                                authDialog = null
                                webView.loadUrl(fullUrl)
                            }
                        } else if (!fullUrl.contains("accounts.google.com")) {
                            // Redirected back without token (cancelled or error)
                            Log.d(TAG, "OAuth redirect back to Sonfy without token")
                            runOnUiThread {
                                dialog.dismiss()
                                authDialog = null
                                webView.reload()
                            }
                        }
                    }
                }
            }
            
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val reqUrl = request.url.toString()
                Log.d(TAG, "Auth WebView loading: $reqUrl")
                
                // Allow all URLs in auth WebView - don't override
                return false
            }
        }
        
        container.addView(authWebView)
        dialog.setContentView(container)
        dialog.show()
        
        authWebView.loadUrl(url)
    }
    
    private fun injectControlScript() {
        val script = """
            (function() {
                if (window.SonfyControl) return;
                
                window.SonfyControl = {
                    play: function() {
                        var btn = document.querySelector('.play-button');
                        if (btn) btn.click();
                    },
                    pause: function() {
                        var btn = document.querySelector('.play-button');
                        if (btn) btn.click();
                    },
                    previous: function() {
                        var btns = document.querySelectorAll('button');
                        for (var i = 0; i < btns.length; i++) {
                            if (btns[i].title === 'Previous' || btns[i].getAttribute('title') === 'Previous') {
                                btns[i].click();
                                return;
                            }
                        }
                    },
                    next: function() {
                        var btns = document.querySelectorAll('button');
                        for (var i = 0; i < btns.length; i++) {
                            if (btns[i].title === 'Next' || btns[i].getAttribute('title') === 'Next') {
                                btns[i].click();
                                return;
                            }
                        }
                    }
                };
                
                function parseTime(str) {
                    if (!str) return 0;
                    var parts = str.split(':');
                    if (parts.length === 2) {
                        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                    }
                    return 0;
                }
                
                var lastTitle = '';
                var lastDuration = 0;
                setInterval(function() {
                    try {
                        var titleEl = document.querySelector('.player-song-title');
                        var artistEl = document.querySelector('.player-song-artist');
                        var coverEl = document.querySelector('.player-song-info img');
                        var timeEls = document.querySelectorAll('.time-display-top .time');
                        var duration = timeEls.length >= 2 ? parseTime(timeEls[1].textContent) : 0;
                        
                        var title = titleEl ? (titleEl.innerText || '').trim() : '';
                        var artist = artistEl ? (artistEl.innerText || '').trim() : '';
                        var cover = coverEl ? coverEl.src : '';
                        
                        if (title === 'Select a song to play') title = '';
                        
                        if (title && (title !== lastTitle || duration !== lastDuration) && window.SonfyNative) {
                            lastTitle = title;
                            lastDuration = duration;
                            window.SonfyNative.notify(title, artist || 'Unknown Artist', duration, cover || '');
                        }
                    } catch(e) {}
                }, 1000);
                
                var lastPlaying = null;
                var lastPos = -1;
                setInterval(function() {
                    try {
                        var playBtn = document.querySelector('.play-button');
                        var isPlaying = playBtn ? (playBtn.getAttribute('title') === 'Pause') : false;
                        var timeEls = document.querySelectorAll('.time-display-top .time');
                        var pos = timeEls.length >= 1 ? parseTime(timeEls[0].textContent) : 0;
                        
                        if (window.SonfyNative && (lastPlaying !== isPlaying || Math.abs(pos - lastPos) >= 1)) {
                            lastPlaying = isPlaying;
                            lastPos = pos;
                            window.SonfyNative.notifyProgress(isPlaying, pos);
                        }
                    } catch(e) {}
                }, 500);
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(script, null)
    }
    
    private fun initService() {
        val connection = object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName, binder: IBinder) {
                val sonfyBinder = binder as SonfyService.SonfyBinder
                service = sonfyBinder.getService()
                service?.initialize(webView, this@MainActivity)
                serviceBound = true
                Log.d(TAG, "Service connected")
            }

            override fun onServiceDisconnected(name: ComponentName) {
                serviceBound = false
                service = null
            }
        }
        val intent = Intent(this, SonfyService::class.java)
        bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }
    
    private fun setupAudioFocus() {
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            
            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener { }
                .build()
            
            audioManager?.requestAudioFocus(audioFocusRequest!!)
        }
    }
    
    fun notify(title: String, author: String, seconds: Long, thumbnail: String) {
        service?.notify(title, author, seconds, thumbnail)
    }
    
    fun notifyProgress(playing: Boolean, pos: Long) {
        service?.notifyProgress(playing, pos)
    }
    
    fun exit() {
        service?.exit()
    }
    
    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.resumeTimers()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { audioManager?.abandonAudioFocusRequest(it) }
        }
        
        service?.exit()
    }
}
