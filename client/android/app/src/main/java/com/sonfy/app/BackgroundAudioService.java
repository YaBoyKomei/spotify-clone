package com.sonfy.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.ext.okhttp.OkHttpDataSource;
import com.google.android.exoplayer2.source.DefaultMediaSourceFactory;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultHttpDataSource;
import okhttp3.OkHttpClient;

public class BackgroundAudioService extends Service {
    private static final String TAG = "BackgroundAudioService";
    private static final String CHANNEL_ID = "SonfyAudioChannel";
    private static final int NOTIFICATION_ID = 2;
    
    public static final String ACTION_PLAY = "com.sonfy.app.PLAY";
    public static final String ACTION_PAUSE = "com.sonfy.app.PAUSE";
    public static final String ACTION_STOP = "com.sonfy.app.STOP";
    public static final String ACTION_NEXT = "com.sonfy.app.NEXT";
    public static final String ACTION_PREVIOUS = "com.sonfy.app.PREVIOUS";
    
    private ExoPlayer exoPlayer;
    private MediaSessionCompat mediaSession;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    
    private String currentTitle = "Sonfy";
    private String currentArtist = "Music Player";
    private boolean isPlaying = false;
    
    private final IBinder binder = new LocalBinder();
    
    public class LocalBinder extends Binder {
        BackgroundAudioService getService() {
            return BackgroundAudioService.this;
        }
    }
    
    private BroadcastReceiver controlReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action != null) {
                switch (action) {
                    case ACTION_PLAY:
                        play();
                        break;
                    case ACTION_PAUSE:
                        pause();
                        break;
                    case ACTION_NEXT:
                    case ACTION_PREVIOUS:
                        // Broadcast to web app
                        Intent webIntent = new Intent("MUSIC_CONTROL");
                        webIntent.putExtra("action", action);
                        sendBroadcast(webIntent);
                        break;
                }
            }
        }
    };
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        
        // Initialize ExoPlayer
        initializePlayer();
        
        // Initialize MediaSession
        initializeMediaSession();
        
        // Create notification channel
        createNotificationChannel();
        
        // Register broadcast receiver
        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_PLAY);
        filter.addAction(ACTION_PAUSE);
        filter.addAction(ACTION_NEXT);
        filter.addAction(ACTION_PREVIOUS);
        registerReceiver(controlReceiver, filter);
        
        // Start as foreground service
        startForeground(NOTIFICATION_ID, createNotification());
    }
    
    private void initializePlayer() {
        // Create OkHttp client for better YouTube support
        OkHttpClient okHttpClient = new OkHttpClient.Builder().build();
        
        DataSource.Factory dataSourceFactory = new DefaultHttpDataSource.Factory()
            .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        
        exoPlayer = new ExoPlayer.Builder(this)
            .setMediaSourceFactory(new DefaultMediaSourceFactory(this).setDataSourceFactory(dataSourceFactory))
            .build();
        
        exoPlayer.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                if (playbackState == Player.STATE_ENDED) {
                    // Notify web app that song ended
                    Intent intent = new Intent("MUSIC_CONTROL");
                    intent.putExtra("action", "ENDED");
                    sendBroadcast(intent);
                }
            }
            
            @Override
            public void onIsPlayingChanged(boolean playing) {
                isPlaying = playing;
                updateNotification();
                updateMediaSession();
            }
        });
    }
    
    private void initializeMediaSession() {
        mediaSession = new MediaSessionCompat(this, TAG);
        mediaSession.setFlags(
            MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );
        
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                play();
            }
            
            @Override
            public void onPause() {
                pause();
            }
            
            @Override
            public void onSkipToNext() {
                sendBroadcast(new Intent("MUSIC_CONTROL").putExtra("action", ACTION_NEXT));
            }
            
            @Override
            public void onSkipToPrevious() {
                sendBroadcast(new Intent("MUSIC_CONTROL").putExtra("action", ACTION_PREVIOUS));
            }
        });
        
        mediaSession.setActive(true);
    }
    
    public void loadUrl(String url) {
        if (url == null || url.isEmpty()) {
            Log.e(TAG, "Invalid URL");
            return;
        }
        
        Log.d(TAG, "Loading URL: " + url);
        
        requestAudioFocus();
        
        MediaItem mediaItem = MediaItem.fromUri(url);
        exoPlayer.setMediaItem(mediaItem);
        exoPlayer.prepare();
        exoPlayer.setPlayWhenReady(true);
    }
    
    public void play() {
        if (exoPlayer != null) {
            requestAudioFocus();
            exoPlayer.setPlayWhenReady(true);
            Log.d(TAG, "Playing");
        }
    }
    
    public void pause() {
        if (exoPlayer != null) {
            exoPlayer.setPlayWhenReady(false);
            Log.d(TAG, "Paused");
        }
    }
    
    public void stop() {
        if (exoPlayer != null) {
            exoPlayer.stop();
            abandonAudioFocus();
        }
    }
    
    public void seekTo(long position) {
        if (exoPlayer != null) {
            exoPlayer.seekTo(position);
        }
    }
    
    public long getCurrentPosition() {
        return exoPlayer != null ? exoPlayer.getCurrentPosition() : 0;
    }
    
    public long getDuration() {
        return exoPlayer != null ? exoPlayer.getDuration() : 0;
    }
    
    public boolean isPlaying() {
        return exoPlayer != null && exoPlayer.isPlaying();
    }
    
    public void updateMetadata(String title, String artist) {
        this.currentTitle = title;
        this.currentArtist = artist;
        updateNotification();
        updateMediaSession();
    }
    
    private void requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }
    
    private void abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }
    
    private void updateMediaSession() {
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            )
            .setState(
                isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                getCurrentPosition(),
                1.0f
            );
        
        mediaSession.setPlaybackState(stateBuilder.build());
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        Intent playPauseIntent = new Intent(isPlaying ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent playPausePendingIntent = PendingIntent.getBroadcast(
            this, 1, playPauseIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        Intent previousIntent = new Intent(ACTION_PREVIOUS);
        PendingIntent previousPendingIntent = PendingIntent.getBroadcast(
            this, 2, previousIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        Intent nextIntent = new Intent(ACTION_NEXT);
        PendingIntent nextPendingIntent = PendingIntent.getBroadcast(
            this, 3, nextIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(android.R.drawable.ic_media_previous, "Previous", previousPendingIntent)
            .addAction(
                isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                isPlaying ? "Pause" : "Play",
                playPausePendingIntent
            )
            .addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent)
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2))
            .build();
    }
    
    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Sonfy Audio Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Controls for music playback");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        
        try {
            unregisterReceiver(controlReceiver);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        if (exoPlayer != null) {
            exoPlayer.release();
        }
        
        if (mediaSession != null) {
            mediaSession.release();
        }
        
        abandonAudioFocus();
        stopForeground(true);
    }
}
