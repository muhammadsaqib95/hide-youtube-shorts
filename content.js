const SHORTS_HREF = "/shorts/";

function hideShorts() {
  // Individual short videos in grid/list (home, subscriptions, search)
  document.querySelectorAll("a#thumbnail[href*='/shorts/'], a.shortsLockupViewModelHostEndpoint[href*='/shorts/']").forEach(a => {
    const card = a.closest(
      "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer"
    );
    if (card) card.style.display = "none";
  });

  // Shorts shelves / reels
  document.querySelectorAll("ytd-reel-shelf-renderer, ytd-rich-shelf-renderer[is-shorts], grid-shelf-view-model").forEach(el => {
    el.style.display = "none";
  });

  // Channel "Shorts" tab
  document.querySelectorAll("yt-tab-shape, tp-yt-paper-tab").forEach(tab => {
    if (tab.textContent.trim().toLowerCase() === "shorts") tab.style.display = "none";
  });
}

// Run now and on DOM changes (YouTube is a SPA)
hideShorts();
const observer = new MutationObserver(() => hideShorts());
observer.observe(document.documentElement, { childList: true, subtree: true });

// Re-run on YouTube navigation
window.addEventListener("yt-navigate-finish", hideShorts);