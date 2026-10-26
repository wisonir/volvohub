/**
 * VOLVO AUTOHUB — GAS BRIDGE ADAPTER
 * 
 * Menggantikan dependensi bawaan `google.script.run` menjadi HTTP Fetch modern.
 * Menghubungkan antarmuka frontend statis (GitHub Pages) ke Google Apps Script Web App.
 * 
 * Fitur:
 * - Menangani redirect 302 Google Apps Script tanpa hambatan CORS (mengirim via text/plain POST).
 * - Menyediakan antarmuka Promise / async-await: `GasBridge.call(action, payload)`
 * - Menyediakan drop-in polyfill untuk sintaks lama: `google.script.run.withSuccessHandler(...).withFailureHandler(...)`
 */

const GasBridge = (function () {
  'use strict';

  /**
   * Eksekusi request HTTP ke Google Apps Script Web App
   * @param {string} action - Nama aksi backend yang dipanggil
   * @param {Object} payload - Data payload yang dikirim
   * @returns {Promise<any>}
   */
  async function call(action, payload = {}) {
    const apiUrl = (window.CONFIG && window.CONFIG.GAS_API_URL) ? window.CONFIG.GAS_API_URL.trim() : '';
    
    if (!apiUrl || apiUrl.includes('placeholder')) {
      const msg = 'GAS_API_URL belum dikonfigurasi pada config.js. Silakan masukkan Web App URL Google Apps Script Anda.';
      console.warn('[GasBridge]', msg);
      throw new Error(msg);
    }

    const timeoutMs = (window.CONFIG && window.CONFIG.REQUEST_TIMEOUT_MS) || 35000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Catatan Penting CORS Google Apps Script:
      // Gunakan Content-Type: text/plain agar browser TIDAK mengirimkan HTTP OPTIONS preflight request.
      // GAS Web App tidak mendukung OPTIONS preflight, namun mengizinkan POST simple-request dan merespons via 302.
      const requestBody = JSON.stringify({
        action: action,
        payload: payload
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Permintaan timeout (melebihi batas waktu tunggu respons GAS).');
      }
      throw err;
    }
  }

  return {
    call: call
  };
})();

/**
 * Polyfill Adapter untuk google.script.run
 * Memungkinkan seluruh kode JavaScript frontend lama berjalan tanpa perlu diubah satu per satu.
 */
(function () {
  'use strict';

  class ScriptRunProxy {
    constructor(successHandler = null, failureHandler = null) {
      this._successHandler = successHandler;
      this._failureHandler = failureHandler;
    }

    withSuccessHandler(handler) {
      return new ScriptRunProxy(handler, this._failureHandler);
    }

    withFailureHandler(handler) {
      return new ScriptRunProxy(this._successHandler, handler);
    }

    _invoke(action, payload) {
      GasBridge.call(action, payload)
        .then((res) => {
          if (typeof this._successHandler === 'function') {
            this._successHandler(res);
          }
        })
        .catch((err) => {
          if (typeof this._failureHandler === 'function') {
            this._failureHandler(err);
          } else {
            console.error(`[GasBridge Run Error - ${action}]:`, err);
          }
        });
    }

    // Mapping method sesuai signature pemanggilan di kode frontend:
    getCarsData() {
      this._invoke('getCarsData', {});
    }

    submitLead(formData) {
      this._invoke('submitLead', { leadData: formData });
    }

    verifyAdmin(password) {
      this._invoke('verifyAdmin', { password: password });
    }

    getAdminLeads(token) {
      this._invoke('getAdminLeads', { token: token });
    }

    updateLeadStatus(token, leadId, newStatus) {
      this._invoke('updateLeadStatus', { token: token, leadId: leadId, newStatus: newStatus });
    }

    saveCarUnit(token, car) {
      this._invoke('saveCarUnit', { token: token, car: car });
    }

    uploadBrochurePdf(token, base64Data, fileName) {
      this._invoke('uploadBrochurePdf', { token: token, base64Data: base64Data, fileName: fileName });
    }

    uploadCarPhoto(token, base64Data, fileName, mimeType) {
      this._invoke('uploadCarPhoto', { token: token, base64Data: base64Data, fileName: fileName, mimeType: mimeType });
    }

    getDriveStructure(token) {
      this._invoke('getDriveStructure', { token: token });
    }

    backupLeadsToDrive(token) {
      this._invoke('backupLeadsToDrive', { token: token });
    }

    getAdminCars(token) {
      this._invoke('getAdminCars', { token: token });
    }

    deleteCarUnit(token, carId) {
      this._invoke('deleteCarUnit', { token: token, carId: carId });
    }

    getSiteConfig() {
      this._invoke('getSiteConfig', {});
    }

    uploadSiteMedia(token, base64Data, fileName, mimeType) {
      this._invoke('uploadSiteMedia', { token: token, base64Data: base64Data, fileName: fileName, mimeType: mimeType });
    }

    saveSiteConfig(token, config) {
      this._invoke('saveSiteConfig', { token: token, config: config });
    }

    verifyAdminToken(token) {
      this._invoke('verifyAdminToken', { token: token });
    }

    logoutAdmin(token) {
      this._invoke('logoutAdmin', { token: token });
    }
  }

  // Pasang adapter ke window.google.script.run
  if (typeof window !== 'undefined') {
    window.GasBridge = GasBridge;
    window.google = window.google || {};
    window.google.script = window.google.script || {};
    window.google.script.run = new ScriptRunProxy();
  }
})();
