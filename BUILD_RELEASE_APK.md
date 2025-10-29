# Build Signed Release APK for Sonfy

## ✅ What's Done:
- ✅ Signing key generated: `sonfy-release-key.keystore`
- ✅ Build configuration updated
- ✅ Ready to build release APK

## 📝 Before Building:

### 1. Update key.properties with your passwords

Edit `client/android/key.properties` and replace:
```properties
storePassword=YOUR_ACTUAL_PASSWORD
keyPassword=YOUR_ACTUAL_PASSWORD
keyAlias=sonfy
storeFile=../../sonfy-release-key.keystore
```

**Use the passwords you entered when generating the keystore!**

## 🏗️ Build Release APK

### Method 1: Android Studio (Recommended)

1. **Open project**
   ```bash
   cd client
   npx cap open android
   ```

2. **Update passwords** in `client/android/key.properties`

3. **Build Release APK**
   - Menu: **Build** → **Generate Signed Bundle / APK**
   - Select: **APK**
   - Click **Next**
   - Key store path: Browse to `sonfy-release-key.keystore`
   - Key store password: (your password)
   - Key alias: `sonfy`
   - Key password: (your password)
   - Click **Next**
   - Select **release**
   - Click **Finish**

4. **Find APK**
   - Location: `client\android\app\release\app-release.apk`
   - Or click "locate" in notification

### Method 2: Command Line (if Java 21 installed)

```bash
cd client/android
gradlew.bat assembleRelease
```

APK location: `client\android\app\build\outputs\apk\release\app-release.apk`

## 📱 Install Release APK

The release APK is:
- ✅ Signed and verified
- ✅ Optimized and smaller
- ✅ Ready for distribution
- ✅ Can be uploaded to Play Store

### Install on Phone:
1. Copy `app-release.apk` to your phone
2. Open the file
3. Allow installation from unknown sources
4. Install

## 🚀 Publish to Google Play Store

### 1. Create App Bundle (AAB)

In Android Studio:
- **Build** → **Generate Signed Bundle / APK**
- Select **Android App Bundle**
- Use same signing key
- Build

AAB location: `client\android\app\release\app-release.aab`

### 2. Upload to Play Console

1. Go to: https://play.google.com/console
2. Create new app
3. Upload AAB file
4. Fill in store listing:
   - Title: Sonfy
   - Short description: Free music streaming app
   - Full description: Stream millions of songs for free...
   - Screenshots: (take from app)
   - Icon: Use logo192.png
5. Set content rating
6. Set pricing (Free)
7. Submit for review

## 🔒 Security Notes

### Keep These Safe:
- ✅ `sonfy-release-key.keystore` - Your signing key
- ✅ Keystore password
- ✅ Key password

### Never:
- ❌ Commit keystore to git
- ❌ Share passwords publicly
- ❌ Lose the keystore (can't update app without it!)

## 📊 APK Comparison

| Type | Size | Use Case |
|------|------|----------|
| Debug | ~5-10 MB | Testing only |
| Release | ~3-5 MB | Distribution, Play Store |

## 🐛 Troubleshooting

### "Invalid Package" Error

If release APK also shows invalid package:

1. **Check Android version**
   - Sonfy requires Android 6.0+ (API 23+)
   - Check your phone's Android version

2. **Rebuild from scratch**
   ```bash
   cd client
   npm run build
   npx cap sync
   npx cap open android
   ```
   Then build in Android Studio

3. **Check signing**
   - Make sure passwords in `key.properties` are correct
   - Verify keystore file exists

### Build Fails

- Make sure `key.properties` has correct passwords
- Verify keystore file path is correct
- Try cleaning: **Build** → **Clean Project**

## ✨ Success!

Once built, your release APK is ready to:
- ✅ Install on any Android device
- ✅ Share with friends
- ✅ Upload to Play Store
- ✅ Distribute publicly

The release APK is properly signed and should not show "invalid package" errors!
