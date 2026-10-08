const STORAGE_KEY = "skippedAds";
const countEl = document.getElementById("count");

function render(count) {
  countEl.textContent = Number(count || 0).toLocaleString();
}

chrome.storage.local.get({ [STORAGE_KEY]: 0 }).then((data) => render(data[STORAGE_KEY]));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue);
  }
});

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.set({ [STORAGE_KEY]: 0 });
  await chrome.action.setBadgeText({ text: "" });
});
