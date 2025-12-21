package com.sonfy.app;

import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final int NOTIFICATION_PERMISSION_REQUEST_CODE = 1001;
    private PowerManager.WakeLock wakeLock;
    private MusicService musicService;
    private boolean serviceBound = false;
    private WebView webView;
    private Handler handler = new Handler(Looper.getMainLooper());
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean isInBackground = false;
    private Runnable keepAliveRunnable;
    
    private ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            MusicService.MusicBinder musicBinder = (MusicService.MusicBinder) binder;
            musicService = musicBinder.getService();
            serviceBound = true;
            
            if (webView != null) {
                musicService.setWebView(webView);
            }
            android.util.Log.d("Sonfy", "MusicService connected");
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            serviceBound = false;
            musicService = null;
        }
    };
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MusicControlPlugin.class);
        super.onCreate(savedInstanceState);
        
        // Get Capacitor's WebView - don't replace it
        webView = getBridge().getWebView();
        
        if (webView != null) {
            // Configure WebView for background playback
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setDatabaseEnabled(true);
            webView.getSettings().setJavaScriptEnabled(true);
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            // Add JavaScript interface
            webView.addJavascriptInterface(new SonfyJsInterface(this), "SonfyNative");
            
            android.util.Log.d("Sonfy", "WebView configured for background playback");
        }
        
        // Setup keep-alive runnable that continuously resumes WebView
        keepAliveRunnable = new Runnable() {
            @Override
            public void run() {
                if (isInBackground && webView != null) {
                    try {
                        webView.onResume();
                        webView.resumeTimers();
                    } catch (Exception e) {
                        // Ignore
                    }
                    // Run every 200ms while in background
                    handler.postDelayed(this, 200);
                }
            }
        };
        
        // Setup audio focus
        setupAudioFocus();
        
        // Acquire wake lock
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Sonfy::MusicPlayback"
        );
        wakeLock.acquire();
        
        requestNotificationPermission();
    }
    
    private void setupAudioFocus() {
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
            
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(focusChange -> {
                    android.util.Log.d("Sonfy", "Audio focus changed: " + focusChange);
                })
                .build();
            
            audioManager.requestAudioFocus(audioFocusRequest);
        }
    }
    
    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIFICATION_PERMISSION_REQUEST_CODE
                );
            } else {
                startAndBindService();
            }
        } else {
            startAndBindService();
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == NOTIFICATION_PERMISSION_REQUEST_CODE) {
            startAndBindService();
        }
    }
    
    private void startAndBindService() {
        try {
            Intent serviceIntent = new Intent(this, MusicService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE);
        } catch (Exception e) {
            android.util.Log.e("Sonfy", "Error starting service: " + e.getMessage());
        }
    }
    
    public class SonfyJsInterface {
        private MainActivity activity;
        
        public SonfyJsInterface(MainActivity activity) {
            this.activity = activity;
        }
        
        @JavascriptInterface
        public void notify(String title, String artist, long duration, String thumbnail) {
            android.util.Log.d("Sonfy", "JS notify: " + title + " by " + artist);
            if (musicService != null) {
                musicService.notify(title, artist, duration, thumbnail);
            }
        }
        
        @JavascriptInterface
        public void notifyProgress(boolean playing, long position) {
            if (musicService != null) {
                musicService.notifyProgress(playing, position);
            }
        }
        
        @JavascriptInterface
        public void log(String message) {
            android.util.Log.d("SonfyJS", message);
        }
    }
    
    public MusicService getMusicService() {
        return musicService;
    }

    @Override
    public void onResume() {
        super.onResume();
        isInBackground = false;
        
        // Stop keep-alive loop
        handler.removeCallbacks(keepAliveRunnable);
        
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
        
        android.util.Log.d("Sonfy", "App resumed");
    }

    @Override
    public void onPause() {
        android.util.Log.d("Sonfy", "App pausing - starting background keep-alive");
        isInBackground = true;
        
        // Start keep-alive loop BEFORE super.onPause()
        handler.post(keepAliveRunnable);
        
        super.onPause();
        
        // Also post immediate resumes after Capacitor pauses
        if (webView != null) {
            handler.postDelayed(() -> {
                if (webView != null && isInBackground) {
                    webView.onResume();
                    webView.resumeTimers();
                }
            }, 50);
        }
    }

    @Override
    public void onStop() {
        android.util.Log.d("Sonfy", "App stopping");
        super.onStop();
        
        // Resume WebView after stop
        if (webView != null && isInBackground) {
            handler.postDelayed(() -> {
                if (webView != null && isInBackground) {
                    webView.onResume();
                    webView.resumeTimers();
                }
            }, 50);
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        isInBackground = false;
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        }
        
        if (serviceBound) {
            unbindService(serviceConnection);
            serviceBound = false;
        }
        
        Intent serviceIntent = new Intent(this, MusicService.class);
        stopService(serviceIntent);
        
        super.onDestroy();
    }
}
