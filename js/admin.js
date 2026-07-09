/* ============================================
   ADMIN — Admin panel (professional style)
   ============================================ */

const Admin = (() => {
  const AUTH_KEY = 'photobooth_admin_auth';
  const CREDS = { username: 'admin', password: 'admin123' };
  let currentTab = 'templates';

  function isLoggedIn() { return Utils.loadFromStorage(AUTH_KEY, false); }
  function login(u, p) { if (u === CREDS.username && p === CREDS.password) { Utils.saveToStorage(AUTH_KEY, true); return true; } return false; }
  function logout() { Utils.removeFromStorage(AUTH_KEY); }

  function render(container) {
    isLoggedIn() ? renderDashboard(container) : renderLogin(container);
  }

  // ---- Login ----
  function renderLogin(container) {
    container.innerHTML = `
      <div class="admin-login-section">
        <div class="card login-card">
          <div class="login-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 class="login-title">admin panel</h2>
          <p class="login-subtitle">masuk untuk kelola template & event</p>
          <form id="login-form">
            <div class="form-group">
              <label class="form-label">username</label>
              <input type="text" id="admin-username" class="form-input" placeholder="username" value="admin" autocomplete="username">
            </div>
            <div class="form-group">
              <label class="form-label">password</label>
              <input type="password" id="admin-password" class="form-input" placeholder="password" autocomplete="current-password">
            </div>
            <div id="login-error" class="form-error" style="display:none; margin-bottom:1rem;"></div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%">masuk</button>
          </form>
          <p style="margin-top:1.25rem; font-size:0.75rem; color:var(--text-muted);">Selamat Datang, Silahkan Masuk!</p>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('admin-username').value;
      const p = document.getElementById('admin-password').value;
      if (login(u, p)) {
        Utils.showToast('selamat datang, admin', 'success');
        renderDashboard(container);
      } else {
        const err = document.getElementById('login-error');
        err.textContent = 'username atau password salah';
        err.style.display = 'block';
      }
    });
  }

  // ---- Dashboard ----
  function renderDashboard(container) {
    const stats = Templates.getStats();

    container.innerHTML = `
      <div class="admin-section">
        <div class="container">
          <div class="admin-header">
            <div>
              <h1 class="admin-title">dashboard</h1>
              <p style="color:var(--text-secondary); margin-top:4px; font-size:0.88rem;">kelola template & event photobooth</p>
            </div>
            <div class="btn-group">
              <a class="btn btn-ghost" href="#home">kembali ke beranda</a>
              <button class="btn btn-danger" id="btn-logout">logout</button>
            </div>
          </div>

          <div class="admin-stats">
            <div class="card stat-card">
              <div class="stat-value" style="color:white;">${stats.totalTemplates}</div>
              <div class="stat-label">total template</div>
            </div>
            <div class="card stat-card">
              <div class="stat-value" style="color:white;">${stats.activeTemplates}</div>
              <div class="stat-label">template aktif</div>
            </div>
            <div class="card stat-card">
              <div class="stat-value" style="color:white;">${stats.totalEvents}</div>
              <div class="stat-label">total event</div>
            </div>
            <div class="card stat-card">
              <div class="stat-value" style="color:var(--text-primary);">${stats.totalUsage}</div>
              <div class="stat-label">total sesi foto</div>
            </div>
          </div>

          <div class="admin-tabs">
            <button class="admin-tab ${currentTab === 'templates' ? 'active' : ''}" data-tab="templates">
              <span style="display:flex; align-items:center; gap:6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                template
              </span>
            </button>
            <button class="admin-tab ${currentTab === 'events' ? 'active' : ''}" data-tab="events">
              <span style="display:flex; align-items:center; gap:6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                event
              </span>
            </button>
            <button class="admin-tab ${currentTab === 'upload' ? 'active' : ''}" data-tab="upload">
              <span style="display:flex; align-items:center; gap:6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                upload
              </span>
            </button>
          </div>

          <div id="admin-tab-content"></div>
        </div>
      </div>
    `;

    document.getElementById('btn-logout').addEventListener('click', () => {
      logout();
      Utils.showToast('berhasil logout', 'info');
      renderLogin(container);
    });

    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentTab = tab.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent();
      });
    });

    renderTabContent();
  }

  function renderTabContent() {
    const el = document.getElementById('admin-tab-content');
    if (!el) return;
    ({ templates: renderTemplatesTab, events: renderEventsTab, upload: renderUploadTab })[currentTab]?.(el);
  }

  // ---- Templates Tab ----
  function renderTemplatesTab(el) {
    const templates = Templates.getTemplates();
    const events = Templates.getEvents();

    if (templates.length === 0) {
      el.innerHTML = `
        <div class="card text-center" style="padding:2.5rem;">
          <h3 style="margin-bottom:0.3rem;">belum ada template</h3>
          <p style="color:var(--text-secondary); font-size:0.88rem; margin-bottom:1rem;">upload template pertama kamu.</p>
          <button class="btn btn-accent" onclick="document.querySelector('[data-tab=upload]').click()">upload template</button>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="admin-template-grid">
        ${templates.map(t => {
          const evt = events.find(e => e.id === t.event_id);
          return `
            <div class="admin-template-card">
              <div class="admin-template-preview">
                <img src="${t.data_url}" alt="${t.name}" loading="lazy">
                <div style="position:absolute; top:6px; right:6px;">
                  <span class="badge ${t.is_active ? 'badge-active' : 'badge-inactive'}">${t.is_active ? 'aktif' : 'off'}</span>
                </div>
              </div>
              <div class="admin-template-info">
                <div class="admin-template-name" title="${t.name}">${t.name}</div>
                <div class="admin-template-meta">
                  <span>${evt ? evt.name.replace(/^\p{Emoji}\s*/u, '') : '—'}</span>
                  <span class="badge badge-count">${t.usage_count || 0}×</span>
                </div>
              </div>
              <div class="admin-template-actions" style="flex-wrap: wrap;">
                <button class="btn btn-sm ${t.is_active ? 'btn-danger' : 'btn-success'}" onclick="Admin.toggleTemplate('${t.id}')" style="flex:1; min-width: 100px;">
                  ${t.is_active ? 'nonaktifkan' : 'aktifkan'}
                </button>
                <button class="btn btn-sm btn-primary" onclick="Admin.editTemplate('${t.id}')" title="Edit" style="padding: 0.4rem 0.6rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="btn btn-sm btn-danger" onclick="Admin.removeTemplate('${t.id}')" title="Hapus" style="padding: 0.4rem 0.6rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ---- Events Tab ----
  function renderEventsTab(el) {
    const events = Templates.getEvents();
    const allT = Templates.getTemplates();

    el.innerHTML = `
      <div style="margin-bottom:1.25rem;">
        <button class="btn btn-accent" id="btn-add-event">tambah event</button>
      </div>
      ${events.length === 0 ? `
        <div class="card text-center" style="padding:2.5rem;">
          <h3>belum ada event</h3>
          <p style="color:var(--text-secondary); font-size:0.88rem;">buat event pertama kamu.</p>
        </div>
      ` : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>nama</th><th>template</th><th>status</th><th>tanggal</th><th>aksi</th></tr></thead>
            <tbody>
              ${events.map(e => {
                const tc = allT.filter(t => t.event_id === e.id).length;
                return `<tr>
                  <td><strong>${e.name}</strong></td>
                  <td><span class="badge badge-info">${tc}</span></td>
                  <td><span class="badge ${e.is_active ? 'badge-active' : 'badge-inactive'}">${e.is_active ? 'aktif' : 'off'}</span></td>
                  <td style="color:var(--text-muted);">${Utils.formatDate(e.created_at)}</td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-sm ${e.is_active ? 'btn-danger' : 'btn-success'}" onclick="Admin.toggleEvent('${e.id}')">${e.is_active ? 'nonaktifkan' : 'aktifkan'}</button>
                      <button class="btn btn-sm btn-primary" onclick="Admin.editEvent('${e.id}')">edit</button>
                      <button class="btn btn-sm btn-danger" onclick="Admin.removeEvent('${e.id}')">hapus</button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    document.getElementById('btn-add-event')?.addEventListener('click', showAddEventModal);
  }

  // ---- Upload Tab ----
  function renderUploadTab(el) {
    const events = Templates.getEvents();

    el.innerHTML = `
      <div class="card" style="max-width:560px;">
        <h3 style="margin-bottom:1.25rem; font-family:var(--font-sans);">upload template</h3>
        <form id="upload-form">
          <div class="form-group">
            <label class="form-label">nama template</label>
            <input type="text" id="upload-name" class="form-input" placeholder="contoh: Frame Aesthetic" required>
          </div>
          <div class="form-group">
            <label class="form-label">layout template</label>
            <select id="upload-layout-type" class="form-select" required>
              <option value="auto" selected>✨ Auto Detect (Otomatis deteksi area transparan)</option>
              <option value="single">Single Photo (Layar Penuh)</option>
              <option value="grid">4-Cut (Grid 2x2)</option>
              <option value="strip">Filmstrip (4 Foto Vertikal)</option>
            </select>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">Jika pilih Auto Detect, pastikan lubang foto di template Anda benar-benar transparan 100%.</p>
          </div>
          <div class="form-group">
            <label class="form-label">event</label>
            <select id="upload-event" class="form-select" required>
              <option value="">— pilih event —</option>
              ${events.map(e => `<option value="${e.id}">${e.name.replace(/^\p{Emoji}\s*/u, '')}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">file PNG</label>
            <div class="upload-zone" id="upload-zone">
              <div class="upload-zone-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <div class="upload-zone-text">klik atau drag & drop file PNG</div>
              <div class="upload-zone-hint">format: PNG (wajib transparan), maks: 5MB. disarankan 1080x1440px.</div>
              <input type="file" id="upload-file" accept="image/png" style="display:none">
            </div>
            <div class="upload-preview" id="upload-preview">
              <img id="upload-preview-img" alt="Preview" style="max-height:180px; border-radius:12px; margin:0.75rem auto; display:block; background:repeating-conic-gradient(var(--bg-surface) 0% 25%, var(--bg-raised) 0% 50%) 50%/16px 16px;">
              <p id="upload-file-info" style="text-align:center; font-size:0.78rem; color:var(--text-muted);"></p>
            </div>
            <div id="upload-errors" class="form-error" style="display:none;"></div>
          </div>
          <div class="btn-group">
            <button type="submit" class="btn btn-primary" id="upload-submit" disabled>upload & simpan</button>
            <button type="button" class="btn btn-ghost" id="upload-reset">reset</button>
          </div>
        </form>
      </div>
    `;

    setupUpload();
  }

  function setupUpload() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('upload-file');
    const previewDiv = document.getElementById('upload-preview');
    const previewImg = document.getElementById('upload-preview-img');
    const fileInfo = document.getElementById('upload-file-info');
    const errorsDiv = document.getElementById('upload-errors');
    const submitBtn = document.getElementById('upload-submit');
    const form = document.getElementById('upload-form');

    let fileDataURL = null;

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

    async function handleFile(file) {
      const v = Utils.validatePNG(file);
      if (!v.valid) {
        errorsDiv.textContent = v.errors.join('. ');
        errorsDiv.style.display = 'block';
        submitBtn.disabled = true;
        previewDiv.classList.remove('has-file');
        return;
      }
      errorsDiv.style.display = 'none';
      fileDataURL = await Utils.fileToDataURL(file);
      const dims = await Utils.getImageDimensions(fileDataURL);
      previewImg.src = fileDataURL;
      fileInfo.textContent = `${file.name} — ${dims.width}×${dims.height} — ${(file.size / 1024).toFixed(1)}KB`;
      previewDiv.classList.add('has-file');
      submitBtn.disabled = false;
    }

    document.getElementById('upload-reset').addEventListener('click', () => {
      form.reset(); fileDataURL = null;
      previewDiv.classList.remove('has-file');
      errorsDiv.style.display = 'none';
      submitBtn.disabled = true;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('upload-name').value.trim();
      const eventId = document.getElementById('upload-event').value;
      const layoutType = document.getElementById('upload-layout-type').value;

      if (!name || !eventId || !fileDataURL) { Utils.showToast('lengkapi semua field', 'error'); return; }

      submitBtn.disabled = true;
      submitBtn.textContent = 'memproses...';

      let layout;
      if (layoutType === 'auto') {
        try {
          let slots = await Utils.detectTransparentSlots(fileDataURL);
          
          // If no transparent slots found, try detecting white slots
          if (slots.length === 0 && Templates.detectWhiteSlots) {
            slots = await Templates.detectWhiteSlots(fileDataURL);
          }
          
          if (slots.length === 0) {
            Utils.showToast('Gagal mendeteksi kotak foto. Pastikan area foto transparan atau putih.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'upload & simpan';
            return;
          }
          layout = { type: 'custom', slots: slots };
          console.log('[AutoDetect] Detected slots:', slots);
        } catch (e) {
          Utils.showToast('Terjadi kesalahan saat memproses gambar.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'upload & simpan';
          return;
        }
      } else {
        layout = Templates.getLayout(layoutType);
      }

      const dims = await Utils.getImageDimensions(fileDataURL);
      
      Templates.addTemplate({
        id: Utils.generateId(), name, event_id: eventId, data_url: fileDataURL,
        layout: layout,
        orientation: dims.width > dims.height ? 'landscape' : 'portrait',
        width: dims.width, height: dims.height, is_active: true, usage_count: 0,
        uploaded_at: new Date().toISOString()
      });

      Utils.showToast('template berhasil diupload', 'success');
      currentTab = 'templates';
      renderDashboard(document.getElementById('view-admin'));
    });
  }

  // ---- Modal ----
  function showAddEventModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">tambah event</h3>
        <button class="modal-close" onclick="Admin.closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <form id="add-event-form">
        <div class="form-group">
          <label class="form-label">nama event</label>
          <input type="text" id="event-name" class="form-input" placeholder="contoh: Wisuda UNSIQ 2026" required>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">simpan</button>
          <button type="button" class="btn btn-ghost" onclick="Admin.closeModal()">batal</button>
        </div>
      </form>
    `;
    overlay.classList.add('active');

    document.getElementById('add-event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('event-name').value.trim();
      if (!name) return;
      Templates.addEvent({ id: 'evt_' + Utils.generateId(), name, slug: Utils.slugify(name), is_active: true, created_at: new Date().toISOString() });
      Utils.showToast(`event "${name}" ditambahkan`, 'success');
      closeModal();
      renderTabContent();
    });
  }

  function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

  function showEditTemplateModal(id) {
    const t = Templates.getTemplateById(id);
    if (!t) return;
    const events = Templates.getEvents();
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">edit template</h3>
        <button class="modal-close" onclick="Admin.closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <form id="edit-template-form">
        <div class="form-group">
          <label class="form-label">nama template</label>
          <input type="text" id="edit-template-name" class="form-input" value="${t.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">pilih event</label>
          <select id="edit-template-event" class="form-select">
            <option value="">(tanpa event)</option>
            ${events.map(e => `<option value="${e.id}" ${t.event_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">simpan</button>
          <button type="button" class="btn btn-ghost" onclick="Admin.closeModal()">batal</button>
        </div>
      </form>
    `;
    overlay.classList.add('active');

    document.getElementById('edit-template-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-template-name').value.trim();
      const event_id = document.getElementById('edit-template-event').value;
      if (!name) return;
      Templates.updateTemplate(id, { name, event_id });
      Utils.showToast('template diperbarui', 'success');
      closeModal();
      renderTabContent();
    });
  }

  function showEditEventModal(id) {
    const ev = Templates.getEventById(id);
    if (!ev) return;
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">edit event</h3>
        <button class="modal-close" onclick="Admin.closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <form id="edit-event-form">
        <div class="form-group">
          <label class="form-label">nama event & ikon/emoji</label>
          <input type="text" id="edit-event-name" class="form-input" value="${ev.name}" placeholder="contoh: 🎓 Wisuda 2026" required>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">simpan</button>
          <button type="button" class="btn btn-ghost" onclick="Admin.closeModal()">batal</button>
        </div>
      </form>
    `;
    overlay.classList.add('active');

    document.getElementById('edit-event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-event-name').value.trim();
      if (!name) return;
      Templates.updateEvent(id, { name, slug: Utils.slugify(name) });
      Utils.showToast('event diperbarui', 'success');
      closeModal();
      renderTabContent();
    });
  }

  // ---- Actions ----
  function toggleTemplate(id) {
    const t = Templates.getTemplateById(id);
    if (t) { Templates.updateTemplate(id, { is_active: !t.is_active }); Utils.showToast(t.is_active ? 'template dinonaktifkan' : 'template diaktifkan', 'success'); renderTabContent(); refreshStats(); }
  }
  function removeTemplate(id) {
    if (confirm('hapus template ini?')) { Templates.deleteTemplate(id); Utils.showToast('template dihapus', 'info'); renderTabContent(); refreshStats(); }
  }
  function toggleEvent(id) {
    const e = Templates.getEventById(id);
    if (e) { Templates.updateEvent(id, { is_active: !e.is_active }); Utils.showToast(e.is_active ? 'event dinonaktifkan' : 'event diaktifkan', 'success'); renderTabContent(); refreshStats(); }
  }
  function removeEvent(id) {
    const tc = Templates.getTemplates().filter(t => t.event_id === id).length;
    if (confirm(tc > 0 ? `event ini punya ${tc} template. semua akan terhapus. lanjut?` : 'hapus event ini?')) {
      Templates.deleteEvent(id); Utils.showToast('event dihapus', 'info'); renderTabContent(); refreshStats();
    }
  }

  function refreshStats() {
    const s = Templates.getStats();
    const vals = document.querySelectorAll('.stat-value');
    if (vals.length >= 4) { vals[0].textContent = s.totalTemplates; vals[1].textContent = s.activeTemplates; vals[2].textContent = s.totalEvents; vals[3].textContent = s.totalUsage; }
  }

  return { render, isLoggedIn, login, logout, toggleTemplate, removeTemplate, editTemplate: showEditTemplateModal, toggleEvent, removeEvent, editEvent: showEditEventModal, closeModal };
})();
