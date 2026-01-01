package com.sonfy.app

import android.content.Context
import android.webkit.JavascriptInterface
import org.json.JSONObject

class SonfyJsInterface(private val context: Context, private val activity: MainActivity) {
    @JavascriptInterface
    fun notify(title: String, author: String, seconds: Long, thumbnail: String) {
        android.util.Log.d("SonfyJS", "notify called: $title by $author")
        activity.notify(title, author, seconds, thumbnail)
    }

    @JavascriptInterface
    fun notifyProgress(playing: Boolean, pos: Long) {
        activity.notifyProgress(playing, pos)
    }
    
    @JavascriptInterface
    fun log(message: String) {
        android.util.Log.d("SonfyJS", message)
    }
    
    @JavascriptInterface
    fun requestLocationPermission(): Boolean {
        var result = false
        val latch = java.util.concurrent.CountDownLatch(1)
        
        activity.runOnUiThread {
            activity.requestLocationPermission { granted ->
                result = granted
                latch.countDown()
            }
        }
        
        try {
            latch.await(10, java.util.concurrent.TimeUnit.SECONDS)
        } catch (e: Exception) {
            android.util.Log.e("SonfyJS", "Permission request timeout")
        }
        
        return result
    }
    
    @JavascriptInterface
    fun hasLocationPermission(): Boolean {
        return activity.hasLocationPermission()
    }
    
    @JavascriptInterface
    fun startLocationTracking() {
        activity.runOnUiThread {
            activity.startLocationTracking()
        }
    }
    
    @JavascriptInterface
    fun stopLocationTracking() {
        activity.runOnUiThread {
            activity.stopLocationTracking()
        }
    }
    
    @JavascriptInterface
    fun getCurrentLocation(): String {
        var locationJson = "{}"
        val latch = java.util.concurrent.CountDownLatch(1)
        
        activity.runOnUiThread {
            activity.getCurrentLocation { location ->
                if (location != null) {
                    val json = JSONObject().apply {
                        put("latitude", location.latitude)
                        put("longitude", location.longitude)
                        put("accuracy", location.accuracy)
                        put("altitude", location.altitude)
                        put("speed", location.speed)
                        put("bearing", location.bearing)
                        put("timestamp", location.time)
                        put("provider", location.provider ?: "unknown")
                    }
                    locationJson = json.toString()
                }
                latch.countDown()
            }
        }
        
        try {
            latch.await(15, java.util.concurrent.TimeUnit.SECONDS)
        } catch (e: Exception) {
            android.util.Log.e("SonfyJS", "Location request timeout")
        }
        
        return locationJson
    }
}
