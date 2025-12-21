package com.sonfy.app;

import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.util.Log;
import java.io.IOException;

public class NativeMediaPlayer implements MediaPlayer.OnPreparedListener, 
        MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {
    
    private static final String TAG = "NativeMediaPlayer";
    private MediaPlayer mediaPlayer;
    private Context context;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private String currentUrl;
    private boolean isPreparing = false;
    private PlayerCallback callback;
    
    public interface PlayerCallback {
        void onPrepared();
        void onCompletion();
        void onError(String error);
    }
    
    public NativeMediaPlayer(Context context, PlayerCallback callback) {
        this.context = context;
        this.callback = callback;
        this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        initMediaPlayer();
    }
    
    private void initMediaPlayer() {
        if (mediaPlayer != null) {
            mediaPlayer.release();
        }
        
        mediaPlayer = new MediaPlayer();
        mediaPlayer.setAudioAttributes(
            new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .build()
        );
        
        mediaPlayer.setOnPreparedListener(this);
        mediaPlayer.setOnCompletionListener(this);
        mediaPlayer.setOnErrorListener(this);
    }
    
    public void loadUrl(String url) {
        if (url == null || url.isEmpty()) {
            Log.e(TAG, "Invalid URL");
            return;
        }
        
        if (url.equals(currentUrl) && mediaPlayer != null) {
            Log.d(TAG, "Same URL, not reloading");
            return;
        }
        
        currentUrl = url;
        isPreparing = true;
        
        try {
            requestAudioFocus();
            
            if (mediaPlayer != null) {
                mediaPlayer.reset();
            } else {
                initMediaPlayer();
            }
            
            mediaPlayer.setDataSource(url);
            mediaPlayer.prepareAsync();
            
            Log.d(TAG, "Loading URL: " + url);
        } catch (IOException e) {
            Log.e(TAG, "Error loading URL", e);
            isPreparing = false;
            if (callback != null) {
                callback.onError("Failed to load audio: " + e.getMessage());
            }
        }
    }
    
    public void play() {
        if (mediaPlayer != null && !isPreparing) {
            if (!mediaPlayer.isPlaying()) {
                requestAudioFocus();
                mediaPlayer.start();
                updateNotification(true);
                Log.d(TAG, "Playing");
            }
        }
    }
    
    public void pause() {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
            updateNotification(false);
            Log.d(TAG, "Paused");
        }
    }
    
    public void stop() {
        if (mediaPlayer != null) {
            if (mediaPlayer.isPlaying()) {
                mediaPlayer.stop();
            }
            abandonAudioFocus();
            Log.d(TAG, "Stopped");
        }
    }
    
    public void seekTo(int position) {
        if (mediaPlayer != null && !isPreparing) {
            mediaPlayer.seekTo(position);
        }
    }
    
    public int getCurrentPosition() {
        if (mediaPlayer != null && !isPreparing) {
            try {
                return mediaPlayer.getCurrentPosition();
            } catch (Exception e) {
                return 0;
            }
        }
        return 0;
    }
    
    public int getDuration() {
        if (mediaPlayer != null && !isPreparing) {
            try {
                return mediaPlayer.getDuration();
            } catch (Exception e) {
                return 0;
            }
        }
        return 0;
    }
    
    public boolean isPlaying() {
        return mediaPlayer != null && mediaPlayer.isPlaying();
    }
    
    public void release() {
        if (mediaPlayer != null) {
            mediaPlayer.release();
            mediaPlayer = null;
        }
        abandonAudioFocus();
    }
    
    @Override
    public void onPrepared(MediaPlayer mp) {
        isPreparing = false;
        Log.d(TAG, "Media prepared, starting playback");
        mp.start();
        updateNotification(true);
        if (callback != null) {
            callback.onPrepared();
        }
    }
    
    @Override
    public void onCompletion(MediaPlayer mp) {
        Log.d(TAG, "Playback completed");
        if (callback != null) {
            callback.onCompletion();
        }
    }
    
    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
        isPreparing = false;
        if (callback != null) {
            callback.onError("Playback error: " + what);
        }
        return true;
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
    
    private void updateNotification(boolean isPlaying) {
        // Notification will be updated by the service
        Intent intent = new Intent(context, MusicService.class);
        intent.putExtra("isPlaying", isPlaying);
        context.startService(intent);
    }
}
