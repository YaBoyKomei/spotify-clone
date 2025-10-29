package com.sonfy.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeAudio")
public class NativeAudioPlugin extends Plugin {
    
    private AudioPlayerService audioService;
    private boolean serviceBound = false;
    
    private ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            AudioPlayerService.AudioBinder binder = (AudioPlayerService.AudioBinder) service;
            audioService = binder.getService();
            serviceBound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            serviceBound = false;
        }
    };

    @Override
    public void load() {
        super.load();
        
        // Bind to AudioPlayerService
        Intent intent = new Intent(getContext(), AudioPlayerService.class);
        getContext().bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
    }

    @PluginMethod
    public void loadAudio(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "Unknown");
        String artist = call.getString("artist", "Unknown");
        
        if (url == null) {
            call.reject("URL is required");
            return;
        }
        
        if (serviceBound && audioService != null) {
            audioService.loadAudio(url, title, artist);
            call.resolve();
        } else {
            call.reject("Service not bound");
        }
    }

    @PluginMethod
    public void play(PluginCall call) {
        if (serviceBound && audioService != null) {
            audioService.play();
            call.resolve();
        } else {
            call.reject("Service not bound");
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (serviceBound && audioService != null) {
            audioService.pause();
            call.resolve();
        } else {
            call.reject("Service not bound");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (serviceBound && audioService != null) {
            audioService.stop();
            call.resolve();
        } else {
            call.reject("Service not bound");
        }
    }

    @PluginMethod
    public void isPlaying(PluginCall call) {
        if (serviceBound && audioService != null) {
            JSObject ret = new JSObject();
            ret.put("isPlaying", audioService.isPlaying());
            call.resolve(ret);
        } else {
            call.reject("Service not bound");
        }
    }

    @PluginMethod
    public void getCurrentPosition(PluginCall call) {
        if (serviceBound && audioService != null) {
            JSObject ret = new JSObject();
            ret.put("position", audioService.getCurrentPosition());
            call.resolve(ret);
        } else {
            call.reject("Service not bound");
        }
    }

    @PluginMethod
    public void getDuration(PluginCall call) {
        if (serviceBound && audioService != null) {
            JSObject ret = new JSObject();
            ret.put("duration", audioService.getDuration());
            call.resolve(ret);
        } else {
            call.reject("Service not bound");
        }
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        Integer position = call.getInt("position");
        
        if (position == null) {
            call.reject("Position is required");
            return;
        }
        
        if (serviceBound && audioService != null) {
            audioService.seekTo(position);
            call.resolve();
        } else {
            call.reject("Service not bound");
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (serviceBound) {
            getContext().unbindService(serviceConnection);
            serviceBound = false;
        }
    }
}
