/**
 * VOLVO AUTOHUB — BACKEND CONTROLLER & DATABASE ENGINE
 * Google Apps Script Web App
 */

// Global Sheet Names
const SHEET_CARS = 'DATA_CARS';
const SHEET_LEADS = 'DATA_LEADS';
const SHEET_CONFIG = 'CONFIG_ADMIN';

/**
 * HTTP GET Entry Point — Merender HTML Shell
 */
function doGet(e) {
  setupDatabase(); // Pastikan lembar kerja database tersedia
  
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Volvo AutoHub — Scandinavian Luxury Digital Showroom')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk menyertakan file CSS dan JS modular
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Setup Database Otomatis: Membuat lembar kerja dan data katalog bawaan jika belum ada
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. DATA_CARS Sheet
  let carSheet = ss.getSheetByName(SHEET_CARS);
  if (!carSheet) {
    carSheet = ss.insertSheet(SHEET_CARS);
    const carHeaders = [
      'ID', 'Model', 'Trim', 'Category', 'PriceOTR', 'Acceleration', 
      'RangeOrPower', 'BatteryCapacity', 'ChargingSpeed', 'MainImageUrl', 
      'VideoUrl', 'ExteriorColorsJson', 'InteriorImagesJson', 'KeyFeaturesJson', 
      'BrochurePdfUrl', 'Status', 'UpdatedAt'
    ];
    carSheet.appendRow(carHeaders);
    carSheet.getRange(1, 1, 1, carHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    
    // Seed Data: Volvo EX30 & XC40 Recharge
    seedInitialCars(carSheet);
  }

  // Migrasi ringan: pastikan spreadsheet lama (15 kolom) ikut punya
  // kolom Status & UpdatedAt agar katalog publik tidak kosong.
  ensureCarColumns_(carSheet);

  // 2. DATA_LEADS Sheet
  let leadSheet = ss.getSheetByName(SHEET_LEADS);
  if (!leadSheet) {
    leadSheet = ss.insertSheet(SHEET_LEADS);
    const leadHeaders = [
      'LeadID', 'Timestamp', 'FullName', 'WhatsApp', 'ModelInterest', 
      'FormatDelivery', 'CityShowroom', 'PreferredDate', 'PreferredSlot', 
      'Notes', 'FollowUpStatus', 'HandledBy'
    ];
    leadSheet.appendRow(leadHeaders);
    leadSheet.getRange(1, 1, 1, leadHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    
    // Seed Sample Leads for Initial CRM Visuals
    seedInitialLeads(leadSheet);
  }

  // 3. CONFIG_ADMIN Sheet
  let configSheet = ss.getSheetByName(SHEET_CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEET_CONFIG);
    configSheet.appendRow(['Key', 'Value']);
    configSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f1f5f9');
    
    // Default Password: 'admin' (SHA-256 Hash)
    const defaultHash = computeSHA256('admin');
    configSheet.appendRow(['ADMIN_PASS_HASH', defaultHash]);
    configSheet.appendRow(['SALES_WHATSAPP', '6281234567890']);
    configSheet.appendRow(['NOTIF_EMAIL', Session.getActiveUser().getEmail() || 'sales.volvo@example.com']);
  }
  // 4. CONFIG_SITE Sheet (konten landing page dinamis)
  ensureSiteConfigSheet_();

  // 5. Pastikan Drive Induk & subfolder fungsional tersedia (sekali saja)
  ensureDriveSetupOnce_();
}

/**
 * Utility: pastikan sheet katalog memakai skema 17 kolom terbaru.
 * Aman dijalankan berulang; baris lama otomatis diberi Status 'Active'.
 */
function ensureCarColumns_(sheet) {
  if (!sheet) return;

  const headers = [
    'ID', 'Model', 'Trim', 'Category', 'PriceOTR', 'Acceleration',
    'RangeOrPower', 'BatteryCapacity', 'ChargingSpeed', 'MainImageUrl',
    'VideoUrl', 'ExteriorColorsJson', 'InteriorImagesJson', 'KeyFeaturesJson',
    'BrochurePdfUrl', 'Status', 'UpdatedAt'
  ];

  if (sheet.getLastColumn() < headers.length) {
    const head = sheet.getRange(1, 1, 1, headers.length);
    head.setValues([headers]);
    head.setFontWeight('bold').setBackground('#f1f5f9');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Isi kolom Status (kolom 16) untuk baris yang masih kosong.
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();
  const statuses = rows.map(function (row) {
    if (!row[0]) return [''];
    return [row[15] ? row[15] : 'Active'];
  });

  sheet.getRange(2, 16, statuses.length, 1).setValues(statuses);
}

/**
 * Seed data unit mobil awal
 */
function seedInitialCars(sheet) {
  const ex30Colors = JSON.stringify([
    { name: 'Cloud Blue Metallic', hex: '#A9BAC6', imgUrl: 'https://www.volvocars.com/images/v/-/media/project/cars/ex30/launch/ex30_exterior_cloud_blue.png' },
    { name: 'Onyx Black Metallic', hex: '#1B1B1B', imgUrl: 'https://www.volvocars.com/images/v/-/media/project/cars/ex30/launch/ex30_exterior_onyx_black.png' },
    { name: 'Crystal White Pearl', hex: '#F4F4F4', imgUrl: 'https://www.volvocars.com/images/v/-/media/project/cars/ex30/launch/ex30_exterior_crystal_white.png' },
    { name: 'Moss Yellow', hex: '#BDB76B', imgUrl: 'https://www.volvocars.com/images/v/-/media/project/cars/ex30/launch/ex30_exterior_moss_yellow.png' }
  ]);

  const ex30Interiors = JSON.stringify([
    { title: 'Nordico Upholstery Breeze', desc: 'Bahan daur ulang botol PET & minyak pinus alami Skandinavia.', imgUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80' },
    { title: 'Harman Kardon Soundbar', desc: 'Desain soundbar melintang di sepanjang dashboard depan.', imgUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80' }
  ]);

  const ex30Features = JSON.stringify([
    { title: 'Safe Space Technology™', desc: 'Deteksi radar pembuka pintu untuk mencegah tabrakan dengan pesepeda.' },
    { title: 'Pilot Assist Semi-Autonomous', desc: 'Menjaga lajur jalan secara adaptif dan jarak aman otomatis.' },
    { title: 'One-Pedal Drive Tuning', desc: 'Pengendaraan presisi dan regenerasi daya baterai instan.' }
  ]);

  sheet.appendRow([
    'VOLVO-EX30-01', 'Volvo EX30', 'Ultra Twin Motor Performance', 'Pure Electric', 
    'Rp 1.160.000.000', '3.6 detik', '476 km', '69 kWh (NMC)', '26 mnt (10-80%)',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80',
    'https://www.youtube.com/embed/dQw4w9WgXcQ', ex30Colors, ex30Interiors, ex30Features,
    'https://www.volvocars.com', 'Active', new Date()
  ]);

  sheet.appendRow([
    'VOLVO-XC40-02', 'Volvo XC40 Recharge', 'Pure Electric Twin Motor Ultimate', 'Pure Electric', 
    'Rp 1.390.000.000', '4.8 detik', '500 km', '78 kWh (NMC)', '28 mnt (10-80%)',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
    'https://www.youtube.com/embed/dQw4w9WgXcQ', ex30Colors, ex30Interiors, ex30Features,
    'https://www.volvocars.com', 'Active', new Date()
  ]);

  sheet.appendRow([
    'VOLVO-XC90-03', 'Volvo XC90 Recharge', 'T8 Ultimate 7-Seater Luxury PHEV', 'Plug-in Hybrid', 
    'Rp 2.050.000.000', '5.3 detik', '462 hp', '18.8 kWh', 'Hybrid Mode',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
    'https://www.youtube.com/embed/dQw4w9WgXcQ', ex30Colors, ex30Interiors, ex30Features,
    'https://www.volvocars.com', 'Active', new Date()
  ]);
}

/**
 * Seed data prospek awal untuk tampilan CRM
 */
function seedInitialLeads(sheet) {
  sheet.appendRow([
    'LEAD-20261026-001', '2026-10-26 14:15:00', 'dr. Aryo Kusumo', '62811772901', 
    'Volvo EX30', 'Showroom Flagship', 'Batam (Showroom Baloi)', '2026-10-28', 
    'Pagi (09:30 - 11:30 WIB)', 'Ingin mencoba akselerasi Twin Motor', 'New', 'Sales Specialist'
  ]);
  sheet.appendRow([
    'LEAD-20261026-002', '2026-10-26 13:40:00', 'Sisca Wijaya', '62812660382', 
    'Volvo XC40 Recharge', 'Home Delivery', 'Batam (Nongsa Digital Park)', '2026-10-29', 
    'Siang (13:30 - 15:30 WIB)', 'Jadwalkan demo ke kantor', 'Contacted', 'Sales Specialist'
  ]);
  sheet.appendRow([
    'LEAD-20261026-003', '2026-10-25 16:20:00', 'Hendrik Tanoto', '62821991445', 
    'Volvo XC90 Recharge', 'Showroom Flagship', 'Batam (PT Marina Indah)', '2026-10-27', 
    'Sore (16:00 - 17:30 WIB)', 'Diskusi skema DP 30%', 'Test Drive Scheduled', 'Sales Specialist'
  ]);
}

/**
 * Mengambil data mobil untuk halaman publik
 */
function getCarsData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_CARS);
    if (!sheet) return { success: true, data: [], config: { salesWhatsApp: '6281234567890' } };
    
    const data = sheet.getDataRange().getDisplayValues(); // Gunakan getDisplayValues agar seluruh sel terbaca sebagai string aman
    const cars = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[15] === 'Active') {
        cars.push({
          id: String(row[0] || ''),
          model: String(row[1] || ''),
          trim: String(row[2] || ''),
          category: String(row[3] || ''),
          priceOtr: String(row[4] || ''),
          acceleration: String(row[5] || ''),
          rangeOrPower: String(row[6] || ''),
          batteryCapacity: String(row[7] || ''),
          chargingSpeed: String(row[8] || ''),
          mainImageUrl: String(row[9] || ''),
          videoUrl: String(row[10] || ''),
          exteriorColorsJson: String(row[11] || '[]'),
          interiorImagesJson: String(row[12] || '[]'),
          keyFeaturesJson: String(row[13] || '[]'),
          brochurePdfUrl: String(row[14] || '')
        });
      }
    }

    // Ambil WhatsApp sales
    const configSheet = ss.getSheetByName(SHEET_CONFIG);
    let salesWa = '6281234567890';
    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      for (let j = 1; j < configData.length; j++) {
        if (configData[j][0] === 'SALES_WHATSAPP') {
          salesWa = configData[j][1];
          break;
        }
      }
    }

    return {
      success: true,
      data: cars,
      config: { salesWhatsApp: salesWa }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Menyimpan pengajuan prospek test drive dari form publik (Diproteksi LockService)
 */
function submitLead(formData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Batas waktu antrean 10 detik

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_LEADS);
    const leadId = 'LEAD-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss');
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    // Sanitasi input
    const cleanName = sanitizeText(formData.fullName);
    const cleanWa = sanitizeText(formData.whatsApp).replace(/\D/g, '');
    const cleanModel = sanitizeText(formData.modelInterest);
    const cleanFormat = sanitizeText(formData.formatDelivery);
    const cleanCity = sanitizeText(formData.cityShowroom);
    const cleanDate = sanitizeText(formData.preferredDate);
    const cleanSlot = sanitizeText(formData.preferredSlot);
    const cleanNotes = sanitizeText(formData.notes);

    sheet.appendRow([
      leadId, timestamp, cleanName, cleanWa, cleanModel,
      cleanFormat, cleanCity, cleanDate, cleanSlot, cleanNotes,
      'New', 'Pending Assign'
    ]);

    // Kirim notifikasi email instan
    sendLeadEmailNotification(cleanName, cleanWa, cleanModel, cleanDate, cleanSlot, cleanCity);

    return { success: true, leadId: leadId, message: 'Berhasil' };
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengirim notifikasi email prospek baru via MailApp
 */
