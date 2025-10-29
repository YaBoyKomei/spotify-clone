# How to Build Sonfy APK in Android Studio

Since you can already debug the app in Android Studio, building the APK is simple:

## Step-by-Step:

### 1. Open Project in Android Studio
```bash
cd client
npx cap open android
```

### 2. Build APK
- Click **Build** menu (top menu bar)
- Select **Build Bundle(s) / APK(s)**
- Click **Build APK(s)**

### 3. Wait for Build
- You'll see "Gradle Build Running..." at the bottom
- Wait for it to complete (usually 1-3 minutes)

### 4. Locate APK
- When done, you'll see a notification: "APK(s) generated successfully"
- Click **"locate"** in the notification
- Or manually go to: `client\android\app\build\outputs\apk\debug\`

### 5. APK Location
```
client\android\app\build\outputs\apk\debug\app-debug.apk
```

## Install APK on Phone

### Method 1: Direct Install from Android Studio
1. Connect your phone via USB
2. Enable USB Debugging on phone
3. Click the green **Run** button in Android Studio
4. Select your device
5. App installs automatically

### Method 2: Transfer APK File
1. Copy `app-debug.apk` to your phone
2. Open the APK file on your phone
3. Allow "Install from Unknown Sources" if prompted
4. Click Install

## Troubleshooting

### "Build APK" option is grayed out
- Make sure Gradle sync is complete
- Wait for indexing to finish
- Try: File → Invalidate Caches → Restart

### Build fails with Java error
- In Android Studio: File → Settings → Build Tools → Gradle
- Set "Gradle JDK" to Java 17 or higher
- Click Apply → OK
- Rebuild

### Can't find APK after build
Run this script:
```bash
find-apk.bat
```

Or manually check:
```
client\android\app\build\outputs\apk\debug\app-debug.apk
```

## Quick Commands

### Open Android Studio
```bash
cd client
npx cap open android
```

### Find APK
```bash
find-apk.bat
```

### Open APK folder
```bash
explorer client\android\app\build\outputs\apk\debug
```

## APK File Info

- **Debug APK**: `app-debug.apk` (for testing, larger size)
- **Release APK**: `app-release.apk` (for distribution, optimized)

Debug APK can be installed directly on any Android device for testing.
