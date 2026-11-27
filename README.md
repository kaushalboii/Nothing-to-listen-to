<div align="center">

# 🎵 Nothing to Listen to

**An immersive, ad-free WebGL 3D musical universe with real-time shared Jam sessions, lossless low-data streaming, and mobile lock-screen background playback.**

[![Live Site](https://img.shields.io/badge/Live_Site-GitHub_Pages-2ea44f?style=for-the-badge&logo=githubpages&logoColor=white)](https://kaushalboii.github.io/Nothing-to-listen-to/)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4_kaushalboii-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/kaushalboii)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![WebGL 2.0](https://img.shields.io/badge/WebGL-2.0_Enabled-00599c?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![License: MIT](https://img.shields.io/badge/License-MIT-f1e05a?style=for-the-badge)](LICENSE)

<br/>

<iframe src="https://github.com/sponsors/kaushalboii/button" title="Sponsor kaushalboii" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

<br/>

[**Explore Live Universe »**](https://kaushalboii.github.io/Nothing-to-listen-to/) · [**Start a Jam Session**](https://kaushalboii.github.io/Nothing-to-listen-to/) · [**Sponsor Developer**](https://github.com/sponsors/kaushalboii)

</div>

---

## 📑 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
  - [👥 Listen Together (Private Jam Session)](#-listen-together-private-jam-session)
  - [📱 Mobile Ultra-Performance & Zero Heating](#-mobile-ultra-performance--zero-heating)
  - [🔒 Lock-Screen Background Playback & MediaSession](#-lock-screen-background-playback--mediasession-api)
  - [⚡ Lossless Low-Data Streaming & Offline Caching](#-lossless-low-data-streaming--smart-offline-caching)
  - [🌐 Global Multi-Lingual Catalog (216 Masterpieces)](#-global-multi-lingual-catalog-216-masterpieces)
  - [🎧 Universal Multi-Platform Links](#-universal-multi-platform-links)
  - [🔎 Instant Search & Filter System](#-instant-search--dual-filter-system)
- [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
- [💖 Support & Sponsor](#-support--sponsor)
- [🚀 Quick Start](#-quick-start)
- [🔄 Automated Daily Releases Pipeline](#-automated-daily-releases--auto-deployment-pipeline)
- [🏗 Architecture & Tech Stack](#-architecture--tech-stack)
- [🤝 Attribution & Credits](#-attribution--open-source-credits)
- [⚖️ License & Legal Disclaimer](#-license--legal-disclaimer)

---

## 🌟 Overview

**Nothing to Listen to** reimagines musical discovery as a tactile, force-directed 3D Voronoi visual sphere. Instead of scrolling through flat, algorithmic lists, songs are mapped across time and genre as interactive cells that pulsate, expand, and play directly in your browser without intrusive ads.

Whether you're craving classic rock legends, viral Bollywood melodies, explosive Kollywood mass anthems, high-energy Telugu blockbusters, soulful Malayalam indie gems, electrifying K-Pop choreography, or rhythmic Latin chart-toppers—**Nothing to Listen to** unites them into one fluid, ad-free canvas.

---

## ✨ Key Features

### 👥 Listen Together (Private Jam Session)
- **Private 2-User Room Lock**: Create a room with a 6-character room code or 1-tap invite link. The room locks automatically to strictly 2 listeners, keeping your session private.
- **Cross-Internet Real-Time Sync**: High-speed zero-NAT WebSocket signaling relays playback actions instantly across different devices, Wi-Fi networks, and mobile data worldwide.
- **Microsecond Precision Audio Sync**: Synchronizes play, pause, seeking, and track changes with automatic network latency compensation.
- **Collaborative DJ & Live Reactions**: Host can grant guest playback control and exchange floating real-time emoji reactions (❤️, 🔥, 🎵, ⚡).
- **Auto-Reconnection Watchdog**: Silent heartbeat checks automatically restore dropped mobile connections in the background without user intervention.

### 📱 Mobile Ultra-Performance & Zero Heating
- **95% CPU Reduction on Mobile**: Mobile preset tuned to **216 cells** (`CELL_LIMIT.min`), perfectly matching the 216-song atlas grid while eliminating heavy physics calculations.
- **Adaptive Dynamic Frame Rate**: Automatically boosts to **60 FPS** during touch, swipe, or drag gestures for silky-smooth response, and settles to **30 FPS** when idle to eliminate battery drain and device heat.
- **Retina 1.0 DPR Tuning**: Optimized fragment shader pixel ratio to 1.0 on mobile OLED screens, slashing GPU work by >55% while maintaining crystal-clear visuals.
- **Automatic Background Sleep**: Pauses the WebGL render loop within 300ms when your phone screen is locked or you switch apps, dropping CPU/GPU usage to **0%**.
- **Zero-Error WebGL Context Recovery**: Automatic `webglcontextlost` and `webglcontextrestored` listeners ensure the 3D galaxy resumes seamlessly upon phone unlock without black screens or frozen tabs.

### 🔒 Lock-Screen Background Playback & MediaSession API
- **Continuous Lock-Screen Audio**: Music continues playing smoothly even when your phone screen is locked or the browser is minimized.
- **Native OS Media Controls**: Displays track title, artist name, and high-resolution album artwork on your iOS / Android lock screen and notification bar.
- **Hardware & Headphone Control**: Supports play, pause, previous track, next track, and scrubber seeking directly from headphone buttons and car Bluetooth dashboards.

### ⚡ Lossless Low-Data Streaming & Smart Offline Caching
- **100% Ad-Free Direct Streams**: Seamless high-fidelity direct audio streaming without pre-roll or mid-roll video ads.
- **Smart Data Saver Mode**: Automatically chooses 160kbps on 2G/3G/spotty mobile networks for 50% data savings, and 320kbps for audiophile lossless fidelity on broadband.
- **Zero-Network Instant Replays**: Integrates the native `CacheStorage` API to cache listened songs locally for immediate 0ms offline replays without re-downloading.
- **Intelligent Track Prefetching**: Automatically pre-fetches the next upcoming track in the background for zero-buffering transitions.

### 🌐 Global Multi-Lingual Catalog (216 Masterpieces)
- **Tamil**: Anirudh Ravichander (*Leo*, *Jailer*, *Vikram*, *Master*), A. R. Rahman (*Ponniyin Selvan*, *Roja*, *Alaipayuthey*), Harris Jayaraj, Yuvan Shankar Raja, Ilaiyaraaja (*Thalapathi*, *Nayagan*), Santhosh Narayanan (*Kabali*).
- **Hindi / Bollywood**: Arijit Singh (*Kesariya*, *Apna Bana Le*, *Tum Hi Ho*), A. R. Rahman (*Chaiyya Chaiyya*, *Kun Faya Kun*), Pritam, Vishal-Shekhar, Shankar-Ehsaan-Loy.
- **Telugu / Tollywood**: *RRR* (*Naatu Naatu*), *Pushpa* (*Oo Antava*, *Srivalli*), *Ala Vaikunthapurramuloo* (*Butta Bomma*), *Devara* (*Fear Song*, *Chuttamalle*), *Guntur Kaaram*, *Hi Nanna*.
- **Punjabi & Malayalam**: Diljit Dosanjh (*Lover*, *G.O.A.T.*, *Hass Hass*), AP Dhillon (*Brown Munde*, *Excuses*), Sidhu Moose Wala (*295*), Sushin Shyam (*Aavesham - Illuminati*, *Manjummel Boys*).
- **English / International Pop & Rock**: The Weeknd, Taylor Swift, Ed Sheeran, Harry Styles, Coldplay, Imagine Dragons, Queen, Nirvana, Linkin Park, Adele, Bruno Mars.
- **K-Pop & Asian Hits**: BTS (*Dynamite*, *Butter*), BLACKPINK (*DDU-DU DDU-DU*, *How You Like That*), NewJeans (*Super Shy*, *OMG*, *Ditto*), Stray Kids, Jung Kook, YOASOBI (*Idol*), LiSA (*Gurenge*).
- **Spanish & Latin**: Luis Fonsi (*Despacito*), Bad Bunny (*Tití Me Preguntó*, *Dákiti*), Shakira (*Waka Waka*, *Hips Don't Lie*, *Bzrp 53*), Rosalía, J Balvin.

### 🎧 Universal Multi-Platform Links
- Direct 1-click links for every song to stream on **Spotify**, **Apple Music**, **YouTube Music**, **JioSaavn**, **Amazon Music**, **Wynk Music**, **Gaana**, and **SoundCloud**.

### 🔎 Instant Search & Dual Filter System
- Press `Cmd + K`, `Ctrl + K`, or `/` anywhere to open the instant search modal.
- Real-time filtering across **Languages**, **Eras** (2020s, 2010s, 2000s, 1990s, Classics), and **Genres** (Pop, Rock, Soundtrack, Hip-Hop, Folk, EDM).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd + K` / `Ctrl + K` or `/` | Open Instant Search & Filters modal |
| `Space` | Toggle Play / Pause |
| `Right Arrow` (`→`) | Skip to Next Song in Playlist |
| `Left Arrow` (`←`) | Return to Previous Song |
| `Esc` | Close search modal / player view |

---

## 💖 Support & Sponsor

If you enjoy **Nothing to Listen to** and want to support ongoing server-free development, new features, and daily music sync pipelines, consider becoming a sponsor!

<div align="center">

<!-- Official GitHub Sponsors Card Embed -->
<iframe src="https://github.com/sponsors/kaushalboii/card" title="Sponsor kaushalboii" height="225" width="600" style="border: 0;"></iframe>

<br/>

<!-- Interactive Visual Sponsor Card -->
<table align="center">
  <tr>
    <td align="center" style="padding: 24px; border: 1px solid #30363d; border-radius: 12px; background: #0d1117;">
      <a href="https://github.com/sponsors/kaushalboii" target="_blank">
        <img src="https://github.com/kaushalboii.png" width="96" height="96" style="border-radius: 50%; box-shadow: 0 4px 14px rgba(0,0,0,0.4);" alt="kaushalboii" />
        <br />
        <br />
        <img src="https://img.shields.io/badge/Sponsor_%E2%9D%A4_kaushalboii-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" height="38" alt="Sponsor kaushalboii" />
      </a>
      <p style="margin-top: 12px; color: #8b949e; font-size: 14px;"><strong>Support Nothing to Listen to & open-source music innovation</strong></p>
      <p style="color: #8b949e; font-size: 13px; max-width: 500px;">Your sponsorship powers ad-free streaming, low-data mobile optimizations, real-time shared Jam audio sync, and automated daily music release pipelines.</p>
    </td>
  </tr>
</table>

</div>

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer)
- Modern browser with WebGL 2.0 support (Chrome, Edge, Safari, Firefox)

### Installation
```bash
# Clone the repository
git clone https://github.com/kaushalboii/Nothing-to-listen-to.git
cd Nothing-to-listen-to

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build
```bash
# Compile TypeScript and bundle with Vite
npm run build

# Preview the production build locally
npm run preview
```

### Dynamic Daily Music Sync
```bash
# Fetch latest releases of today across all languages and rebuild 3D textures
npm run sync:music
```

---

## 🔄 Automated Daily Releases & Auto-Deployment Pipeline

1. **Daily Auto-Sync Cron (`.github/workflows/update-music.yml`)**:
   - Runs automatically every day at midnight UTC (`0 0 * * *`).
   - Fetches live daily chart releases across **Apple Music** (Tamil, Hindi, Telugu, Punjabi, Malayalam), **Global/US**, **Japan**, **Latin America**, and **Saavn New Releases**.
   - Resolves verified official video IDs, downloads 600x600 high-resolution artwork, and rebuilds the WebGL compressed texture atlas.
   - Automatically commits changes and deploys live to **GitHub Pages**.
2. **Push CI/CD Deployment (`.github/workflows/deploy.yml`)**:
   - Runs on every push to `main`, validating all tests and deploying production builds with zero downtime.

---

## 🏗 Architecture & Tech Stack

- **Frontend Core**: React 19, TypeScript 5.8, Vite 7
- **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide Icons
- **State Management**: Zustand
- **3D Graphics & Physics**: Voroforce WebGL2 engine, OGL, custom GLSL shaders, multi-threaded force simulation
- **Audio Engine**: HTML5 Audio, W3C MediaSession API, Web Audio API melodic synthesizer and analyzer
- **Real-time Networking**: High-speed zero-NAT WebSocket relay & WebRTC
- **Deployment**: Automated GitHub Actions Pages CI/CD workflow (`.github/workflows/deploy.yml`)

---

## 🤝 Attribution & Open-Source Credits

This project was inspired by and built upon the open-source architecture of [Nothing to Watch](https://github.com/gnovotny/nothing-to-watch), conceived and developed by [Gabriel Novotny](https://github.com/gnovotny).

We express our gratitude to the original creators for open-sourcing their force-directed Voronoi visualization engine under the permissive **MIT License**.

---

## ⚖️ License & Legal Disclaimer

### License
This project is open source and available under the terms of the [MIT License](LICENSE).

### Content & Streaming Disclaimer
- **Nothing to Listen to** is a non-commercial, educational, and personal open-source project designed for musical discovery.
- **No media files are hosted**: This web application does not store, host, or distribute any copyrighted MP3, AAC, MP4, or video files on its servers.
- **Official Public Embeds & Streams**: Playback leverages official, publicly available streams and privacy-enhanced YouTube embeds (`youtube-nocookie.com`).
- **External Links**: Streaming links point directly to public search endpoints on authorized third-party services (Spotify, Apple Music, YouTube Music, JioSaavn, Amazon Music, Wynk, Gaana, and SoundCloud).
- All copyrights, trademarks, artwork, and song rights belong exclusively to their respective artists, composers, and record labels.

---

<div align="center">

### 📬 Contact & Feedback

For questions, feedback, or suggestions:  
📧 **Email**: [contact.nothingtolisten@gmail.com](mailto:contact.nothingtolisten@gmail.com) · 🐙 **GitHub**: [@kaushalboii](https://github.com/kaushalboii) · 💖 **Sponsor**: [github.com/sponsors/kaushalboii](https://github.com/sponsors/kaushalboii)

</div>