function sendLeadEmailNotification(name, wa, model, date, slot, city) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(SHEET_CONFIG);
    let targetEmail = '';

    if (configSheet) {
      const rows = configSheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === 'NOTIF_EMAIL') {
          targetEmail = rows[i][1];
          break;
        }
      }
    }

    if (targetEmail && targetEmail.includes('@')) {
      const subject = `[PROSPEK BARU VOLVO] Permohonan Test Drive - ${name} (${model})`;
      const body = `Halo Tim Sales Volvo,\n\nTerdapat prospek permohonan test drive baru:\n\n` +
                   `Nama: ${name}\n` +
                   `WhatsApp: +${wa}\n` +
                   `Model Minat: ${model}\n` +
                   `Jadwal: ${date} (${slot})\n` +
                   `Lokasi: ${city}\n\n` +
                   `Silakan buka portal CRM Executive untuk menindaklanjuti.`;
      MailApp.sendEmail(targetEmail, subject, body);
    }
  } catch (e) {
    console.warn('Gagal mengirim email: ' + e.message);
  }
}

/**
 * Verifikasi login admin
 */
function verifyAdmin(password) {
  try {
    const inputHash = computeSHA256(password);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_CONFIG);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'ADMIN_PASS_HASH') {
        if (data[i][1] === inputHash) {
          const sessionToken = computeSHA256(inputHash + '_' + Date.now());
          saveAdminSession_(sessionToken);
          return { success: true, token: sessionToken, expiresInMs: ADMIN_SESSION_TTL_MS };
        }
        break;
      }
    }
    return { success: false, message: 'Kata sandi tidak cocok.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mengambil daftar seluruh prospek untuk admin CRM
 */
function getAdminLeads(token) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_LEADS);
    if (!sheet) return { success: true, data: [] };

    const data = sheet.getDataRange().getDisplayValues(); // Mencegah error serialisasi objek Date
    const leads = [];

    for (let i = data.length - 1; i >= 1; i--) {
      const r = data[i];
      if (r[0]) {
        leads.push({
          leadId: String(r[0]),
          timestamp: String(r[1]),
          fullName: String(r[2]),
          whatsApp: String(r[3]),
          modelInterest: String(r[4]),
          formatDelivery: String(r[5]),
          cityShowroom: String(r[6]),
          preferredDate: String(r[7]),
          preferredSlot: String(r[8]),
          notes: String(r[9]),
          followUpStatus: String(r[10] || 'New'),
          handledBy: String(r[11] || '-')
        });
      }
    }

    return { success: true, data: leads };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Memperbarui status prospek dari admin CRM
 */
