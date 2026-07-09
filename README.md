# 📸 PhotoIn Photobooth

Selamat datang di repositori **PhotoIn Photobooth**! Aplikasi ini adalah web-based photobooth modern dan interaktif yang sepenuhnya berjalan di sisi klien (frontend). Dibuat untuk menghadirkan pengalaman berfoto ala studio langsung dari peramban (browser) di berbagai perangkat, baik desktop maupun mobile.

## ✨ Fitur Utama

- **📷 Pengambilan Foto Langsung & Unggah**: Pengguna dapat mengambil foto secara langsung menggunakan kamera (mendukung kamera depan/belakang di HP) atau mengunggah foto dari galeri.
- **🖼️ Border & Frame Kustom**: Pilih dari berbagai desain *border* menarik yang dikelompokkan berdasarkan acara (Event) tertentu (misalnya: Wisuda, Valentine, Y2K, dll).
- **🤖 Deteksi Kotak Otomatis (Smart Slot Detection)**: Sistem dapat secara pintar mendeteksi area transparan/lubang pada *border* untuk menempatkan foto secara presisi.
- **🐍 Chroma Key Otomatis**: Dilengkapi dengan *script* Python di balik layar (`remove_green.py`) yang berjalan otomatis untuk mendeteksi *Green Screen* atau *Blue Screen* pada gambar desain *border* baru dan menyapunya menjadi transparan dengan sangat rapi (mendukung *Anti-Aliasing* dan *Color Despilling*).
- **📱 Responsif & Proporsional**: Antarmuka dirancang *Mobile-First*, sehingga tombol kontrol dan area kamera tidak akan bertabrakan dengan antarmuka peramban HP Anda.
- **🎛️ Panel Admin**: Tersedia halaman Admin interaktif (`admin.html`) untuk mengunggah desain *border* baru, mengatur kategori *Event*, serta mengekspor data ke dalam sistem tanpa memerlukan *database* (sepenuhnya berbasis file JSON/JS).

## 🚀 Teknologi yang Digunakan

Aplikasi ini dibangun murni menggunakan teknologi web modern, sehingga sangat mudah di- *host* (hosting gratis) di *platform* seperti **Vercel**, **Github Pages**, atau **Netlify**:

- **HTML5 & CSS3**: Struktur dan desain antarmuka modern yang memanjakan mata (*glassmorphism*, *smooth animation*).
- **Vanilla JavaScript (ES6)**: Seluruh logika aplikasi (kamera, perhitungan posisi, rendering *canvas*) berjalan murni dengan JS tanpa *framework* berat.
- **Python (Pillow & NumPy)**: *Script* opsional di komputer lokal (`remove_green.py`) untuk optimasi penghapusan *green/blue screen* super cepat sebelum aset dipublikasikan.

## 🛠️ Cara Penggunaan (Untuk Developer/Pemilik)

### 1. Menjalankan secara Lokal
Karena aplikasi ini 100% berbasis *frontend*, Anda cukup membuka file `index.html` di peramban Anda. Namun, untuk pengalaman terbaik dan agar fitur kamera serta *export* modul JS berfungsi normal, sangat disarankan menggunakan ekstensi seperti **Live Server** di VS Code.

### 2. Mengunggah Border Baru (Panel Admin)
1. Buka halaman `/admin.html`.
2. Klik tombol unggah *border* dan pilih file berformat `.png` (Pastikan area fotonya transparan atau berwarna putih kosong).
3. Tentukan nama dan kategori acara (Event).
4. Klik **"Simpan"** lalu klik **"Download Data & Terapkan"**. Hal ini akan menghasilkan file `photobooth_data.js`.
5. Timpa file `js/photobooth_data.js` yang lama dengan file yang baru saja didownload tersebut agar Vercel membaca data terbaru.

### 3. Menggunakan Script Chroma Key (Green/Blue Screen Remover)
Jika *border* Anda masih memiliki warna hijau (`#00FF00`) atau biru pekat:
1. Pastikan Anda telah menginstal Python beserta modul `Pillow` dan `numpy` (`pip install Pillow numpy`).
2. Jalankan perintah `python remove_green.py` di terminal.
3. *Script* ini akan memantau folder `assets/frames/`. Setiap Anda menempelkan (*copy-paste*) gambar ber- *green screen* ke folder tersebut, *script* akan langsung mengubahnya menjadi transparan secara *real-time*.

## 🌐 Deployment (Publikasi)

Proyek ini sudah dikonfigurasi untuk langsung di- *deploy* melalui Vercel! 
Setiap kali Anda menekan perintah `git push` ke *branch* `main` di Github, Vercel akan otomatis menarik versi terbaru dan memperbarui situs *live* Anda dalam waktu kurang dari 2 menit.

---
*Dibuat dengan 💖 untuk mengabadikan momen-momen terbaikmu.*
