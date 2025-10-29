# Fix "Invalid Package" Error

The "invalid package" error happens when the APK is built with the wrong Java version from command line.

## ✅ Solution: Build in Android Studio

Android Studio has its own JDK and will build correctly.

### Steps:

1. **Open Android Studio**
   ```bash
   cd client
   npx cap open android
   ```

2. **Wait for Gradle Sync** to complete (bottom right corner)

3. **Build APK**
   - Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait 1-2 minutes

4. **Find APK**
   - Click "locate" in the success notification
   - Or go to: `client\android\app\build\outputs\apk\debug\app-debug.apk`

5. **Install on Phone**
   - Copy APK to phone
   - Open and install
   - Or use USB: Click Run button in Android Studio

## Why Command Line Fails

- Capacitor needs Java 21
- Your system has Java 17
- Android Studio uses its own Java 21

## Alternative: Install Java 21

If you want command line builds to work:

1. Download Java 21: https://adoptium.net/temurin/releases/?version=21
2. Install it
3. Set JAVA_HOME environment variable
4. Run: `gradlew.bat assembleDebug`

But Android Studio is easier! 😊