function updateLeadStatus(token, leadId, newStatus) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_LEADS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === leadId) {
        sheet.getRange(i + 1, 11).setValue(newStatus);
        return { success: true };
      }
    }
    return { success: false, message: 'Lead ID tidak ditemukan.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Endpoint: daftar SELURUH unit katalog untuk Super Admin
 * (termasuk status Draft & Archived yang tidak tampil di showroom publik).
 */
function getAdminCars(token) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_CARS);
    if (!sheet) return { success: true, data: [] };

    const data = sheet.getDataRange().getDisplayValues();
    const cars = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      cars.push({
        id: String(row[0] || ''),
        model: String(row[1] || ''),
        trim: String(row[2] || ''),
        category: String(row[3] || ''),
        priceOtr: String(row[4] || ''),
        acceleration: String(row[5] || ''),
        rangeOrPower: String(row[6] || ''),
        batteryCapacity: String(row[7] || ''),
        chargingSpeed: String(row[8] || ''),
        mainImageUrl: String(row[9] || ''),
        videoUrl: String(row[10] || ''),
        exteriorColorsJson: String(row[11] || '[]'),
        interiorImagesJson: String(row[12] || '[]'),
        keyFeaturesJson: String(row[13] || '[]'),
        brochurePdfUrl: String(row[14] || ''),
        status: String(row[15] || 'Active'),
        updatedAt: String(row[16] || '')
      });
    }

    return { success: true, data: cars };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Endpoint: hapus permanen satu unit dari katalog (Super Admin).
 */
