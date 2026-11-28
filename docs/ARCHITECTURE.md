# 🏗 System Architecture & Technical Design

**Nothing to Listen to** couples a high-performance WebGL 2.0 graphics pipeline with an HTML5 audio playback subsystem and real-time WebSocket state synchronization.

---

## 1. High-Level Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          User Interface Layer                          │
│   React 19  •  Tailwind CSS  •  Radix UI Primitives  •  Lucide Icons   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         [ Zustand State Store ]
           (Active Track, Playlists, Jam Session, Visual Settings)
            │                       │                       │
            ▼                       ▼                       ▼
┌───────────────────────┐ ┌───────────────────┐ ┌────────────────────────┐
│  3D Graphics Engine   │ │  Audio Streaming  │ │  Real-Time Jam Sync    │
│  Voroforce (WebGL2)   │ │  Direct HTML5     │ │  WebSocket Relay       │
│  OGL 2.0 Shaders      │ │  Lossless Quality │ │  Microsecond Phase-Lock│
│  Worker Physics Forces│ │  CacheStorage 0ms │ │  Collaborative DJ Mode │
│  Idle Convergence     │ │  W3C MediaSession │ │  Live Floating Emojis  │
└───────────────────────┘ └───────────────────┘ └────────────────────────┘
```

---

## 2. Component Subsystems

### A. 3D Voronoi Engine (`voroforce/`)
- **Worker Physics**: Force-directed layout simulations calculate cell boundaries and repulsions in dedicated Web Workers, keeping the main UI thread at 60 FPS.
- **OGL Rendering Pipeline**: Custom GLSL vertex and fragment shaders render textured hexagonal/Voronoi cells with interactive pointer magnetism and bulging effects.
- **Adaptive Resolution**: Automatically throttles draw calls and clamps device-pixel-ratio (DPR) to 1.0 or 1.5 on mobile devices to prevent GPU thermal throttling.
- **Idle Sleep**: Halts physics loops once particle convergence stabilizes.

### B. Audio & Caching Pipeline (`app/services/`)
- **Native HTML5 Audio Core**: Manages media streaming without heavy third-party player overhead.
- **CacheStorage Engine (`audio-cache.ts`)**: Caches streamed audio tracks in the browser's persistent CacheStorage for immediate 0ms offline replays.
- **MediaSession Integration**: Synchronizes metadata, track artwork, and play/pause/seek controls with the operating system's lock screen and Bluetooth devices.

### C. Multi-User Jam Sessions (`app/services/jam-session.ts`)
- **WebSocket Relay**: Transmits synchronization timestamps across connected peers.
- **Phase-Lock Clock Alignment**: Automatically calculates round-trip network latency to sync audio playheads down to the millisecond.
- **Role Authority**: Supports Host-controlled playback as well as open Collaborative DJ modes.

### D. State Management (`app/store/`)
- Global application state is orchestrated using lightweight **Zustand** stores, partitioned into modular slices:
  - `activeTrack`: Current playing media item, progress, duration, and volume.
  - `playlists`: User-curated custom playlists with local storage persistence.
  - `jam`: Room identifiers, connected peer count, and DJ permissions.
  - `visualSettings`: Voronoi cell density, camera zoom, and shader distortion controls.
