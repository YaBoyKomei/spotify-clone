# Simple Way to Build Release APK

## Step-by-Step (No "Generate Signed" menu needed)

### 1. Update Passwords

Edit `client/android/key.properties`:
```properties
storePassword=YOUR_ACTUAL_PASSWORD
keyPassword=YOUR_ACTUAL_PASSWORD
keyAlias=sonfy
storeFile=../../sonfy-release-key.keystore
```

Replace `YOUR_ACTUAL_PASSWORD` with the password you used when creating the keystore.

### 2. Open Android Studio

```bash
cd client
npx cap open android
```

Wait for Gradle sync to finish.

### 3. Switch to Release Build

**Option A: Using Build Variants Panel**
- Look for "Build Variants" tab (bottom-left corner)
- If not visible: **View** → **Tool Windows** → **Build Variants**
- Click on "debug" under "Active Build Variant"
- Select **"release"** from dropdown

**Option B: Using Build Menu**
- **Build** → **Select Build Variant...**
- Choose **"release"**

### 4. Build APK

- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- Wait 1-2 minutes for build to complete

### 5. Get Your APK

When build completes, you'll see notification: "APK(s) generated successfully"

**APK Location:**
```
client\android\app\build\outputs\apk\release\app-release.apk
```

Or run this to open the folder:
```bash
explorer client\android\app\build\outputs\apk\release
```

## ✅ This APK is:
- Signed with your keystore
- Optimized for release
- Ready to install on any Android device
- Ready for Play Store

## 📱 Install on Phone

1. Copy `app-release.apk` to your phone
2. Open the file
3. Allow "Install from Unknown Sources" if prompted
4. Tap Install

## 🐛 If Build Fails

### "Signing config not found"
- Make sure `key.properties` has correct passwords
- Verify `sonfy-release-key.keystore` exists in project root

### "Build Variant not found"
- Make sure Gradle sync completed
- Try: **File** → **Sync Project with Gradle Files**

### Still shows "debug" APK
- Double-check Build Variants panel shows "release"
- Clean and rebuild: **Build** → **Clean Project** → **Rebuild Project**

## 🎯 Quick Commands

### Open Android Studio
```bash
cd client
npx cap open android
```

### Open APK folder
```bash
explorer client\android\app\build\outputs\apk\release
```

### Check if APK exists
```bash
dir client\android\app\build\outputs\apk\release\*.apk
```

## 📊 File Sizes

- Debug APK: ~5-10 MB (larger, for testing)
- Release APK: ~3-5 MB (smaller, optimized)

If your release APK is much larger, it might still be building debug version.
