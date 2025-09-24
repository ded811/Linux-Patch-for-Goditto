const toggle = document.getElementById('toggle');
const stateEl = document.getElementById('state');
const smartIcon = document.getElementById('smartIcon');

function setEnabledUI(on) {
  toggle.checked = on;
  stateEl.textContent = on ? 'ON' : 'OFF';
  stateEl.style.color = on ? '' : '#e57373';
}

async function updateRules(on) {
  try {
    if (on) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['ruleset_1'] });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ['ruleset_1'] });
    }
  } catch (e) {
    console.error('DNR toggle failed', e);
  }
}

async function reloadIfGoditto() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.startsWith('https://connect.goditto.com/')) {
      chrome.tabs.reload(tab.id, { bypassCache: true });
    }
  } catch (e) {
    // No tabs permission? Ignore reload.
  }
}

async function hasTabsPermission() {
  try { return await chrome.permissions.contains({ permissions: ['tabs'] }); }
  catch { return false; }
}

async function ensureTabsPermission() {
  const has = await hasTabsPermission();
  if (has) return true;
  try {
    const granted = await chrome.permissions.request({ permissions: ['tabs'] });
    return !!granted;
  } catch (e) {
    return false;
  }
}

async function syncSmartIconUI() {
  const { smartIconEnabled = false } = await chrome.storage.sync.get({ smartIconEnabled: false });
  smartIcon.checked = smartIconEnabled;
}

chrome.storage.sync.get({ enabled: true }, async ({ enabled }) => {
  setEnabledUI(enabled);
});
syncSmartIconUI();

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  await chrome.storage.sync.set({ enabled });
  await updateRules(enabled);
  await reloadIfGoditto();
  setEnabledUI(enabled);
});

smartIcon.addEventListener('change', async () => {
  if (smartIcon.checked) {
    const ok = await ensureTabsPermission();
    if (!ok) {
      smartIcon.checked = false;
      return;
    }
    await chrome.storage.sync.set({ smartIconEnabled: true });
  } else {
    await chrome.storage.sync.set({ smartIconEnabled: false });
  }
});