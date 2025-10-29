@echo off
echo Opening APK output folder...
echo.
echo Location: client\android\app\build\outputs\apk\debug
echo.

if exist "client\android\app\build\outputs\apk\debug" (
    explorer "client\android\app\build\outputs\apk\debug"
    echo ✅ Folder opened!
) else (
    echo ❌ Folder doesn't exist yet.
    echo.
    echo Build the APK first in Android Studio:
    echo 1. Build ^> Build Bundle^(s^) / APK^(s^) ^> Build APK^(s^)
    echo 2. Wait for build to complete
    echo 3. Run this script again
)

pause
