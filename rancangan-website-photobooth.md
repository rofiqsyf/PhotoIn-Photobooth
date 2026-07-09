# Rancangan Website Photobooth Digital
### Berbasis Analisis Tren Pasar & Kebutuhan Fitur Admin Template

---

## 1. Ringkasan Eksekutif

Dokumen ini menyajikan rancangan konseptual untuk sebuah **website photobooth digital**, yaitu platform yang memungkinkan pengunjung mengambil foto/selfie secara langsung melalui browser, kemudian menyandingkannya dengan **template frame berformat PNG** yang telah disediakan oleh admin. Rancangan disusun berdasarkan observasi tren produk sejenis yang berkembang di pasar (khususnya tren "aesthetic photobooth" yang populer di kalangan Gen Z dan mahasiswa sejak 2023–2026) serta praktik umum arsitektur web modern.

> **Catatan metodologis:** Karena pengetahuan model memiliki batas waktu (Januari 2026) dan tren digital berubah cepat, data kompetitor dan statistik pasar di bawah ini bersifat **indikatif berdasarkan pola umum industri**, bukan hasil scraping data real-time. Disarankan memvalidasi ulang dengan mengaktifkan fitur *web search* jika Anda memerlukan data kompetitor paling mutakhir.

---

## 2. Riset & Analisis Tren Pasar

### 2.1 Pola Tren yang Teridentifikasi

| Tren | Deskripsi | Relevansi bagi Rancangan |
|---|---|---|
| **Retro/Y2K Filmstrip** | Frame vertikal 3–4 foto ala mesin photobooth analog tahun 90-2000an | Jadi kategori template wajib (default) |
| **Aesthetic Overlay/Branding** | Frame dengan elemen dekoratif (stiker, teks, logo event) untuk keperluan wedding, wisuda, seminar kampus | Mendorong kebutuhan *multi-template per event* |
| **Instant Share ke Sosmed** | Hasil foto langsung bisa dibagikan ke Instagram Story/WhatsApp | Fitur *share button* wajib ada |
| **QR Code / Link Download** | Alternatif print fisik: pengunjung scan QR untuk unduh hasil ke HP | Relevan untuk booth di acara kampus/event offline |
| **Kustomisasi oleh Penyelenggara** | Panitia event ingin frame sesuai identitas acara mereka sendiri | **Ini akar kebutuhan fitur admin upload PNG** |
| **AI Filter/Background Removal** | Beberapa kompetitor mulai menyisipkan fitur ganti background otomatis | Fitur *nice-to-have*, bisa masuk roadmap V2 |

### 2.2 Insight Kunci

1. Diferensiasi utama produk semacam ini **bukan pada fitur ambil foto** (relatif standar di semua kompetitor), melainkan pada **variasi & kualitas template** serta **kemudahan admin mengelola template tersebut**.
2. Segmen pasar terbesar di Indonesia untuk kasus ini adalah **event kampus** (wisuda, seminar, lomba, ospek) dan **UMKM kreatif** (studio foto kecil, wedding organizer) — relevan dengan latar belakang Anda sebagai mahasiswa UNSIQ.
3. Karena target user berganti-ganti sesuai event, **arsitektur multi-tenant sederhana** (per-event template set) lebih relevan daripada template global tunggal.

---

## 3. Target Pengguna & Persona

| Persona | Kebutuhan Utama | Frustrasi terhadap Produk Lama |
|---|---|---|
| **Panitia Event (Admin)** | Upload frame PNG custom sesuai tema acara, cepat, tanpa coding | Software photobooth desktop sulit di-custom ulang tiap event |
| **Pengunjung Acara (User)** | Ambil foto cepat, pilih frame menarik, langsung dapat hasil | Antrian lama, hasil buram, tidak bisa langsung share |

---

## 4. Fitur Utama Website

### 4.1 Sisi Pengunjung (User)
- Akses kamera langsung via browser (`getUserMedia` API)
- Countdown timer sebelum jepret (3-2-1)
- Pilihan mode: single shot / filmstrip (multi-foto otomatis)
- Galeri pilihan **template PNG** yang sudah diunggah admin (real-time, tanpa perlu reload)
- Preview live overlay template di atas kamera sebelum jepret (opsional, tingkat lanjut)
- Download hasil (PNG/JPEG) & tombol share ke sosial media
- Opsional: generate QR code untuk unduh dari HP

### 4.2 Sisi Admin
- **Login admin** (autentikasi terpisah dari user biasa)
- **Upload template PNG** dengan validasi:
  - Format wajib `.png` (mendukung transparansi/alpha channel — krusial karena template harus "berlubang" di bagian foto pengunjung)
  - Validasi ukuran file (mis. maks 5MB) dan resolusi minimum (mis. 1080×1920 untuk mode potret)
  - Preview template setelah upload sebelum dipublish
- **Manajemen kategori/event**: kelompokkan template per acara (mis. "Wisuda 2026", "Lomba UI/UX HIMTI")
- **Aktif/nonaktifkan template** tanpa menghapus (soft toggle)
- **Statistik penggunaan**: berapa kali tiap template dipakai/diunduh
- **Hapus/replace template**

---

## 5. Alur Sistem (User Flow)

```
[Pengunjung buka web]
        |
        v
[Pilih Event/Kategori Template] --(data difetch dari DB, diisi Admin)
        |
        v
[Pilih Template PNG spesifik]
        |
        v
[Aktifkan kamera & ambil foto] --(overlay template ditampilkan di atas live preview)
        |
        v
[Compose: gabungkan foto asli + layer PNG template] --(canvas rendering)
        |
        v
[Preview hasil akhir]
        |
        v
[Download / Share / Scan QR]
```

