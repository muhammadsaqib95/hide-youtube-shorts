const STORAGE_KEY = "skippedAds";

function formatBadge(count) {
  if (count <= 0) return "";
  if (count < 1000) return String(count);
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  return `${(count / 1000000).toFixed(1)}m`;
}

async function setBadge(count) {
  await chrome.action.setBadgeBackgroundColor({ color: "#c5221f" });
  await chrome.action.setBadgeText({ text: formatBadge(count) });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "ads-skipped" || !message.count) return;

  chrome.storage.local.get({ [STORAGE_KEY]: 0 }).then(async (data) => {
    const total = data[STORAGE_KEY] + message.count;
    await chrome.storage.local.set({ [STORAGE_KEY]: total });
    await setBadge(total);
    sendResponse({ total });
  });

  return true;
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get({ [STORAGE_KEY]: 0 }).then((data) => setBadge(data[STORAGE_KEY]));
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ [STORAGE_KEY]: 0 }).then((data) => setBadge(data[STORAGE_KEY]));
});
