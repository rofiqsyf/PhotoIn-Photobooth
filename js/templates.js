/* ============================================
   TEMPLATES — Template Management Module
   Mendukung Canvas Generator & Static PNG Files
   ============================================ */

const Templates = (() => {
  // Gunakan key permanen agar data tidak hilang saat update kode
  const STORAGE_KEY = 'photobooth_templates';
  const EVENTS_KEY = 'photobooth_events';

  let selectedTemplate = null;
  let currentEventFilter = null;

  function getLayout(styleOrType) {
    let W = 1080, H = 1440;
    if (['filmstrip_classic', 'polaroid_stack', 'neon_strip', 'y2k', 'korean_fourcut', 'strip'].includes(styleOrType)) {
      H = 3240;
    }
    const slots = [];
    
    // Grid 2x2 Layout (4-Cut)
    if (styleOrType === 'fourcut_minimal' || styleOrType === 'fourcut_color' || styleOrType === 'grid') {
      const pad = styleOrType === 'fourcut_color' ? 45 : 50;
      const gap = styleOrType === 'fourcut_color' ? 24 : 30;
      const bottom = styleOrType === 'fourcut_color' ? 180 : 160;
      
      const sw = (W - pad * 2 - gap) / 2;
      const sh = (H - pad * 2 - gap - bottom) / 2;
      slots.push({x: pad, y: pad, w: sw, h: sh});
      slots.push({x: pad + sw + gap, y: pad, w: sw, h: sh});
      slots.push({x: pad, y: pad + sh + gap, w: sw, h: sh});
      slots.push({x: pad + sw + gap, y: pad + sh + gap, w: sw, h: sh});
      return { type: 'grid', slots, w: W, h: H };
    }
    
    // Vertical Strip Layout (Filmstrip)
    const buildStrip = (pad, gap, topR, botR) => {
      const photoW = W - pad * 2;
      const availH = H - topR - botR;
      const photoH = (availH - gap * 3) / 4;
      for(let i=0; i<4; i++) {
        slots.push({x: pad, y: topR + i*(photoH + gap), w: photoW, h: photoH});
      }
      return { type: 'strip', slots, w: W, h: H };
    };

    if (styleOrType === 'filmstrip_classic') return buildStrip(85, 20, 70, 110);
    if (styleOrType === 'polaroid_stack') return buildStrip(60, 22, 60, 140);
    if (styleOrType === 'neon_strip') return buildStrip(50, 20, 80, 130);
    if (styleOrType === 'y2k') return buildStrip(50, 22, 90, 170);
    if (styleOrType === 'korean_fourcut') return buildStrip(40, 16, 20, 200);
    if (styleOrType === 'strip') return buildStrip(50, 20, 80, 180); // Default strip fallback

    // Default Single Photo Layout
    return { type: 'single', slots: [{x: 0, y: 0, w: W, h: H}], w: W, h: H };
  }

  async function generateDemoTemplates() {
    const dbg = document.getElementById('debug-log');
    const log = (msg) => { console.log('[Templates]', msg); if (dbg) dbg.innerText += msg + '\n'; };

    try {
      const isInitialized = localStorage.getItem('photobooth_initialized') === 'true';
      const deletedIds = Utils.loadFromStorage('photobooth_deleted_ids', []);

      if (!isInitialized) {
        // ===============================================================
        // PERTAMA KALI: Seed semua data default, lalu set flag.
        // Fungsi ini TIDAK akan pernah jalan lagi setelah flag di-set.
        // ===============================================================
        log('First time init — seeding default data...');

        // Migrasi dari key lama jika ada
        let migratedTemplates = Utils.loadFromStorage('photobooth_templates_v14', null);
        let migratedEvents = Utils.loadFromStorage('photobooth_events_v14', null);
        
        if (migratedTemplates && migratedTemplates.length > 0) {
          Utils.saveToStorage(STORAGE_KEY, migratedTemplates);
          Utils.saveToStorage(EVENTS_KEY, migratedEvents || []);
          localStorage.setItem('photobooth_initialized', 'true');
          log('Migrated from v14, done.');
          return;
        }

        // Seed events
        const demoEvents = [
          { id: 'evt_grad', name: '🎓 Wisuda 2026', slug: 'wisuda-2026', is_active: true, created_at: new Date().toISOString() },
          { id: 'evt_aes', name: '✨ Aesthetic Collection', slug: 'aesthetic', is_active: true, created_at: new Date().toISOString() },
          { id: 'evt_retro', name: '🎞️ Retro Vibes', slug: 'retro-vibes', is_active: true, created_at: new Date().toISOString() },
          { id: 'evt_custom', name: '📁 Template Static (Upload Manual)', slug: 'custom', is_active: true, created_at: new Date().toISOString() },
        ];
        Utils.saveToStorage(EVENTS_KEY, demoEvents);
        log('Events seeded: ' + demoEvents.length);

        // Seed templates
        const templatesToSave = [];

        // Static frames dari folder
        const staticConfigs = window.PHOTOBOOTH_FRAMES || [];
        for (const config of staticConfigs) {
          const tId = 'tmpl_' + config.image_path.replace(/[^a-zA-Z0-9]/g, '');
          try {
            const dims = await Utils.getImageDimensions(config.image_path);
            let slots = await Utils.detectTransparentSlots(config.image_path);
            if (slots.length === 0) slots = await detectWhiteSlots(config.image_path);
            if (slots.length === 0) slots = getLayout('strip').slots;
            const imgW = dims.width || 1080, imgH = dims.height || 1440;
            templatesToSave.push({
              id: tId, name: config.name, event_id: config.event_id,
              data_url: config.image_path,
              layout: { type: slots.length === 1 ? 'single' : 'strip', slots, w: imgW, h: imgH },
              orientation: imgW > imgH ? 'landscape' : 'portrait',
              width: imgW, height: imgH, is_active: true, usage_count: 0,
              uploaded_at: new Date().toISOString()
            });
            log(`Seeded static: "${config.name}"`);
          } catch (err) {
            log(`Error static "${config.name}": ${err.message}`);
          }
        }

        // Generated demo templates
        const generatedConfigs = [
          { name: '4-Cut Minimal', event_id: 'evt_aes', style: 'fourcut_minimal', colors: { bg: '#ffffff', accent: '#000000', text: '#333' } },
          { name: '4-Cut Lavender', event_id: 'evt_aes', style: 'fourcut_color', colors: { bg: '#ede9fe', accent: '#8b5cf6', text: '#6d28d9' } },
          { name: 'Film Strip Classic', event_id: 'evt_retro', style: 'filmstrip_classic', colors: { bg: '#1a1a1a', accent: '#e5e5e5', text: '#ffffff' } },
          { name: 'Polaroid Stack', event_id: 'evt_aes', style: 'polaroid_stack', colors: { bg: '#fafafa', accent: '#e5e5e5', text: '#404040' } },
          { name: 'Y2K Dream', event_id: 'evt_retro', style: 'y2k', colors: { bg: '#fdf2f8', accent: '#f9a8d4', text: '#ec4899' } },
          { name: 'Korean 4-Cut', event_id: 'evt_aes', style: 'korean_fourcut', colors: { bg: '#fefce8', accent: '#fbbf24', text: '#92400e' } },
          { name: 'Wisuda Elegant', event_id: 'evt_grad', style: 'graduation', colors: { bg: 'transparent', accent: '#d4af37', text: '#fbbf24' } },
          { name: 'Soft Glow', event_id: 'evt_aes', style: 'soft_glow', colors: { bg: 'transparent', accent: '#c4b5fd', text: '#fff' } },
        ];
        for (const config of generatedConfigs) {
          const tId = 'tmpl_' + config.style + '_' + config.name.replace(/[^a-zA-Z0-9]/g, '');
          const layout = getLayout(config.style);
          templatesToSave.push({
            id: tId, name: config.name, event_id: config.event_id,
            data_url: generateFrame(config), layout,
            orientation: layout.w > layout.h ? 'landscape' : 'portrait',
            width: layout.w || 1080, height: layout.h || 1440,
            is_active: true, usage_count: 0, uploaded_at: new Date().toISOString()
          });
        }
        log('Generated templates: ' + generatedConfigs.length);

        let saved = Utils.saveToStorage(STORAGE_KEY, templatesToSave);
        if (!saved) {
          // Fallback: kompres gambar generated agar muat
          const light = await Promise.all(templatesToSave.map(async (t) => {
            if (t.data_url && t.data_url.startsWith('data:')) {
              return new Promise(r => {
                const img = new Image();
                img.onload = () => { const c = document.createElement('canvas'); c.width=270; c.height=360; c.getContext('2d').drawImage(img,0,0,270,360); r({...t, data_url: c.toDataURL('image/jpeg',0.8)}); };
                img.onerror = () => r(t);
                img.src = t.data_url;
              });
            }
            return t;
          }));
          saved = Utils.saveToStorage(STORAGE_KEY, light);
        }
        log('Save result: ' + saved + ', total: ' + templatesToSave.length);

        // Set flag — fungsi ini tidak akan pernah masuk sini lagi
        localStorage.setItem('photobooth_initialized', 'true');
        return;
      }

      // ===============================================================
      // SUDAH PERNAH INIT: Hanya cek apakah ada file BARU di folder
      // yang belum ada di storage DAN belum pernah dihapus user.
      // TIDAK menyentuh data yang sudah ada sama sekali.
      // ===============================================================
      const staticConfigs = window.PHOTOBOOTH_FRAMES || [];
      if (staticConfigs.length === 0) return;

      const existing = Utils.loadFromStorage(STORAGE_KEY, []);
      const existingIds = new Set(existing.map(t => t.id));
      let added = false;
      let modified = false;

      // 1. Tambah file baru dari folder
      for (const config of staticConfigs) {
        const tId = 'tmpl_' + config.image_path.replace(/[^a-zA-Z0-9]/g, '');
        if (existingIds.has(tId)) continue;       // Sudah ada
        if (deletedIds.includes(tId)) continue;   // Pernah dihapus user

        try {
          const dims = await Utils.getImageDimensions(config.image_path);
          let slots = await Utils.detectTransparentSlots(config.image_path);
          if (slots.length === 0) slots = await detectWhiteSlots(config.image_path);
          if (slots.length === 0) slots = getLayout('strip').slots;
          const imgW = dims.width || 1080, imgH = dims.height || 1440;
          existing.push({
            id: tId, name: config.name, event_id: config.event_id,
            data_url: config.image_path,
            layout: { type: slots.length === 1 ? 'single' : 'strip', slots, w: imgW, h: imgH },
            orientation: imgW > imgH ? 'landscape' : 'portrait',
            width: imgW, height: imgH, is_active: true, usage_count: 0,
            uploaded_at: new Date().toISOString()
          });
          added = true;
          log(`New frame detected: "${config.name}"`);
        } catch (err) {
          log(`Error new frame "${config.name}": ${err.message}`);
        }
      }

      // 2. Hapus file statis yang sudah hilang dari folder
      const currentStaticIds = new Set(staticConfigs.map(c => 'tmpl_' + c.image_path.replace(/[^a-zA-Z0-9]/g, '')));
      const newExisting = existing.filter(t => {
        // Cek apakah ini template statis (dari assets/frames/)
        if (t.data_url && typeof t.data_url === 'string' && t.data_url.startsWith('assets/frames/')) {
          // Jika ID-nya tidak ada di currentStaticIds, berarti filenya sudah dihapus user dari folder
          if (!currentStaticIds.has(t.id)) {
            modified = true;
            log(`Frame deleted from folder, removing from UI: "${t.name}"`);
            return false; // Hapus dari storage
          }
        }
        return true; // Pertahankan
      });

      if (added || modified) {
        Utils.saveToStorage(STORAGE_KEY, newExisting);
        log('Saved synced frames.');
      }
    } catch (err) {
      log('CRITICAL ERROR: ' + err.message);
    }
  }

  // Detect white (or near-white) rectangular regions as photo slots
  function detectWhiteSlots(imageSrc) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => resolve([]);
      img.onload = () => {
        try {
          const scale = Math.min(1, 360 / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          
          const imgData = ctx.getImageData(0, 0, w, h).data;
          const visited = new Uint8Array(w * h);
          const slots = [];
          
          // Check if pixel is "white-ish" (R,G,B all > 240)
          const isWhite = (x, y) => {
            const idx = (y * w + x) * 4;
            return imgData[idx] > 240 && imgData[idx+1] > 240 && imgData[idx+2] > 240;
          };
          
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = y * w + x;
              if (visited[idx]) continue;
              
              if (isWhite(x, y)) {
                // BFS to find connected white region
                const queue = [{x, y}];
                visited[idx] = 1;
                let minX = x, maxX = x, minY = y, maxY = y;
              let area = 0;
              let head = 0;
              
              while (head < queue.length) {
                const p = queue[head++];
                area++;
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
                
                const neighbors = [
                  {nx: p.x, ny: p.y - 1}, {nx: p.x, ny: p.y + 1},
                  {nx: p.x - 1, ny: p.y}, {nx: p.x + 1, ny: p.y}
                ];
                for (const n of neighbors) {
                  if (n.nx >= 0 && n.nx < w && n.ny >= 0 && n.ny < h) {
                    const nIdx = n.ny * w + n.nx;
                    if (!visited[nIdx] && isWhite(n.nx, n.ny)) {
                      visited[nIdx] = 1;
                      queue.push({x: n.nx, y: n.ny});
                    }
                  }
                }
              }
              
              // Only count as slot if large enough (> 3% of total area)
              if (area > (w * h * 0.03)) {
                slots.push({
                  x: Math.round(minX / scale),
                  y: Math.round(minY / scale),
                  w: Math.round((maxX - minX + 1) / scale),
                  h: Math.round((maxY - minY + 1) / scale)
                });
              }
            } else {
              visited[idx] = 1;
            }
          }
        }
        
        // Sort top-to-bottom, then left-to-right
        slots.sort((a, b) => {
          if (Math.abs(a.y - b.y) > (a.h * 0.3)) return a.y - b.y;
          return a.x - b.x;
        });
        
        resolve(slots);
        } catch (e) {
          console.error("Error in detectWhiteSlots:", e);
          resolve([]);
        }
      };
      img.src = imageSrc;
    });
  }

  // ---- Canvas Generator Functions ----
  function generateFrame(config) {
    const layout = getLayout(config.style);
    const W = layout.w || 1080, H = layout.h || 1440;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const { bg, accent, text } = config.colors;
    const drawFn = frameFunctions[config.style];
    if (drawFn) drawFn(ctx, W, H, bg, accent, text, config.name);
    return canvas.toDataURL('image/png');
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const frameFunctions = {
    fourcut_minimal(ctx, W, H, bg, accent, textColor, name) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const l = getLayout('fourcut_minimal');
      ctx.globalCompositeOperation = 'destination-out';
      l.slots.forEach(s => { roundRect(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = accent; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
      l.slots.forEach((s, i) => ctx.fillText(`${i + 1}`, s.x + 12, s.y + 28));
      ctx.textAlign = 'center'; ctx.font = 'bold 36px sans-serif'; ctx.fillText('PHOTOBOOTH', W / 2, H - 125);
      ctx.font = '20px sans-serif'; ctx.fillStyle = textColor; ctx.fillText(name.toUpperCase(), W / 2, H - 90);
    },
    fourcut_color(ctx, W, H, bg, accent, textColor, name) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const l = getLayout('fourcut_color');
      ctx.globalCompositeOperation = 'destination-out';
      l.slots.forEach(s => { roundRect(ctx, s.x, s.y, s.w, s.h, 16); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = accent; ctx.lineWidth = 3;
      l.slots.forEach(s => {
        ctx.beginPath(); ctx.moveTo(s.x - 6, s.y + 20); ctx.lineTo(s.x - 6, s.y - 6); ctx.lineTo(s.x + 20, s.y - 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x + s.w + 6, s.y + s.h - 20); ctx.lineTo(s.x + s.w + 6, s.y + s.h + 6); ctx.lineTo(s.x + s.w - 20, s.y + s.h + 6); ctx.stroke();
      });
      const bottomY = H - 175;
      ctx.fillStyle = accent; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PHOTO', W / 2, bottomY + 35);
      ctx.font = 'bold 32px sans-serif'; ctx.fillStyle = textColor; ctx.fillText('PHOTOBOOTH', W / 2, bottomY + 75);
    },
    filmstrip_classic(ctx, W, H, bg, accent, textColor, name) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const stripW = 55, perfW = 22, perfH = 30, perfGap = 16;
      ctx.fillStyle = bg === '#1a1a1a' ? '#222' : '#2a2a2a';
      ctx.fillRect(0, 0, stripW, H); ctx.fillRect(W - stripW, 0, stripW, H);
      ctx.globalCompositeOperation = 'destination-out';
      for (let y = 20; y < H - 20; y += perfH + perfGap) {
        roundRect(ctx, (stripW - perfW) / 2, y, perfW, perfH, 4); ctx.fill();
        roundRect(ctx, W - stripW + (stripW - perfW) / 2, y, perfW, perfH, 4); ctx.fill();
      }
      const l = getLayout('filmstrip_classic');
      l.slots.forEach(s => { roundRect(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = textColor; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.fillText('PHOTOBOOTH', W / 2, 45);
    },
    polaroid_stack(ctx, W, H, bg, accent, textColor, name) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const l = getLayout('polaroid_stack');
      l.slots.forEach(s => {
        ctx.fillStyle = 'rgba(0,0,0,0.06)'; roundRect(ctx, s.x + 4, s.y + 4, s.w, s.h, 8); ctx.fill();
        ctx.fillStyle = '#fff'; roundRect(ctx, s.x - 8, s.y - 8, s.w + 16, s.h + 16, 8); ctx.fill();
        ctx.strokeStyle = accent; ctx.lineWidth = 1; roundRect(ctx, s.x - 8, s.y - 8, s.w + 16, s.h + 16, 8); ctx.stroke();
      });
      ctx.globalCompositeOperation = 'destination-out';
      l.slots.forEach(s => { roundRect(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = textColor; ctx.font = 'italic 24px serif'; ctx.textAlign = 'center'; ctx.fillText('memories', W / 2, H - 85);
    },
    y2k(ctx, W, H, bg, accent, textColor, name) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const l = getLayout('y2k');
      ctx.fillStyle = accent; ctx.globalAlpha = 0.3;
      for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.arc(x, 15 + Math.sin(x * 0.05) * 8, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      l.slots.forEach(s => { roundRect(ctx, s.x, s.y, s.w, s.h, 20); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = accent; ctx.lineWidth = 3;
      l.slots.forEach(s => { roundRect(ctx, s.x, s.y, s.w, s.h, 20); ctx.stroke(); });
      ctx.fillStyle = textColor; ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PHOTOBOOTH', W / 2, H - 105);
    },
    korean_fourcut(ctx, W, H, bg, accent, textColor, name) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const l = getLayout('korean_fourcut');
      ctx.globalCompositeOperation = 'destination-out';
      l.slots.forEach(s => { ctx.fillRect(s.x, s.y, s.w, s.h); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.3; ctx.lineWidth = 1;
      l.slots.forEach(s => { ctx.strokeRect(s.x, s.y, s.w, s.h); });
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(W / 2, H - 145, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bg; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('4', W / 2, H - 135);
      ctx.fillStyle = textColor; ctx.font = 'bold 30px sans-serif'; ctx.fillText('PHOTO BOOTH', W / 2, H - 85);
    },
    graduation(ctx, W, H, bg, accent, textColor, name) {
      ctx.clearRect(0, 0, W, H);
      const bw = 50;
      ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.strokeRect(bw, bw, W - bw * 2, H - bw * 2);
      ctx.fillStyle = textColor; ctx.font = 'bold 32px serif'; ctx.textAlign = 'center'; ctx.fillText('WISUDA 2026', W / 2, H - bw - 50);
    },
    soft_glow(ctx, W, H, bg, accent, textColor, name) {
      ctx.clearRect(0, 0, W, H);
      const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
      vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(196,181,253,0.12)');
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.3; ctx.lineWidth = 2; roundRect(ctx, 30, 30, W - 60, H - 60, 24); ctx.stroke();
    }
  };

  function getTemplates() { return Utils.loadFromStorage(STORAGE_KEY, []); }
  function getActiveTemplates(eventId = null) {
    let t = getTemplates().filter(t => t.is_active);
    if (eventId) t = t.filter(t => t.event_id === eventId);
    return t;
  }
  function getTemplateById(id) { return getTemplates().find(t => t.id === id); }
  function addTemplate(tmpl) { const t = getTemplates(); t.push(tmpl); Utils.saveToStorage(STORAGE_KEY, t); }
  function updateTemplate(id, updates) {
    const t = getTemplates(); const i = t.findIndex(x => x.id === id);
    if (i !== -1) { t[i] = { ...t[i], ...updates }; Utils.saveToStorage(STORAGE_KEY, t); return true; }
    return false;
  }
  function deleteTemplate(id) { 
    Utils.saveToStorage(STORAGE_KEY, getTemplates().filter(t => t.id !== id)); 
    const del = Utils.loadFromStorage('photobooth_deleted_ids', []);
    if (!del.includes(id)) { del.push(id); Utils.saveToStorage('photobooth_deleted_ids', del); }
  }
  function incrementUsage(id) {
    const t = getTemplates(); const i = t.findIndex(x => x.id === id);
    if (i !== -1) { t[i].usage_count = (t[i].usage_count || 0) + 1; Utils.saveToStorage(STORAGE_KEY, t); }
  }

  function getEvents() { return Utils.loadFromStorage(EVENTS_KEY, []); }
  function getActiveEvents() { return getEvents().filter(e => e.is_active); }
  function getEventById(id) { return getEvents().find(e => e.id === id); }
  function addEvent(evt) { const e = getEvents(); e.push(evt); Utils.saveToStorage(EVENTS_KEY, e); }
  function updateEvent(id, updates) {
    const e = getEvents(); const i = e.findIndex(x => x.id === id);
    if (i !== -1) { e[i] = { ...e[i], ...updates }; Utils.saveToStorage(EVENTS_KEY, e); return true; }
    return false;
  }
  function deleteEvent(id) {
    const templatesToDelete = getTemplates().filter(t => t.event_id === id);
    Utils.saveToStorage(STORAGE_KEY, getTemplates().filter(t => t.event_id !== id));
    Utils.saveToStorage(EVENTS_KEY, getEvents().filter(e => e.id !== id));
    
    // Catat semua ID yang dihapus ke blacklist tunggal
    const del = Utils.loadFromStorage('photobooth_deleted_ids', []);
    if (!del.includes(id)) del.push(id);
    templatesToDelete.forEach(t => { if (!del.includes(t.id)) del.push(t.id); });
    Utils.saveToStorage('photobooth_deleted_ids', del);
  }

  function setSelectedTemplate(t) { selectedTemplate = t; }
  function getSelectedTemplate() { return selectedTemplate; }
  function setEventFilter(id) { currentEventFilter = id; }
  function getEventFilter() { return currentEventFilter; }

  function getStats() {
    const t = getTemplates(), e = getEvents();
    return {
      totalTemplates: t.length,
      activeTemplates: t.filter(x => x.is_active).length,
      totalEvents: e.length,
      activeEvents: e.filter(x => x.is_active).length,
      totalUsage: t.reduce((s, x) => s + (x.usage_count || 0), 0)
    };
  }

  return {
    generateDemoTemplates, getLayout,
    getTemplates, getActiveTemplates, getTemplateById, addTemplate, updateTemplate, deleteTemplate, incrementUsage,
    getEvents, getActiveEvents, getEventById, addEvent, updateEvent, deleteEvent,
    setSelectedTemplate, getSelectedTemplate, setEventFilter, getEventFilter, getStats,
    detectWhiteSlots
  };
})();
