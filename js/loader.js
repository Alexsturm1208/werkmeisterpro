/**
 * loader.js – Lädt alle HTML-Partials und injiziert sie ins DOM.
 * Muss als erstes <script> vor den anderen JS-Modulen eingebunden werden.
 * Gibt das Event "app:partials-loaded" ab, sobald alle Partials bereit sind.
 */
(function () {
  var BASE = './partials/';

  var SECTIONS = [
    'sections/dashboard',
    'sections/customers',
    'sections/articles',
    'sections/templates',
    'sections/orders',
    'sections/offers',
    'sections/invoices',
    'sections/expenses',
    'sections/dunning',
    'sections/tax',
    'sections/appointments',
    'sections/settings'
  ];

  var MODALS = [
    'modals/detail-views',
    'modals/expense-review',
    'modals/order-form',
    'modals/service-form',
    'modals/template-form',
    'modals/quick-template-form',
    'modals/article-form',
    'modals/customer-form',
    'modals/user-form',
    'modals/invoice-edit',
    'modals/appointment-form',
    'modals/dunning-form',
    'modals/dialog',
    'modals/email-preview',
    'modals/doc-template-editor'
  ];

  function loadText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' – ' + url);
      return r.text();
    });
  }

  var all = SECTIONS.concat(MODALS).map(function (p) {
    return loadText(BASE + p + '.html');
  });

  Promise.all(all).then(function (parts) {
    var sectionsHtml = parts.slice(0, SECTIONS.length).join('\n');
    var modalsHtml   = parts.slice(SECTIONS.length).join('\n');

    var secEl = document.getElementById('app-sections');
    var modEl = document.getElementById('app-modals');
    if (secEl) secEl.innerHTML = sectionsHtml;
    if (modEl) modEl.innerHTML = modalsHtml;

    window.__partialsLoaded = true;
    document.dispatchEvent(new Event('app:partials-loaded'));
  }).catch(function (err) {
    console.error('[WM] Partials konnten nicht geladen werden:', err);
    window.__partialsLoaded = true;
    document.dispatchEvent(new Event('app:partials-loaded'));
  });
})();
