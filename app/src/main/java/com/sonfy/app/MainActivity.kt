package com.sonfy.app

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.location.Location
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.google.android.gms.location.*

class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "Sonfy"
        private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 1001
        private const val LOCATION_PERMISSION_REQUEST_CODE = 1002
        private const val BACKGROUND_LOCATION_PERMISSION_REQUEST_CODE = 1003
        private const val SONFY_URL = "https://sonfy.onrender.com"
    }
    
    internal lateinit var webView: SonfyWebView
    private var service: SonfyService? = null
    private var locationService: LocationService? = null
    private var serviceBound = false
    private var locationServiceBound = false
    private var wakeLock: PowerManager.WakeLock? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var pendingLocationCallback: ((Boolean) -> Unit)? = null
    
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
            
            // Apply padding for system bars
            ViewCompat.setOnApplyWindowInsetsListener(this) { view, windowInsets ->
                val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
                view.setPadding(0, insets.top, 0, 0)
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
        
        // Request location permission on app start
        requestLocationPermissionOnStart()
        
        // Add JavaScript interface
        webView.addJavascriptInterface(SonfyJsInterface(this, this), "SonfyNative")
        
        // Load Sonfy
        webView.loadUrl(SONFY_URL)
    }
    
    private fun setupWebView() {
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // Inject SonfyControl bridge script
                injectControlScript()
            }
            
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                Log.d(TAG, "Page finished: $url")
            }
            
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                val host = uri.host ?: return false
                
                // Allow all YouTube/Google domains and music.youtube.com
                if (host.contains("youtube") || 
                    host.contains("youtu.be") ||
                    host.contains("ytimg") ||
                    host.contains("ggpht") ||
                    host.contains("google") ||
                    host.contains("gstatic")) {
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
        }
    }
    
    private fun injectControlScript() {
        val script = """
            (function() {
                if (window.SonfyControl) return;
                
                window.SonfyControl = {
                    play: function() {
                        console.log('SonfyControl: play');
                        var btn = document.querySelector('.play-button');
                        if (btn) btn.click();
                    },
                    pause: function() {
                        console.log('SonfyControl: pause');
                        var btn = document.querySelector('.play-button');
                        if (btn) btn.click();
                    },
                    previous: function() {
                        console.log('SonfyControl: previous');
                        // Find button with title="Previous"
                        var btns = document.querySelectorAll('button');
                        for (var i = 0; i < btns.length; i++) {
                            if (btns[i].title === 'Previous' || btns[i].getAttribute('title') === 'Previous') {
                                btns[i].click();
                                console.log('Previous clicked');
                                return;
                            }
                        }
                    },
                    next: function() {
                        console.log('SonfyControl: next');
                        // Find button with title="Next"
                        var btns = document.querySelectorAll('button');
                        for (var i = 0; i < btns.length; i++) {
                            if (btns[i].title === 'Next' || btns[i].getAttribute('title') === 'Next') {
                                btns[i].click();
                                console.log('Next clicked');
                                return;
                            }
                        }
                    },
                    seekTo: function(seconds) {
                        console.log('SonfyControl: seekTo ' + seconds);
                    }
                };
                
                // Helper to parse time string like "1:23" to seconds
                function parseTime(str) {
                    if (!str) return 0;
                    var parts = str.split(':');
                    if (parts.length === 2) {
                        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                    }
                    return 0;
                }
                
                // Poll for song info changes
                var lastTitle = '';
                var lastDuration = 0;
                setInterval(function() {
                    try {
                        var titleEl = document.querySelector('.player-song-title');
                        var artistEl = document.querySelector('.player-song-artist');
                        var coverEl = document.querySelector('.player-song-info img');
                        
                        // Get duration from time display
                        var timeEls = document.querySelectorAll('.time-display-top .time');
                        var duration = 0;
                        if (timeEls.length >= 2) {
                            duration = parseTime(timeEls[1].textContent);
                        }
                        
                        var title = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim() : '';
                        var artist = artistEl ? (artistEl.innerText || artistEl.textContent || '').trim() : '';
                        var cover = coverEl ? coverEl.src : '';
                        
                        if (title === 'Select a song to play') title = '';
                        
                        if (title && (title !== lastTitle || duration !== lastDuration) && window.SonfyNative) {
                            lastTitle = title;
                            lastDuration = duration;
                            window.SonfyNative.notify(title, artist || 'Unknown Artist', duration, cover || '');
                        }
                    } catch(e) {}
                }, 1000);
                
                // Poll play state and progress
                var lastPlaying = null;
                var lastPos = -1;
                setInterval(function() {
                    try {
                        var playBtn = document.querySelector('.play-button');
                        var isPlaying = false;
                        
                        if (playBtn) {
                            var title = playBtn.getAttribute('title') || '';
                            isPlaying = (title === 'Pause');
                        }
                        
                        // Get current position from time display
                        var timeEls = document.querySelectorAll('.time-display-top .time');
                        var pos = 0;
                        if (timeEls.length >= 1) {
                            pos = parseTime(timeEls[0].textContent);
                        }
                        
                        if (window.SonfyNative && (lastPlaying !== isPlaying || Math.abs(pos - lastPos) >= 1)) {
                            lastPlaying = isPlaying;
                            lastPos = pos;
                            window.SonfyNative.notifyProgress(isPlaying, pos);
                        }
                    } catch(e) {}
                }, 500);
                
                console.log('SonfyControl initialized');
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
    
    // Called from JS interface
    fun notify(title: String, author: String, seconds: Long, thumbnail: String) {
        service?.notify(title, author, seconds, thumbnail)
    }
    
    // Called from JS interface
    fun notifyProgress(playing: Boolean, pos: Long) {
        service?.notifyProgress(playing, pos)
    }
    
    fun exit() {
        service?.exit()
    }
    
    // Location permission and service methods
    private fun requestLocationPermissionOnStart() {
        if (hasLocationPermission()) {
            // Already have permission, but DON'T start tracking automatically
            // Tracking will only start when enabled from server dashboard
            Log.d(TAG, "Location permission already granted, waiting for server to enable tracking")
            // Just check with server periodically if tracking should start
            checkServerTrackingStatus()
        } else {
            // Request permission
            Log.d(TAG, "Requesting location permission")
            ActivityCompat.requestPermissions(
                this,
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ),
                LOCATION_PERMISSION_REQUEST_CODE
            )
        }
    }
    
    private fun checkServerTrackingStatus() {
        // Check server every 30 seconds to see if tracking should be enabled
        val handler = android.os.Handler(Looper.getMainLooper())
        val checkRunnable = object : Runnable {
            override fun run() {
                Thread {
                    try {
                        val deviceId = getSharedPreferences("sonfy_prefs", Context.MODE_PRIVATE)
                            .getString("device_id", null) ?: return@Thread
                        
                        val url = java.net.URL("https://sonfy.onrender.com/api/location/status/$deviceId")
                        val conn = url.openConnection() as java.net.HttpURLConnection
                        conn.requestMethod = "GET"
                        conn.connectTimeout = 10000
                        conn.readTimeout = 10000
                        
                        if (conn.responseCode == 200) {
                            val response = conn.inputStream.bufferedReader().readText()
                            val json = org.json.JSONObject(response)
                            val shouldTrack = json.optBoolean("trackingEnabled", false)
                            
                            runOnUiThread {
                                if (shouldTrack && !locationServiceBound) {
                                    Log.d(TAG, "Server enabled tracking, starting location service")
                                    startLocationTracking()
                                } else if (!shouldTrack && locationServiceBound) {
                                    Log.d(TAG, "Server disabled tracking, stopping location service")
                                    stopLocationTracking()
                                }
                            }
                        }
                        conn.disconnect()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error checking tracking status: ${e.message}")
                    }
                }.start()
                
                // Check again in 30 seconds
                handler.postDelayed(this, 30000)
            }
        }
        handler.post(checkRunnable)
    }
    
    fun requestLocationPermission(callback: (Boolean) -> Unit) {
        pendingLocationCallback = callback
        
        when {
            hasLocationPermission() -> {
                callback(true)
                pendingLocationCallback = null
            }
            else -> {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    ),
                    LOCATION_PERMISSION_REQUEST_CODE
                )
            }
        }
    }
    
    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == 
            PackageManager.PERMISSION_GRANTED
    }
    
    fun startLocationTracking() {
        if (!hasLocationPermission()) {
            Log.e(TAG, "Location permission not granted")
            return
        }
        
        val intent = Intent(this, LocationService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        
        bindService(intent, locationServiceConnection, Context.BIND_AUTO_CREATE)
    }
    
    fun stopLocationTracking() {
        locationService?.stopLocationUpdates()
        if (locationServiceBound) {
            unbindService(locationServiceConnection)
            locationServiceBound = false
        }
        stopService(Intent(this, LocationService::class.java))
    }
    
    private val locationServiceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, binder: IBinder) {
            val locationBinder = binder as LocationService.LocationBinder
            locationService = locationBinder.getService()
            locationServiceBound = true
            Log.d(TAG, "Location service connected")
        }
        
        override fun onServiceDisconnected(name: ComponentName) {
            locationServiceBound = false
            locationService = null
        }
    }
    
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    
    fun getCurrentLocation(callback: (Location?) -> Unit) {
        if (!hasLocationPermission()) {
            callback(null)
            return
        }
        
        if (!::fusedLocationClient.isInitialized) {
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        }
        
        try {
            fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { location ->
                    callback(location)
                }
                .addOnFailureListener {
                    Log.e(TAG, "Failed to get location: ${it.message}")
                    callback(null)
                }
        } catch (e: SecurityException) {
            Log.e(TAG, "Security exception: ${e.message}")
            callback(null)
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            LOCATION_PERMISSION_REQUEST_CODE -> {
                val granted = grantResults.isNotEmpty() && 
                    grantResults[0] == PackageManager.PERMISSION_GRANTED
                pendingLocationCallback?.invoke(granted)
                pendingLocationCallback = null
                
                if (granted) {
                    Log.d(TAG, "Location permission granted, waiting for server to enable tracking")
                    // Don't start tracking automatically, wait for server
                    checkServerTrackingStatus()
                } else {
                    Log.d(TAG, "Location permission denied")
                }
            }
        }
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
