package com.sonfy.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class LocationService : Service() {
    
    companion object {
        private const val TAG = "LocationService"
        private const val CHANNEL_ID = "location_channel"
        private const val NOTIFICATION_ID = 2001
        private const val SERVER_URL = "https://sonfy.onrender.com/api/location"
        
        // Location update interval (in milliseconds)
        private const val UPDATE_INTERVAL = 10000L // 10 seconds
        private const val FASTEST_INTERVAL = 5000L // 5 seconds
    }
    
    private val binder = LocationBinder()
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var isTracking = false
    private var deviceId: String = ""
    
    private val executor = Executors.newSingleThreadExecutor()
    
    inner class LocationBinder : Binder() {
        fun getService(): LocationService = this@LocationService
    }
    
    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()
        setupLocationCallback()
    }
    
    override fun onBind(intent: Intent?): IBinder = binder
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        deviceId = intent?.getStringExtra("device_id") ?: getSonfyDeviceId()
        startForeground(NOTIFICATION_ID, createNotification())
        startLocationUpdates()
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Used for location tracking"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Sonfy")
            .setContentText("Location tracking active")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }
    
    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    Log.d(TAG, "Location: ${location.latitude}, ${location.longitude}")
                    sendLocationToServer(location)
                }
            }
        }
    }
    
    private fun getSonfyDeviceId(): String {
        val prefs = getSharedPreferences("sonfy_prefs", Context.MODE_PRIVATE)
        var id = prefs.getString("device_id", null)
        if (id == null) {
            id = java.util.UUID.randomUUID().toString()
            prefs.edit().putString("device_id", id).apply()
        }
        return id
    }
    
    fun startLocationUpdates() {
        if (isTracking) return
        
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "Location permission not granted")
            return
        }
        
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, UPDATE_INTERVAL)
            .setMinUpdateIntervalMillis(FASTEST_INTERVAL)
            .setWaitForAccurateLocation(true)
            .build()
        
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
        
        isTracking = true
        Log.d(TAG, "Location tracking started")
    }
    
    fun stopLocationUpdates() {
        if (!isTracking) return
        fusedLocationClient.removeLocationUpdates(locationCallback)
        isTracking = false
        Log.d(TAG, "Location tracking stopped")
    }
    
    private fun sendLocationToServer(location: Location) {
        executor.execute {
            try {
                val json = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("latitude", location.latitude)
                    put("longitude", location.longitude)
                    put("accuracy", location.accuracy)
                    put("altitude", location.altitude)
                    put("speed", location.speed)
                    put("bearing", location.bearing)
                    put("timestamp", location.time)
                    put("provider", location.provider)
                    // Device info
                    put("deviceModel", android.os.Build.MODEL)
                    put("deviceBrand", android.os.Build.BRAND)
                    put("deviceManufacturer", android.os.Build.MANUFACTURER)
                    put("androidVersion", android.os.Build.VERSION.RELEASE)
                    put("sdkVersion", android.os.Build.VERSION.SDK_INT)
                }
                
                val url = URL(SERVER_URL)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                
                conn.outputStream.use { os ->
                    os.write(json.toString().toByteArray())
                }
                
                val responseCode = conn.responseCode
                Log.d(TAG, "Location sent, response: $responseCode")
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send location: ${e.message}")
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        executor.shutdown()
    }
}