function deleteCarUnit(token, carId) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_CARS);
    if (!sheet) return { success: false, message: 'Sheet katalog tidak ditemukan.' };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(carId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Unit ' + carId + ' berhasil dihapus.' };
      }
    }

    return { success: false, message: 'Unit tidak ditemukan.' };
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menambah / Mengubah data unit mobil dari Drawer Admin.
 * Seluruh kolom katalog (termasuk warna, interior, fitur, status) diatur di sini.
 */
function saveCarUnit(token, car) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_CARS);
    if (!sheet) return { success: false, message: 'Sheet katalog tidak ditemukan.' };

    const data = sheet.getDataRange().getValues();
    const carId = String(car.id || '').trim() || ('VOLVO-' + Date.now());
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === carId) {
        rowIndex = i + 1;
        break;
      }
    }

    // Aset gambar boleh dikirim sebagai data URL (base64) → otomatis diunggah ke Drive.
    const mainImage = resolveDriveAsset_(car.mainImageUrl, carId + '_main', 'CATALOG', 'image/jpeg');
    const brochure = resolveDriveAsset_(car.brochurePdfUrl, carId + '_brochure', 'BROCHURE', 'application/pdf');

    const row = [
      carId,
      String(car.model || ''),
      String(car.trim || ''),
      String(car.category || 'Pure Electric'),
      String(car.priceOtr || ''),
      String(car.acceleration || ''),
      String(car.rangeOrPower || ''),
      String(car.batteryCapacity || '69 kWh'),
      String(car.chargingSpeed || ''),
      mainImage,
      String(car.videoUrl || ''),
      resolveColorsJson_(car.exteriorColorsJson, carId),
      resolveInteriorsJson_(car.interiorImagesJson, carId),
      normalizeFeaturesJson_(car.keyFeaturesJson),
      brochure,
      normalizeCarStatus_(car.status),
      new Date()
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return { success: true, id: carId, message: 'Data unit ' + carId + ' berhasil disimpan.' };
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Utility: status unit yang diizinkan pada katalog.
 */
function normalizeCarStatus_(value) {
  const allowed = ['Active', 'Draft', 'Archived'];
  const s = String(value || '').trim();
  return allowed.indexOf(s) >= 0 ? s : 'Active';
}

/**
 * Utility: ubah nilai apa pun menjadi array JavaScript yang aman.
 */
function parseJsonArray_(value) {
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
}

/**
 * Utility: simpan fitur kunci sebagai JSON string (tanpa aset gambar).
 */
function normalizeFeaturesJson_(value) {
  const arr = parseJsonArray_(value).map(function (f) {
    return {
      title: String((f && f.title) || ''),
      desc: String((f && f.desc) || '')
    };
  });
  return JSON.stringify(arr);
}

/**
 * Utility: simpan warna eksterior, sekaligus unggah gambar warna base64 ke Drive.
 */
function resolveColorsJson_(value, carId) {
  const arr = parseJsonArray_(value).map(function (c, i) {
    const raw = (c && c.imgUrl) || '';
    const imgUrl = resolveDriveAsset_(raw, carId + '_color' + (i + 1), 'CATALOG', 'image/jpeg');
    if (raw && !imgUrl) {
      throw new Error('Gagal mengunggah gambar warna baris ' + (i + 1) + ' ke Drive.');
    }
    return {
      name: String((c && c.name) || ''),
      hex: String((c && c.hex) || '#CCCCCC'),
      imgUrl: imgUrl
    };
  });
  return JSON.stringify(arr);
}

/**
 * Utility: simpan galeri interior, sekaligus unggah gambar base64 ke Drive.
 */
function resolveInteriorsJson_(value, carId) {
  const arr = parseJsonArray_(value).map(function (it, i) {
    const raw = (it && it.imgUrl) || '';
    const imgUrl = resolveDriveAsset_(raw, carId + '_interior' + (i + 1), 'CATALOG', 'image/jpeg');
    if (raw && !imgUrl) {
      throw new Error('Gagal mengunggah gambar interior baris ' + (i + 1) + ' ke Drive.');
    }
    return {
      title: String((it && it.title) || ''),
      desc: String((it && it.desc) || ''),
      imgUrl: imgUrl
    };
  });
  return JSON.stringify(arr);
}

/**
 * Utility: Sanitasi teks untuk mencegah XSS
 */
function sanitizeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Utility: Hash SHA-256
 */
function computeSHA256(input) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  let hexString = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byte = (rawHash[i] < 0 ? rawHash[i] + 256 : rawHash[i]).toString(16);
    if (byte.length === 1) byte = '0' + byte;
    hexString += byte;
  }
  return hexString;
}

/**
 * ==========================================
 * GOOGLE DRIVE INTEGRATION — CENTRAL DATA HUB
 * ==========================================
 */

// Nama Drive Induk & Subfolder Fungsional
const DRIVE_ROOT_NAME = 'Volvo AutoHub Data';
const DRIVE_FOLDERS = {
  CATALOG: '01 - Car Catalog Photos',
  LEADS: '02 - Leads & CRM Documents',
  BROCHURE: '03 - Brochures & Catalogs PDF',
  ASSETS: '04 - Admin Assets & Backups',
  MEDIA: '05 - Landing Page Media'
};

/**
 * Mengambil folder berdasarkan nama, atau membuatnya bila belum ada.
 */
function getOrCreateFolder_(parent, name) {
  const found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}

/**
 * Membangun Drive Induk + seluruh subfolder fungsional.
 */
