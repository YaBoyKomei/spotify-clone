package com.sonfy.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.webkit.WebView;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;
import androidx.media.session.MediaButtonReceiver;
import java.io.InputStream;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MusicService extends Service {
    private static final String CHANNEL_ID = "SonfyMusicChannel";
    private static final int NOTIFICATION_ID = 777;
    
    private final IBinder binder = new MusicBinder();
    private MediaSessionCompat mediaSession;
    private NotificationManager notificationManager;
    private PlaybackStateCompat.Builder stateBuilder;
    private WebView webView;
    private Handler mainHandler;
    private ExecutorService executor;
    
    private String currentTitle = "Sonfy";
    private String currentArtist = "Ready to play music";
    private boolean isPlaying = false;
    private long currentPosition = 0;
    private long duration = 0;
    
    public class MusicBinder extends Binder {
        public MusicService getService() {
            return MusicService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mainHandler = new Handler(Looper.getMainLooper());
        executor = Executors.newSingleThreadExecutor();
        createNotificationChannel();
        initMediaSession();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            MediaButtonReceiver.handleIntent(mediaSession, intent);
            
            // Handle song info updates
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");
            String thumbnail = intent.getStringExtra("thumbnail");
            long dur = intent.getLongExtra("duration", 0);
            
            if (title != null && !title.isEmpty()) {
                notify(title, artist != null ? artist : "", dur, thumbnail != null ? thumbnail : "");
            }
            
            // Handle playing state
            if (intent.hasExtra("isPlaying")) {
                boolean playing = intent.getBooleanExtra("isPlaying", false);
                notifyProgress(playing, currentPosition);
            }
        }
        
        // Show initial notification
        if (mediaSession != null) {
            showNotification();
        }
        
        return START_STICKY;
    }
    
    public void setWebView(WebView view) {
        this.webView = view;
    }
    
    private void initMediaSession() {
        mediaSession = new MediaSessionCompat(this, "SonfyMusicService");
        
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                executeJavaScript("window.SonfyControl && window.SonfyControl.play()");
            }

            @Override
            public void onPause() {
                executeJavaScript("window.SonfyControl && window.SonfyControl.pause()");
            }

            @Override
            public void onSkipToPrevious() {
                executeJavaScript("window.SonfyControl && window.SonfyControl.previous()");
            }

            @Override
            public void onSkipToNext() {
                executeJavaScript("window.SonfyControl && window.SonfyControl.next()");
            }
            
            @Override
            public void onSeekTo(long pos) {
                executeJavaScript("window.SonfyControl && window.SonfyControl.seekTo(" + (pos / 1000) + ")");
            }
        });
        
        mediaSession.setActive(true);
        
        // Initialize playback state
        stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_PLAY_PAUSE |
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                PlaybackStateCompat.ACTION_SEEK_TO
            );
        
        setPlaybackState(false, 0);
    }
    
    private void executeJavaScript(String script) {
        if (webView != null) {
            mainHandler.post(() -> {
                webView.evaluateJavascript(script, null);
            });
        }
    }
    
    public void notify(String title, String artist, long seconds, String thumbnail) {
        currentTitle = title;
        currentArtist = artist;
        duration = seconds * 1000;
        
        MediaMetadataCompat.Builder metadataBuilder = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putString(MediaMetadataCompat.METADATA_KEY_AUTHOR, artist)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration);
        
        // Load thumbnail in background
        if (thumbnail != null && !thumbnail.isEmpty()) {
            executor.execute(() -> {
                try {
                    InputStream stream = new URL(thumbnail).openStream();
                    Bitmap bitmap = BitmapFactory.decodeStream(stream);
                    stream.close();
                    
                    MediaMetadataCompat metadata = metadataBuilder
                        .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, bitmap)
                        .build();
                    
                    mainHandler.post(() -> {
                        mediaSession.setMetadata(metadata);
                        showNotification();
                    });
                } catch (Exception e) {
                    e.printStackTrace();
                    mainHandler.post(() -> {
                        mediaSession.setMetadata(metadataBuilder.build());
                        showNotification();
                    });
                }
            });
        } else {
            mediaSession.setMetadata(metadataBuilder.build());
            showNotification();
        }
    }
    
    public void notifyProgress(boolean playing, long positionSeconds) {
        boolean wasPlaying = isPlaying;
        isPlaying = playing;
        currentPosition = positionSeconds * 1000;
        
        setPlaybackState(playing, currentPosition);
        
        // Only update notification if play state changed
        if (wasPlaying != playing) {
            showNotification();
        }
    }
    
    private void setPlaybackState(boolean playing, long position) {
        if (stateBuilder == null) return;
        
        PlaybackStateCompat state = stateBuilder
            .setState(
                playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                position,
                1.0f
            )
            .build();
        
        mediaSession.setPlaybackState(state);
    }
    
    private void showNotification() {
        try {
            Notification notification = buildNotification();
            startForeground(NOTIFICATION_ID, notification);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private Notification buildNotification() {
        MediaMetadataCompat metadata = mediaSession.getController().getMetadata();
        
        String title = currentTitle;
        String artist = currentArtist;
        Bitmap largeIcon = null;
        
        if (metadata != null) {
            String metaTitle = metadata.getString(MediaMetadataCompat.METADATA_KEY_TITLE);
            String metaArtist = metadata.getString(MediaMetadataCompat.METADATA_KEY_ARTIST);
            if (metaTitle != null) title = metaTitle;
            if (metaArtist != null) artist = metaArtist;
            largeIcon = metadata.getBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART);
        }
        
        // Content intent to open app
        Intent contentIntent = new Intent(this, MainActivity.class);
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
            this, 0, contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Media button intents
        PendingIntent prevIntent = MediaButtonReceiver.buildMediaButtonPendingIntent(
            this, PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
        );
        PendingIntent playPauseIntent = MediaButtonReceiver.buildMediaButtonPendingIntent(
            this, PlaybackStateCompat.ACTION_PLAY_PAUSE
        );
        PendingIntent nextIntent = MediaButtonReceiver.buildMediaButtonPendingIntent(
            this, PlaybackStateCompat.ACTION_SKIP_TO_NEXT
        );
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(artist)
            .setContentIntent(contentPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_media_previous, "Previous", prevIntent)
            .addAction(
                isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                isPlaying ? "Pause" : "Play",
                playPauseIntent
            )
            .addAction(android.R.drawable.ic_media_next, "Next", nextIntent)
            .setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
            );
        
        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon);
        }
        
        return builder.build();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Sonfy Music Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows currently playing music");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        if (executor != null) {
            executor.shutdown();
        }
        stopForeground(true);
    }
}
