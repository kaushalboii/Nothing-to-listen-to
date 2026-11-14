# There's nothing to listen to...

The golden age of vinyl, CDs, and legendary studio recordings is arguably behind us. Luckily, we have over sixty years of timeless music albums to fall back on.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![React](https://img.shields.io/badge/React-19.1-blue.svg)
![WebGL](https://img.shields.io/badge/WebGL-enabled-green.svg)
![Vite](https://img.shields.io/badge/Vite-7.0-purple.svg)

## 🎵 Overview

An experimental WebGL gallery that visualizes hundreds of the greatest and most iconic music albums of all time in an interactive force-directed Voronoi diagram.

### Key Features

- **Interactive 1:1 Square WebGL Visualization**: Custom Voroforce engine tailored for vinyl square album artwork.
- **216+ Legendary Music Records**: Spanning Classic Rock, Pop, Hip-Hop, Electronic & IDM, Jazz & Blues, 90s Grunge, Alternative, Post-Punk, Soul & Funk, Metal, and Modern Indie.
- **Audio Synthesizer & Equalizer**: Live melodic Web Audio synthesizer generating harmonic chord previews for each record, complete with animated equalizer bars.
- **Spinning Vinyl Animation**: Interactive sleeve and spinning vinyl record visualization that slides out and rotates when playing.
- **Tracklist & Album Trivia**: Track-by-track breakdown with durations, lore, critical acclaim scores, and review quotes.
- **Direct Streaming Integration**: One-click shortcuts to open albums directly in Spotify, Apple Music, and YouTube Music.
- **Interactive Force Modes**: Intro, selection, and preview modes with smooth 60fps force simulation.
- **Responsive & Dark/Light Themes**: Optimized for desktop, tablet, and mobile browsers.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** (or Bun / pnpm)
- Modern browser with WebGL 2.0 support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kaushalboii/Nothing-to-listen-to.git
   cd Nothing-to-listen-to
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production with TypeScript compilation |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint code with Biome |
| `npm run format` | Format code with Biome |
| `npm run check` | Run comprehensive Biome checks |

## 🏗 Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI (Shadcn), Zustand state management.
- **Engine (Voroforce)**: Lightweight WebGL2 rendering with OGL, custom GLSL shaders, multi-threaded force simulation, and 1:1 square media lattice.
- **Audio**: Web Audio API melodic synthesizer.
- **Data**: Curated album collection loaded from `public/json/0.json` with multi-tier texture support from `public/media/`.

## 📄 License

MIT