function setupVolvoDriveFolders() {
  try {
    const existing = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);
    const root = existing.hasNext() ? existing.next() : DriveApp.createFolder(DRIVE_ROOT_NAME);

    const map = { root: root.getId() };
    Object.keys(DRIVE_FOLDERS).forEach(function (key) {
      map[key] = getOrCreateFolder_(root, DRIVE_FOLDERS[key]).getId();
    });

    return { success: true, rootFolderId: root.getId(), rootUrl: root.getUrl(), folders: map };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mengambil objek folder fungsional di dalam Drive Induk.
 */
function getDriveFolder_(key) {
  const rootIter = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);
  const root = rootIter.hasNext() ? rootIter.next() : DriveApp.createFolder(DRIVE_ROOT_NAME);
  return getOrCreateFolder_(root, DRIVE_FOLDERS[key] || DRIVE_FOLDERS.CATALOG);
}

/**
 * URL gambar Drive yang boleh dipakai langsung pada tag <img>.
 * Endpoint lama (uc?export=view) diblokir Google untuk <img src>, sehingga
 * foto hasil unggahan tidak pernah tampil. lh3.googleusercontent.com adalah
 * host CDN resmi yang mengizinkan hotlink untuk berkas yang dibagikan.
 */
function buildDriveImageUrl_(fileId) {
  return 'https://lh3.googleusercontent.com/d/' + fileId + '=w1600';
}

/**
 * URL thumbnail Drive — dipakai sebagai cadangan bila host CDN utama gagal.
 */
function buildDriveThumbUrl_(fileId) {
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';
}

/**
 * URL pratinjau dokumen (PDF) — untuk tautan brosur, bukan untuk <img>.
 */
function buildDriveFileViewUrl_(fileId) {
  return 'https://drive.google.com/file/d/' + fileId + '/view';
}

/**
 * Upload payload base64 / data URL ke subfolder Drive tertentu.
 */
function uploadFileToDrive_(base64Data, fileName, mimeType, folderKey) {
  const folder = getDriveFolder_(folderKey || 'CATALOG');

  let payload = String(base64Data || '');
  let resolvedMime = mimeType || 'application/octet-stream';

  if (payload.indexOf('data:') === 0) {
    const parts = payload.split(',');
    const mimeMatch = parts[0].match(/data:([^;]+)/);
    if (mimeMatch) resolvedMime = mimeMatch[1];
    payload = parts[1];
  } else if (payload.indexOf('base64:') === 0) {
    payload = payload.substring(7);
  }

  const bytes = Utilities.base64Decode(payload);
  const safeName = String(fileName || ('Volvo_File_' + Date.now())).replace(/[\\/:*?"<>|]/g, '_');
  const file = folder.createFile(Utilities.newBlob(bytes, resolvedMime, safeName));

  // Berbagi tautan bersifat opsional: sebagian domain Workspace memblokirnya,
  // sehingga kegagalan di sini tidak boleh membatalkan proses upload.
  let shared = 'private';
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    shared = 'anyone';
  } catch (shareErr) {
    try {
      file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
      shared = 'domain';
    } catch (domainErr) {
      console.warn('SetSharing dilewati: ' + domainErr.message);
    }
  }

  const fileId = file.getId();
  const isPdf = resolvedMime === 'application/pdf';
  const isImage = resolvedMime.indexOf('image/') === 0;

  return {
    success: true,
    fileId: fileId,
    kind: isImage ? 'image' : (isPdf ? 'pdf' : 'file'),
    // Gambar memakai host CDN (langsung bisa di-<img>), PDF memakai halaman pratinjau,
    // berkas lain (video) memakai URL unduh langsung agar bisa diputar <video>.
    url: isImage
      ? buildDriveImageUrl_(fileId)
      : (isPdf ? buildDriveFileViewUrl_(fileId) : ('https://drive.google.com/uc?export=download&id=' + fileId)),
    thumbUrl: isImage ? buildDriveThumbUrl_(fileId) : '',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
    viewUrl: file.getUrl(),
    name: file.getName(),
    folder: folder.getName(),
    shared: shared
  };
}

/**
 * Bila nilai berupa data URL base64 → upload ke Drive dan kembalikan URL publik.
 * Bila sudah berupa URL biasa → dikembalikan apa adanya.
 */
function resolveDriveAsset_(value, baseName, folderKey, mimeType) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (v.indexOf('data:') !== 0 && v.indexOf('base64:') !== 0) return v;

  const ext = (mimeType === 'application/pdf') ? '.pdf' : '.jpg';
  const res = uploadFileToDrive_(v, baseName + '_' + Date.now() + ext, mimeType, folderKey);
  return res.success ? res.url : '';
}

/**
 * Endpoint: upload foto unit mobil dari Admin Drawer ke Drive.
 */
