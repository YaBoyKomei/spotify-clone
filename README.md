# 🎵 Sonfy - Music Streaming App

A modern, fully-featured music streaming application built with React and Node.js, integrating YouTube Music API for real-time music playback.

## ✨ Features

- 🎵 **Music Streaming** - Stream music from YouTube Music
- 🔍 **Search** - Search for songs, artists, and albums
- ❤️ **Liked Songs** - Save your favorite tracks
- 🔀 **Shuffle & Repeat** - Control playback modes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎮 **Media Controls** - Control playback from notification area
- 🌙 **Background Playback** - Music continues when minimized
- 🎨 **Modern UI** - Glassmorphism design with smooth animations

## 🚀 Tech Stack

**Frontend:**
- React 18
- CSS3 with Glassmorphism effects
- YouTube IFrame API
- Media Session API

**Backend:**
- Node.js
- Express.js
- YouTube Music API integration

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd spotify-clone
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Run the application**

**Terminal 1 - Start the server:**
```bash
cd server
npm start
```

**Terminal 2 - Start the client:**
```bash
cd client
npm start
```

The app will open at `http://localhost:3000`

## 🌐 Deployment on Render

### Method 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and deploy

### Method 2: Manual Setup

1. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**
   - **Name:** spotify-clone
   - **Environment:** Node
   - **Build Command:** 
     ```
     npm install && cd server && npm install && cd ../client && npm install && npm run build
     ```
   - **Start Command:** 
     ```
     node server/server.js
     ```
   - **Environment Variables:**
     - `NODE_ENV` = `production`
     - `PORT` = `5000`

3. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |

## 🎮 Usage

### Playing Music
1. Browse the home page for trending songs
2. Click on any song card to start playing
3. Use the player controls at the bottom

### Search
1. Click "Search" in the sidebar
2. Enter your search query
3. Click "Search" button or press Enter
4. Click any result to play

### Liked Songs
1. Click the heart icon on any song
2. Access your liked songs from the sidebar
3. Click "Liked Songs" to view all favorites

### Media Controls
- Use notification area controls (Windows/Android/iOS)
- Control playback when app is minimized
- Previous/Next track buttons
- Play/Pause from lock screen

## 📱 Mobile Features

- Responsive design for all screen sizes
- Hamburger menu for navigation
- Touch-friendly controls
- PWA support (Add to Home Screen)
- Background playback on mobile

## 🛠️ Project Structure

```
spotify-clone/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js        # Main app component
│   │   ├── App.css       # Main styles
│   │   └── index.js      # Entry point
│   └── package.json
├── server/                # Node.js backend
│   ├── server.js         # Express server
│   └── package.json
├── render.yaml           # Render deployment config
├── package.json          # Root package.json
└── README.md
```

## 🔧 API Endpoints

- `GET /api/songs` - Get trending songs by sections
- `GET /api/search?q=query` - Search for songs
- `GET /api/section/:browseId` - Get more songs from a section

## 🐛 Troubleshooting

### Build fails on Render
- Ensure Node.js version is >= 18.0.0
- Check that all dependencies are listed in package.json
- Verify build command is correct

### Music doesn't play
- Check browser console for errors
- Ensure YouTube IFrame API is loaded
- Try refreshing the page

### Background playback stops
- Check browser permissions for media playback
- Ensure page is not in battery saver mode
- Try using as PWA (Add to Home Screen)

## 📄 License

MIT License - feel free to use this project for learning and personal use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ using React and Node.js

A minimal music streaming application with React frontend and Node.js backend.

## Features
- Browse songs
- Play/pause music
- Player controls
- Playlist management

## Setup

### Server
```bash
cd server
npm install
npm start
```

### Client
```bash
cd client
npm install
npm start
```

## Tech Stack
- Frontend: React, CSS
- Backend: Node.js, Express
- Audio: HTML5 Audio API
