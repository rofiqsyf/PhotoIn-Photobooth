/* ============================================
   COMPOSER — Canvas compositing
   Uses template layout slots for perfect framing
   ============================================ */

const Composer = (() => {
  // W and H will be determined dynamically by the layout

  async function compose(captureResult, templateDataURL) {
    const tmpl = Templates.getSelectedTemplate();
    const photos = captureResult.mode === 'single' ? [captureResult.photos[0]] : captureResult.photos;
    
    // If no template is selected, fallback to a default layout based on mode
    let layout = tmpl ? tmpl.layout : null;
    if (!layout) {
      layout = captureResult.mode === 'filmstrip' 
        ? Templates.getLayout('strip') 
        : Templates.getLayout('single');
    }

    return await composeWithLayout(photos, templateDataURL, layout, tmpl);
  }

  function composeWithLayout(photos, templateDataURL, layout, tmpl = null) {
    return new Promise((resolve) => {
      const W = (tmpl && tmpl.width) ? tmpl.width : (layout.w || 1080);
      const H = (tmpl && tmpl.height) ? tmpl.height : (layout.h || 1440);
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = layout.type === 'single' ? '#000000' : '#ffffff';
      ctx.fillRect(0, 0, W, H);

      Promise.all(photos.map(src => loadImage(src))).then((images) => {
        // Draw each photo into its corresponding slot
        images.forEach((img, i) => {
          if (!img || i >= layout.slots.length) return;
          const slot = layout.slots[i];
          
          ctx.save();
          // Add 4px bleed on all sides so photo tucks nicely under the template anti-aliased edge
          const bleed = 4;
          roundRect(ctx, slot.x - bleed, slot.y - bleed, slot.w + bleed * 2, slot.h + bleed * 2, 4);
          ctx.clip();
          drawCover(ctx, img, slot.x - bleed, slot.y - bleed, slot.w + bleed * 2, slot.h + bleed * 2);
          ctx.restore();
        });

        // Overlay template
        if (templateDataURL) {
          const tmplImg = new Image();
          tmplImg.onload = () => {
            ctx.drawImage(tmplImg, 0, 0, W, H);
            resolve(canvas.toDataURL('image/png', 0.92));
          };
          tmplImg.onerror = () => resolve(canvas.toDataURL('image/png', 0.92));
          tmplImg.src = templateDataURL;
        } else {
          addDefaultBranding(ctx, images.length, layout.type, W, H);
          resolve(canvas.toDataURL('image/png', 0.92));
        }
      });
    });
  }

  function addDefaultBranding(ctx, photoCount, type, W, H) {
    if (type === 'single') {
      const grad = ctx.createLinearGradient(0, H - 120, 0, H);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H - 120, W, 120);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
    } else {
      ctx.fillStyle = '#111';
    }

    ctx.font = '600 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTOBOOTH', W / 2, H - 60);

    ctx.font = '14px sans-serif';
    ctx.globalAlpha = 0.5;
    ctx.fillText(new Date().toLocaleDateString('id-ID'), W / 2, H - 35);
    ctx.globalAlpha = 1;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function drawCover(ctx, img, x, y, w, h) {
    const imgR = img.width / img.height;
    const areaR = w / h;
    let sx, sy, sw, sh;

    if (imgR > areaR) {
      sh = img.height; sw = img.height * areaR;
      sx = (img.width - sw) / 2; sy = 0;
    } else {
      sw = img.width; sh = img.width / areaR;
      sx = 0; sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
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

  return { compose };
})();
