@echo off
echo.
echo 🔍 Searching for Sonfy APK files...
echo.

cd client\android

if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo ✅ DEBUG APK FOUND!
    echo Location: client\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    dir "app\build\outputs\apk\debug\app-debug.apk"
    echo.
    echo Opening folder...
    explorer "app\build\outputs\apk\debug"
) else if exist "app\build\outputs\apk\release\app-release.apk" (
    echo ✅ RELEASE APK FOUND!
    echo Location: client\android\app\build\outputs\apk\release\app-release.apk
    echo.
    dir "app\build\outputs\apk\release\app-release.apk"
    echo.
    echo Opening folder...
    explorer "app\build\outputs\apk\release"
) else (
    echo ❌ No APK found yet!
    echo.
    echo To build the APK:
    echo 1. Open Android Studio
    echo 2. Click: Build ^> Build Bundle^(s^) / APK^(s^) ^> Build APK^(s^)
    echo 3. Wait for build to complete
    echo 4. Run this script again
    echo.
    echo Or build from command line:
    echo   cd client\android
    echo   gradlew.bat assembleDebug
    echo.
)

pause
