# Browser Timer and Wikipedia Article Click Counter

A self-created Chrome extension with a movable timer and a counter that tracks which Wikipedia links you click. Made for the WikiQuest YouTube channel.

- A floating timer with milliseconds that follows you from site to site
- Dark mode, light mode, and custom colors
- On Wikipedia, a counter that shows how many times you clicked an article link
- Saves the total number of clicks and total elapsed time from article to article

---

## How to install (about 2 minutes)

You'll need Google Chrome on a computer (Windows, Mac, or Chromebook). Edge and Brave use the same steps at `edge://extensions` and `brave://extensions`.

### Step 1: Download the extension

1. On this page, look at the right side and click **Releases**.
2. Click the newest release at the top.
3. Under **Assets**, click **page-timer.zip**. It will download to your computer, usually into your Downloads folder.

### Step 2: Unzip it

- **Windows:** right-click `page-timer.zip`, choose **Extract All**, then click **Extract**.
- **Mac:** double-click `page-timer.zip`.

You'll get a folder called **page-timer**. Move that folder somewhere you won't delete it, like your Documents folder. Chrome runs the extension from this folder, so if you delete it, the extension stops working.

### Step 3: Open Chrome's extensions page

Click the address bar at the top of Chrome, type `chrome://extensions`, and press **Enter**.

### Step 4: Turn on Developer mode

In the top-right corner of that page, switch **Developer mode** on. Three new buttons appear at the top left.

### Step 5: Load the extension

1. Click **Load unpacked**.
2. Choose the **page-timer** folder. It's the one that has `manifest.json` directly inside it.
3. Click **Select Folder** (Windows) or **Open** (Mac).

**Page Timer** now shows up in your list of extensions, switched on.

### Step 6: Refresh your tabs

The timer only appears on pages loaded after you install, so refresh any tabs that were already open. You should see the timer in the top-right corner of the page.

Tip: click the puzzle-piece icon in Chrome's toolbar and pin **Page Timer** so its icon is always visible.

---

## How to use it

| Button | What it does |
|---|---|
| Play / pause | Starts and stops the timer |
| Circular arrow | Resets the timer to zero |
| Cursor with a number (Wikipedia only) | Shows your total link clicks. Click it to see each link and how many times you clicked it |
| Sun / moon | Switches between light mode and dark mode |
| Palette | Lets you pick your own background and text colors |

- **Move it:** click and drag the timer bar anywhere on the page.
- **Hide or show it:** click the Page Timer icon in Chrome's toolbar.
- **Clear your Wikipedia counts:** open the click list and click the trash can.

---

## Something not working?

**"Manifest file is missing or unreadable."** You picked the wrong folder. Open the `page-timer` folder and make sure you can see `manifest.json` inside it, then try **Load unpacked** again.

**I don't see the timer.** Refresh the page. The timer can't appear on Chrome's own pages (like `chrome://extensions`) or on the Chrome Web Store. If you still don't see it, click the Page Timer icon in the toolbar, since it may have been hidden.

**Chrome says it has disabled developer mode extensions.** This warning can appear when Chrome starts. Keep the extension turned on (don't click **Disable**).

---

## Updating to a new version

1. Download the newest `page-timer.zip` from **Releases** and unzip it.
2. Replace the files in your old `page-timer` folder with the new ones.
3. Go to `chrome://extensions` and click the circular reload arrow on the Page Timer card.

---

## Privacy

Nothing leaves your computer. Your timer, colors, and Wikipedia link counts are saved only in your browser. There are no accounts, ads, or tracking.
