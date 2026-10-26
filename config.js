/**
 * VOLVO AUTOHUB — FRONTEND CONFIGURATION
 * 
 * Panduan Pengaturan:
 * 1. Deploy file `backend/Code.gs` sebagai Google Apps Script Web App:
 *    - Buka Google Sheets database Anda -> Extensions -> Apps Script
 *    - Tempelkan isi `backend/Code.gs`
 *    - Klik Deploy -> New Deployment
 *    - Pilih type: Web app
 *    - Execute as: "Me" (email Anda)
 *    - Who has access: "Anyone"
 * 2. Salin Web app URL yang didapat (berakhiran `/exec`), lalu tempelkan pada `GAS_API_URL` di bawah ini.
 */

const CONFIG = {
  // Ganti dengan URL Google Apps Script Web App Deployment Anda
  GAS_API_URL: 'https://script.google.com/macros/s/AKfycbyERU6li2_KR3QDC00jt4lJh_d4tEVrnm15C2qpcAG9BRWaYuJPvpm5WrPLtKXyYFF5/exec',

  // Request timeout (milidetik)
  REQUEST_TIMEOUT_MS: 35000,

  // Fallback nomor WhatsApp Sales Volvo
  DEFAULT_WHATSAPP: '6285760730132'
};

// Pasang ke window object agar dapat diakses oleh gas-bridge dan modul lain
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
