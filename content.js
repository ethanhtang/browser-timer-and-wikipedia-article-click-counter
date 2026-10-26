(() => {
  'use strict';

  // Only run in the top-level page, and only once.
  if (window.top !== window) return;
  if (document.getElementById('page-timer-host')) return;

  const KEY = 'pageTimer';
  const CLICK_KEY = 'pageTimerClicks';
  const IS_WIKI = /(^|\.)wikipedia\.org$/.test(location.hostname);
  const ID = Math.random().toString(36).slice(2); // identifies writes made by this tab

  const DEFAULT_COLORS = {
    dark: { bg: '#000000', text: '#ffffff' },
    light: { bg: '#ffffff', text: '#1a1a1a' },
  };

  const DEFAULT_STATE = {
    theme: 'dark',
    custom: { dark: null, light: null }, // per-mode color overrides
    timer: { running: false, startedAt: 0, elapsed: 0 },
    visible: true,
    pos: { right: 16, top: 16 },
  };

  const svg = (inner, cls = '') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;

  const ICONS = {
    play: svg('<polygon points="6 3 20 12 6 21 6 3"/>', 'play'),
    pause: svg('<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>'),
    reset: svg('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
    moon: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    palette: svg('<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>'),
    bucket: svg('<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/>'),
    type: svg('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>'),
    pointer: svg('<path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>'),
    trash: svg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>'),
    undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>'),
  };

  const CSS = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }

    .wrap {
      --line: color-mix(in srgb, var(--fg) 24%, transparent);
      --hover: color-mix(in srgb, var(--fg) 14%, transparent);
      position: relative;
      color: var(--fg);
      font: 600 18px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }

    .bar, .panel {
      display: flex;
      align-items: center;
      gap: 2px;
      background: var(--bg);
      color: var(--fg);
      border: 1px solid var(--line);
      border-radius: 14px;
      box-shadow: 0 8px 28px rgba(0, 0, 0, .28);
    }

    .bar {
      padding: 5px 6px 5px 14px;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    .bar.dragging { cursor: grabbing; }

    .time {
      min-width: 9ch;
      margin-right: 8px;
      letter-spacing: .02em;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .ms {
      font-size: 13px;
      font-weight: 500;
      opacity: .7;
    }

    .panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      padding: 5px;
      animation: pop .14s ease-out;
    }
    .wrap.up .panel {
      top: auto;
      bottom: calc(100% + 8px);
      --from: 4px;
    }

    button, .chip {
      appearance: none;
      position: relative;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition: background-color .12s;
    }
    button:hover, .chip:hover { background: var(--hover); }
    button:focus-visible, .chip:has(input:focus-visible) {
      outline: 2px solid var(--fg);
      outline-offset: -2px;
    }

    .primary {
      margin-right: 4px;
      border-radius: 50%;
      background: var(--fg);
      color: var(--bg);
    }
    .primary:hover { background: var(--fg); opacity: .85; }
    .primary svg { width: 13px; height: 13px; fill: currentColor; }
    .primary svg.play { transform: translateX(1px); }

    .chip input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      opacity: 0;
      cursor: pointer;
    }

    svg {
      display: block;
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }

    .count {
      width: auto;
      min-width: 34px;
      margin: 0 3px;
      padding: 0 11px 0 9px;
      grid-auto-flow: column;
      gap: 6px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: color-mix(in srgb, var(--fg) 16%, transparent);
      font-size: 15px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      isolation: isolate;
    }
    .count::after {
      content: "";
      position: absolute;
      inset: -1px;
      z-index: -1;
      border-radius: inherit;
      background: var(--fg);
      opacity: 0;
      pointer-events: none;
    }
    .count:hover { background: color-mix(in srgb, var(--fg) 26%, transparent); }
    .count svg { width: 16px; height: 16px; }

    .count.hit { animation: hit .6s ease-out; }
    .count.hit::after { animation: flash .6s ease-out; }
    .plus {
      position: absolute;
      top: -9px;
      right: -5px;
      padding: 2px 6px;
      border-radius: 999px;
      background: var(--fg);
      color: var(--bg);
      box-shadow: 0 0 0 2px var(--bg);
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      opacity: 0;
      pointer-events: none;
    }
    .count.hit .plus { animation: plus 1.5s ease-out; }
    @keyframes hit {
      0%   { transform: scale(1);   color: var(--bg); }
      30%  { transform: scale(1.2); color: var(--bg); }
      100% { transform: scale(1); }
    }
    @keyframes flash { 0%, 30% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes plus {
      0%   { opacity: 0; transform: translateY(5px) scale(.8); }
      15%  { opacity: 1; transform: none; }
      75%  { opacity: 1; transform: none; }
      100% { opacity: 0; transform: translateY(-5px); }
    }
    @keyframes plusfade { 0% { opacity: 1; } 100% { opacity: 0; } }

    .list {
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      width: 300px;
      max-height: min(340px, 55vh);
      padding: 10px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--line) transparent;
    }
    .head { display: flex; align-items: baseline; gap: 8px; padding: 2px 6px 10px; }
    .big { font-size: 32px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
    .sub { font-size: 14px; font-weight: 500; opacity: .75; }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 5px 12px;
      padding: 7px 6px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.25;
    }
    .row:hover { background: var(--hover); }
    .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .n {
      min-width: 28px;
      padding: 2px 9px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--fg) 16%, transparent);
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .meter {
      grid-column: 1 / -1;
      height: 3px;
      border-radius: 3px;
      background: color-mix(in srgb, var(--fg) 14%, transparent);
      overflow: hidden;
    }
    .meter i { display: block; height: 100%; border-radius: 3px; background: var(--fg); }
    .empty { margin: 0; padding: 6px 4px; font-size: 14px; font-weight: 500; line-height: 1.35; opacity: .8; }
    .clear { align-self: flex-end; position: sticky; bottom: 0; margin-top: 4px; background: var(--bg); }
    .clear:hover { background: color-mix(in srgb, var(--fg) 14%, var(--bg)); }

    @keyframes pop {
      from { opacity: 0; transform: translateY(calc(var(--from, -4px) * -1)); }
      to   { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel { animation: none; }
      button, .chip { transition: none; }
      .count.hit, .count.hit::after { animation: none; }
      .count.hit .plus { animation: plusfade 1.5s steps(1, end); }
    }
  `;

  const HTML = `
    <div class="wrap" id="wrap">
      <div class="bar" id="bar">
        <span class="time" id="time" role="timer"><span id="timeMain">00:00</span><span class="ms" id="timeMs">.000</span></span>
        <button class="primary" id="toggle" type="button"></button>
        <button id="reset" type="button" title="Reset" aria-label="Reset">${ICONS.reset}</button>
        <button id="clicks" class="count" type="button" title="Wikipedia link clicks" aria-label="Wikipedia link clicks" aria-expanded="false" hidden>${ICONS.pointer}<span id="clickCount">0</span><span class="plus" aria-hidden="true">+1</span></button>
        <button id="toLight" type="button" title="Switch to light mode" aria-label="Switch to light mode">${ICONS.sun}</button>
        <button id="toDark" type="button" title="Switch to dark mode" aria-label="Switch to dark mode">${ICONS.moon}</button>
        <button id="customize" type="button" title="Customize colors" aria-label="Customize colors" aria-expanded="false">${ICONS.palette}</button>
      </div>
      <div class="panel" id="panel" hidden>
        <label class="chip" title="Background color">${ICONS.bucket}<input id="bgColor" type="color" aria-label="Background color"></label>
        <label class="chip" title="Text color">${ICONS.type}<input id="textColor" type="color" aria-label="Text color"></label>
        <button id="restore" type="button" title="Restore default colors" aria-label="Restore default colors">${ICONS.undo}</button>
      </div>
      <div class="panel list" id="list" hidden></div>
    </div>
  `;

  // ---------- state ----------

  const normalize = (s) => ({
    ...DEFAULT_STATE,
    ...(s || {}),
    custom: { ...DEFAULT_STATE.custom, ...((s && s.custom) || {}) },
    timer: { ...DEFAULT_STATE.timer, ...((s && s.timer) || {}) },
    pos: { ...DEFAULT_STATE.pos, ...((s && s.pos) || {}) },
  });

  const normalizeClicks = (c) => ({
    total: Number((c && c.total) || 0),
    links: { ...((c && c.links) || {}) },
    lastAt: Number((c && c.lastAt) || 0),
  });

  let state = normalize(null);
  let clicks = normalizeClicks(null);
  let host, root, el;
  let ticker = null;
  let colorSaveTimer = null;
  let drag = null;
  let lastRunning = null;

  const alive = () => {
    try { return !!chrome.runtime.id; } catch (_) { return false; }
  };

  async function save(patch) {
    if (!alive()) { teardown(); return; }
    try {
      const stored = (await chrome.storage.local.get(KEY))[KEY];
      await chrome.storage.local.set({ [KEY]: { ...normalize(stored), ...patch, src: ID } });
    } catch (_) { /* extension was reloaded; nothing to do */ }
  }

  function teardown() {
    cancelAnimationFrame(ticker);
    ticker = null;
    if (host) host.remove();
  }

  // ---------- timer ----------

  const pad = (n) => String(n).padStart(2, '0');

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return {
      main: h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`,
      ms: `.${String(Math.floor(ms % 1000)).padStart(3, '0')}`,
    };
  }

  const elapsedMs = () => {
    const t = state.timer;
    return t.elapsed + (t.running ? Date.now() - t.startedAt : 0);
  };

  function updateTime() {
    if (!alive()) { teardown(); return; }
    const t = formatTime(elapsedMs());
    if (el.timeMain.textContent !== t.main) el.timeMain.textContent = t.main;
    el.timeMs.textContent = t.ms;
  }

  function frame() {
    updateTime();
    ticker = requestAnimationFrame(frame);
  }

  function syncTicker() {
    if (state.timer.running && !ticker) {
      ticker = requestAnimationFrame(frame);
    } else if (!state.timer.running && ticker) {
      cancelAnimationFrame(ticker);
      ticker = null;
    }
  }

  function toggleTimer() {
    const t = state.timer;
    state.timer = t.running
      ? { running: false, startedAt: 0, elapsed: t.elapsed + (Date.now() - t.startedAt) }
      : { running: true, startedAt: Date.now(), elapsed: t.elapsed };
    render();
    save({ timer: state.timer });
  }

  function resetTimer() {
    state.timer = { running: false, startedAt: 0, elapsed: 0 };
    render();
    save({ timer: state.timer });
  }

  // ---------- colors ----------

  const colors = () => ({ ...DEFAULT_COLORS[state.theme], ...(state.custom[state.theme] || {}) });

  function setTheme(theme) {
    state.theme = theme;
    render();
    save({ theme });
  }

  function setColor(key, value) {
    state.custom[state.theme] = { ...colors(), [key]: value };
    render();
    clearTimeout(colorSaveTimer);
    colorSaveTimer = setTimeout(() => save({ custom: state.custom }), 200);
  }

  function restoreColors() {
    state.custom[state.theme] = null;
    render();
    save({ custom: state.custom });
  }

  // ---------- position ----------

  const viewW = () => document.documentElement.clientWidth;
  const viewH = () => window.innerHeight;
  const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), Math.max(lo, hi));

  function setHost(prop, value) {
    host.style.setProperty(prop, value, 'important');
  }

  function applyPos(pos) {
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    const right = clamp(pos.right, 0, viewW() - w);
    const top = clamp(pos.top, 0, viewH() - h);
    setHost('right', `${right}px`);
    setHost('top', `${top}px`);
    return { right, top };
  }

  function placePanel() {
    const r = host.getBoundingClientRect();
    el.wrap.classList.toggle('up', r.bottom + 70 > viewH());
  }

  // ---------- panel ----------

  function closePanels() {
    if (!el) return;
    for (const [panel, button] of [[el.panel, el.customize], [el.list, el.clicks]]) {
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    }
  }

  function togglePanel(panel, button, onOpen) {
    const wasOpen = !panel.hidden;
    closePanels();
    if (wasOpen) return;
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    if (onOpen) onOpen();
    placePanel();
  }

  const anyPanelOpen = () => !el.panel.hidden || !el.list.hidden;

  // ---------- Wikipedia link clicks ----------

  function labelFor(url) {
    const m = url.hostname.match(/^([a-z0-9-]+)(?:\.m)?\.wikipedia\.org$/i);
    if (m) {
      let title = null;
      if (url.pathname.startsWith('/wiki/')) title = url.pathname.slice(6);
      else if (url.searchParams.get('title')) title = url.searchParams.get('title');
      if (title) {
        try { title = decodeURIComponent(title); } catch (_) { /* keep raw */ }
        title = title.replace(/_/g, ' ');
        return m[1].toLowerCase() === 'en' ? title : `${m[1]}: ${title}`;
      }
    }
    const text = url.hostname.replace(/^www\./, '') + (url.pathname === '/' ? '' : url.pathname);
    return text.length > 48 ? `${text.slice(0, 47)}…` : text;
  }

  function saveClicks() {
    if (!alive()) { teardown(); return; }
    try {
      const p = chrome.storage.local.set({ [CLICK_KEY]: { ...clicks, src: ID } });
      if (p && p.catch) p.catch(() => {});
    } catch (_) { /* extension was reloaded */ }
  }

  function recordClick(e) {
    if (!e.isTrusted) return;
    if (e.type === 'click' && e.button !== 0) return;
    if (e.type === 'auxclick' && e.button !== 1) return; // middle-click opens a new tab
    const path = e.composedPath();
    if (path.includes(host)) return; // ignore the timer's own buttons
    const a = path.find((n) => n.nodeName === 'A' && n.href);
    if (!a) return;

    let url;
    try { url = new URL(a.href); } catch (_) { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    if (url.href.split('#')[0] === location.href.split('#')[0]) return; // same-page jumps

    const key = `${url.protocol}//${url.host.replace(/\.m\./, '.')}${url.pathname}${url.search}`;
    const entry = clicks.links[key] || { label: labelFor(url), count: 0, last: 0 };
    entry.count += 1;
    entry.last = Date.now();
    clicks.links[key] = entry;
    clicks.total += 1;
    clicks.lastAt = Date.now();

    const keys = Object.keys(clicks.links);
    if (keys.length > 1000) {
      keys.sort((x, y) => clicks.links[x].last - clicks.links[y].last)
        .slice(0, 100)
        .forEach((k) => delete clicks.links[k]);
    }

    saveClicks();
    renderClicks();
    bumpClicks();
  }

  // Flash the counter. Also runs on the next page load, because following a
  // link reloads the page before the first flash can be seen.
  function bumpClicks() {
    if (!IS_WIKI || !el) return;
    el.clicks.classList.remove('hit');
    void el.clicks.offsetWidth; // restart the animation
    el.clicks.classList.add('hit');
  }

  function resetClicks() {
    clicks = normalizeClicks(null);
    saveClicks();
    renderClicks();
  }

  function renderList() {
    el.list.textContent = '';
    const entries = Object.entries(clicks.links)
      .sort((x, y) => y[1].count - x[1].count || y[1].last - x[1].last)
      .slice(0, 30);

    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Click a link on this page to start counting.';
      el.list.appendChild(empty);
      return;
    }

    const head = document.createElement('div');
    head.className = 'head';
    const big = document.createElement('span');
    big.className = 'big';
    big.textContent = String(clicks.total);
    const sub = document.createElement('span');
    sub.className = 'sub';
    sub.textContent = clicks.total === 1 ? 'link click' : 'link clicks';
    head.append(big, sub);
    el.list.appendChild(head);

    const max = entries[0][1].count;
    for (const [key, v] of entries) {
      const row = document.createElement('div');
      row.className = 'row';
      row.title = key;
      const label = document.createElement('span');
      label.className = 'lbl';
      label.textContent = v.label;
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = String(v.count);
      const meter = document.createElement('span');
      meter.className = 'meter';
      const fill = document.createElement('i');
      fill.style.width = `${Math.max(4, Math.round((v.count / max) * 100))}%`;
      meter.appendChild(fill);
      row.append(label, n, meter);
      el.list.appendChild(row);
    }

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'clear';
    clear.title = 'Clear click counts';
    clear.setAttribute('aria-label', 'Clear click counts');
    clear.innerHTML = ICONS.trash;
    clear.addEventListener('click', resetClicks);
    el.list.appendChild(clear);
  }

  function renderClicks() {
    if (!IS_WIKI || !el) return;
    el.clickCount.textContent = clicks.total > 999 ? '999+' : String(clicks.total);
    if (!el.list.hidden) renderList();
  }

  // ---------- render ----------

  function render() {
    const c = colors();
    el.wrap.style.setProperty('--bg', c.bg);
    el.wrap.style.setProperty('--fg', c.text);
    if (el.bgColor.value !== c.bg) el.bgColor.value = c.bg;
    if (el.textColor.value !== c.text) el.textColor.value = c.text;

    el.clicks.hidden = !IS_WIKI; // the click counter only appears on Wikipedia

    // Only the button for the *other* mode is shown.
    el.toLight.hidden = state.theme === 'light';
    el.toDark.hidden = state.theme === 'dark';

    const running = state.timer.running;
    if (running !== lastRunning) {
      lastRunning = running;
      el.toggle.innerHTML = running ? ICONS.pause : ICONS.play;
      el.toggle.title = running ? 'Pause' : 'Start';
      el.toggle.setAttribute('aria-label', running ? 'Pause' : 'Start');
    }

    if (state.visible) {
      host.style.removeProperty('display');
      applyPos(state.pos);
    } else {
      setHost('display', 'none');
      closePanels();
    }

    updateTime();
    syncTicker();
  }

  // ---------- build ----------

  function build() {
    host = document.createElement('div');
    host.id = 'page-timer-host';
    host.style.cssText =
      'all: initial !important; position: fixed !important; z-index: 2147483647 !important;';

    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>${HTML}`;

    const $ = (id) => root.getElementById(id);
    el = {
      wrap: $('wrap'), bar: $('bar'), timeMain: $('timeMain'), timeMs: $('timeMs'), toggle: $('toggle'),
      reset: $('reset'), toLight: $('toLight'), toDark: $('toDark'),
      customize: $('customize'), panel: $('panel'),
      clicks: $('clicks'), clickCount: $('clickCount'), list: $('list'),
      bgColor: $('bgColor'), textColor: $('textColor'), restore: $('restore'),
    };

    el.toggle.addEventListener('click', toggleTimer);
    el.reset.addEventListener('click', resetTimer);
    el.toLight.addEventListener('click', () => setTheme('light'));
    el.toDark.addEventListener('click', () => setTheme('dark'));
    el.customize.addEventListener('click', () => togglePanel(el.panel, el.customize));
    el.clicks.addEventListener('click', () => togglePanel(el.list, el.clicks, renderList));
    el.bgColor.addEventListener('input', (e) => setColor('bg', e.target.value));
    el.textColor.addEventListener('input', (e) => setColor('text', e.target.value));
    el.restore.addEventListener('click', restoreColors);

    // Drag the timer anywhere on the page by grabbing the bar (not the buttons).
    el.bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const r = host.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, right: viewW() - r.right, top: r.top, pos: null };
      el.bar.setPointerCapture(e.pointerId);
      el.bar.classList.add('dragging');
    });
    el.bar.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.pos = applyPos({
        right: drag.right - (e.clientX - drag.x),
        top: drag.top + (e.clientY - drag.y),
      });
      placePanel();
    });
    const endDrag = () => {
      if (!drag) return;
      el.bar.classList.remove('dragging');
      if (drag.pos) {
        state.pos = drag.pos;
        save({ pos: state.pos });
      }
      drag = null;
    };
    el.bar.addEventListener('pointerup', endDrag);
    el.bar.addEventListener('pointercancel', endDrag);

    // Close the color panel on outside click or Escape.
    document.addEventListener('pointerdown', (e) => {
      if (anyPanelOpen() && !e.composedPath().includes(host)) closePanels();
    }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && anyPanelOpen()) closePanels();
    });

    window.addEventListener('resize', () => {
      if (!state.visible) return;
      applyPos(state.pos);
      placePanel();
    });

    document.documentElement.appendChild(host);
  }

  // ---------- init ----------

  async function init() {
    try {
      const stored = (await chrome.storage.local.get(KEY))[KEY];
      state = normalize(stored);
    } catch (_) {
      return;
    }

    if (IS_WIKI) {
      try {
        clicks = normalizeClicks((await chrome.storage.local.get(CLICK_KEY))[CLICK_KEY]);
      } catch (_) { /* start from zero */ }
    }

    build();
    render();
    renderClicks();
    if (IS_WIKI && Date.now() - clicks.lastAt < 6000) bumpClicks();

    if (IS_WIKI) {
      document.addEventListener('click', recordClick, true);
      document.addEventListener('auxclick', recordClick, true);
    }

    // Keep every open tab in sync (timer, mode, colors, show/hide).
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (IS_WIKI && changes[CLICK_KEY]) {
        const c = changes[CLICK_KEY].newValue;
        if (c && c.src !== ID) {
          clicks = normalizeClicks(c);
          renderClicks();
        }
      }
      if (!changes[KEY]) return;
      const next = changes[KEY].newValue;
      if (!next || next.src === ID) return;
      state = { ...normalize(next), pos: state.pos }; // each tab keeps its own position
      render();
    });
  }

  init();
})();
