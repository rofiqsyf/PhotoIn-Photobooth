/* ============================================
   APP — Main Application (Step Flow)
   ============================================ */

const App = (() => {
  let currentView = 'home';
  let composedResult = null;

  // Step flow state
  let selectedBorder = null; // The chosen template object
  let boothStep = 1;         // 1=pick border, 2=pick source, 3=camera/upload
  let capturedPhotos = [];   // Array of dataURL strings

  async function init() {
    await Templates.generateDemoTemplates();
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // Listen for data changes (same-tab and cross-tab) for Real-Time Sync
    window.addEventListener('storage', handleDataSync);
    window.addEventListener('appDataChanged', handleDataSync);

    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('navbar-nav')?.classList.toggle('open');
    });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.addEventListener('click', () => document.getElementById('navbar-nav')?.classList.remove('open'));
    });
  }

  function handleDataSync() {
    // Do not interrupt the user if they are in the middle of taking photos or previewing
    if (currentView === 'booth' && boothStep === 3) return;
    if (currentView === 'preview') return;
    if (currentView === 'request') return; // Jangan reset form request jika ada sinkronisasi background
    
    // Auto-refresh the current view to reflect new data
    const renderers = { home: renderHome, booth: renderBooth, admin: renderAdmin, templates: renderAllTemplates };
    if (renderers[currentView]) {
      renderers[currentView]();
    }
  }

  function handleRoute() {
    navigateTo(window.location.hash.slice(1) || 'home');
  }

  function navigateTo(view) {
    if (currentView === 'booth' && view !== 'booth') {
      Camera.stop();
      selectedBorder = null;
      boothStep = 1;
      capturedPhotos = [];
    }
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.view === view);
    });

    const renderers = { home: renderHome, booth: renderBooth, preview: renderPreview, admin: renderAdmin, templates: renderAllTemplates, request: renderRequest };
    
    // Fallback to home if view is invalid
    if (!renderers[view]) {
      view = 'home';
      window.location.hash = '#home';
      return; // handleRoute will be triggered again by hashchange, or we just proceed here
    }

    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');
    renderers[view]();
  }

  function useTemplate(id) {
    const tmpl = Templates.getTemplateById(id);
    if (tmpl) {
      selectedBorder = tmpl;
      Templates.setSelectedTemplate(tmpl);
      boothStep = 2;
      window.location.hash = '#booth';
    }
  }

  // ========== HOME ==========
  function renderHome() {
    const el = document.getElementById('view-home');
    const events = Templates.getActiveEvents();
    const templates = Templates.getTemplates().filter(t => t.is_active);

    const marqueeItems = templates.slice(0, 10);
    const marqueeHTML = [...marqueeItems, ...marqueeItems].map(t =>
      `<div class="marquee-item"><img src="${t.data_url}" alt="${t.name}" loading="lazy" decoding="async"></div>`
    ).join('');

    el.innerHTML = `
      <section class="hero">
        <!-- Floating Ornaments -->
        <div class="deco-shape shape-1"><svg width="48" height="48" viewBox="0 0 24 24" fill="var(--brand-tertiary)" stroke="var(--border-dark)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
        <div class="deco-shape shape-2"><svg width="40" height="40" viewBox="0 0 24 24" fill="var(--brand-primary)" stroke="var(--border-dark)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg></div>
        <div class="deco-shape shape-3"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round"><path d="M4 14c3-6 5-6 8 0s5 6 8 0"></path></svg></div>
        <div class="deco-shape shape-4"><svg width="44" height="44" viewBox="0 0 24 24" fill="var(--brand-quaternary)" stroke="var(--border-dark)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg></div>

        <div class="container">
          <div class="hero-eyebrow anim-in">
            <span style="color:var(--mint);">●</span> ready to capture
          </div>
          <h1 class="hero-title anim-in anim-d1">
            snap it.<br><span class="text-gradient">frame it.</span><br>share it.
          </h1>
          <p class="hero-desc anim-in anim-d2">
            ambil foto langsung dari browser — pilih frame aesthetic favorit kamu, langsung download & share ke sosmed.
          </p>
          <div class="hero-actions anim-in anim-d3">
            <a class="btn btn-primary btn-lg" href="#booth">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              mulai foto
            </a>
            <a class="btn btn-accent btn-lg" href="#templates">
              lihat semua border
            </a>
          </div>
        </div>
      </section>

      ${marqueeItems.length > 0 ? `
        <div class="marquee-strip">
          <div class="marquee-track">${marqueeHTML}</div>
        </div>
      ` : ''}

      <section class="bento-section">
        <div class="container text-center">
          <p class="section-label">fitur</p>
          <h2 class="section-title">Kenapa PhotoIn?</h2>
          <div class="bento-grid">
            <div class="card bento-card span-2">
              <div class="bento-icon-lg">📸</div>
              <div class="bento-content">
                <div class="bento-card-title">Langsung dari Browser</div>
                <div class="bento-card-desc">Tidak perlu install apapun. Buka, pilih border, foto, done!</div>
              </div>
            </div>
            <div class="card bento-card">
              <div class="bento-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
              <div class="bento-content">
                <div class="bento-card-title">Border Premium</div>
                <div class="bento-card-desc">Koleksi border aesthetic siap pakai.</div>
              </div>
            </div>
            <div class="card bento-card">
              <div class="bento-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></div>
              <div class="bento-content">
                <div class="bento-card-title">HD Download</div>
                <div class="bento-card-desc">Hasil jernih, siap upload IG story.</div>
              </div>
            </div>
            <div class="card bento-card span-2">
              <div class="bento-icon-lg">✨</div>
              <div class="bento-content">
                <div class="bento-card-title">Multi-Cut Support</div>
                <div class="bento-card-desc">Dukung layout 4-cut, filmstrip, grid, dan single shot — otomatis sesuai border.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      ${events.length > 0 ? `
        <section class="events-section">
          <div class="container text-center">
            <p class="section-label">event</p>
            <h2 class="section-title">Pilih Event</h2>
            <p class="section-desc">Setiap event punya koleksi border yang berbeda.</p>
            <div class="events-grid">
              ${events.map(e => {
                const count = templates.filter(t => t.event_id === e.id).length;
                return `
                  <div class="card event-card" onclick="App.selectEvent('${e.id}')">
                    <div class="event-info">
                      <div class="event-name">${e.name}</div>
                      <div class="event-meta">${count} border tersedia</div>
                    </div>
                    <div class="event-arrow">→</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </section>
      ` : ''}

      <footer class="footer">
        <p>dibuat dengan ❤️ — PhotoIn Digital © ${new Date().getFullYear()}</p>
      </footer>
    `;
    el.classList.add('active');
  }

  // ========== ALL TEMPLATES ==========
  function renderAllTemplates() {
    const el = document.getElementById('view-home');
    const templates = Templates.getTemplates().filter(t => t.is_active);

    el.innerHTML = `
      <section class="events-section" style="padding-top:8rem;">
        <div class="container">
          <button class="step-back" onclick="window.location.hash='#home'">← kembali</button>
          <p class="section-label">koleksi</p>
          <h2 class="section-title">Semua Border</h2>
          <p class="section-desc" style="margin-left:0;">Pilih border favoritmu dan langsung pakai.</p>

          <div class="admin-template-grid" style="gap:1.5rem; margin-top:2rem;">
            ${templates.map(t => `
              <div class="admin-template-card" style="cursor:pointer;" onclick="App.useTemplate('${t.id}')">
                <div class="admin-template-preview" style="aspect-ratio:3/4;">
                  <img src="${t.data_url}" alt="${t.name}" loading="lazy" decoding="async">
                </div>
                <div class="admin-template-info" style="text-align:center;">
                  <div class="admin-template-name" style="font-size:1.1rem;">${t.name}</div>
                  <button class="btn btn-primary btn-sm" style="margin-top:0.5rem; width:100%;">Gunakan Border</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
    el.classList.add('active');
  }

  // ---- Request View ----
  function renderRequest() {
    const view = document.getElementById('view-request');
    view.innerHTML = `
      <div class="request-container">
        <div class="request-header fade-in">
          <h2>Request Custom Border</h2>
          <p>Kirimkan ide, referensi desain, atau tema border yang Anda inginkan. Kami akan buatkan untuk Anda!</p>
        </div>
        <form id="request-form" action="https://formspree.io/f/mdkarqkp" method="POST" class="request-form fade-in">
          <div class="form-group">
            <label>Nama Anda</label>
            <input type="text" name="name" required placeholder="Contoh: Budi Sudarsono">
          </div>
          <div class="form-group">
            <label>Email Kontak</label>
            <input type="email" name="email" required placeholder="Contoh: budi@email.com">
          </div>
          <div class="form-group">
            <label>Deskripsi/Ide Border</label>
            <textarea name="message" rows="5" required placeholder="Ceritakan sedetail mungkin border seperti apa yang Anda butuhkan..."></textarea>
          </div>
          <div class="form-group">
            <label>Link Referensi (Opsional)</label>
            <input type="url" name="reference_url" placeholder="Contoh: link Pinterest atau Google Drive">
          </div>
          <button type="submit" class="btn btn-primary btn-submit">Kirim Request</button>
          <div id="request-status" class="request-status"></div>
        </form>
      </div>
    `;

    const form = document.getElementById('request-form');
    const status = document.getElementById('request-status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = form.querySelector('.btn-submit');
      btn.disabled = true;
      btn.textContent = 'Mengirim...';
      
      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          status.innerHTML = '<span class="success">Request berhasil dikirim! Kami akan segera menghubungi Anda.</span>';
          form.reset();
        } else {
          status.innerHTML = '<span class="error">Gagal mengirim. Silakan coba lagi.</span>';
        }
      } catch (error) {
        status.innerHTML = '<span class="error">Terjadi kesalahan koneksi.</span>';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Kirim Request';
      }
    });
  }

  // ========== BOOTH (Step Flow) ==========
  function renderBooth() {
    const el = document.getElementById('view-booth');

    if (boothStep === 1) renderBoothStep1(el);
    else if (boothStep === 2) renderBoothStep2(el);
    else if (boothStep === 3) renderBoothStep3Camera(el);
    else if (boothStep === 4) renderBoothStep3Upload(el);
  }

  // Helper: step progress HTML
  function stepProgressHTML(current) {
    const steps = [1, 2, 3];
    return `<div class="step-progress">
      ${steps.map((s, i) => `
        <div class="step-dot ${s === current ? 'active' : (s < current ? 'done' : '')}">${s < current ? '✓' : s}</div>
        ${i < steps.length - 1 ? '<div class="step-line"></div>' : ''}
      `).join('')}
    </div>`;
  }

  // ----- STEP 1: Pick Border -----
  function renderBoothStep1(el) {
    const eventId = Templates.getEventFilter();
    const templates = Templates.getActiveTemplates(eventId);
    const events = Templates.getActiveEvents();

    el.innerHTML = `
      <div class="booth-section">
        <div class="container">
          ${stepProgressHTML(1)}
          <h2 class="step-title">Pilih Border</h2>
          <p class="step-desc">Pilih border favorit kamu untuk foto.</p>

          ${events.length > 1 ? `
            <div style="max-width:300px; margin:0 auto 2rem;">
              <select id="booth-event-filter" class="form-select">
                <option value="">semua event</option>
                ${events.map(e => `<option value="${e.id}" ${eventId === e.id ? 'selected' : ''}>${e.name.replace(/^\p{Emoji}\s*/u, '')}</option>`).join('')}
              </select>
            </div>
          ` : ''}

          <div class="border-picker-grid">
            ${templates.length === 0 ? `
              <div class="no-templates" style="grid-column:1/-1;"><p>tidak ada border tersedia</p></div>
            ` : templates.map(t => {
              const slotCount = t.layout ? t.layout.slots.length : 1;
              return `
                <div class="border-card" onclick="App.pickBorder('${t.id}')">
                  <div class="border-card-preview">
                    <img src="${t.data_url}" alt="${t.name}" loading="lazy" decoding="async">
                  </div>
                  <div class="border-card-info">
                    <div class="border-card-name">${t.name}</div>
                    <div class="border-card-slots">${slotCount} foto</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    el.classList.add('active');

    document.getElementById('booth-event-filter')?.addEventListener('change', (e) => {
      Templates.setEventFilter(e.target.value || null);
      renderBoothStep1(el);
    });
  }

  function pickBorder(id) {
    const tmpl = Templates.getTemplateById(id);
    if (!tmpl) return;
    selectedBorder = tmpl;
    Templates.setSelectedTemplate(tmpl);
    capturedPhotos = [];
    boothStep = 2;
    renderBooth();
  }

  // ----- STEP 2: Pick Source -----
  function renderBoothStep2(el) {
    if (!selectedBorder) { boothStep = 1; renderBooth(); return; }
    const slotCount = selectedBorder.layout ? selectedBorder.layout.slots.length : 1;

    el.innerHTML = `
      <div class="booth-section">
        <div class="container">
          ${stepProgressHTML(2)}
          <button class="step-back" onclick="App.goBoothStep(1)">← pilih border lain</button>
          <h2 class="step-title">${selectedBorder.name}</h2>
          <p class="step-desc">Border ini membutuhkan ${slotCount} foto. Pilih cara pengambilan:</p>

          <div class="step2-layout">
            <div class="step2-preview">
              <img class="step2-preview-img" src="${selectedBorder.data_url}" alt="${selectedBorder.name}">
            </div>
            <div class="step2-actions">
              <button class="source-btn" onclick="App.goBoothStep(3)">
                <div class="source-btn-icon">📷</div>
                <div class="source-btn-text">
                  <h4>Buka Kamera</h4>
                  <p>Ambil ${slotCount} foto langsung dari kamera</p>
                </div>
              </button>
              <button class="source-btn" onclick="App.goBoothStep(4)">
                <div class="source-btn-icon">📁</div>
                <div class="source-btn-text">
                  <h4>Upload Foto</h4>
                  <p>Pilih ${slotCount} foto dari galeri</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    el.classList.add('active');
  }

  // ----- STEP 3: Camera -----
  async function renderBoothStep3Camera(el) {
    if (!selectedBorder) { boothStep = 1; renderBooth(); return; }
    const slotCount = selectedBorder.layout ? selectedBorder.layout.slots.length : 1;
    capturedPhotos = [];

    const layout = selectedBorder.layout || Templates.getLayout('single');
    const tmplW = layout.w || 1080;
    const tmplH = layout.h || 1440;

    el.innerHTML = `
      <div class="booth-section">
        <div class="container">
          ${stepProgressHTML(3)}
          <button class="step-back" onclick="App.goBoothStep(2)">← kembali</button>

          <div class="step3-layout">
            <div class="camera-side">
              <div class="camera-settings-bar">
                <label>Timer: 
                  <select id="camera-timer-select">
                    <option value="3">3 Detik</option>
                    <option value="5">5 Detik</option>
                    <option value="7">7 Detik</option>
                    <option value="10">10 Detik</option>
                  </select>
                </label>
                <label>Mode: 
                  <select id="camera-mode-select">
                    <option value="auto">Auto-Next</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
              </div>

              <div class="simple-camera" id="camera-container">
                <video id="camera-video" autoplay playsinline muted></video>
                <div class="countdown-overlay" id="countdown-overlay">
                  <div class="countdown-number" id="countdown-number">3</div>
                </div>
                <div class="flash-overlay" id="flash-overlay"></div>
              </div>

              <div class="camera-info" id="camera-info">
                foto <span id="photo-counter">1</span> dari <span>${slotCount}</span>
              </div>

              <div class="camera-actions">
                <button class="cam-btn" id="btn-switch-camera" title="Ganti kamera">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                </button>
                <button class="capture-btn" id="btn-capture" title="Ambil foto"></button>
                <div style="width:48px;"></div>
              </div>
            </div>

            <div class="preview-side">
              <div class="live-preview-container" id="live-preview-container" style="aspect-ratio: ${tmplW} / ${tmplH};">
                <img class="live-preview-border" src="${selectedBorder.data_url}" alt="Border Preview" decoding="async">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    el.classList.add('active');

    // Init camera
    const video = document.getElementById('camera-video');
    await Camera.init(video);

    document.getElementById('btn-switch-camera')?.addEventListener('click', () => Camera.switchCamera());
    document.getElementById('btn-capture')?.addEventListener('click', () => handleCameraCapture(slotCount));
  }

  async function handleCameraCapture(totalSlots) {
    const captureBtn = document.getElementById('btn-capture');
    if (!captureBtn || captureBtn.disabled) return;
    captureBtn.disabled = true;

    const timerSelect = document.getElementById('camera-timer-select');
    const timerValue = timerSelect ? parseInt(timerSelect.value, 10) : 3;
    const modeSelect = document.getElementById('camera-mode-select');
    const isAuto = modeSelect && modeSelect.value === 'auto';

    // Countdown
    await Camera.startCountdown(timerValue);
    Camera.triggerFlash();
    const photo = Camera.captureFrame();

    if (photo) {
      capturedPhotos.push(photo);
      const thumbIdx = capturedPhotos.length - 1;

      // Update Live Preview (Inject photo div with calculated percentage bounds)
      const previewContainer = document.getElementById('live-preview-container');
      const layout = selectedBorder.layout || Templates.getLayout('single');
      const slot = layout.slots[thumbIdx];
      
      if (previewContainer && slot) {
        // Calculate percentages based on the actual template resolution (not hardcoded 1080x1440)
        const tmplW = layout.w || 1080;
        const tmplH = layout.h || 1440;
        
        // Add 4px bleed to hide any anti-aliased edge gaps from the PNG cutout
        const bleed = 4;
        const left = ((slot.x - bleed) / tmplW) * 100;
        const top = ((slot.y - bleed) / tmplH) * 100;
        const width = ((slot.w + bleed*2) / tmplW) * 100;
        const height = ((slot.h + bleed*2) / tmplH) * 100;

        const imgEl = document.createElement('img');
        imgEl.className = 'live-preview-photo anim-in';
        imgEl.src = photo;
        imgEl.style.left = left + '%';
        imgEl.style.top = top + '%';
        imgEl.style.width = width + '%';
        imgEl.style.height = height + '%';
        
        previewContainer.appendChild(imgEl);
      }

      // Update counter
      const counter = document.getElementById('photo-counter');
      if (counter) counter.textContent = Math.min(capturedPhotos.length + 1, totalSlots);

      if (capturedPhotos.length >= totalSlots) {
        // All photos taken! Compose and go to preview
        await composeAndPreview();
        return;
      } else if (isAuto) {
        // Short delay for the user to see the result, then trigger next capture automatically
        await new Promise(r => setTimeout(r, 1500));
        captureBtn.disabled = false;
        handleCameraCapture(totalSlots);
        return;
      }
    }

    // Small delay before allowing next manual capture
    await new Promise(r => setTimeout(r, 500));
    captureBtn.disabled = false;
  }

  // ----- STEP 3b: Upload -----
  function renderBoothStep3Upload(el) {
    if (!selectedBorder) { boothStep = 1; renderBooth(); return; }
    const slotCount = selectedBorder.layout ? selectedBorder.layout.slots.length : 1;
    capturedPhotos = new Array(slotCount).fill(null);

    el.innerHTML = `
      <div class="booth-section">
        <div class="container">
          ${stepProgressHTML(3)}
          <button class="step-back" onclick="App.goBoothStep(2)">← kembali</button>
          <h2 class="step-title">Upload ${slotCount} Foto</h2>
          <p class="step-desc">Klik setiap slot untuk memilih foto dari galeri.</p>

          <div class="upload-photos-grid" id="upload-grid">
            ${Array.from({length: slotCount}, (_, i) => `
              <div class="upload-photo-slot" id="upload-slot-${i}" onclick="App.pickUploadPhoto(${i})">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span class="slot-label">Foto ${i + 1}</span>
              </div>
            `).join('')}
          </div>

          <div style="text-align:center; margin-top:2rem;">
            <button class="btn btn-primary btn-lg" id="btn-compose-upload" disabled onclick="App.composeUploads()">
              Buat Foto →
            </button>
          </div>

          <input type="file" id="upload-file-input" accept="image/*" style="display:none">
        </div>
      </div>
    `;
    el.classList.add('active');
  }

  let currentUploadSlot = 0;

  function pickUploadPhoto(slotIndex) {
    currentUploadSlot = slotIndex;
    const input = document.getElementById('upload-file-input');
    if (!input) return;

    // Remove old listener by cloning
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('change', async () => {
      if (!newInput.files[0]) return;
      const dataURL = await Utils.fileToDataURL(newInput.files[0]);
      capturedPhotos[currentUploadSlot] = dataURL;

      // Update slot visual
      const slot = document.getElementById(`upload-slot-${currentUploadSlot}`);
      if (slot) {
        slot.className = 'upload-photo-slot filled';
        slot.innerHTML = `<img src="${dataURL}" alt="Foto ${currentUploadSlot + 1}">`;
        slot.onclick = () => pickUploadPhoto(currentUploadSlot); // Allow re-pick
      }

      // Enable compose button if all slots filled
      const allFilled = capturedPhotos.every(p => p !== null);
      const composeBtn = document.getElementById('btn-compose-upload');
      if (composeBtn) composeBtn.disabled = !allFilled;
    });

    newInput.click();
  }

  async function composeUploads() {
    const photos = capturedPhotos.filter(p => p !== null);
    if (photos.length === 0) return;
    await composeAndPreview(photos);
  }

  // ----- Compose & Preview -----
  async function composeAndPreview(photos = null) {
    const photosToUse = photos || capturedPhotos;
    const mode = photosToUse.length === 1 ? 'single' : 'filmstrip';

    composedResult = await Composer.compose(
      { mode, photos: photosToUse },
      selectedBorder?.data_url || null
    );

    if (selectedBorder) Templates.incrementUsage(selectedBorder.id);

    Camera.stop();
    window.location.hash = '#preview';
  }

  function goBoothStep(step) {
    if (step <= 2) Camera.stop();
    boothStep = step;
    if (step === 1) {
      selectedBorder = null;
      capturedPhotos = [];
    }
    renderBooth();
  }

  function selectEvent(eventId) {
    Templates.setEventFilter(eventId);
    boothStep = 1;
    window.location.hash = '#booth';
  }

  // ========== PREVIEW ==========
  function renderPreview() {
    const el = document.getElementById('view-preview');

    if (!composedResult) {
      el.innerHTML = `
        <div class="preview-section">
          <div class="container text-center">
            <h2 style="margin-bottom:0.5rem;">belum ada foto</h2>
            <p style="color:var(--text-secondary); margin-bottom:1.5rem;">ambil foto dulu yuk.</p>
            <a class="btn btn-primary btn-lg" href="#booth">kembali ke booth</a>
          </div>
        </div>
      `;
      el.classList.add('active');
      return;
    }

    el.innerHTML = `
      <div class="preview-section">
        <div class="container">
          <div class="preview-layout">
            <div class="preview-frame anim-in">
              <img src="${composedResult}" alt="Hasil foto" id="result-img">
            </div>
            <div class="preview-content anim-in anim-d2">
              <h2 class="preview-title">hasil capture</h2>
              <p class="preview-desc">
                foto kamu udah jadi — download atau share langsung.
              </p>

              <div class="action-list">
                <button class="action-item" id="btn-download">
                  <div class="action-item-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  </div>
                  <div class="action-item-text">
                    <h4>download</h4>
                    <p>simpan sebagai PNG HD</p>
                  </div>
                </button>

                <button class="action-item" id="btn-share">
                  <div class="action-item-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </div>
                  <div class="action-item-text">
                    <h4>share</h4>
                    <p>bagikan ke social media</p>
                  </div>
                </button>

                <button class="action-item" id="btn-retake">
                  <div class="action-item-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
                  </div>
                  <div class="action-item-text">
                    <h4>foto lagi</h4>
                    <p>kembali ke booth</p>
                  </div>
                </button>

                <button class="action-item" id="btn-home">
                  <div class="action-item-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </div>
                  <div class="action-item-text">
                    <h4>beranda</h4>
                    <p>halaman utama</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    el.classList.add('active');

    document.getElementById('btn-download')?.addEventListener('click', () => {
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      Utils.downloadImage(composedResult, `PhotoIn-${ts}.png`);
      Utils.showToast('foto berhasil diunduh', 'success');
    });
    document.getElementById('btn-share')?.addEventListener('click', () => Utils.shareImage(composedResult));
    document.getElementById('btn-retake')?.addEventListener('click', () => { boothStep = 2; window.location.hash = '#booth'; });
    document.getElementById('btn-home')?.addEventListener('click', () => { window.location.hash = '#home'; });
  }

  // ========== ADMIN ==========
  function renderAdmin() {
    const el = document.getElementById('view-admin');
    Admin.render(el);
    el.classList.add('active');
  }

  return { init, navigateTo, useTemplate, selectEvent, pickBorder, goBoothStep, pickUploadPhoto, composeUploads };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
