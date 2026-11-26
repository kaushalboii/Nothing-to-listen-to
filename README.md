# Nothing to Listen to 🎵

> An immersive, ad-free WebGL 3D musical universe. Discover and stream 216+ iconic, multi-lingual songs across Tamil, Hindi, Telugu, English, Punjabi, Malayalam, K-Pop, Latin, and Japanese with verified YouTube playback and multi-platform streaming.

[![Live Site](https://img.shields.io/badge/Live_Site-GitHub_Pages-brightgreen.svg)](https://kaushalboii.github.io/Nothing-to-listen-to/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://react.dev/)
[![WebGL 2.0](https://img.shields.io/badge/WebGL-2.0_Enabled-green.svg)](https://www.khronos.org/webgl/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

**Nothing to Listen to** reimagines music discovery as an interactive 3D force-directed Voronoi visual sphere. Instead of endless text lists, explore hundreds of songs mapped across time and genre as tactile interactive cells that pulsate, expand, and play directly in your browser without intrusive ads.

Whether you are looking for classic rock legends, viral Bollywood melodies, explosive Kollywood mass anthems, high-energy Telugu blockbusters, soulful Malayalam indie gems, electrifying K-Pop choreography, or rhythmic Latin chart-toppers—**Nothing to Listen to** brings them all together into one seamless, ad-free experience.

---

## ✨ Features

- **🌐 100% Multi-Lingual & Global Catalog (216 Masterpieces)**:
  - **Tamil**: Anirudh Ravichander (*Leo*, *Jailer*, *Vikram*, *Master*), A. R. Rahman (*Ponniyin Selvan*, *Roja*, *Alaipayuthey*), Harris Jayaraj, Yuvan Shankar Raja, Ilaiyaraaja (*Thalapathi*, *Nayagan*), Santhosh Narayanan (*Kabali*).
  - **Hindi / Bollywood**: Arijit Singh (*Kesariya*, *Apna Bana Le*, *Tum Hi Ho*), A. R. Rahman (*Chaiyya Chaiyya*, *Kun Faya Kun*), Pritam, Vishal-Shekhar, Shankar-Ehsaan-Loy.
  - **Telugu / Tollywood**: *RRR* (*Naatu Naatu*), *Pushpa* (*Oo Antava*, *Srivalli*), *Ala Vaikunthapurramuloo* (*Butta Bomma*), *Devara* (*Fear Song*, *Chuttamalle*), *Guntur Kaaram*, *Hi Nanna*.
  - **Punjabi & Malayalam**: Diljit Dosanjh (*Lover*, *G.O.A.T.*, *Hass Hass*), AP Dhillon (*Brown Munde*, *Excuses*), Sidhu Moose Wala (*295*), Sushin Shyam (*Aavesham - Illuminati*, *Manjummel Boys*).
  - **English / International Pop & Rock**: The Weeknd, Taylor Swift, Ed Sheeran, Harry Styles, Coldplay, Imagine Dragons, Queen, Nirvana, Linkin Park, Adele, Bruno Mars.
  - **K-Pop & Asian Hits**: BTS (*Dynamite*, *Butter*), BLACKPINK (*DDU-DU DDU-DU*, *How You Like That*), NewJeans (*Super Shy*, *OMG*, *Ditto*), Stray Kids, Jung Kook, YOASOBI (*Idol*), LiSA (*Gurenge*).
  - **Spanish & Latin**: Luis Fonsi (*Despacito*), Bad Bunny (*Tití Me Preguntó*, *Dákiti*), Shakira (*Waka Waka*, *Hips Don't Lie*, *Bzrp 53*), Rosalía, J Balvin.

- **👥 Listen Together (Private Jam Session)**:
  - Stream music simultaneously with a friend anywhere in the world in real-time sync via peer-to-peer WebRTC.
  - **Zero Server Setup**: Works 100% client-side over mobile data or Wi-Fi across different networks.
  - **Strict 2-User Capacity & Private Room Lock**: Generate a unique room code or 1-tap invite link; locks to 2 users max so unauthorized users cannot enter.
  - **High-Precision Playback Sync**: Real-time play, pause, seek, and auto-drift compensation across native audio and YouTube playback.
  - **Collaborative DJ & Live Reactions**: Host can enable shared song control and send instant live emoji reactions (❤️, 🔥, 🎵, ⚡).

- **🎥 Ad-Free In-App YouTube Streaming**:
  - Embedded privacy-enhanced player (`youtube-nocookie.com`) with verified, active official music videos.
  - No broken "Video unavailable" errors.
  - Minimize, expand, and seek seamlessly while navigating the 3D globe.

- **🎧 Universal Multi-Platform Listen Links**:
  - Direct 1-click links for every song to stream on **Spotify**, **Apple Music**, **YouTube Music**, **JioSaavn**, **Amazon Music**, **Wynk Music**, **Gaana**, and **SoundCloud**.

- **🔎 Instant Search & Dual Filter System**:
  - Press `Cmd + K`, `Ctrl + K`, or `/` anywhere on the site to trigger the instant search modal.
  - Filter by **Language** (*All, English, Tamil, Hindi, Telugu, Punjabi, Malayalam, K-Pop, Latin, Japanese*).
  - Filter by **Era / Decade** (*All Eras, 2024-2025, 2020s, 2010s, 2000s, 1990s, Classics*).
  - Filter by **Genre** (*Pop, Rock, Soundtrack, Hip-Hop, Folk, EDM*).

- **💿 Real Album Artwork & WebGL DXT1 Atlas**:
  - Real high-resolution official video thumbnails pulled dynamically from YouTube's CDN.
  - Voroforce WebGL compressed DXT1 DDS texture atlas generated from real pixel data for 60fps rendering without lag.

- **🎹 Live Melodic Synth Preview**:
  - Real-time generative Web Audio synthesizer that creates dynamic chord progressions and animated equalizer waveforms for each song.

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
   - Fetches live daily chart releases across **Apple Music India** (Tamil, Hindi, Telugu, Punjabi, Malayalam), **Global/US**, **Japan**, **Latin America**, and optional YouTube feeds.
   - Automatically resolves verified official YouTube video IDs in parallel and downloads high-resolution 600x600 official cover artwork.
   - Rebuilds the WebGL compressed DXT1 DDS texture atlas and updates `public/json/0.json`.
   - Automatically commits and pushes the new daily songs and textures back to `main`.
   - Immediately compiles the production web app and deploys it live to **GitHub Pages**.
2. **Manual Pushes (`.github/workflows/deploy.yml`)**:
   - Whenever you push changes manually to `main`, GitHub Pages automatically rebuilds and publishes the latest site.
3. **Manual 1-Click Sync**:
   - Go to your GitHub repository -> **Actions** tab -> **Auto-Sync Latest Daily Music & Deploy** -> click **Run workflow**.

---

## 🏗 Architecture & Tech Stack

- **Frontend Core**: React 19, TypeScript 5.8, Vite 7
- **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide Icons
- **State Management**: Zustand
- **3D Graphics & Physics**: Voroforce WebGL2 engine, OGL, custom GLSL shaders, multi-threaded force simulation
- **Audio Engine**: Web Audio API melodic synthesizer and analyzer
- **Deployment**: Automated GitHub Pages CI/CD workflow (`.github/workflows/deploy.yml`)

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
- **Official Public Embeds**: Video and audio playback is rendered entirely through official, publicly available YouTube privacy-enhanced embed frames (`youtube-nocookie.com`) as authorized by YouTube's standard terms of service.
- **External Links**: Streaming links point directly to public search endpoints on authorized third-party services (Spotify, Apple Music, YouTube Music, JioSaavn, Amazon Music, Wynk, Gaana, and SoundCloud).
- All copyrights, trademarks, artwork, and song rights belong exclusively to their respective artists, composers, and record labels.

---

## 📬 Contact & Feedback

For questions, feedback, or suggestions, please contact:
📧 **Email**: [contact.nothingtolisten@gmail.com](mailto:contact.nothingtolisten@gmail.com)  
🐙 **GitHub**: [@kaushalboii](https://github.com/kaushalboii)
