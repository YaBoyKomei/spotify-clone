# Background Playback in Native Android App

## ⚠️ Important Note

Background playback with YouTube embedded player in a native app has limitations:

1. **YouTube Terms of Service** - YouTube's API doesn't officially support background playback in apps
2. **WebView Limitations** - When app goes to background, WebView pauses
3. **Media Session** - Requires native Android MediaSession implementation

## Current Implementation

Your app uses YouTube's IFrame API which:
- ✅ Works great when app is in foreground
- ❌ Pauses when app goes to background (by design)
- ❌ No native media controls (YouTube limitation)

## Solutions

### Option 1: Accept Current Behavior (Recommended for MVP)

Most music apps using YouTube (like YouTube Music itself) require the app to stay in foreground or use Picture-in-Picture mode.

**What works:**
- Music plays perfectly when app is open
- Screen can be off (with wake lock)
- App stays in recent apps

### Option 2: Add Picture-in-Picture Mode

Allow users to minimize the app while keeping video visible.

**Add to AndroidManifest.xml:**
```xml
<activity
    android:name=".MainActivity"
    android:supportsPictureInPicture="true"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
    ...>
</activity>
```

### Option 3: Use Audio-Only API (Complex)

Switch from YouTube IFrame to audio-only streaming:
- Requires different API
- More complex implementation
- Better background support

## What I've Added

### 1. Permissions (Already Added)
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 2. Wake Lock (In Player.js)
Your app already has wake lock implementation to keep screen on during playback.

## Why No Media Notification?

YouTube's IFrame API doesn't provide:
- ❌ Native media session
- ❌ Lock screen controls
- ❌ Notification controls
- ❌ True background playback

These require:
1. Native Android MediaSession
2. Audio-only streaming (not video embed)
3. Custom audio player implementation

## Workarounds

### For Users:

1. **Keep App Open**
   - Music plays fine when app is visible
   - Can switch to other apps briefly

2. **Use Picture-in-Picture** (if implemented)
   - Small video window stays on top
   - Can use other apps

3. **Lock Screen**
   - Music continues with screen off
   - Wake lock keeps playback active

### For Developers:

To add true background playback, you would need to:

1. **Replace YouTube IFrame** with audio streaming
2. **Implement Native MediaSession**
3. **Create Foreground Service**
4. **Add Media Notification**

This is a major rewrite and requires:
- Native Android code (Java/Kotlin)
- Different audio source (not YouTube embed)
- Capacitor plugin development

## Recommended Approach

For your MVP (Minimum Viable Product):

1. ✅ **Current implementation is fine**
   - Works great for foreground playback
   - Simple and reliable
   - No YouTube TOS violations

2. ✅ **Add Picture-in-Picture** (optional)
   - Easy to implement
   - Better user experience
   - Allows multitasking

3. ⏳ **Future: Native Audio Player**
   - Plan for v2.0
   - Requires significant development
   - Better background support

## Testing Current Behavior

1. Open Sonfy app
2. Play a song
3. Press Home button
4. **Expected:** Music pauses (this is normal for YouTube embed)
5. Return to app
6. **Expected:** Music resumes

## Alternative: Web App

If background playback is critical:
- Keep using the web version (PWA)
- Browsers handle background audio better
- No native app limitations

## Summary

| Feature | Current Status | Difficulty to Add |
|---------|---------------|-------------------|
| Foreground Playback | ✅ Working | - |
| Wake Lock | ✅ Working | - |
| Background Playback | ❌ Limited | 🔴 Very Hard |
| Media Notification | ❌ Not Available | 🔴 Very Hard |
| Lock Screen Controls | ❌ Not Available | 🔴 Very Hard |
| Picture-in-Picture | ⏳ Can Add | 🟡 Medium |

The current implementation is **normal and expected** for YouTube-based music apps!
