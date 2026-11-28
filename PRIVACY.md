# Privacy Policy

**Effective Date:** November 28, 2026  
**Project:** Nothing to Listen To ([kaushalboii.github.io/Nothing-to-listen-to](https://kaushalboii.github.io/Nothing-to-listen-to/))  
**Repository:** [github.com/kaushalboii/Nothing-to-listen-to](https://github.com/kaushalboii/Nothing-to-listen-to)

---

## 1. Overview & Core Philosophy

**Nothing to Listen to** is a free, non-commercial, open-source musical discovery gallery and interactive 3D WebGL experience. 

We strongly believe that your listening habits, personal data, and device information belong to you. Our architecture is designed on a **privacy-first, client-side-only model**:
- **Zero user account requirements** (no logins, no passwords, no email registrations).
- **Zero third-party advertising networks** (no Google AdSense, no tracking pixels, no ad brokers).
- **Zero analytics tracking cookies** (no Google Analytics, no Meta Pixel, no fingerprinting).
- **100% of user-created data remains locally on your device**.

---

## 2. Information We Do NOT Collect

We do not collect, harvest, store, or sell any Personally Identifiable Information (PII), including:
- Names, physical addresses, or phone numbers.
- Email addresses (unless you voluntarily reach out for developer support).
- Credit card numbers, billing addresses, or payment details.
- Microphone, camera, or biometric data.
- Personal music listening histories or cross-site browsing behaviors.

---

## 3. Data Stored Locally on Your Device (Client-Side Storage)

To provide a personalized, responsive experience across sessions without requiring remote accounts or centralized databases, **Nothing to Listen to** saves certain user preferences directly inside your web browser’s local storage APIs.

| Storage API | Stored Data | Purpose | Expiration |
| :--- | :--- | :--- | :--- |
| **`localStorage`** | • Selected Theme (Dark / Light)<br/>• WebGL Preset (Mobile, Minimal, Contours, Depth)<br/>• Device Class rating<br/>• Custom User Playlists (up to 3)<br/>• Favorited Albums & Custom Links<br/>• DevTools & audio preferences | Retains your customized UI layout, favorite records, and custom playlists between visits. | Persistent on your machine until you manually clear site data. |
| **`sessionStorage`** | • Active Jam Session Room Code<br/>• Temporary Jam Role (Host or Guest) | Maintains real-time room connection during page refreshes within the active browser tab. | Automatically deleted immediately when you close the browser tab. |
| **`CacheStorage`** (`ntlt-audio-cache-v1`) | • Temporary audio stream chunks (up to 30 tracks)<br/>• LRU (Least Recently Used) cache manifest | Enables instant 0ms offline playback and saves mobile cellular data on repeat plays. | Automatically evicted when storage exceeds 30 tracks (~100MB), or upon manual browser cache clearing. |

> **Your Control:** All data listed above resides exclusively on your local device hardware. None of this data is ever sent to or stored on any central server. You can instantly erase all stored preferences at any time by clearing your browser cache or site data for `kaushalboii.github.io`.

---

## 4. Listen Together (Jam Sessions) Privacy

When you initiate or join a real-time **Jam Session**:
- A temporary, randomized 4-character room code (e.g., `NTLT-8K92`) is generated.
- The Jam service relays real-time playback synchronization signals (current track title, audio timestamp, play/pause commands, and live emoji reactions) between connected session participants.
- **No audio eavesdropping**: Microphones are never accessed.
- **No chat or message logging**: No chat messages, transcripts, or communication histories are ever recorded, saved, or analyzed.
- Session records expire and terminate the moment all participants disconnect.

---

## 5. Third-Party Services & External Integrations

To deliver static assets, interactive 3D graphics, and music discovery, the application connects with the following privacy-conscious third-party providers:

### A. Hosting & Infrastructure
- **GitHub Pages**: The application’s static HTML, JavaScript, and WebGL assets are hosted on GitHub Pages. When your browser requests files, GitHub may process standard server request logs (including IP addresses, browser User-Agent headers, and request timestamps) to maintain network security and DDoS mitigation, in accordance with the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

### B. Music Playback & Audio Streaming
- **Audio CDN Streams**: Direct audio playback connects to public Content Delivery Networks for lossless streaming. Requests include standard HTTP streaming headers; no identifying user profiles are created.
- **Privacy-Enhanced YouTube Player**: When a video stream is requested, playback loads via YouTube's privacy-enhanced embed domain (`https://www.youtube-nocookie.com/embed/`). YouTube does not place persistent tracking cookies on your device when using this domain until you interact with the player. Playback is governed by the [Google Privacy Policy](https://policies.google.com/privacy).

### C. Fonts & Typography
- **Google Fonts**: Typography is served via `fonts.googleapis.com` and `fonts.gstatic.com`. Google Fonts does not use cookies, and requests for fonts are separated from other Google services per the [Google Fonts Privacy Documentation](https://developers.google.com/fonts/faq/privacy).

### D. External Streaming Links
- When you click an external link to listen to an album on Spotify, Apple Music, YouTube Music, JioSaavn, Amazon Music, Wynk, Gaana, or SoundCloud, you leave our site. Your interaction on those third-party services is governed exclusively by their respective privacy policies.

---

## 6. Children's Privacy (COPPA Compliance)

**Nothing to Listen to** is a general-audience cultural discovery website and does not intentionally or knowingly collect personal information from children under the age of 13 (or under the age of 16 in certain European jurisdictions). Because the application requires zero account registration, no personal information is collected from any visitor.

---

## 7. Your Rights (GDPR & CCPA/CPRA Compliance)

Under international privacy frameworks, including the **General Data Protection Regulation (GDPR)** and the **California Consumer Privacy Act (CCPA/CPRA)**, visitors have fundamental privacy rights:

- **Right to Access & Portability**: You have full access to your playlists and favorite records stored in your browser's `localStorage`.
- **Right to Erasure (Right to be Forgotten)**: Because we maintain no remote user database, you can exercise complete erasure of all your data instantly by clearing your browser's cookies and site data for `kaushalboii.github.io`.
- **Right to Opt-Out of Data Sale**: We do not sell, rent, or monetize personal information. We never have, and never will.

---

## 8. Security Measures

We enforce rigorous client-side and transport-layer security standards:
- **HTTPS / TLS 1.3 Strict Encryption**: All communication is encrypted end-to-end to prevent interception or tampering.
- **Strict Content Security Policy (CSP)**: Enforces origin boundaries to prevent unauthorized Cross-Site Scripting (XSS) or third-party script injections.
- **Cross-Origin Isolation**: Protected via `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers.

---

## 9. Changes to This Privacy Policy

We may occasionally update this Privacy Policy to reflect enhancements to our features, infrastructure updates, or regulatory adjustments. Any updates will be published with a revised **Effective Date** at the top of this document. Continued use of the platform after changes signifies acceptance of the updated policy.

---

## 10. Contact & Inquiries

If you have questions, feedback, or legal inquiries regarding this Privacy Policy or your data privacy, please contact:

- 📧 **Email**: [contact.nothingtolisten@gmail.com](mailto:contact.nothingtolisten@gmail.com)
- 🐙 **GitHub Issues**: [github.com/kaushalboii/Nothing-to-listen-to/issues](https://github.com/kaushalboii/Nothing-to-listen-to/issues)
- 👤 **Maintainer**: [@kaushalboii](https://github.com/kaushalboii)
