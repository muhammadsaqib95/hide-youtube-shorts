const STORAGE_KEY = "skippedAds";
const DUMB_KEY = "dumbYoutube";
const PLAYABLES_KEY = "hidePlayables";
const countEl = document.getElementById("count");
const dumbToggle = document.getElementById("dumb-youtube");
const playablesToggle = document.getElementById("hide-playables");

function render(count) {
  countEl.textContent = Number(count || 0).toLocaleString();
}

chrome.storage.local.get({
  [STORAGE_KEY]: 0,
  [DUMB_KEY]: false,
  hideSuggestions: false,
  [PLAYABLES_KEY]: true,
}).then((data) => {
  render(data[STORAGE_KEY]);
  dumbToggle.checked = Boolean(data[DUMB_KEY] || data.hideSuggestions);
  playablesToggle.checked = Boolean(data[PLAYABLES_KEY]);
});

dumbToggle.addEventListener("change", () => {
  chrome.storage.local.set({ [DUMB_KEY]: dumbToggle.checked, hideSuggestions: false });
});

playablesToggle.addEventListener("change", () => {
  chrome.storage.local.set({ [PLAYABLES_KEY]: playablesToggle.checked });
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
