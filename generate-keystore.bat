@echo off
echo.
echo 🔐 Generating Android Signing Key for Sonfy
echo.
echo This will create: sonfy-release-key.keystore
echo.
echo You will be asked for:
echo - Keystore password (remember this!)
echo - Key password (can be same as keystore password)
echo - Your name
echo - Organization (can be "Sonfy" or your name)
echo - City, State, Country
echo.
pause

keytool -genkey -v -keystore sonfy-release-key.keystore -alias sonfy -keyalg RSA -keysize 2048 -validity 10000

echo.
echo ✅ Keystore created: sonfy-release-key.keystore
echo.
echo ⚠️  IMPORTANT: Keep this file and passwords safe!
echo    You'll need them to update your app in the future.
echo.
pause
