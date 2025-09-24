const GODITTO = 'https://connect.goditto.com/';

function iconPath(enabled, onSite) {
  const on = enabled && onSite;
  return on ? {
    16: "icons/icon-on-16.png",
    32: "icons/icon-on-32.png",
    48: "icons/icon-on-48.png",
    128: "icons/icon-on-128.png",
  } : {
    16: "icons/icon-off-16.png",
    32: "icons/icon-off-32.png",
    48: "icons/icon-off-48.png",
    128: "icons/icon-off-128.png",
  };
}

async function getEnabled() {
  return new Promise(res => {
    chrome.storage.sync.get({ enabled: true }, ({ enabled }) => res(enabled));
  });
}

async function smartIconEnabled() {
  return new Promise(res => {
    chrome.storage.sync.get({ smartIconEnabled: false }, ({ smartIconEnabled }) => res(smartIconEnabled));
  });
}

async function hasTabsPerm() {
  try { return await chrome.permissions.contains({ permissions: ['tabs'] }); }
  catch { return false; }
}

async function updateIconForActiveTab() {
  try {
    const enabled = await getEnabled();
    const smart = await smartIconEnabled();
    const tabsOK = smart && await hasTabsPerm();
    if (!tabsOK) {
      await chrome.action.setIcon({ path: iconPath(false, false) });
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const onSite = !!(tab && tab.url && tab.url.startsWith(GODITTO));
    await chrome.action.setIcon({ path: iconPath(enabled, onSite) });
  } catch {}
}

async function maybeInject(tabId, url) {
  try {
    if (!url || !url.startsWith(GODITTO)) return;
    const enabled = await getEnabled();
    if (!enabled) return;
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['spoof-page.js'],
      world: 'MAIN',
      injectImmediately: true
    });
  } catch (e) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['spoof-page.js'],
        injectImmediately: true
      });
    } catch {}
  }
}

function init() { updateIconForActiveTab(); }

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

chrome.permissions.onAdded.addListener(({ permissions }) => {
  if (permissions && permissions.includes('tabs')) {
    chrome.tabs.onActivated.addListener(updateIconForActiveTab);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading' || changeInfo.url) {
        if (tab && tab.url) maybeInject(tabId, tab.url);
      }
      if (changeInfo.status === 'complete' || changeInfo.url) {
        updateIconForActiveTab();
      }
    });
    updateIconForActiveTab();
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.enabled || changes.smartIconEnabled)) {
    updateIconForActiveTab();
  }
});