// NTLT Personal Ad-Shield for YouTube (Manifest V3)
// Injected into all YouTube frames (including embeds inside Nothing to Listen To)

(function () {
  'use strict';

  // 1. Inject CSS rules to hide ad elements immediately
  const style = document.createElement('style');
  style.id = 'ntlt-ad-shield-style';
  style.textContent = `
    .video-ads,
    .ytp-ad-module,
    .ytp-ad-overlay-container,
    .ytp-ad-message-container,
    .ytp-ad-player-overlay,
    .ytp-ad-action-interstitial,
    .ytp-ad-preview-container,
    .ytp-ad-progress,
    ytd-ad-slot-renderer,
    ytd-in-feed-ad-layout-renderer,
    #masthead-ad,
    #player-ads {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;

  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(style);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      (document.head || document.documentElement).appendChild(style);
    });
  }

  // 2. Active Ad Dismissal & Fast-Forward Engine
  function processAds() {
    // A. Click standard Skip Ad buttons instantly
    const skipSelectors = [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button-text',
      'button.ytp-ad-skip-button-modern'
    ];

    for (const selector of skipSelectors) {
      const btn = document.querySelector(selector);
      if (btn && typeof btn.click === 'function') {
        btn.click();
        return;
      }
    }

    // B. Close overlay and banner ads
    const closeSelectors = [
      '.ytp-ad-overlay-close-button',
      '.ytp-ad-overlay-close-container button'
    ];

    for (const selector of closeSelectors) {
      const closeBtn = document.querySelector(selector);
      if (closeBtn && typeof closeBtn.click === 'function') {
        closeBtn.click();
      }
    }

    // C. Detect active video ad playback and fast-forward to the end
    const playerContainer = document.querySelector('#movie_player, .html5-video-player');
    const isAdPlaying =
      (playerContainer && (playerContainer.classList.contains('ad-showing') || playerContainer.classList.contains('ad-interrupting'))) ||
      document.querySelector('.ytp-ad-player-overlay, .ytp-ad-module:not(:empty)');

    if (isAdPlaying) {
      const video = document.querySelector('video');
      if (video) {
        // Mute ad audio while accelerating
        video.muted = true;
        video.playbackRate = 16.0;

        if (Number.isFinite(video.duration) && video.duration > 0) {
          // Jump directly to end of ad
          video.currentTime = video.duration - 0.1;
        }
      }
    }
  }

  // Run fast loop to catch ads as soon as they render
  setInterval(processAds, 100);

  // Also hook into MutationObserver for instant DOM updates
  const observer = new MutationObserver(processAds);
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
  }
})();
