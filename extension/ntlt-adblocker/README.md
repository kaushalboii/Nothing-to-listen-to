# 🛡️ NTLT Personal Ad-Shield (Chrome Extension)

A lightweight personal Manifest V3 extension that automatically blocks and fast-forwards YouTube video ads and removes banner overlays across YouTube and embedded players (including **Nothing to Listen To**).

---

## 🚀 How to Install in Chrome (Takes 15 seconds)

1. Open **Google Chrome**.
2. In the address bar, type:
   ```
   chrome://extensions
   ```
   and press **Enter**.
3. In the top-right corner, toggle **"Developer mode"** to **ON**.
4. In the top-left corner, click the **"Load unpacked"** button.
5. Select this folder:
   ```
   Nothing-to-listen-to/extension/ntlt-adblocker
   ```
6. **Enable in Incognito** (Crucial if you use Incognito mode):
   - On the `NTLT Personal Ad-Shield` extension card in `chrome://extensions`, click **"Details"**.
   - Scroll down to **"Allow in Incognito"** and toggle it **ON**.

---

## ✨ Features
- **100% In-House & Private**: Zero external servers, zero telemetry, zero 3rd-party dependencies.
- **Embedded Player Support**: Uses `"all_frames": true` to block ads inside iframes on `kaushalboii.github.io/Nothing-to-listen-to/`.
- **Instant Ad Skip**: Auto-clicks skip buttons within 100ms.
- **16x Fast-Forward**: If an unskippable video ad triggers, it auto-mutes and speeds up the video 16x to finish instantly.
