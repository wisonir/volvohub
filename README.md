# Volvo AutoHub — Decoupled Digital Showroom & Concierge

Repositori ini memuat implementasi modern **Volvo AutoHub** dengan arsitektur terpisah (*decoupled*):
- **Frontend**: Single Page Application (HTML5, Tailwind CSS, Lucide Icons, Vanilla JS) yang dihosting pada **GitHub Pages**.
- **Backend**: Headless REST/RPC JSON API yang berjalan di atas **Google Apps Script (GAS)** terhubung dengan **Google Sheets** dan **Google Drive**.

---

## 📁 Struktur Direktori

```text
Volvo Marketing/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD otomatis deployment frontend ke GitHub Pages
├── backend/
│   └── Code.gs             # Backend JSON API & Google Sheets Database Engine
├── frontend/
│   ├── index.html          # Shell antarmuka publik & modal studio visualizer
│   ├── style.css           # Custom styling Skandinavia & video cover
│   ├── config.js           # Konfigurasi endpoint GAS_API_URL
│   ├── gas-bridge.js       # HTTP Bridge & CORS adapter pengganti google.script.run
│   └── app.js              # Logika state, visualizer 360, & panel admin
├── _legacy_archive/        # Arsip file monolitik lama
├── .gitignore
└── README.md
```

---

## 🚀 Panduan Deployment Step-by-Step

### Langkah 1: Deploy Backend (Google Apps Script)

1. Buka spreadsheet Google Sheets database Volvo AutoHub Anda (atau buat spreadsheet baru).
2. Di menu atas Google Sheets, klik **Extensions (Ekstensi)** > **Apps Script**.
3. Buka file `backend/Code.gs` dari repositori ini, salin seluruh kodenya, dan tempelkan ke editor Apps Script (menggantikan kode lama).
4. Klik ikon **Save** (Ctrl+S / Cmd+S).
5. Klik tombol biru **Deploy** di pojok kanan atas > **New deployment**.
6. Klik ikon gerigi (Select type) > pilih **Web app**.
7. Isi formulir konfigurasi:
   - **Description**: `Volvo AutoHub Production API v1`
   - **Execute as**: `Me (email-anda@gmail.com)`
   - **Who has access**: **`Anyone`** *(Sangat penting agar frontend GitHub Pages bisa mengakses API)*
8. Klik **Deploy**. Berikan izin otorisasi Google jika diminta.
9. **Salin Web App URL** yang dihasilkan (URL berakhiran `/exec`).

---

### Langkah 2: Hubungkan Frontend ke Backend

1. Buka file `frontend/config.js`.
2. Tempelkan Web App URL yang Anda salin pada baris `GAS_API_URL`:
   ```javascript
   const CONFIG = {
     GAS_API_URL: 'https://script.google.com/macros/s/AKfycbx.../exec',
     REQUEST_TIMEOUT_MS: 35000,
     DEFAULT_WHATSAPP: '6281234567890'
   };
   ```
3. Simpan file `frontend/config.js`.

---

### Langkah 3: Deploy ke GitHub & Aktifkan GitHub Pages

1. Buat repositori baru di akun [GitHub](https://github.com/new) Anda (misalnya: `volvo-autohub`).
2. Jalankan perintah Git berikut di terminal komputer Anda:
   ```bash
   git add .
   git commit -m "feat: migrate to decoupled architecture & setup GitHub Pages CI/CD"
   git branch -M main
   git remote add origin https://github.com/<USERNAME-ANDA>/<NAMA-REPO>.git
   git push -u origin main
   ```
3. Aktifkan GitHub Pages di repositori GitHub Anda:
   - Masuk ke tab **Settings** repositori Anda di GitHub.
   - Di bilah samping kiri, klik **Pages**.
   - Pada bagian **Build and deployment > Source**, pilih **GitHub Actions**.
4. GitHub Actions akan otomatis mendeteksi file `.github/workflows/deploy.yml` dan mendeploy isi folder `frontend/`.
5. Tunggu proses build selesai (1–2 menit). URL website showroom Anda akan muncul di tab **Pages** (contoh: `https://<username>.github.io/<nama-repo>/`).

---

## 🛡️ Penanganan Masalah & Catatan Teknis (CORS)

- **Mengapa tidak terjadi CORS Error?**  
  File `gas-bridge.js` mengirimkan payload menggunakan mode `POST` dengan `Content-Type: text/plain;charset=utf-8`. Ini digolongkan sebagai *simple request* oleh standar W3C/Fetch API, sehingga browser **tidak** mengirimkan *preflight OPTIONS request* yang biasanya ditolak oleh Google Apps Script.
- **Setelan Hak Akses Drive:**  
  Jika Anda mengunggah media (video/brosur/gambar) melalui panel Admin, pastikan file atau folder Drive memiliki setelan akses *"Anyone with the link can view"* agar dapat dimuat oleh publik di browser.
