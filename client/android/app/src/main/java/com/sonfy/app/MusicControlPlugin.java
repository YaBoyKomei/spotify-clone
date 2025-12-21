package com.sonfy.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MusicControl")
public class MusicControlPlugin extends Plugin {
    
    private static final String TAG = "MusicControlPlugin";
    
    private BroadcastReceiver musicControlReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getStringExtra("action");
            if (action != null) {
                Log.d(TAG, "Received control action: " + action);
                JSObject ret = new JSObject();
                ret.put("action", action);
                notifyListeners("controlEvent", ret);
            }
        }
    };
    
    @Override
    public void load() {
        super.load();
        IntentFilter filter = new IntentFilter("MUSIC_CONTROL");
        getContext().registerReceiver(musicControlReceiver, filter);
        Log.d(TAG, "MusicControl plugin loaded");
    }
    
    @PluginMethod
    public void updateNotification(PluginCall call) {
        String title = call.getString("title", "Sonfy");
        String artist = call.getString("artist", "Unknown Artist");
        String thumbnail = call.getString("thumbnail", "");
        Double duration = call.getDouble("duration", 0.0);
        Boolean isPlaying = call.getBoolean("isPlaying", false);
        Double position = call.getDouble("position", 0.0);
        
        MainActivity activity = (MainActivity) getActivity();
        MusicService service = activity != null ? activity.getMusicService() : null;
        
        if (service != null) {
            // Update song info
            if (title != null && !title.isEmpty()) {
                service.notify(title, artist, duration.longValue(), thumbnail);
            }
            // Update playback state
            service.notifyProgress(isPlaying, position.longValue());
        }
        
        call.resolve();
    }
    
    @PluginMethod
    public void notifyProgress(PluginCall call) {
        Boolean isPlaying = call.getBoolean("isPlaying", false);
        Double position = call.getDouble("position", 0.0);
        
        MainActivity activity = (MainActivity) getActivity();
        MusicService service = activity != null ? activity.getMusicService() : null;
        
        if (service != null) {
            service.notifyProgress(isPlaying, position.longValue());
        }
        
        call.resolve();
    }
    
    @Override
    protected void handleOnDestroy() {
        try {
            getContext().unregisterReceiver(musicControlReceiver);
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.handleOnDestroy();
    }
}
