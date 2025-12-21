package com.sonfy.app

import android.content.Context
import android.webkit.JavascriptInterface

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
}
