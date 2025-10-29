# PWA Icon Generation Guide for Sonfy

## Quick Fix - Generate Icons Now

### Method 1: Use the Built-in Generator (Easiest)

1. Open `client/public/generate-icons.html` in your browser
2. You'll see two canvas elements with the Sonfy "S" logo
3. Click "Download 192x192" button → saves `logo192.png`
4. Click "Download 512x512" button → saves `logo512.png`
5. Move both PNG files to `client/public/` folder
6. Done! ✅

### Method 2: Use Online Tool (Best Quality)

1. Go to https://realfavicongenerator.net/
2. Upload your logo or use the apple-touch-icon.png
3. Configure settings (keep defaults)
4. Generate icons
5. Download the package
6. Extract `logo192.png` and `logo512.png` to `client/public/`

### Method 3: Create Manually

Use any image editor (Photoshop, GIMP, Canva, Figma):
- Create 192x192 PNG with Sonfy branding
- Create 512x512 PNG with Sonfy branding
- Save as `logo192.png` and `logo512.png`
- Place in `client/public/`

## What's Already Done

✅ `manifest.json` updated with icon references
✅ Icon generator HTML created
✅ Proper PWA configuration

## What You Need to Do

❌ Generate and add `logo192.png` to `client/public/`
❌ Generate and add `logo512.png` to `client/public/`

## After Adding Icons

```bash
cd client
npm run build
git add public/logo192.png public/logo512.png
git commit -m "Add PWA icons"
git push
```

## Current Icon Status

- ✅ favicon.ico (16x16, 32x32, 64x64)
- ✅ apple-touch-icon.png (180x180)
- ❌ logo192.png (192x192) - **REQUIRED FOR PWA**
- ❌ logo512.png (512x512) - **REQUIRED FOR PWA**
