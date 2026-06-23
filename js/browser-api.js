/**
 * browser-api.js — Polyfill für window.electronAPI in der Browser-Version.
 * Ersetzt alle Electron-IPC-Aufrufe durch native Browser-APIs.
 * Daten werden in localStorage gespeichert.
 */
(function () {
  'use strict';

  var STORAGE_KEY    = 'wm_data';
  var GIST_CFG_KEY   = 'wm_gist_config';
  var _saveStatusCb  = null;

  function notify(s) {
    if (typeof _saveStatusCb === 'function') {
      try { _saveStatusCb(s); } catch (_) {}
    }
  }

  // ── Datei-Download Hilfsfunktion ──────────────────────────────────────────
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  // ── Einfache Kodierung für SMTP-Passwort (kein echter Schlüssel im Browser) ─
  // Kompatibel mit der Electron-Version: speichert base64-kodierten Wert.
  // Achtung: Im Browser gibt es keinen sicheren Schlüssel wie in Electron.
  // Das Passwort liegt base64-kodiert in localStorage — nur für lokalen Einsatz.
  function encryptValue(plaintext) {
    try {
      return Promise.resolve('b64:' + btoa(unescape(encodeURIComponent(String(plaintext || '')))));
    } catch (_) { return Promise.resolve(null); }
  }

  function decryptValue(ciphertext) {
    try {
      var s = String(ciphertext || '');
      // Electron-Format: "iv:encrypted" (hex). Browser-Format: "b64:base64"
      if (s.startsWith('b64:')) {
        return Promise.resolve(decodeURIComponent(escape(atob(s.slice(4)))));
      }
      // Unbekanntes Format — als Plain zurückgeben (für Migrationsfälle)
      return Promise.resolve(null);
    } catch (_) { return Promise.resolve(null); }
  }

  // ── Gist-Konfiguration (in localStorage statt config/gist.json) ───────────
  function loadGistConfig() {
    try {
      var raw = localStorage.getItem(GIST_CFG_KEY);
      return Promise.resolve(raw ? JSON.parse(raw) : null);
    } catch (_) { return Promise.resolve(null); }
  }

  function saveGistConfig(cfg) {
    try {
      localStorage.setItem(GIST_CFG_KEY, JSON.stringify(cfg || {}));
      return Promise.resolve({ ok: true });
    } catch (e) { return Promise.resolve({ ok: false, error: String(e) }); }
  }

  // ── GitHub Gist: Daten laden / pushen ─────────────────────────────────────
  var _gistCfgCache       = null;
  var _gistPendingRetry   = null;
  var _gistDebounceTimer  = null;
  var _gistPendingData    = null;

  async function getGistCfg() {
    if (_gistCfgCache !== null) return _gistCfgCache;
    try {
      var cfg = await loadGistConfig();
      _gistCfgCache = (cfg && cfg.token && cfg.gistId) ? cfg : false;
    } catch (_) { _gistCfgCache = false; }
    return _gistCfgCache;
  }

  async function gistRequest(method, bodyObj) {
    var cfg = await getGistCfg();
    if (!cfg) throw new Error('no-config');
    var url     = 'https://api.github.com/gists/' + cfg.gistId;
    var headers = {
      'Authorization': 'token ' + cfg.token,
      'Accept':        'application/vnd.github.v3+json',
      'User-Agent':    'WerkmeisterPro-Web',
    };
    var opts = { method: method, headers: headers };
    if (bodyObj) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(bodyObj);
    }
    var controller = new AbortController();
    var timer      = setTimeout(function () { controller.abort(); }, 12000);
    opts.signal = controller.signal;
    try {
      var resp = await fetch(url, opts);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function pushToGist(payload) {
    var cfg = await getGistCfg();
    if (!cfg) return;
    try {
      await gistRequest('PATCH', { files: { 'daten.json': { content: JSON.stringify(payload) } } });
      _gistPendingRetry = null;
      notify('saved');
    } catch (_) {
      _gistPendingRetry = payload;
      notify('error');
    }
  }

  // ── Daten laden ────────────────────────────────────────────────────────────
  async function loadData() {
    // 1. Aus localStorage laden
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var local = JSON.parse(raw);
        if (local && Object.keys(local).length) {
          // Gist im Hintergrund synchronisieren
          getGistCfg().then(function (cfg) {
            if (cfg) pushToGist(local);
          });
          return local;
        }
      }
    } catch (_) {}

    // 2. Fallback: aus Gist laden
    var cfg = await getGistCfg();
    if (cfg) {
      try {
        var resp = await gistRequest('GET');
        var file = resp.files && resp.files['daten.json'];
        if (file && file.content) {
          var gistData = JSON.parse(file.content);
          // In localStorage speichern für Offline-Nutzung
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gistData)); } catch (_) {}
          return gistData;
        }
      } catch (_) {}
    }

    return null;
  }

  // ── Daten speichern ────────────────────────────────────────────────────────
  function saveData(data) {
    notify('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      notify('saved');
    } catch (e) {
      notify('error');
      console.error('[WM-Web] Speichern fehlgeschlagen:', e);
    }

    // Gist-Push (debounced, 5 Sekunden)
    _gistPendingData = data;
    if (_gistDebounceTimer) clearTimeout(_gistDebounceTimer);
    var delay = _gistPendingRetry ? 0 : 5000;
    _gistDebounceTimer = setTimeout(function () {
      _gistDebounceTimer = null;
      var p = _gistPendingData;
      _gistPendingData = null;
      pushToGist(p);
    }, delay);

    return Promise.resolve(true);
  }

  // ── PDF-Datei per Download anbieten ───────────────────────────────────────
  function savePdfFile(payload) {
    try {
      var name = payload && payload.defaultName ? String(payload.defaultName) : 'dokument.pdf';
      var data = payload ? payload.data : null;
      var buf  = data instanceof ArrayBuffer ? new Uint8Array(data) : (ArrayBuffer.isView(data) ? data : null);
      if (!buf) return Promise.resolve({ ok: false, error: 'NO_DATA' });
      var blob = new Blob([buf], { type: 'application/pdf' });
      downloadBlob(blob, name);
      return Promise.resolve({ ok: true });
    } catch (e) { return Promise.resolve({ ok: false, error: String(e) }); }
  }

  // ── Text-/CSV-Datei per Download anbieten ─────────────────────────────────
  function saveTextFile(payload) {
    try {
      var name = payload && payload.defaultName ? String(payload.defaultName) : 'export.csv';
      var text = payload && payload.data != null ? String(payload.data) : '';
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, name);
      return Promise.resolve({ ok: true });
    } catch (e) { return Promise.resolve({ ok: false, error: String(e) }); }
  }

  // ── Belegdokument importieren (base64 → localStorage-Referenz) ────────────
  function importExpenseDocumentBuffer(payload) {
    try {
      var originalName = payload && payload.originalName ? String(payload.originalName) : 'beleg';
      var dataBase64   = payload && payload.dataBase64   ? String(payload.dataBase64)   : '';
      var data         = payload ? payload.data : null;

      // Base64 extrahieren
      var b64 = dataBase64;
      if (b64 && b64.startsWith('data:')) {
        var idx = b64.indexOf('base64,');
        if (idx !== -1) b64 = b64.slice(idx + 7);
      }
      if (!b64 && data) {
        if (typeof data === 'string') b64 = data;
      }

      var ext  = (originalName.match(/\.[^.]+$/) || [''])[0].toLowerCase();
      var id   = 'expdoc_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8);
      var size = b64 ? Math.round(b64.length * 0.75) : 0;

      // Kleines Dokument (<2 MB) direkt in localStorage sichern als dataURL
      var storedPath = '[browser-storage]';
      if (b64 && size < 2 * 1024 * 1024) {
        var mime = ext === '.pdf' ? 'application/pdf' : (ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png');
        var dataUrl = 'data:' + mime + ';base64,' + b64;
        try { localStorage.setItem('wm_bel_' + id, dataUrl); storedPath = 'wm_bel_' + id; } catch (_) {}
      }

      return Promise.resolve({
        ok: true,
        doc: {
          id:           id,
          sha256:       '',
          fileName:     id + '_' + originalName,
          originalName: originalName,
          ext:          ext,
          size:         size,
          storedPath:   storedPath,
          createdAt:    Date.now(),
        }
      });
    } catch (e) { return Promise.resolve({ ok: false, error: String(e) }); }
  }

  // ── Datei lesen (für Belegvorschau) ──────────────────────────────────────
  function readFile(filePath) {
    // Im Browser: storedPath ist der localStorage-Key
    try {
      var key = String(filePath || '');
      var val = localStorage.getItem(key);
      if (!val) return Promise.resolve({ ok: false, error: 'NOT_FOUND' });
      // dataURL zurückgeben (ohne "data:...;base64," Präfix)
      var idx = val.indexOf('base64,');
      var b64 = idx !== -1 ? val.slice(idx + 7) : val;
      return Promise.resolve({ ok: true, base64: b64, size: Math.round(b64.length * 0.75) });
    } catch (e) { return Promise.resolve({ ok: false, error: String(e) }); }
  }

  // ── E-Mail senden (nicht verfügbar im Browser) ────────────────────────────
  function sendEmail() {
    return Promise.resolve({
      ok:    false,
      error: 'E-Mail-Versand ist in der Browser-Version nicht verfügbar.\n' +
             'Bitte öffne deinen E-Mail-Client und versende die PDF manuell.'
    });
  }

  function testSmtpConnection() {
    return Promise.resolve({
      ok:    false,
      error: 'SMTP-Test ist in der Browser-Version nicht verfügbar.'
    });
  }

  // ── window.electronAPI ────────────────────────────────────────────────────
  window.electronAPI = {

    // Daten
    loadData:      loadData,
    saveData:      saveData,
    loadLocalData: loadData,
    flushSave:     async function () {
      if (_gistDebounceTimer) {
        clearTimeout(_gistDebounceTimer);
        _gistDebounceTimer = null;
        var p = _gistPendingData || _gistPendingRetry;
        _gistPendingData = null;
        if (p) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (_) {} pushToGist(p); }
      }
    },

    // Status-Callback
    onSaveStatus: function (cb) { _saveStatusCb = cb; },

    // Datenpfad
    getDataPath:      function () { return Promise.resolve('Browser (localStorage)'); },
    showFolderDialog: function () { return Promise.resolve({ canceled: true }); },
    saveDataPath:     function () { return Promise.resolve({ ok: true }); },

    // Dateien
    savePdfFile:  savePdfFile,
    autoSavePdf:  savePdfFile,
    saveTextFile: saveTextFile,
    copyFile:     function () { return Promise.resolve(false); },
    readFile:     readFile,

    // HTML→PDF: Browser nutzt window.print() (bereits in print.js implementiert)
    htmlToPdf:    function () {
      return Promise.resolve({ ok: false, canceled: true });
    },
    htmlToPdfAuto: function () {
      return Promise.resolve({ ok: false, canceled: true });
    },

    // Belege
    importExpenseDocument:       function () { return Promise.resolve({ ok: false, error: 'Nicht verfügbar' }); },
    importExpenseDocumentBuffer: importExpenseDocumentBuffer,

    // Links
    openFile:     function (path) { return Promise.resolve({ ok: true }); },
    openExternal: function (url) {
      try { window.open(String(url || ''), '_blank', 'noopener'); } catch (_) {}
      return Promise.resolve({ ok: true });
    },

    // Verschlüsselung
    encryptValue: encryptValue,
    decryptValue: decryptValue,

    // E-Mail
    sendEmail:          sendEmail,
    testSmtpConnection: testSmtpConnection,
    runPowerShell:      function () { return Promise.resolve({ ok: false, error: 'Nicht verfügbar' }); },

    // GitHub Gist
    saveGistConfig:   saveGistConfig,
    loadGistConfig:   loadGistConfig,
    reloadGistConfig: function () { _gistCfgCache = null; },

    // Backups (localStorage-basiert)
    listBackups: function () { return Promise.resolve([]); },
    restoreBackup: function () {
      return Promise.resolve({ ok: false, error: 'Backup-Wiederherstellung: bitte JSON-Export/Import nutzen.' });
    },

    // Rechnungs-PDF (wird über jsPDF gemacht, nicht benötigt)
    generateInvoicePDF: function () { return Promise.resolve({ ok: false }); },

    // Dev-Tools (kein Electron)
    toggleDevTools: function () {},
    onEnvConfig:    function () {},
  };

  console.log('[WM-Web] Browser-API bereit. Daten werden in localStorage gespeichert.');
})();
