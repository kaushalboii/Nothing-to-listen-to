// NTLT Personal Ad-Shield for YouTube (Manifest V3)
// Injected into all YouTube frames (including embeds inside Nothing to Listen To)

(function () {
  'use strict';

  // 1. Inject CSS rules to hide ad elements and banners immediately
  const style = document.createElement('style');
  style.id = 'ntlt-ad-shield-style';
  style.textContent = `
    .video-ads,
    .ytp-ad-module,
    .ytp-ad-overlay-container,
    .ytp-ad-message-container,
    .ytp-ad-player-overlay,
    .ytp-ad-player-overlay-layout,
    .ytp-ad-action-interstitial,
    .ytp-ad-preview-container,
    .ytp-ad-progress,
    .ytp-ad-image-overlay,
    .ytp-ad-text-overlay,
    .ytp-ad-survey,
    ytd-ad-slot-renderer,
    ytd-in-feed-ad-layout-renderer,
    ytd-banner-promo-renderer,
    ytd-player-legacy-desktop-watch-ads-renderer,
    #masthead-ad,
    #player-ads,
    ytd-enforcement-message-view-model,
    tp-yt-paper-dialog:has(#feedback) {
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
      (document.head || document.documentElement)?.appendChild(style);
    });
  }

  let wasAdActive = false;

  // 2. Fast Ad Dismissal, Click Automation & Acceleration Engine
  function processAds() {
    // A. Click standard & modern Skip Ad buttons instantly
    const skipSelectors = [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button-text',
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-overlay-close-button',
      '.ytp-ad-overlay-close-container button',
      'div[id^="skip-button"] button',
      '.ytp-ad-preview-container',
      '[class*="skip-button"]',
      '[aria-label*="Skip ad" i]',
      '[aria-label*="Skip ads" i]'
    ];

    for (const selector of skipSelectors) {
      const btns = document.querySelectorAll(selector);
      for (const btn of btns) {
        if (typeof btn.click === 'function') {
          btn.click();
        }
      }
    }

    // B. Detect active video ad playback
    const playerContainer = document.querySelector('#movie_player, .html5-video-player');
    const isAdShowing =
      Boolean(document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay, .ytp-ad-player-overlay-layout')) ||
      (playerContainer && (playerContainer.classList.contains('ad-showing') || playerContainer.classList.contains('ad-interrupting')));

    const video = document.querySelector('video');

    if (isAdShowing) {
      wasAdActive = true;

      // Try internal player skip if available
      try {
        if (playerContainer && typeof playerContainer.skipAd === 'function') {
          playerContainer.skipAd();
        }
      } catch (_) {}

      if (video) {
        // Mute ad audio and fast-forward 16x
        video.muted = true;
        video.playbackRate = 16.0;

        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        } else {
          video.currentTime = 99999;
        }

        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    } else if (wasAdActive) {
      // Ad has completed: restore normal playback speed and unmute
      wasAdActive = false;
      if (video) {
        video.playbackRate = 1.0;
        video.muted = false;
      }
    }

    // C. Auto-dismiss anti-adblock dialogs if present
    const dialog = document.querySelector('ytd-enforcement-message-view-model, tp-yt-paper-dialog:has(#feedback)');
    if (dialog) {
      dialog.remove();
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    }
  }

  // High-frequency polling loop (50ms) to intercept ads before first frame renders
  setInterval(processAds, 50);

  // MutationObserver for instant DOM reaction
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
