/* ============================================
   UTILS — Helper Functions
   Storage, download, share, toasts
   ============================================ */

const Utils = (() => {
  // ---- LocalStorage Helpers ----
  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // Dispatch event for same-tab real-time sync
      window.dispatchEvent(new CustomEvent('appDataChanged', { detail: { key } }));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  }

  function loadFromStorage(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error('Storage load error:', e);
      return fallback;
    }
  }

  function removeFromStorage(key) {
    localStorage.removeItem(key);
  }

  // ---- ID Generator ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ---- Date Formatter ----
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ---- File Helpers ----
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  }

  function validatePNG(file) {
    const errors = [];
    
    // Check MIME type
    if (file.type !== 'image/png') {
      errors.push('File harus berformat PNG');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`Ukuran file melebihi batas (maks 5MB, file Anda: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
    }

    return { valid: errors.length === 0, errors };
  }

  function getImageDimensions(dataURL) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = dataURL;
    });
  }

  // ---- Auto-Detect Transparent Slots (BFS) ----
  function detectTransparentSlots(dataURL) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onerror = () => resolve([]);
      img.onload = () => {
        try {
          // Use a smaller canvas for faster processing, but maintain aspect ratio
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
          
          // Helper to get alpha of a pixel (x,y)
          const getAlpha = (x, y) => imgData[(y * w + x) * 4 + 3];
          
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = y * w + x;
              if (visited[idx]) continue;
              
              // Treat alpha < 20 as transparent
              if (getAlpha(x, y) < 20) {
                // BFS to find the connected transparent region
                const queue = [{x, y}];
                visited[idx] = 1;
                
                let minX = x, maxX = x;
              let minY = y, maxY = y;
              let area = 0;
              
              let head = 0;
              while (head < queue.length) {
                const p = queue[head++];
                area++;
                
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
                
                // Check neighbors (up, down, left, right)
                const neighbors = [
                  {nx: p.x, ny: p.y - 1}, {nx: p.x, ny: p.y + 1},
                  {nx: p.x - 1, ny: p.y}, {nx: p.x + 1, ny: p.y}
                ];
                
                for (const n of neighbors) {
                  if (n.nx >= 0 && n.nx < w && n.ny >= 0 && n.ny < h) {
                    const nIdx = n.ny * w + n.nx;
                    if (!visited[nIdx] && getAlpha(n.nx, n.ny) < 20) {
                      visited[nIdx] = 1;
                      queue.push({x: n.nx, y: n.ny});
                    }
                  }
                }
              }
              
              // Only consider it a valid slot if it's large enough (> 2% of total area)
              if (area > (w * h * 0.02)) {
                // Scale back to original image dimensions
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

          // Sort slots top-to-bottom, then left-to-right
          slots.sort((a, b) => {
            if (Math.abs(a.y - b.y) > (a.h * 0.5)) {
              return a.y - b.y;
            }
            return a.x - b.x;
          });
          
          resolve(slots);
        } catch (e) {
          console.error("Error in detectTransparentSlots:", e);
          resolve([]);
        }
      };
      img.src = dataURL;
    });
  }

  // ---- Download ----
  function downloadImage(dataURL, filename = 'photobooth-result.png') {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ---- Share ----
  async function shareImage(dataURL, title = 'Foto Photobooth') {
    if (navigator.share && navigator.canShare) {
      try {
        const blob = dataURLtoBlob(dataURL);
        const file = new File([blob], 'photobooth.png', { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: title,
            text: 'Lihat foto photobooth saya! 📸',
            files: [file]
          });
          return true;
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('Share error:', e);
        }
        return false;
      }
    }
    
    // Fallback: copy to clipboard
    try {
      const blob = dataURLtoBlob(dataURL);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('Gambar disalin ke clipboard!', 'success');
      return true;
    } catch (e) {
      // Final fallback: open in new tab
      const win = window.open();
      win.document.write(`<img src="${dataURL}" style="max-width:100%">`);
      return true;
    }
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // ---- Debounce ----
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // ---- Sanitize filename ----
  function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 100);
  }

  // ---- Slugify ----
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  // Public API
  return {
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    generateId,
    formatDate,
    formatDateTime,
    fileToDataURL,
    dataURLtoBlob,
    validatePNG,
    getImageDimensions,
    detectTransparentSlots,
    downloadImage,
    shareImage,
    showToast,
    debounce,
    sanitizeFilename,
    slugify
  };
})();
