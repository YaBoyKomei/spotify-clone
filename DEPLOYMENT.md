# 🚀 Deployment Guide for Render

## Pre-Deployment Checklist

- [ ] All code is committed to Git
- [ ] Dependencies are listed in package.json files
- [ ] Build scripts are tested locally
- [ ] Environment variables are documented
- [ ] README.md is updated

## Quick Deploy Steps

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Ready for deployment"

# Create GitHub repository and push
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy on Render

#### Option A: Blueprint (Automatic - Recommended)

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account
4. Select your repository
5. Render will detect `render.yaml` and configure automatically
6. Click **"Apply"**
7. Wait for deployment (5-10 minutes)

#### Option B: Manual Setup

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `spotify-clone` (or your preferred name)
   - **Environment:** `Node`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Build Command:**
     ```
     npm install && cd server && npm install && cd ../client && npm install && npm run build
     ```
   - **Start Command:**
     ```
     node server/server.js
     ```
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
6. Click **"Create Web Service"**

### 3. Monitor Deployment

- Watch the build logs in Render dashboard
- First deployment takes 5-10 minutes
- Subsequent deployments are faster

### 4. Access Your App

- Your app will be available at: `https://your-app-name.onrender.com`
- Test all features:
  - [ ] Home page loads
  - [ ] Songs play
  - [ ] Search works
  - [ ] Liked songs work
  - [ ] Mobile responsive
  - [ ] Media controls work

## Build Command Breakdown

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies and build
cd ../client && npm install && npm run build
```

This creates an optimized production build in `client/build/`

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `5000` | Server port (Render provides this) |

## Troubleshooting

### Build Fails

**Error: Node version too old**
- Solution: Update `engines` in package.json to match your Node version
- Check your local version: `node --version`

**Error: Module not found**
- Solution: Ensure all dependencies are in package.json
- Run `npm install` locally to verify

**Error: Build timeout**
- Solution: Render free tier has build time limits
- Optimize build by removing unused dependencies

### App Doesn't Load

**Blank page**
- Check browser console for errors
- Verify build command completed successfully
- Check that `NODE_ENV=production` is set

**API errors**
- Check server logs in Render dashboard
- Verify all API endpoints are working
- Test with: `https://your-app.onrender.com/api/songs`

### Performance Issues

**Slow initial load**
- Render free tier spins down after inactivity
- First request takes 30-60 seconds to wake up
- Upgrade to paid tier for always-on service

**Music playback issues**
- Check browser console for YouTube API errors
- Verify internet connection
- Try different browser

## Post-Deployment

### Custom Domain (Optional)

1. Go to your service settings in Render
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed

### Monitoring

- Check Render dashboard for:
  - Build status
  - Server logs
  - Resource usage
  - Uptime

### Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically rebuild and deploy!

## Free Tier Limitations

- **Spin down:** Service sleeps after 15 minutes of inactivity
- **Build time:** Limited build minutes per month
- **Bandwidth:** 100GB/month
- **Storage:** Temporary (resets on deploy)

## Upgrade Options

For production use, consider:
- **Starter Plan ($7/month):** Always-on, no spin down
- **Standard Plan ($25/month):** More resources, better performance

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
- GitHub Issues: Open an issue in your repository

---

Happy Deploying! 🚀