function uploadCarPhoto(token, base64Data, fileName, mimeType) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  try {
    return uploadFileToDrive_(base64Data, fileName, mimeType || 'image/jpeg', 'CATALOG');
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Endpoint: upload katalog PDF resmi ke Drive.
 */
function uploadBrochurePdf(token, base64Data, fileName) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  try {
    return uploadFileToDrive_(base64Data, fileName, 'application/pdf', 'BROCHURE');
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Endpoint: simpan salinan data prospek (CSV) ke folder CRM di Drive.
 */
function backupLeadsToDrive(token) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_LEADS);
    if (!sheet) return { success: false, message: 'Sheet prospek tidak ditemukan.' };

    const rows = sheet.getDataRange().getDisplayValues();
    const csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');

    const folder = getDriveFolder_('LEADS');
    const name = 'VOLVO_LEADS_BACKUP_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss') + '.csv';
    const file = folder.createFile(Utilities.newBlob(csv, 'text/csv', name));

    return {
      success: true,
      url: file.getUrl(),
      name: file.getName(),
      rows: Math.max(rows.length - 1, 0)
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Endpoint: ringkasan struktur Drive Induk untuk panel Admin.
 */
function getDriveStructure(token) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  try {
    const setup = setupVolvoDriveFolders();
    if (!setup.success) return setup;

    const root = DriveApp.getFolderById(setup.rootFolderId);
    const subs = root.getFolders();
    const list = [];

    while (subs.hasNext()) {
      const f = subs.next();
      let count = 0;
      const files = f.getFiles();
      while (files.hasNext()) { files.next(); count++; }
      list.push({ name: f.getName(), id: f.getId(), url: f.getUrl(), fileCount: count });
    }

    return {
      success: true,
      rootName: DRIVE_ROOT_NAME,
      rootUrl: root.getUrl(),
      rootFolderId: root.getId(),
      folders: list
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Pastikan Drive Induk sudah dibuat sekali saja (dicatat di CONFIG_ADMIN).
 */
function ensureDriveSetupOnce_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_CONFIG);
    if (!sheet) return;

    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === 'DRIVE_ROOT_ID' && rows[i][1]) return;
    }

    const res = setupVolvoDriveFolders();
    if (res.success) {
      sheet.appendRow(['DRIVE_ROOT_ID', res.rootFolderId]);
      sheet.appendRow(['DRIVE_ROOT_URL', res.rootUrl]);
      sheet.appendRow(['DRIVE_SETUP_AT', Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')]);
    }
  } catch (e) {
    console.warn('Setup Drive dilewati: ' + e.message);
  }
}

// ==========================================
// 5. KONTEN LANDING PAGE DINAMIS (CONFIG_SITE)
// Seluruh teks statis landing page disimpan sebagai pasangan Key-Value
// sehingga Super Admin dapat mengubahnya tanpa menyentuh kode.
// ==========================================
const SHEET_SITE = 'CONFIG_SITE';

/**
 * Nilai bawaan konten landing page.
 * Kunci yang belum ada di sheet otomatis memakai nilai di sini.
 */
