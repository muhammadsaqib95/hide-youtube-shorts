const STORAGE_KEY = "skippedAds";
const DUMB_KEY = "dumbYoutube";
const countEl = document.getElementById("count");
const dumbToggle = document.getElementById("dumb-youtube");

function render(count) {
  countEl.textContent = Number(count || 0).toLocaleString();
}

chrome.storage.local.get({ [STORAGE_KEY]: 0, [DUMB_KEY]: false, hideSuggestions: false }).then((data) => {
  render(data[STORAGE_KEY]);
  dumbToggle.checked = Boolean(data[DUMB_KEY] || data.hideSuggestions);
});

dumbToggle.addEventListener("change", () => {
  chrome.storage.local.set({ [DUMB_KEY]: dumbToggle.checked, hideSuggestions: false });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue);
  }
});

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.set({ [STORAGE_KEY]: 0 });
  await chrome.action.setBadgeText({ text: "" });
});
