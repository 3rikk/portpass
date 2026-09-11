'use strict';

// Draw directly from the map data: no screenshot service, DOM capture, or grid.
window.PortpassMapExport = {
  async create({features, results, wallet, counters, categories, mode}) {
    const root = getComputedStyle(document.documentElement);
    const token = key => root.getPropertyValue(key).trim();
    const palette = {
      paper: token('--paper'), surface: token('--surface'), ink: token('--ink'),
      muted: token('--muted'), line: token('--line'), accent: token('--green'),
      map: getComputedStyle(document.querySelector('#map-container')).backgroundColor,
      highlight: getComputedStyle(document.querySelector('.stat')).backgroundColor,
      warning: matchMedia('(prefers-color-scheme: dark)').matches ? '#f1a58d' : '#a55b48'
    };
    const categoryColor = key => token(`--category-${key}`) || PortpassRules.categories[key].color;
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
    text('✳ portpass', right + mapWidth - 24, height - 124, 45, palette.ink, 700);
    text('portpass.erik-kunz.com', right + mapWidth - 24, height - 66, 25, palette.muted);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not create the JPEG.')), 'image/jpeg', .94));
    return new File([blob], `portpass-${mode}-map.jpg`, {type: 'image/jpeg'});
  }
};