const SITE_DEFAULTS = {
  // Strip pengumuman
  announce_text: 'AUTOHUB INDONESIA • AUTHORIZED VOLVO CARS SHOWROOM',
  announce_badge: '⚡ 100% Electrified Portfolio',
  announce_locations: 'JAKARTA SELATAN • CBD SURABAYA • BATAM HUB',

  // Brand & navigasi
  brand_name: 'VOLVO',
  brand_badge: 'AUTOHUB',
  brand_logo_url: '',
  brand_logo_height: 'h-9 md:h-11',
  // Menu navigasi atas dikelola penuh dari panel: label, aksi, dan muncul/tidak.
  // Format: array JSON [{label, action, url, visible}].
  nav_items: '[{"label":"Showroom Lineup","action":"lineup","url":"","visible":"true"},' +
    '{"label":"Studio Visualizer","action":"visualizer","url":"","visible":"true"},' +
    '{"label":"Booking Test Drive","action":"booking","url":"","visible":"true"}]',
  nav_crm: 'Executive CRM Portal',
  nav_desk_title: 'Nordic Desk',
  nav_desk_sub: 'EXECUTIVE',
  nav_cta: 'Booking Test Drive',
  dock_booking: 'Book Test Drive',
  // On/off bagian navigasi atas (diatur dari panel Landing Page).
  nav_enabled: 'true',
  announce_enabled: 'true',

  // Hero showcase
  hero_eyebrow: 'SCANDINAVIAN ELECTRIFICATION',
  hero_title: 'Kemewahan Berkelanjutan.',
  hero_title_accent: '100% Elektrik.',
  hero_subtitle: 'The All-New Volvo EX30 & XC40 Recharge — Didesain dengan standar keselamatan tertinggi, ketenangan akustik Skandinavia, dan nol emisi langsung.',
  hero_cta_primary: 'Booking Test Drive',
  hero_cta_secondary: 'Tonton Video Sinematik',
  hero_m1_value: '3.6s',
  hero_m1_label: '0-100 km/jam',
  hero_m2_value: '476 km',
  hero_m2_label: 'Jarak WLTP',
  hero_m3_value: '5-Star',
  hero_m3_label: 'Euro NCAP',
  hero_card_badge: 'Showcase Unggulan',
  hero_card_year: 'Model 2025',
  hero_card_cta: 'Studio Staging',
  hero_card_image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
  hero_card_model: 'Volvo EX30 Ultra',
  hero_card_color: 'Warna Tampil: Cloud Blue Metallic',
  hero_card_price_label: 'Harga OTR Jakarta & Batam',
  hero_card_price: 'Rp 1.160.000.000',

  // Video sinematik (tepat di bawah navigasi)
  video_enabled: 'true',
  video_source: 'youtube',
  video_url: '',
  video_direct_url: '',
  video_poster: '',
  video_title: 'Volvo EX30 — Sinematik Skandinavia',
  video_subtitle: 'Rasakan akselerasi senyap, kabin hening, dan desain Skandinavia dalam pengalaman sinematik.',
  video_cta_text: 'Booking Test Drive',

  // Lineup model
  lineup_eyebrow: 'Pure Electric Lineup 2025',
  lineup_title: 'Pilihan Model Eksklusif',
  lineup_filter_all: 'Semua Model',
  lineup_filter_electric: 'Pure Electric',
  lineup_filter_hybrid: 'Plug-in Hybrid',

  // Filosofi keselamatan
  safety_eyebrow: 'Prinsip Esensial',
  safety_title: 'Filosofi Keselamatan Volvo',
  safety_subtitle: 'Sejak menciptakan sabuk pengaman tiga titik pada tahun 1959, visi kami tidak pernah bergeser: melindungi setiap jiwa manusia di dalam dan di sekitar kendaraan.',
  safety_1_icon: 'shield-alert',
  safety_1_title: 'Deteksi LiDAR & Safe Space Tech',
  safety_1_desc: 'Sistem sensor atap canggih memindai objek hingga 250 meter di depan dalam kegelapan total, memberi waktu antisipasi kritis saat berkendara di jalan tol dan perkotaan.',
  safety_1_foot: 'Standar Generasi Masa Depan',
  safety_2_icon: 'wind',
  safety_2_title: 'CleanZone® Filtrasi Udara PM 2.5',
  safety_2_desc: 'Menyaring hingga 95% partikel berbahaya PM 2.5 sebelum memasuki kabin. Menjamin udara di dalam mobil sesegar kawasan hutan pinus Swedia Utara.',
  safety_2_foot: 'Kualitas Udara Kabin 99.8%',
  safety_3_icon: 'recycle',
  safety_3_title: '100% Material Daur Ulang Mewah',
  safety_3_desc: 'Sentuhan kain rajut Nordico berbasis poliester daur ulang botol PET, serat wol bersertifikasi, dan panel dekoratif dari serbuk kayu daur ulang Skandinavia.',
  safety_3_foot: 'Jejak Karbon Rendah 19t CO₂',

  // Banner CTA
  cta_eyebrow: 'Door-to-Door Experience',
  cta_title: 'Rasakan Heningnya Akselerasi Elektrik Volvo',
  cta_subtitle: 'Spesialis kendaraan listrik kami siap mengantarkan unit uji coba langsung ke kediaman atau kantor eksekutif Anda di area Jabodetabek, Surabaya, dan Batam.',
  cta_button: 'Reservasi Test Drive Sekarang ➔',

  // Modal booking
  booking_badge: '● VOLVO VIP EXPERIENCE',
  booking_title: 'Jadwalkan Uji Kendara Volvo',
  booking_subtitle: 'Rasakan performa dan standar keselamatan kelas dunia secara langsung di showroom atau kediaman Anda.',

  // Footer showroom
  footer_brand: 'AUTOHUB VOLVO',
  footer_company: 'PT Autohub Mobilitas Swedia',
  footer_address: 'Jl. TB Simatupang No. 18, Cilandak, Jakarta Selatan 12430',
  footer_legal: 'DEALER RESMI VOLVO CARS ID',
  footer_hours_title: 'Jam Operasional Showroom',
  footer_hours_1: 'Senin — Jumat: 08.30 – 19.00 WIB',
  footer_hours_2: 'Sabtu: 09.00 – 18.00 WIB',
  footer_hours_3: 'Minggu & Libur: 10.00 – 16.00 WIB',
  footer_hours_badge: '● Showroom Buka Hari Ini',
  footer_contact_title: 'Direct Concierge Hotline',
  footer_phone: '📞 (021) 7590-8888',
  footer_wa: '📱 +62 812-8000-8888 (WhatsApp VIP)',
  footer_email: 'concierge@autohub.volvo.id',
  footer_internal_title: 'Internal Enterprise Access',
  footer_internal_desc: 'Akses sistem armada, alokasi kuota unit CRM, dan database prospek eksekutif.',
  footer_internal_btn: 'Portal CRM Executive ➔',
  footer_link_1: 'Electrification Spec',
  footer_link_2: 'Bespoke Configurator',
  footer_link_3: 'Enterprise Telemetry',
  footer_tagline: 'Scandinavian Luxury Mobility & Fleet Intelligence',
  footer_copyright: '© 2026 Volvo Car Corporation. v4.8.2 Nordic Edition'
};

// Kunci yang tidak boleh pernah dikirim ke browser.
const SITE_BLOCKED_KEYS = ['ADMIN_PASS_HASH', 'NOTIF_EMAIL', 'DRIVE_ROOT_ID'];

/**
 * Memastikan sheet CONFIG_SITE tersedia dan seluruh kunci bawaan terisi.
 */
function ensureSiteConfigSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SITE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SITE);
    sheet.appendRow(['Key', 'Value', 'UpdatedAt']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f1f5f9');
    sheet.setColumnWidth(1, 220);
    sheet.setColumnWidth(2, 520);
  }
  seedSiteConfig_(sheet);
  return sheet;
}

/**
 * Menambah kunci yang belum ada tanpa menimpa nilai yang sudah diubah admin.
 */
function seedSiteConfig_(sheet) {
  const lastRow = sheet.getLastRow();
  const existing = {};
  if (lastRow > 1) {
    const rows = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    rows.forEach(function (r) {
      const k = String(r[0] || '').trim();
      if (k) existing[k] = true;
    });
  }

  const missing = Object.keys(SITE_DEFAULTS).filter(function (k) { return !existing[k]; });
  if (!missing.length) return 0;

  const now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  const rows = missing.map(function (k) { return [k, SITE_DEFAULTS[k], now]; });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 3).setValues(rows);
  return rows.length;
}

/**
 * Endpoint publik: seluruh konten landing page (nilai bawaan + hasil edit admin).
 */
