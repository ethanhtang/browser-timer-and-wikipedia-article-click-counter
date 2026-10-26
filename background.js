// Clicking the toolbar icon shows or hides the timer on every open tab.
const KEY = 'pageTimer';

chrome.action.onClicked.addListener(async () => {
  const stored = (await chrome.storage.local.get(KEY))[KEY] || {};
  const visible = stored.visible !== false;
  await chrome.storage.local.set({
    [KEY]: { ...stored, visible: !visible, src: 'background' },
  });
});
