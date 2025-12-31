package com.sonfy.app

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

class SplashActivity : AppCompatActivity() {

    companion object {
        private const val SPLASH_DURATION = 1500L // 1.5 seconds
        private const val BATTERY_OPTIMIZATION_REQUEST = 1002
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Make status bar transparent
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.parseColor("#121212")
        
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        // Get views
        val logo = findViewById<ImageView>(R.id.splash_logo)
        val title = findViewById<TextView>(R.id.splash_title)

        // Initial state - invisible and scaled down
        logo.alpha = 0f
        logo.scaleX = 0.5f
        logo.scaleY = 0.5f
        title.alpha = 0f
        title.translationY = 50f

        // Animate logo - scale up and fade in
        val logoScaleX = ObjectAnimator.ofFloat(logo, View.SCALE_X, 0.5f, 1f)
        val logoScaleY = ObjectAnimator.ofFloat(logo, View.SCALE_Y, 0.5f, 1f)
        val logoAlpha = ObjectAnimator.ofFloat(logo, View.ALPHA, 0f, 1f)
        
        val logoAnimator = AnimatorSet().apply {
            playTogether(logoScaleX, logoScaleY, logoAlpha)
            duration = 600
            interpolator = AccelerateDecelerateInterpolator()
        }

        // Animate title - slide up and fade in
        val titleAlpha = ObjectAnimator.ofFloat(title, View.ALPHA, 0f, 1f)
        val titleTranslate = ObjectAnimator.ofFloat(title, View.TRANSLATION_Y, 50f, 0f)
        
        val titleAnimator = AnimatorSet().apply {
            playTogether(titleAlpha, titleTranslate)
            duration = 400
            startDelay = 300
            interpolator = AccelerateDecelerateInterpolator()
        }

        // Start animations
        logoAnimator.start()
        titleAnimator.start()

        // Check battery optimization after animation
        Handler(Looper.getMainLooper()).postDelayed({
            checkBatteryOptimization()
        }, SPLASH_DURATION)
    }

    private fun checkBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(POWER_SERVICE) as PowerManager
            val packageName = packageName
            
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                // Show dialog to explain why we need this permission
                AlertDialog.Builder(this)
                    .setTitle("Background Playback")
                    .setMessage("To keep music playing in the background, please disable battery optimization for Komei.")
                    .setPositiveButton("Settings") { _, _ ->
                        try {
                            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                data = Uri.parse("package:$packageName")
                            }
                            startActivityForResult(intent, BATTERY_OPTIMIZATION_REQUEST)
                        } catch (e: Exception) {
                            // If direct request fails, open battery settings
                            try {
                                startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                            } catch (e2: Exception) {
                                goToMainActivity()
                            }
                        }
                    }
                    .setNegativeButton("Skip") { _, _ ->
                        goToMainActivity()
                    }
                    .setCancelable(false)
                    .show()
            } else {
                goToMainActivity()
            }
        } else {
            goToMainActivity()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == BATTERY_OPTIMIZATION_REQUEST) {
            goToMainActivity()
        }
    }

    private fun goToMainActivity() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
        // No transition animation
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}
