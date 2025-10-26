# 📊 Google Analytics Setup Guide for Sonfy

## Step 1: Create Google Analytics Account

1. **Go to Google Analytics**
   - Visit: https://analytics.google.com/
   - Sign in with your Google account

2. **Create Account**
   - Click "Start measuring"
   - Account name: `Sonfy Music`
   - Configure data sharing settings (optional)
   - Click "Next"

3. **Create Property**
   - Property name: `Sonfy Music App`
   - Reporting time zone: Select your timezone
   - Currency: Select your currency
   - Click "Next"

4. **Business Information**
   - Industry: `Arts & Entertainment`
   - Business size: Select appropriate size
   - Click "Next"

5. **Business Objectives**
   - Select: `Examine user behavior`
   - Click "Create"
   - Accept Terms of Service

## Step 2: Get Your Measurement ID

After creating the property:
1. You'll see a **Measurement ID** like: `G-XXXXXXXXXX`
2. Copy this ID - you'll need it!

## Step 3: Add Measurement ID to Your App

1. **Open** `client/public/index.html`
2. **Find** the Google Analytics script (around line 8)
3. **Replace** `G-XXXXXXXXXX` with your actual Measurement ID in **TWO places**:

```html
<!-- Replace BOTH occurrences -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {  <!-- Replace here too! -->
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
</script>
```

## Step 4: Deploy Your Changes

```bash
# Commit changes
git add .
git commit -m "Add Google Analytics tracking"
git push

# Deploy to your hosting (Render, Vercel, etc.)
```

## Step 5: Verify Installation

1. **Go to Google Analytics Dashboard**
   - Navigate to: Reports > Realtime
   
2. **Open Your Website**
   - Visit: https://sonfy.onrender.com (or your domain)
   
3. **Check Realtime Report**
   - You should see yourself as an active user!
   - If you see activity, it's working! 🎉

## 📈 What Google Analytics Tracks

### Automatic Tracking:
- ✅ **Page Views**: Every page visit
- ✅ **User Sessions**: How long users stay
- ✅ **User Location**: Country, city
- ✅ **Device Info**: Desktop, mobile, tablet
- ✅ **Browser**: Chrome, Safari, Firefox, etc.
- ✅ **Traffic Source**: Where users come from
- ✅ **Real-time Users**: Current active users

### Key Metrics You'll See:
- **Users**: Total unique visitors
- **Sessions**: Total visits
- **Bounce Rate**: % who leave immediately
- **Session Duration**: Average time on site
- **Pages per Session**: How many pages viewed
- **Demographics**: Age, gender, interests
- **Acquisition**: How users found your site

## 🎯 Custom Event Tracking (Optional)

Want to track specific actions? Add custom events:

### Track Song Plays:
```javascript
// In your Player component
gtag('event', 'play_song', {
  song_title: currentSong.title,
  song_artist: currentSong.artist
});
```

### Track Playlist Creation:
```javascript
// When user creates playlist
gtag('event', 'create_playlist', {
  playlist_name: playlistName
});
```

### Track Search:
```javascript
// When user searches
gtag('event', 'search', {
  search_term: searchQuery
});
```

## 📊 Accessing Your Analytics

### Dashboard:
1. Go to: https://analytics.google.com/
2. Select your property: "Sonfy Music App"
3. View reports:
   - **Realtime**: Current active users
   - **Acquisition**: Where users come from
   - **Engagement**: What users do
   - **Monetization**: Revenue (if applicable)
   - **Retention**: User return rate

### Mobile App:
- Download "Google Analytics" app from App Store/Play Store
- Monitor your stats on the go!

## 🔒 Privacy Considerations

Google Analytics is GDPR compliant, but you should:

1. **Add Privacy Policy**
   - Mention you use Google Analytics
   - Explain what data is collected

2. **Cookie Consent** (Optional)
   - Add a cookie consent banner
   - Let users opt-out of tracking

3. **Anonymize IP** (Optional)
   ```javascript
   gtag('config', 'G-XXXXXXXXXX', {
     anonymize_ip: true
   });
   ```

## 🎉 You're All Set!

Once deployed, you'll be able to:
- ✅ See real-time users
- ✅ Track user behavior
- ✅ Understand your audience
- ✅ Measure growth
- ✅ Make data-driven decisions

## 📞 Need Help?

- Google Analytics Help: https://support.google.com/analytics
- GA4 Documentation: https://developers.google.com/analytics/devguides/collection/ga4

---

**Note**: It may take 24-48 hours for full data to appear in reports. Realtime data shows immediately!
