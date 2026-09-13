'use strict';

// Draw directly from the map data: no screenshot service, DOM capture, or grid.
(function() {
  const PALETTES = {
    light: {
      default:{ink:'#243c31',muted:'#7b857e',green:'#365d46',line:'#e3e7df',paper:'#f7f8f5',surface:'#fff',soft:'#eaf0de',map:'#f9fbf7'},
      amber:{ink:'#3b3026',muted:'#8a7a6d',green:'#986133',line:'#e9e1d7',paper:'#faf7f2',surface:'#fffdfa',soft:'#f4e6d3',map:'#fcfaf6'},
      rose:{ink:'#3b2c31',muted:'#89767c',green:'#8d5966',line:'#eadfe1',paper:'#faf6f7',surface:'#fffdfd',soft:'#f3e1e5',map:'#fcf9fa'},
      violet:{ink:'#332f3d',muted:'#81798d',green:'#6d5d8b',line:'#e4deea',paper:'#f8f6fa',surface:'#fff',soft:'#e9e2f1',map:'#fbf9fc'},
      teal:{ink:'#243735',muted:'#718581',green:'#3f7169',line:'#dbe6e3',paper:'#f5f8f7',surface:'#fcfefd',soft:'#dcece8',map:'#f8fbfa'},
      slate:{ink:'#27333f',muted:'#75818e',green:'#4e6c87',line:'#dde4eb',paper:'#f5f7f9',surface:'#fcfdff',soft:'#e0e8ef',map:'#f8fafc'}
    },
    dark: {
      default:{ink:'#e1e7f0',muted:'#a7b3c5',green:'#a9bfe5',line:'#36445b',paper:'#171e2b',surface:'#202b3c',soft:'#26354a',map:'#1b2534'},
      amber:{ink:'#f0e5da',muted:'#c5b3a2',green:'#d9a268',line:'#514235',paper:'#241d17',surface:'#30261e',soft:'#3a2c21',map:'#291f19'},
      rose:{ink:'#ebe7ea',muted:'#b7adb2',green:'#c78f9d',line:'#3f414a',paper:'#191d25',surface:'#222832',soft:'#30272d',map:'#1c2028'},
      violet:{ink:'#eae5f2',muted:'#b9afc8',green:'#b8a5da',line:'#443b59',paper:'#1f1b29',surface:'#2a2437',soft:'#302941',map:'#241f30'},
      teal:{ink:'#e0ecea',muted:'#a6c0bc',green:'#82bdb4',line:'#34504c',paper:'#162221',surface:'#1e302e',soft:'#233936',map:'#192825'},
      slate:{ink:'#e2e9f0',muted:'#aab7c5',green:'#91b0ce',line:'#384a5d',paper:'#18202a',surface:'#222e3a',soft:'#283848',map:'#1c2732'}
    }
  };
  const SWATCHES = {rose:'#a96674',default:'#66835e',amber:'#b9773f',violet:'#77649b',teal:'#4f827a',slate:'#587691'};
  const PALETTE_NAMES = {rose:'Rose',default:'Green',amber:'Amber',violet:'Violet',teal:'Teal',slate:'Slate'};
  const DARK_CATEGORIES = {
    home:'#a6bce4',free:'#839fc9',live:'#839fc9',document:'#80aaaf',permit:'#80aaaf',
    arrival:'#c3b78b',online:'#a39dc4',conditional:'#b9a6d1',required:'#baa698',restricted:'#bf929e',unknown:'#3b485e'
  };
  let lastRenderInput, exportChoice, customExportFile, customExportUrl, controls, controlsBusy = 0;

  const clamp = value => Math.max(0, Math.min(255, Math.round(value)));
  const hexToRgb = value => {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(value || ''));
    return match ? [0, 2, 4].map(index => Number.parseInt(match[1].slice(index, index + 2), 16)) : [0, 0, 0];
  };
  const rgbToHex = rgb => '#' + rgb.map(value => clamp(value).toString(16).padStart(2, '0')).join('');
  const mix = (a, amount, b) => {
    const from = hexToRgb(a), to = hexToRgb(b);
    return rgbToHex(from.map((value, index) => value * amount + to[index] * (1 - amount)));
  };
  const validTheme = value => value === 'dark' ? 'dark' : 'light';
  const validPalette = value => PALETTES.light[value] ? value : 'rose';
  const currentThemeName = () => validTheme(document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const currentPaletteName = () => validPalette(document.documentElement.dataset.palette || 'rose');

  function explicitTheme(settings) {
    const theme = validTheme(settings?.theme), paletteName = validPalette(settings?.palette);
    const source = PALETTES[theme][paletteName];
    const categories = {...Object.fromEntries(Object.entries(PortpassRules.categories).map(([key, value]) => [key, value.color]))};
    if (theme === 'dark') Object.assign(categories, DARK_CATEGORIES);
    categories.unknown = mix(source.green, theme === 'dark' ? .18 : .13, theme === 'dark' ? source.surface : source.paper);
    return {
      settings: {theme, palette: paletteName},
      palette: {
        paper: source.paper, surface: source.surface, ink: source.ink, muted: source.muted,
        line: source.line, accent: source.green, map: source.map, highlight: source.soft,
        warning: theme === 'dark' ? '#f1a58d' : '#a55b48'
      },
      categoryColor: key => categories[key] || PortpassRules.categories[key]?.color || categories.unknown
    };
  }
  function liveTheme() {
    const fallback = explicitTheme({theme: currentThemeName(), palette: currentPaletteName()});
    const root = getComputedStyle(document.documentElement);
    const token = key => root.getPropertyValue(key).trim();
    const mapContainer = document.querySelector('#map-container');
    const firstStat = document.querySelector('.stat');
    const palette = {
      paper: token('--paper') || fallback.palette.paper,
      surface: token('--surface') || fallback.palette.surface,
      ink: token('--ink') || fallback.palette.ink,
      muted: token('--muted') || fallback.palette.muted,
      line: token('--line') || fallback.palette.line,
      accent: token('--green') || fallback.palette.accent,
      map: mapContainer ? getComputedStyle(mapContainer).backgroundColor : fallback.palette.map,
      highlight: firstStat ? getComputedStyle(firstStat).backgroundColor : fallback.palette.highlight,
      warning: token('--warning') || fallback.palette.warning
    };
    return {settings: fallback.settings, palette, categoryColor: key => token(`--category-${key}`) || fallback.categoryColor(key)};
  }

  async function create({features, results, wallet, counters, categories, mode, exportTheme}) {
    lastRenderInput = {features, results, wallet, counters, categories, mode};
    const theme = exportTheme ? explicitTheme(exportTheme) : liveTheme();
    const palette = theme.palette;
    const categoryColor = key => theme.categoryColor(key);
    const width = 1800, sidebarWidth = 480, left = 16, right = 512, mapWidth = 1272;
    const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image export is unavailable in this browser.');
    const text = (value, x, y, size = 18, color = palette.ink, weight = 400, family = font) => {
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.fillStyle = color;
      ctx.fillText(String(value), x, y);
    };
    const lines = (value, maxWidth, size = 18, weight = 400) => {
      ctx.font = `${weight} ${size}px ${font}`;
      const output = []; let line = '';
      for (const word of String(value).split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > maxWidth) { output.push(line); line = word; }
        else line = next;
      }
      if (line) output.push(line);
      return output;
    };
    const walletRows = wallet.map(doc => {
      const title = lines(doc.title, sidebarWidth - 48, 30, 600);
      const detail = lines(doc.detail, sidebarWidth - 48, 23);
      const warning = doc.inactive ? lines('Expired or no active passport', sidebarWidth - 48, 21) : [];
      return {...doc, title, detail, warning, height: title.length * 36 + detail.length * 29 + warning.length * 27 + 18};
    });
    const walletHeight = 82 + (walletRows.length ? walletRows.reduce((sum, doc) => sum + doc.height, 0) : 58);
    const counterRows = counters.map(counter => ({...counter, labelLines: lines(counter.label, sidebarWidth - 48, 24)}));
    const minimumCounterHeights = counterRows.map(counter => 102 + counter.labelLines.length * 29);
    const sidebarHeight = walletHeight + 58 + minimumCounterHeights.reduce((sum, h) => sum + h, 0) + (counters.length - 1) * 12;
    const legendRows = Math.ceil(categories.length / 2);
    const legendHeight = 44 + legendRows * 34;
    const height = Math.max(820, 32 + 590 + legendHeight, sidebarHeight + 32);
    const counterExtra = (height - 32 - sidebarHeight) / counters.length;
    // Stay within common mobile canvas limits, including unusually large wallets.
    const scale = Math.min(1.5, 4096 / width, 8192 / height, Math.sqrt(16000000 / (width * height)));
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    ctx.scale(scale, scale);
    ctx.textBaseline = 'top';
    const box = (x, y, w, h, fill = palette.surface, radius = 16) => {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = palette.line; ctx.lineWidth = 1; ctx.stroke();
    };
    ctx.fillStyle = palette.paper; ctx.fillRect(0, 0, width, height);
    let y = 16;
    box(left, y, sidebarWidth, walletHeight);
    text('Your travel wallet', left + 24, y + 22, 32, palette.ink, 600);
    ctx.textAlign = 'right'; text(wallet.length, left + sidebarWidth - 24, y + 26, 25, palette.muted); ctx.textAlign = 'left';
    let rowY = y + 76;
    if (!walletRows.length) text('No documents added', left + 24, rowY, 25, palette.muted);
    for (const row of walletRows) {
      let baseline = rowY;
      for (const line of row.title) { text(line, left + 24, baseline, 30, palette.ink, 600); baseline += 36; }
      for (const line of row.detail) { text(line, left + 24, baseline + 2, 23, palette.muted); baseline += 29; }
      for (const line of row.warning) { text(line, left + 24, baseline + 4, 21, palette.warning); baseline += 27; }
      rowY += row.height;
    }
    y += walletHeight + 18;
    text('Your possibilities', left + 4, y, 30, palette.ink, 600);
    ctx.textAlign = 'right'; text(mode === 'visit' ? 'VISIT' : 'LIVE', left + sidebarWidth - 4, y + 7, 20, palette.accent, 600); ctx.textAlign = 'left';
    y += 40;
    for (const [index, counter] of counterRows.entries()) {
      const counterHeight = minimumCounterHeights[index] + counterExtra;
      box(left, y, sidebarWidth, counterHeight, index === 0 ? palette.highlight : palette.surface);
      let labelY = y + 18;
      for (const line of counter.labelLines) { text(line, left + 24, labelY, 24, palette.muted); labelY += 29; }
      const numberY = y + counterHeight - 80;
      text(counter.count, left + 24, numberY, 58, palette.ink, 600);
      text('destinations', left + 150, numberY + 28, 24, palette.muted);
      y += counterHeight + 12;
    }

    const mapY = 16, mapHeight = height - 32;
    box(right, mapY, mapWidth, mapHeight, palette.map, 18);
    const collection = {type: 'FeatureCollection', features: features.filter(f => f.properties.code !== 'AQ')};
    // Reserve a compact footer inside the map for the legend and wordmark.
    const footerY = height - 16 - legendHeight;
    const projection = d3.geoNaturalEarth1().fitExtent([[right + 14, mapY + 14], [right + mapWidth - 14, footerY - 12]], collection);
    const path = d3.geoPath(projection, ctx);
    ctx.save(); ctx.beginPath(); ctx.rect(right, mapY, mapWidth, mapHeight); ctx.clip();
    for (const feature of collection.features) {
      ctx.beginPath(); path(feature);
      ctx.fillStyle = categoryColor(results[feature.properties.code]?.category || 'unknown'); ctx.fill();
      ctx.strokeStyle = palette.map; ctx.lineWidth = .8; ctx.stroke();
    }
    ctx.restore();
    const keyX = right + 24;
    text('MAP KEY', keyX, footerY + 2, 20, palette.accent, 600);
    categories.forEach((key, index) => {
      const x = keyX + (index % 2) * 370;
      const rowY = footerY + 36 + Math.floor(index / 2) * 34;
      ctx.fillStyle = categoryColor(key); ctx.beginPath(); ctx.roundRect(x, rowY + 3, 20, 20, 4); ctx.fill();
      text(PortpassRules.categories[key].label, x + 30, rowY, 22, palette.ink);
    });
    ctx.textAlign = 'right';
    const brandRight = right + mapWidth - 24, brandY = height - 124;
    ctx.font = `700 45px ${font}`;
    const brandWidth = ctx.measureText('portpass.world').width;
    const domainWidth = ctx.measureText('.world').width;
    const markX = brandRight - brandWidth - 32;
    const markY = brandY + 26;
    ctx.save(); ctx.strokeStyle = palette.ink; ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let spoke = 0; spoke < 4; spoke++) {
      const angle = spoke * Math.PI / 4;
      const dx = Math.cos(angle) * 18, dy = Math.sin(angle) * 18;
      ctx.moveTo(markX - dx, markY - dy); ctx.lineTo(markX + dx, markY + dy);
    }
    ctx.stroke(); ctx.restore();
    text('portpass', brandRight - domainWidth, brandY, 45, palette.ink, 700);
    text('.world', brandRight, brandY, 45, palette.muted, 600);
    text('portpass.world', right + mapWidth - 24, height - 66, 25, palette.muted);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not create the JPEG.')), 'image/jpeg', .94));
    return new File([blob], `portpass-world-${mode}-map.jpg`, {type: 'image/jpeg'});
  }

  function resetExportChoice() {
    exportChoice = {theme: currentThemeName(), palette: currentPaletteName()};
    customExportFile = null;
    if (customExportUrl) URL.revokeObjectURL(customExportUrl);
    customExportUrl = null;
    updateControls();
  }
  function applyCustomExport(file) {
    const preview = document.querySelector('#share-preview');
    const download = document.querySelector('#download-map');
    const share = document.querySelector('#share-image');
    if (customExportUrl) URL.revokeObjectURL(customExportUrl);
    customExportFile = file;
    customExportUrl = URL.createObjectURL(file);
    if (preview) { preview.src = customExportUrl; preview.hidden = false; }
    if (download) { download.href = customExportUrl; download.download = file.name; download.hidden = false; }
    if (share) {
      let canShare = false;
      try { canShare = !!navigator.share && !!navigator.canShare?.({files: [file]}); } catch {}
      share.hidden = !canShare;
      share.disabled = false;
    }
  }
  function updateControls() {
    if (!controls || !exportChoice) return;
    controls.querySelectorAll('[data-export-theme]').forEach(button => {
      const active = button.dataset.exportTheme === exportChoice.theme;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    controls.querySelectorAll('[data-export-palette]').forEach(button => {
      const active = button.dataset.exportPalette === exportChoice.palette;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  async function regenerateExport() {
    if (!lastRenderInput || !exportChoice) return;
    const generation = ++controlsBusy;
    const status = document.querySelector('#share-status');
    if (status) status.textContent = 'Updating your JPEG…';
    controls?.setAttribute('aria-busy', 'true');
    try {
      const file = await create({...lastRenderInput, exportTheme: exportChoice});
      if (generation !== controlsBusy) return;
      applyCustomExport(file);
      if (status) status.textContent = 'Your JPEG is ready.';
    } catch (error) {
      if (generation === controlsBusy && status) status.textContent = 'Could not update your map theme. Try another option.';
      console.error(error);
    } finally {
      if (generation === controlsBusy) controls?.setAttribute('aria-busy', 'false');
    }
  }
  function ensurePreviewFrame() {
    const preview = document.querySelector('#share-preview');
    if (!preview) return null;
    const existing = preview.closest('.share-preview-frame');
    if (existing) return existing;
    const frame = document.createElement('figure');
    frame.className = 'share-preview-frame';
    frame.setAttribute('aria-label', 'Generated JPEG preview');
    preview.parentNode.insertBefore(frame, preview);
    frame.appendChild(preview);
    return frame;
  }
  function ensureControls() {
    if (controls) return controls;
    const preview = document.querySelector('#share-preview');
    const frame = ensurePreviewFrame();
    if (!preview || !frame) return null;
    const section = document.createElement('section');
    section.id = 'export-theme-controls';
    section.className = 'export-theme-controls';
    section.hidden = true;
    section.innerHTML = `<div class="export-theme-head"><div><strong>Image theme</strong><small>Only changes this JPEG.</small></div><div class="export-theme-mode" aria-label="JPEG colour mode"><button type="button" data-export-theme="light" aria-pressed="false">Light</button><button type="button" data-export-theme="dark" aria-pressed="false">Dark</button></div></div><div class="export-palette-picker" aria-label="JPEG accent colour">${Object.keys(SWATCHES).map(key => `<button type="button" data-export-palette="${key}" style="--swatch:${SWATCHES[key]}" aria-label="${PALETTE_NAMES[key]} accent" aria-pressed="false"></button>`).join('')}</div>`;
    section.addEventListener('click', event => {
      const themeButton = event.target.closest('[data-export-theme]');
      const paletteButton = event.target.closest('[data-export-palette]');
      if (!themeButton && !paletteButton) return;
      if (themeButton) exportChoice.theme = validTheme(themeButton.dataset.exportTheme);
      if (paletteButton) exportChoice.palette = validPalette(paletteButton.dataset.exportPalette);
      updateControls();
      regenerateExport();
    });
    frame.insertAdjacentElement('afterend', section);
    controls = section;
    updateControls();
    return controls;
  }
  function showControlsWhenReady() {
    const preview = document.querySelector('#share-preview');
    const section = ensureControls();
    if (preview?.getAttribute('src') && !preview.hidden && section) {
      if (!exportChoice) resetExportChoice();
      section.hidden = false;
      updateControls();
    }
  }
  function polishShareDialog() {
    const shareDialog = document.querySelector('#share-dialog');
    const heading = shareDialog?.querySelector('.dialog-heading');
    const download = document.querySelector('#download-map');
    const shareImage = document.querySelector('#share-image');
    const close = heading?.querySelector('.close');
    if (!shareDialog || !heading || !download) return;
    shareDialog.classList.add('share-dialog-polished');
    shareDialog.querySelectorAll(':scope > p').forEach(paragraph => paragraph.classList.add('share-dialog-hidden-copy'));
    const status = document.querySelector('#share-status');
    if (status) status.classList.add('share-dialog-hidden-copy');
    let actions = heading.querySelector('.share-top-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'share-top-actions';
      if (close) heading.insertBefore(actions, close);
      else heading.appendChild(actions);
    }
    actions.appendChild(download);
    if (shareImage) actions.appendChild(shareImage);
    ensurePreviewFrame();
  }
  function initExportControls() {
    const shareMap = document.querySelector('#share-map');
    const shareDialog = document.querySelector('#share-dialog');
    const preview = document.querySelector('#share-preview');
    const shareImage = document.querySelector('#share-image');
    if (!shareMap || !shareDialog || !preview) return;
    const style = document.createElement('style');
    style.textContent = `#share-dialog.share-dialog-polished{width:min(920px,calc(100vw - 32px));max-height:calc(100dvh - 40px);overflow:hidden;padding:22px 24px}#share-dialog.share-dialog-polished[open]{display:grid;grid-template-rows:auto minmax(0,1fr) auto}#share-dialog.share-dialog-polished .dialog-heading{align-items:center;gap:12px;margin-bottom:14px}#share-dialog.share-dialog-polished .dialog-heading>div{min-width:0}#share-dialog.share-dialog-polished .close{width:34px;height:34px;display:grid;place-items:center;flex:0 0 auto}#share-dialog.share-dialog-polished .share-top-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:nowrap;justify-content:flex-end}#share-dialog.share-dialog-polished .share-top-actions a,#share-dialog.share-dialog-polished .share-top-actions button{display:inline-flex!important;align-items:center;justify-content:center;width:auto!important;min-height:34px;margin:0!important;padding:8px 13px;border:1px solid var(--line);border-radius:8px;background:var(--palette-soft-2,#f0f2ed);color:var(--ink);font-size:11px;text-decoration:none;white-space:nowrap;flex:0 0 auto}#share-dialog.share-dialog-polished .share-top-actions a{background:var(--green);border-color:var(--green);color:var(--surface);font-weight:600}html:root[data-theme="dark"] #share-dialog.share-dialog-polished .share-top-actions a{color:var(--paper)}#share-dialog.share-dialog-polished .share-dialog-hidden-copy{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;border:0!important}#share-dialog.share-dialog-polished .share-preview-frame{min-width:0;min-height:0;width:100%;overflow:hidden;display:grid;place-items:center;margin:0;padding:10px;border:1px solid color-mix(in srgb,var(--ink) 12%,var(--line));border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--surface) 72%,var(--paper)),var(--surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--surface) 65%,transparent),0 10px 28px color-mix(in srgb,var(--ink) 9%,transparent)}#share-dialog.share-dialog-polished #share-preview{display:block;max-width:100%;max-height:min(50dvh,460px);width:auto;height:auto;margin:auto;border:1px solid color-mix(in srgb,var(--ink) 16%,var(--line));border-radius:8px;background:var(--paper);box-shadow:0 7px 22px color-mix(in srgb,var(--ink) 12%,transparent);object-fit:contain}#share-dialog.share-dialog-polished #share-preview[hidden]{display:none}#share-dialog.share-dialog-polished .export-theme-controls{margin:10px 0 0;padding:9px 11px;border:1px solid var(--line);border-radius:11px;background:color-mix(in srgb,var(--surface) 92%,var(--paper));color:var(--ink)}.export-theme-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.export-theme-head strong{display:block;font-size:11px}.export-theme-head small{display:block;margin-top:3px;color:var(--muted);font-size:9px}.export-theme-mode{border:1px solid var(--line);background:var(--palette-soft-3,#ecefe8);padding:3px;border-radius:8px;display:flex;gap:3px}.export-theme-mode button{padding:7px 12px;border-radius:6px;font-size:10px;color:var(--muted)}.export-theme-mode button.active{background:var(--surface);color:var(--ink);box-shadow:0 2px 5px #25372b0b}.export-palette-picker{display:flex;justify-content:center;gap:8px;margin-top:8px}.export-palette-picker button{width:18px;height:18px;min-width:18px;padding:0;border-radius:50%;border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);background:var(--swatch);box-shadow:0 0 0 2px transparent}.export-palette-picker button.active{box-shadow:0 0 0 2px var(--surface),0 0 0 4px color-mix(in srgb,var(--ink) 48%,transparent)}.export-theme-controls[aria-busy="true"] button{opacity:.55;pointer-events:none}@media(max-width:720px){#share-dialog.share-dialog-polished{padding:18px;width:min(100vw - 22px,620px)}#share-dialog.share-dialog-polished .dialog-heading{align-items:flex-start;flex-wrap:wrap}#share-dialog.share-dialog-polished .share-top-actions{order:3;width:100%;justify-content:flex-start;margin-left:0;flex-wrap:wrap}#share-dialog.share-dialog-polished #share-preview{max-height:40dvh}#share-dialog.share-dialog-polished .share-preview-frame{padding:8px}.export-theme-head{align-items:flex-start;flex-direction:column}.export-theme-mode{width:100%}.export-theme-mode button{flex:1}}`;
    document.head.appendChild(style);
    polishShareDialog();
    shareMap.addEventListener('click', resetExportChoice, true);
    shareDialog.addEventListener('close', () => {
      controlsBusy++;
      if (customExportUrl) URL.revokeObjectURL(customExportUrl);
      customExportFile = customExportUrl = null;
      if (controls) controls.hidden = true;
      exportChoice = null;
    });
    new MutationObserver(showControlsWhenReady).observe(preview, {attributes: true, attributeFilter: ['src', 'hidden']});
    if (shareImage) shareImage.addEventListener('click', async event => {
      if (!customExportFile) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      shareImage.disabled = true;
      try {
        await navigator.share({files: [customExportFile], title: 'My Portpass map'});
        const status = document.querySelector('#share-status');
        if (status) status.textContent = 'Map shared.';
      } catch (error) {
        const status = document.querySelector('#share-status');
        if (status) status.textContent = error.name === 'AbortError'
          ? 'Sharing cancelled. Your JPEG is still ready to download.'
          : 'Sharing is unavailable. Use Download JPEG to save your map.';
      } finally {
        shareImage.disabled = false;
      }
    }, true);
  }

  window.PortpassMapExport = {create};
  document.addEventListener('DOMContentLoaded', initExportControls);
})();