```
[Admin login]
        |
        v
[Dashboard: daftar event & template]
        |
        v
[Upload PNG baru] --(validasi format, transparansi, ukuran)
        |
        v
[Assign ke kategori/event]
        |
        v
[Publish -> muncul otomatis di sisi user]
```

---

## 6. Arsitektur & Tech Stack yang Direkomendasikan

Mengingat latar belakang Anda sudah familiar dengan **PHP + Tailwind (SAQUNA)** dan juga eksplorasi **FastAPI**, berikut perbandingan dua pendekatan:

| Aspek | Opsi A: Laravel + MySQL + Tailwind | Opsi B: Next.js + Node/Express + PostgreSQL |
|---|---|---|
| **Kecepatan development** | Cepat jika sudah terbiasa Laravel (seperti pengalaman SAQUNA Anda) | Perlu setup API terpisah, lebih fleksibel untuk SPA real-time |
| **Kamera & Canvas rendering** | Tetap pakai JS murni/Alpine.js di sisi client | Native cocok dengan React state management |
| **Upload & storage PNG** | Laravel Storage (local/S3) + validasi built-in (`image`, `mimes:png`) | Multer/S3 SDK, perlu setup manual |
| **Skalabilitas** | Baik untuk skala event kampus/UMKM | Lebih baik jika nanti ingin scale ke SaaS multi-klien |
| **Kesesuaian pengalaman Anda** | ✅ Selaras dengan stack SAQUNA yang sudah dikuasai | Perlu ramp-up tambahan |

**Rekomendasi:** Opsi A (Laravel + Tailwind + Material Design 3) untuk konsistensi dengan proyek Anda sebelumnya dan mempercepat pengembangan MVP.

### Komponen Teknis Kunci
- **Kamera & Compositing**: `getUserMedia()` + `<canvas>` API di frontend untuk menggabungkan frame video dengan layer PNG (memanfaatkan transparansi alpha)
- **Storage**: folder `storage/templates/{event_id}/` atau cloud storage (S3-compatible) agar tidak membebani server
- **Optimasi gambar**: kompres PNG saat upload (mis. pakai `Intervention Image` di Laravel) tanpa merusak transparansi

---

## 7. Skema Database (ERD Ringkas)

```
users (admin)
├── id
├── name
├── email
├── password
└── role (admin/superadmin)

events
├── id
├── name             -- contoh: "Wisuda UNSIQ 2026"
├── slug
├── is_active
└── created_at

templates
├── id
├── event_id (FK -> events.id)
├── file_path        -- path PNG di storage
├── orientation      -- portrait/landscape
├── width, height
├── is_active
├── usage_count
└── uploaded_at

captures (opsional, untuk analitik & histori hasil user)
├── id
├── template_id (FK -> templates.id)
├── result_path
├── created_at
```

**Relasi:**
`events (1) — (N) templates — (N) captures`

---

## 8. Spesifikasi Detail Fitur Upload Template PNG

Karena ini adalah fitur inti pembeda produk, berikut kaidah teknis yang perlu diperhatikan agar hasil compositing rapi:

1. **Validasi format & transparansi**
   - Cek MIME type `image/png` di sisi server, bukan hanya ekstensi file (rawan spoofing)
   - Idealnya, validasi bahwa PNG memiliki alpha channel (bisa dicek via library image processing) — jika tidak, area foto pengunjung tidak akan "terlihat" karena frame akan menutupi seluruhnya

2. **Standardisasi rasio & resolusi**
   - Tetapkan rasio baku, misalnya **9:16 (potret, untuk story-friendly)** dan **4:3 (klasik filmstrip)**
   - Validasi resolusi minimum agar tidak pecah saat dicetak/dibagikan

3. **Preview sebelum publish**
   - Tampilkan simulasi overlay template di atas contoh foto dummy, agar admin bisa mengecek posisi "lubang" foto sebelum dipublikasikan ke pengunjung

4. **Keamanan upload**
   - Batasi ukuran file (mencegah abuse storage)
   - Re-generate nama file (hindari path traversal / nama file berbahaya)
   - Simpan di luar `public/` langsung bila perlu kontrol akses lebih ketat

---

## 9. Roadmap Pengembangan

| Fase | Fitur | Estimasi Kompleksitas |
|---|---|---|
| **MVP (V1)** | Ambil foto, pilih template statis, download hasil, admin upload PNG dasar | Sedang |
| **V1.5** | Multi-event/kategori, live preview overlay kamera, share ke sosmed | Sedang-Tinggi |
| **V2** | QR code instant download, statistik penggunaan template, AI background removal | Tinggi |
| **V3 (opsional/SaaS)** | Multi-tenant untuk banyak klien/event organizer sekaligus, sistem langganan | Tinggi |

---

## 10. Kesimpulan

Diferensiasi produk photobooth digital ini terletak pada **fleksibilitas admin dalam mengelola template PNG per-event**, bukan sekadar fitur ambil foto yang sudah jadi komoditas di pasar. Rancangan di atas menempatkan sistem **manajemen template** sebagai modul inti — dengan validasi format, transparansi, dan kategori event — agar produk dapat diadaptasi cepat untuk berbagai kebutuhan (wisuda, lomba, UMKM) tanpa perlu deploy ulang kode setiap kali ada acara baru.

Jika diperlukan, langkah selanjutnya yang bisa saya bantu:
- Membuat **wireframe/mockup UI** (hi-fi) untuk dashboard admin & halaman capture
- Menyusun **ERD lengkap dalam bentuk diagram**
- Membuat **skeleton code Laravel** untuk modul upload template dengan validasi di atas