function getSiteConfig() {
  try {
    const sheet = ensureSiteConfigSheet_();

    const data = {};
    Object.keys(SITE_DEFAULTS).forEach(function (k) { data[k] = SITE_DEFAULTS[k]; });

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const rows = sheet.getRange(2, 1, lastRow - 1, 2).getDisplayValues();
      rows.forEach(function (r) {
        const key = String(r[0] || '').trim();
        if (!key || SITE_BLOCKED_KEYS.indexOf(key) >= 0) return;
        data[key] = String(r[1] == null ? '' : r[1]);
      });
    }

    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message, data: SITE_DEFAULTS };
  }
}

/**
 * Endpoint Super Admin: simpan perubahan konten landing page.
 */
function saveSiteConfig(token, config) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  if (!config || typeof config !== 'object') {
    return { success: false, message: 'Data konten tidak valid.' };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = ensureSiteConfigSheet_();

    const lastRow = sheet.getLastRow();
    const rowOf = {};
    if (lastRow > 1) {
      const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      keys.forEach(function (r, i) {
        const k = String(r[0] || '').trim();
        if (k) rowOf[k] = i + 2;
      });
    }

    const now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const appended = [];
    let saved = 0;

    Object.keys(config).forEach(function (rawKey) {
      const key = String(rawKey || '').trim();
      if (!key || SITE_BLOCKED_KEYS.indexOf(key) >= 0) return;

      const value = config[rawKey] == null ? '' : String(config[rawKey]);
      if (rowOf[key]) {
        sheet.getRange(rowOf[key], 2).setValue(value);
        sheet.getRange(rowOf[key], 3).setValue(now);
      } else {
        appended.push([key, value, now]);
      }
      saved++;
    });

    if (appended.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, appended.length, 3).setValues(appended);
    }

    return {
      success: true,
      updated: saved,
      message: saved + ' konten landing page berhasil disimpan.'
    };
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Endpoint Super Admin: unggah media landing page (video / gambar hero) ke Drive.
 */
function uploadSiteMedia(token, base64Data, fileName, mimeType) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  if (!base64Data) return { success: false, message: 'Berkas media kosong.' };

  try {
    const safeName = String(fileName || ('landing_media_' + Date.now())).replace(/[\\/:*?"<>|]/g, '_');
    const res = uploadFileToDrive_(base64Data, safeName, String(mimeType || 'application/octet-stream'), 'MEDIA');
    if (!res || !res.success) {
      return { success: false, message: (res && res.message) || 'Gagal mengunggah media.' };
    }
    return res;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Endpoint Super Admin: kembalikan kunci terpilih ke nilai bawaan.
 */
function resetSiteConfigKeys(token, keys) {
  if (!isValidAdminToken_(token)) return { success: false, message: 'Unauthorized' };
  const list = Array.isArray(keys) ? keys : [];
  const payload = {};
  list.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(SITE_DEFAULTS, k)) payload[k] = SITE_DEFAULTS[k];
  });
  return saveSiteConfig(token, payload);
}

// ==========================================
// 6. SESI ADMIN (TOKEN TERSIMPAN & BERKEDALUWARSA)
// Sebelumnya token dibuat acak tanpa disimpan, sehingga seluruh endpoint
// admin menerima string apa pun sebagai token yang sah.
// ==========================================
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam

/**
 * Menulis satu pasangan Key-Value pada CONFIG_ADMIN (menambah bila belum ada).
 */
function setConfigValue_(key, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CONFIG);
    sheet.appendRow(['Key', 'Value']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f1f5f9');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === key) {
        sheet.getRange(i + 2, 2).setValue(value);
        return;
      }
    }
  }
  sheet.appendRow([key, value]);
}

/**
 * Membaca satu nilai dari CONFIG_ADMIN.
 */
function getConfigValue_(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) return '';

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return '';

  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === key) return rows[i][1];
  }
  return '';
}

/**
 * Mencatat sesi admin yang sedang aktif beserta masa berlakunya.
 */
function saveAdminSession_(token) {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  setConfigValue_('ADMIN_SESSION_TOKEN', token);
  setConfigValue_('ADMIN_SESSION_EXPIRES', String(expiresAt));
  setConfigValue_('ADMIN_SESSION_STARTED',
    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'));
  return expiresAt;
}

/**
 * Menghapus sesi admin (dipakai saat logout).
 */
function clearAdminSession_() {
  setConfigValue_('ADMIN_SESSION_TOKEN', '');
  setConfigValue_('ADMIN_SESSION_EXPIRES', '');
}

/**
 * Memeriksa apakah token benar-benar sesi admin yang masih berlaku.
 */
function isValidAdminToken_(token) {
  const t = String(token || '').trim();
  if (!t) return false;

  try {
    const stored = String(getConfigValue_('ADMIN_SESSION_TOKEN') || '').trim();
    if (!stored || stored !== t) return false;

    const expires = Number(getConfigValue_('ADMIN_SESSION_EXPIRES') || 0);
    if (!expires || Date.now() > expires) return false;

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Endpoint publik: memeriksa apakah sesi tersimpan masih berlaku.
 * Dipakai halaman untuk memutuskan menampilkan tombol masuk admin.
 */
function verifyAdminToken(token) {
  try {
    return { success: true, valid: isValidAdminToken_(token) };
  } catch (err) {
    return { success: false, valid: false, message: err.message };
  }
}

/**
 * Endpoint: mengakhiri sesi admin.
 */
function logoutAdmin(token) {
  try {
    if (isValidAdminToken_(token)) clearAdminSession_();
    return { success: true, message: 'Sesi admin berakhir.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}