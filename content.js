const SHORTS_HREF = "/shorts/";

const YT_AD_SELECTOR = [
  "ytd-ad-slot-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-banner-promo-renderer",
  "ytd-statement-banner-renderer",
  "ytd-promoted-sparkles-web-renderer",
  "ytd-promoted-sparkles-text-search-renderer",
  "ytd-promoted-video-renderer",
  "ytd-display-ad-renderer",
  "ytd-video-masthead-ad-v3-renderer",
  "ytd-primetime-promo-renderer",
  "ytd-search-pyv-renderer",
  "ytd-companion-slot-renderer",
  "ytd-action-companion-ad-renderer",
].join(",");

const CARD_SELECTOR = [
  "ytd-ad-slot-renderer",
  "ytd-search-pyv-renderer",
  "ytd-promoted-sparkles-web-renderer",
  "ytd-promoted-sparkles-text-search-renderer",
  "ytd-compact-promoted-video-renderer",
  "ytd-promoted-video-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "yt-lockup-view-model",
].join(",");

function closestCard(el) {
  let current = el;
  while (current) {
    if (current.matches?.(CARD_SELECTOR)) return current;
    const root = current.getRootNode?.();
    current = root?.host || current.parentElement;
  }
  return null;
}

function collectSponsoredCards(root, cards) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = root;
  while (node) {
    if (node.shadowRoot) collectSponsoredCards(node.shadowRoot, cards);
    const text = node.childNodes
      ? [...node.childNodes]
          .filter((child) => child.nodeType === Node.TEXT_NODE)
          .map((child) => child.textContent)
          .join("")
          .trim()
      : "";
    if (/^sponsored\b/i.test(text) && text.length < 80) {
      const card = closestCard(node);
      if (card) cards.add(card);
    }
    node = walker.nextNode();
  }
}

function hideYouTubeAds() {
  const cards = new Set(
    [...document.querySelectorAll(YT_AD_SELECTOR)].map(
      (el) => el.closest("ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer") || el
    )
  );
  if (document.body) collectSponsoredCards(document.body, cards);
  const unique = [...cards];

  let newlySkipped = 0;
  for (const el of unique) {
    el.style.setProperty("display", "none", "important");
    if (el.dataset.skippedAd) continue;
    el.dataset.skippedAd = "1";
    newlySkipped += 1;
  }

  if (newlySkipped > 0) {
    chrome.runtime.sendMessage({ type: "ads-skipped", count: newlySkipped }).catch(() => {});
  }
}

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
let hidePlayablesOn = true;

function playableShelf(el) {
  return (
    el.closest(
      "ytd-rich-shelf-renderer, ytd-horizontal-card-list-renderer, ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
    ) || el.closest("ytd-rich-section-renderer")
  );
}

function hidePlayables() {
  const marked = [...document.querySelectorAll("[data-hidden-playable]")];
  if (!hidePlayablesOn) {
    marked.forEach((el) => {
      el.style.removeProperty("display");
      delete el.dataset.hiddenPlayable;
    });
    return;
  }

  const shelves = new Set();
  document.querySelectorAll('a[href*="playables"]').forEach((anchor) => {
    const shelf = playableShelf(anchor);
    if (shelf && !shelf.querySelector("ytd-rich-item-renderer ytd-rich-shelf-renderer")) shelves.add(shelf);
  });

  document.querySelectorAll("span, yt-formatted-string, h2").forEach((el) => {
    const text = [...el.childNodes]
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent)
      .join("")
      .trim();
    if (text !== "YouTube Playables") return;
    const shelf = playableShelf(el);
    if (shelf) shelves.add(shelf);
  });

  shelves.forEach((shelf) => {
    if (shelf.querySelector("ytd-video-renderer, ytd-compact-video-renderer") && shelf.querySelector("ytd-rich-item-renderer")) return;
    shelf.dataset.hiddenPlayable = "1";
    shelf.style.setProperty("display", "none", "important");
  });
}

function hideAll() {
  hideShorts();
  hideYouTubeAds();
  hidePlayables();
  syncDumbPlaceholder();
}

let dumbYoutube = false;

function applyDumbYoutube(enabled) {
  dumbYoutube = Boolean(enabled);
  document.documentElement.classList.toggle("dumb-youtube", dumbYoutube);
  syncDumbPlaceholder();
}

function syncDumbPlaceholder() {
  const onHome = location.pathname === "/" || location.pathname.startsWith("/feed/subscriptions");
  let note = document.getElementById("dumb-yt-note");
  if (!dumbYoutube || !onHome) {
    note?.remove();
    return;
  }
  if (!note) {
    note = document.createElement("p");
    note.id = "dumb-yt-note";
    note.textContent = "Search for a topic to watch a video.";
    document.documentElement.appendChild(note);
  }
}

chrome.storage.local.get({ dumbYoutube: false, hideSuggestions: false, hidePlayables: true }).then((data) => {
  applyDumbYoutube(data.dumbYoutube || data.hideSuggestions);
  hidePlayablesOn = data.hidePlayables !== false;
  hidePlayables();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.dumbYoutube || changes.hideSuggestions) {
    chrome.storage.local.get({ dumbYoutube: false, hideSuggestions: false }).then((data) => {
      applyDumbYoutube(data.dumbYoutube || data.hideSuggestions);
    });
  }
  if (changes.hidePlayables) {
    hidePlayablesOn = Boolean(changes.hidePlayables.newValue);
    hidePlayables();
  }
});

hideAll();
let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    hideAll();
  }, 200);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener("yt-navigate-finish", hideAll);