# Folder Static Frames

Simpan file PNG frame/border Anda di dalam folder ini (misal: `ultah.png`).

Untuk menampilkannya di website, buka file `js/templates.js` dan edit bagian `staticConfigs`.
Tambahkan kode berikut:

```javascript
{ 
  name: 'Ulang Tahun', 
  event_id: 'evt_custom', 
  image_path: 'assets/frames/ultah.png', 
  layout_type: 'single' 
}
```

Pilihan `layout_type`:
- `single` : 1 foto full layar
- `grid` : 4 kotak (2x2)
- `strip` : 4 kotak memanjang ke bawah (filmstrip)
