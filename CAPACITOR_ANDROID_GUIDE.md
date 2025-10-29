# Sonfy - Capacitor Android App Guide

## ✅ What's Already Done

- ✅ Capacitor installed and initialized
- ✅ Android platform added
- ✅ Build synced with Capacitor
- ✅ Configuration set up for production API

## 📱 Build Android APK

### Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install with default settings
   - Open Android Studio and complete setup wizard

2. **Install Java JDK 17**
   - Download from: https://www.oracle.com/java/technologies/downloads/#java17
   - Or use: `winget install Oracle.JDK.17`

### Build Steps

#### Option 1: Using Android Studio (Recommended)

```bash
# 1. Open Android project in Android Studio
cd client
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete
4. Click "locate" in the notification to find your APK
5. APK location: `client/android/app/build/outputs/apk/debug/app-debug.apk`

#### Option 2: Using Command Line

```bash
cd client/android
./gradlew assembleDebug

# APK will be at: app/build/outputs/apk/debug/app-debug.apk
```

### For Release APK (Production)

```bash
cd client/android
./gradlew assembleRelease

# APK will be at: app/build/outputs/apk/release/app-release-unsigned.apk
```

## 🔧 Development Workflow

### 1. Make Changes to React App

```bash
cd client
# Make your code changes
npm run build
```

### 2. Sync with Capacitor

```bash
npx cap sync
```

### 3. Run on Android Device/Emulator

```bash
npx cap run android
```

Or open in Android Studio:
```bash
npx cap open android
```

## 📝 Important Configuration

### API Configuration

The app is configured to use your production API at `https://sonfy.onrender.com`

To change this, edit `client/capacitor.config.ts`:

```typescript
server: {
  url: 'https://your-api-url.com',
  cleartext: true
}
```

### App Icons

Icons are located in:
- `client/android/app/src/main/res/mipmap-*/ic_launcher.png`

To update icons:
1. Generate icons using: https://icon.kitchen/
2. Download Android icon pack
3. Replace files in `mipmap-*` folders
4. Run `npx cap sync`

### App Name & Package

Edit `client/android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Sonfy</string>
<string name="title_activity_main">Sonfy</string>
<string name="package_name">com.sonfy.app</string>
```

## 🚀 Publishing to Google Play Store

### 1. Generate Signing Key

```bash
keytool -genkey -v -keystore sonfy-release-key.keystore -alias sonfy -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing

Create `client/android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=sonfy
storeFile=../sonfy-release-key.keystore
```

### 3. Build Release APK

```bash
cd client/android
./gradlew assembleRelease
```

### 4. Build App Bundle (AAB) for Play Store

```bash
cd client/android
./gradlew bundleRelease
```

AAB location: `app/build/outputs/bundle/release/app-release.aab`

### 5. Upload to Play Store

1. Go to https://play.google.com/console
2. Create new app
3. Upload AAB file
4. Fill in store listing details
5. Submit for review

## 🔍 Testing

### Test on Physical Device

1. Enable Developer Options on your Android phone
2. Enable USB Debugging
3. Connect phone via USB
4. Run: `npx cap run android`

### Test on Emulator

1. Open Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Run: `npx cap run android`

## 🐛 Troubleshooting

### Gradle Build Failed

```bash
cd client/android
./gradlew clean
./gradlew build
```

### Clear Capacitor Cache

```bash
cd client
rm -rf android
npx cap add android
npm run build
npx cap sync
```

### CORS Issues

If you get CORS errors, make sure your server allows requests from the app:
- Add `Access-Control-Allow-Origin: *` header
- Or configure specific origins in your server

## 📦 Current Setup

- **App ID**: com.sonfy.app
- **App Name**: Sonfy
- **API URL**: https://sonfy.onrender.com
- **Platform**: Android (iOS can be added with `npx cap add ios`)

## 🎯 Next Steps

1. ✅ Build APK using Android Studio
2. ⬜ Test on Android device
3. ⬜ Customize app icons
4. ⬜ Generate signing key for release
5. ⬜ Build release APK/AAB
6. ⬜ Publish to Google Play Store

## 📚 Resources

- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio
- Play Console: https://play.google.com/console
