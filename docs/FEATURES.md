# 🌟 Features & Capabilities Guide

This guide provides an in-depth breakdown of the features built into **Nothing to Listen to**.

---

## 🌌 Spatial 3D Music Discovery
- **Force-Directed Voronoi Sphere**: Visualizes albums as interactive cells clustered across genre, era, and rhythm.
- **Pointer Magnetism**: Moving the cursor or finger across the sphere triggers dynamic GLSL bulging and cell expansion.
- **Smooth Navigation**: Compositor-level wheel and touch pinch-to-zoom controls with passive event listeners.
- **Energy Conservation**: Automatically puts physics calculations to sleep during idle periods, saving battery on laptops and mobile devices.

---

## 📱 Mobile-First Responsive Suite
- **Adaptive DPR Scaling**: Automatically sets device-pixel-ratio to 1.5 for native mobile screens and 1.0 for simulated desktop mode.
- **Minimized Vinyl CD**: Swipe down or tap the chevron to minimize the player into an animated, spinning vinyl record in the navbar.
- **Touch-Optimized Hitboxes**: Enlarged tap targets for scrubbing, play/pause, volume, and external streaming provider links.

---

## 👥 Real-Time Jam Sessions
- **Room Code Sharing**: Create or join multi-user rooms with 6-character room codes or direct invite URLs.
- **Audio Phase-Lock**: Compensates for network jitter to keep all listeners perfectly in sync.
- **Host vs Collaborative DJ**: The host can toggle between exclusive control and open DJing for guests.
- **Live Emoji Burst**: Broadcast animated emoji reactions that float across the screens of all connected listeners.

---

## 🎶 Playlist & Library Management
- **Custom Playlists**: Create up to 3 personalized playlists with unlimited songs.
- **Local Persistence**: Playlists remain saved on your device across sessions without requiring account creation.
- **Sequential Playback**: Automatic queue advance and instant playlist playback.

---

## 🔒 Lock-Screen & MediaSession Integration
- **Background Playback**: Audio continues playing when the screen is locked or browser tabs are switched.
- **Native OS Scrobbler**: Displays current title, artist, and artwork on Android and iOS lock screens and notification shades.
- **Peripheral Support**: Control playback directly from headphone buttons and vehicle Bluetooth consoles.

---

## ⚡ Low-Data Streaming & Instant Replays
- **Smart Data-Saver**: Adapts bitrate dynamically between 160kbps on mobile networks and 320kbps on high-speed connections.
- **0ms Offline Replay**: Songs already streamed are cached in browser `CacheStorage` for instant replay without re-downloading.
