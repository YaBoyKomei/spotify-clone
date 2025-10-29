# How to Find Build Variants in Android Studio

## Where is Build Variants?

### Location 1: Bottom-Left Corner
Look for a tab labeled **"Build Variants"** at the bottom-left of Android Studio window.

### Location 2: Left Side Panel
Check the left side panel for **"Build Variants"** tab.

### Location 3: View Menu
If you can't find it:
1. Click **View** (top menu)
2. Hover over **Tool Windows**
3. Click **Build Variants**

## What You'll See

The Build Variants panel shows:
```
┌─────────────────────────────┐
│ Build Variants              │
├─────────────────────────────┤
│ Module: app                 │
│ Active Build Variant: debug │  ← Click here
├─────────────────────────────┤
```

## Change to Release

1. Click on "debug" (where it says Active Build Variant)
2. A dropdown appears with options:
   - debug
   - **release** ← Select this
3. Click "release"
4. Wait for Gradle sync (few seconds)

## After Switching to Release

Now when you build APK:
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**

It will create a **signed release APK** instead of debug APK!

## Visual Indicators

When on "release" build variant:
- Build Variants panel shows: "Active Build Variant: **release**"
- APK will be in: `app/build/outputs/apk/release/`
- APK name: `app-release.apk`

When on "debug" build variant:
- Build Variants panel shows: "Active Build Variant: **debug**"
- APK will be in: `app/build/outputs/apk/debug/`
- APK name: `app-debug.apk`

## Alternative: Build from Terminal

If you can't find Build Variants, you can also build release from terminal:

```bash
cd client/android
gradlew.bat assembleRelease
```

But this requires Java 21 to be installed.
