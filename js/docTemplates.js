// ─────────────────────────────────────────────────────────────────────────────
// Dokumentvorlagen-System
// Vollständig anpassbare HTML/CSS-Vorlagen für Angebote, Rechnungen,
// Mahnungen und Aufträge mit Live-Vorschau und Platzhalter-Editor.
// ─────────────────────────────────────────────────────────────────────────────

var DOC_TEMPLATE_TYPES  = ['offer', 'invoice', 'dunning', 'order'];
var DOC_TEMPLATE_LABELS = { offer:'Angebot', invoice:'Rechnung', dunning:'Mahnung', order:'Auftrag' };

var TEMPLATE_PLACEHOLDERS = [
  // Firmendaten
  { key:'firma',            label:'Firmenname' },
  { key:'strasse',          label:'Straße' },
  { key:'plz',              label:'PLZ' },
  { key:'ort',              label:'Ort' },
  { key:'telefon',          label:'Telefon' },
  { key:'email',            label:'E-Mail' },
  { key:'steuernummer',     label:'Steuernummer' },
  { key:'ust_id',           label:'USt-IdNr.' },
  { key:'logo_img',         label:'Logo (HTML-Tag)',                    isHtml:true },
  { key:'absender_zeile',   label:'Absenderzeile (Firma · Str · PLZ)' },
  { key:'seitenfuss',       label:'Seitenfuß (alle Firmendaten)' },
  // Dokument-Metadaten
  { key:'dokument_typ',     label:'Dokumenttyp kurz (z.B. ANGEBOT)' },
  { key:'dokument_typ_lang',label:'Dokumenttyp lang (z.B. Angebot)' },
  { key:'nummer',           label:'Dokumentnummer' },
  { key:'datum',            label:'Datum' },
  { key:'faellig_bis',      label:'Fällig bis / Gültig bis' },
  { key:'titel',            label:'Betreff / Objekt' },
  // Empfänger
  { key:'empfaenger_block', label:'Empfänger-Adressblock (HTML)',       isHtml:true },
  // Beträge
  { key:'netto',            label:'Nettobetrag' },
  { key:'mwst',             label:'Mehrwertsteuer' },
  { key:'mwst_pct',         label:'MwSt.-Satz in %' },
  { key:'brutto',           label:'Bruttobetrag' },
  { key:'mwst_zeile',       label:'MwSt.-Zeile (HTML, inkl. KU-Logik)',isHtml:true },
  { key:'ku_hinweis',       label:'Kleinunternehmer-Hinweis (leer wenn kein KU)' },
  // Blöcke
  { key:'positionen_tabelle',   label:'Positionstabelle (HTML)',        isHtml:true },
  { key:'bankverbindung_block', label:'Bankverbindung (HTML)',           isHtml:true },
  { key:'fusstext',         label:'Fußtext des Dokuments' },
  { key:'akzentfarbe',      label:'Primärfarbe (Hex, z.B. #0891b2)' },
  // Mahnungs-spezifisch
  { key:'mahnung_stufe_nr',   label:'Mahnstufe (1, 2 oder 3)',          types:['dunning'] },
  { key:'mahnung_stufe_name', label:'Stufenname (Zahlungserinnerung…)', types:['dunning'] },
  { key:'mahnung_text',       label:'Mahnungstext (Absatz)',            types:['dunning'] },
  { key:'mahngebuehr',        label:'Mahngebühr',                      types:['dunning'] },
  { key:'zinsen',             label:'Verzugszinsen',                   types:['dunning'] },
  { key:'mahnung_gesamt',     label:'Gesamtbetrag (Forderung + Gebühren)', types:['dunning'] },
  { key:'ueberfaellig_tage',  label:'Tage überfällig',                 types:['dunning'] },
];

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderDocTemplate(templateHtml, data) {
  data = data || {};
  return String(templateHtml || '').replace(/\{\{(\w+)\}\}/g, function(_, key) {
    var val = data[key];
    return (val === undefined || val === null) ? '' : String(val);
  });
}

// ── HTML-Bausteine ────────────────────────────────────────────────────────────

function _dtPosTable(lines, accentHex) {
  accentHex = accentHex || '#0891b2';
  var rows = '';
  var matHdrShown = false;
  ensureArray(lines).forEach(function(l, idx) {
    if (l.costType === 'material' && !matHdrShown) {
      matHdrShown = true;
      rows += '<tr><td colspan="6" style="padding:3px 4px;font-size:7.5pt;color:#6d28d9;font-weight:700;border-top:1px solid #e5e7eb">MATERIALBEDARF</td></tr>';
    }
    var isVz = (Number(l.lineTotal) || 0) < 0 || (Number(l.unitPrice) || 0) < 0;
    var bg   = isVz ? '#fef9c3' : (l.costType === 'material' ? '#ede9fe' : (idx % 2 === 0 ? '#f0f9ff' : '#fff'));
    var fg   = isVz ? '#92400e' : (l.costType === 'material' ? '#6d28d9' : '#1f2937');
    var qty  = l.qty !== undefined ? l.qty : (l.quantity || 0);
    var tot  = l.lineTotal !== undefined ? l.lineTotal : (qty * (l.unitPrice || 0));
    rows += '<tr style="background:' + bg + ';color:' + fg + '">'
      + '<td style="padding:3px 4px;font-size:9pt;white-space:nowrap">' + esc(String(l.pos !== undefined ? l.pos : idx + 1)) + '</td>'
      + '<td style="padding:3px 4px;font-size:9pt">' + esc(String(l.title || ''))
        + (l.description ? '<div style="font-size:7.5pt;color:#9ca3af;margin-top:1px">' + esc(String(l.description)) + '</div>' : '')
      + '</td>'
      + '<td style="padding:3px 4px;text-align:right;font-size:9pt;white-space:nowrap">' + esc(fmtNum(qty)) + '</td>'
      + '<td style="padding:3px 4px;font-size:9pt">' + esc(String(l.unit || '')) + '</td>'
      + '<td style="padding:3px 4px;text-align:right;font-size:9pt;white-space:nowrap">' + esc(fmtCur(l.unitPrice || 0)) + '</td>'
      + '<td style="padding:3px 4px;text-align:right;font-size:9pt;font-weight:700;white-space:nowrap">' + esc(fmtCur(tot)) + '</td>'
      + '</tr>';
  });
  return '<table style="width:100%;border-collapse:collapse;margin-bottom:6mm">'
    + '<thead><tr style="background:' + esc(accentHex) + ';color:#fff">'
    + '<th style="padding:2mm;text-align:left;font-size:8pt">Pos.</th>'
    + '<th style="padding:2mm;text-align:left;font-size:8pt">Bezeichnung</th>'
    + '<th style="padding:2mm;text-align:right;font-size:8pt;white-space:nowrap">Menge</th>'
    + '<th style="padding:2mm;text-align:left;font-size:8pt">Einheit</th>'
    + '<th style="padding:2mm;text-align:right;font-size:8pt;white-space:nowrap">Einzelpreis</th>'
    + '<th style="padding:2mm;text-align:right;font-size:8pt;white-space:nowrap">Gesamt</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function _dtEmpfBlock(lines) {
  return ensureArray(lines).map(function(l) { return '<div>' + esc(String(l)) + '</div>'; }).join('');
}

function _dtBankBlock(bankAccount, cs, accentHex) {
  accentHex = accentHex || '#0891b2';
  cs = cs || {};
  var rows = [];
  if (bankAccount && bankAccount.iban) {
    if (bankAccount.owner) rows.push({k:'Kontoinhaber', v:bankAccount.owner});
    if (bankAccount.bank)  rows.push({k:'Bank',         v:bankAccount.bank});
    rows.push({k:'IBAN', v:bankAccount.iban});
    if (bankAccount.bic)   rows.push({k:'BIC',          v:bankAccount.bic});
  } else if (cs.iban) {
    if (cs.firma) rows.push({k:'Empfänger', v:cs.firma});
    if (cs.bank)  rows.push({k:'Bank',      v:cs.bank});
    rows.push({k:'IBAN', v:cs.iban});
    if (cs.bic)   rows.push({k:'BIC',       v:cs.bic});
  }
  if (!rows.length) return '';
  var inner = rows.map(function(r) {
    return '<div style="color:#6b7280;font-size:8pt">' + esc(r.k) + '</div><div style="font-size:9pt">' + esc(r.v) + '</div>';
  }).join('');
  return '<div style="border:0.5pt solid ' + esc(accentHex) + ';border-radius:2mm;padding:3mm;margin-bottom:6mm;display:grid;grid-template-columns:36mm auto;gap:1.5mm 3mm">'
    + inner + '</div>';
}

// ── Daten für Vorlage aufbauen ────────────────────────────────────────────────

function buildDocData(type, docObj, extra) {
  docObj = docObj || {};
  extra  = extra  || {};

  var cs     = docObj.companySnapshot || docObj.company || companyData || {};
  var accent = normalizeHexColor(cs.letterPrimary, '#0891b2');

  // Logo
  var logoSrc = cs.logoDataUrl || (companyData && companyData.logoDataUrl) || (typeof APP_LOGO_SIDE_URL !== 'undefined' ? APP_LOGO_SIDE_URL : '');
  var logoImg = logoSrc
    ? '<img src="' + escAttr(logoSrc) + '" alt="Logo" style="max-height:20mm;max-width:60mm;object-fit:contain">'
    : '';

  var absender  = getSenderAddressLine(cs);
  var seitenfuss = getCompanyFooterFrom(cs) || getCompanyFooter() || '';

  // Empfänger-Zeilen aufbauen
  var empfLines = ensureArray(docObj.recipientLines || []);
  if (!empfLines.length) {
    var nm = [docObj.customerFirstName, docObj.customerLastName].filter(Boolean).join(' ');
    if (docObj.customerSalutation) empfLines.push(docObj.customerSalutation);
    if (docObj.customerCompany)    empfLines.push(docObj.customerCompany);
    if (nm)                        empfLines.push(nm);
    if (docObj.customerAddress)    empfLines = empfLines.concat(splitAddressLines(docObj.customerAddress));
    if (!empfLines.length && docObj.customer) {
      empfLines = [docObj.customer].concat(splitAddressLines(docObj.address || ''));
    }
  }

  // Positionen
  var lines = ensureArray(docObj.lines || []);
  if (!lines.length && docObj.services) {
    lines = servicesToPrintLines(docObj.services);
  }
  var posTabelle = _dtPosTable(lines, accent);

  // Beträge
  var isKU    = !!(docObj.isKU || docObj.kleinunternehmer || cs.kleinunternehmer);
  var vatRate = isKU ? 0 : (docObj.vatRate || cs.defaultVat || 0.19);
  var vatPct  = isKU ? 0 : Math.round(vatRate * 100);
  var net     = Number(docObj.netTotal || docObj.net || 0);
  var vat     = Number(docObj.vatTotal || docObj.vat || 0);
  var gross   = Number(docObj.grossTotal || docObj.gross || 0);
  if (!net && lines.length) {
    net   = lines.reduce(function(s, l) { return s + Number(l.lineTotal || (l.qty || 0) * (l.unitPrice || 0) || 0); }, 0);
    vat   = isKU ? 0 : net * vatRate;
    gross = net + vat;
  }

  var mwstZeile = isKU
    ? '<div style="display:flex;justify-content:space-between;padding:1mm 0;font-size:9pt;border-top:0.3pt solid #e5e7eb"><span>MwSt. gem. §19 UStG</span><span>0,00 EUR</span></div>'
    : '<div style="display:flex;justify-content:space-between;padding:1mm 0;font-size:10pt;border-top:0.3pt solid #e5e7eb"><span>MwSt. ' + vatPct + '%</span><span>' + esc(fmtCur(vat)) + '</span></div>';

  var kuHinweis = isKU ? 'Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).' : '';
  var bankBlock = _dtBankBlock(docObj.bankAccount || null, cs, accent);

  var fusstext = docObj.fusstext || '';
  if (!fusstext) {
    if (type === 'offer')   fusstext = cs.offerFooterText || 'Dieses Angebot ist freibleibend. Vielen Dank für Ihr Interesse.';
    if (type === 'invoice') fusstext = cs.invFooterText   || ('Zahlbar innerhalb von ' + (cs.zahlungsziel || 14) + ' Tagen ohne Abzug.');
  }

  var typShort = {offer:'ANGEBOT', invoice:'RECHNUNG', dunning:'MAHNUNG', order:'AUFTRAG'};
  var typLong  = {offer:'Angebot', invoice:'Rechnung',  dunning:'Mahnung',  order:'Auftrag'};

  var datum     = docObj.datum    || docObj.issueDate || new Date().toISOString().slice(0, 10);
  var faelligBis = docObj.faelligBis || docObj.dueDate || docObj.validUntil || '';
  if (faelligBis === 'sofort') faelligBis = 'Sofort';

  return {
    firma:             esc(cs.firma         || ''),
    strasse:           esc(cs.strasse       || ''),
    plz:               esc(cs.plz           || ''),
    ort:               esc(cs.ort           || ''),
    telefon:           esc(cs.telefon       || ''),
    email:             esc(cs.email         || ''),
    steuernummer:      esc(cs.steuernummer  || ''),
    ust_id:            esc(cs.ustId         || ''),
    logo_img:          logoImg,
    absender_zeile:    esc(absender),
    seitenfuss:        esc(seitenfuss),
    dokument_typ:      esc(typShort[type]   || ''),
    dokument_typ_lang: esc(typLong[type]    || ''),
    nummer:            esc(String(docObj.nummer || docObj.number || '')),
    datum:             esc(datum),
    faellig_bis:       esc(faelligBis),
    titel:             esc(String(docObj.titel  || docObj.object || docObj.subject || '')),
    empfaenger_block:  _dtEmpfBlock(empfLines),
    netto:             esc(fmtCur(net)),
    mwst:              esc(fmtCur(vat)),
    mwst_pct:          String(vatPct),
    brutto:            esc(fmtCur(gross)),
    mwst_zeile:        mwstZeile,
    ku_hinweis:        esc(kuHinweis),
    positionen_tabelle:    posTabelle,
    bankverbindung_block:  bankBlock,
    fusstext:          esc(fusstext),
    akzentfarbe:       accent,
    // Mahnung
    mahnung_stufe_nr:   String(extra.level          || ''),
    mahnung_stufe_name: esc(extra.dunningLevelName   || ''),
    mahnung_text:       esc(extra.dunningText        || ''),
    mahngebuehr:        esc(fmtCur(extra.fee         || 0)),
    zinsen:             esc(fmtCur(extra.interest    || 0)),
    mahnung_gesamt:     esc(fmtCur(extra.total       || gross)),
    ueberfaellig_tage:  String(extra.days            || ''),
  };
}

// ── Standard-Vorlagen ─────────────────────────────────────────────────────────

function _dtBaseStyle() {
  return '@page{size:A4;margin:0}'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#1f2937;line-height:1.4;padding:18mm 20mm}'
    + '.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:7mm}'
    + '.hdr-r{text-align:right}'
    + '.co-name{font-size:14pt;font-weight:700}'
    + '.co-info{font-size:8pt;color:#6b7280;line-height:1.5;margin-top:1mm}'
    + '.sender{font-size:7.5pt;color:#9ca3af;border-bottom:0.3pt solid #c8c8c8;padding-bottom:1.5mm;margin-bottom:4mm}'
    + '.addr-row{display:flex;justify-content:space-between;gap:10mm;margin-bottom:8mm}'
    + '.recip div{font-size:10pt;line-height:1.6}'
    + '.meta{text-align:right;font-size:9pt;min-width:52mm}'
    + '.meta-lbl{color:#9ca3af;font-size:7.5pt;margin-top:2mm}'
    + '.meta-val{font-size:10pt;margin-top:0.5mm}'
    + '.doc-title{font-size:18pt;font-weight:700;margin-bottom:7mm}'
    + '.sum-wrap{display:flex;justify-content:flex-end;margin-bottom:6mm}'
    + '.sum-box{min-width:82mm}'
    + '.sum-row{display:flex;justify-content:space-between;padding:1mm 0;border-top:0.3pt solid #e5e7eb}'
    + '.sum-total{background:{{akzentfarbe}};color:#fff;font-weight:700;font-size:11pt;padding:2mm 3mm;border-radius:1mm;margin-top:1mm;display:flex;justify-content:space-between}'
    + '.foot{font-size:9pt;color:#374151;margin:5mm 0 3mm}'
    + '.pg-foot{border-top:0.3pt solid #e5e7eb;padding-top:2mm;font-size:7pt;color:#9ca3af;text-align:center;margin-top:8mm}';
}

function getDefaultTemplateHtml(type) {
  var style = _dtBaseStyle();

  if (type === 'dunning') {
    return '<style>' + style + '</style>'
      + '<div class="hdr"><div>{{logo_img}}</div>'
      + '<div class="hdr-r"><div class="co-name">{{firma}}</div><div class="co-info">{{strasse}}<br>{{plz}} {{ort}}<br>{{telefon}} &middot; {{email}}</div></div></div>'
      + '<div class="sender">{{absender_zeile}}</div>'
      + '<div class="addr-row">'
      + '<div class="recip">{{empfaenger_block}}</div>'
      + '<div class="meta">'
      + '<div class="meta-lbl">Datum</div><div class="meta-val">{{datum}}</div>'
      + '<div class="meta-lbl">Rechnungs-Nr.</div><div class="meta-val">{{nummer}}</div>'
      + '<div class="meta-lbl">Fällig seit</div><div class="meta-val">{{faellig_bis}}</div>'
      + '</div></div>'
      + '<div class="doc-title">{{mahnung_stufe_name}}</div>'
      + '<p style="font-size:10pt;color:#374151;margin-bottom:6mm;line-height:1.6">{{mahnung_text}}</p>'
      + '{{positionen_tabelle}}'
      + '<div class="sum-wrap"><div class="sum-box">'
      + '<div class="sum-row"><span>Rechnungsbetrag</span><span>{{brutto}}</span></div>'
      + '<div class="sum-row"><span>Mahngebühr</span><span>{{mahngebuehr}}</span></div>'
      + '<div class="sum-row"><span>Verzugszinsen ({{ueberfaellig_tage}} Tage)</span><span>{{zinsen}}</span></div>'
      + '<div class="sum-total"><span>Gesamtbetrag</span><span>{{mahnung_gesamt}}</span></div>'
      + '</div></div>'
      + '<div class="foot">Bitte überweisen Sie den Gesamtbetrag innerhalb von {{faellig_bis}} Tagen auf unten stehendes Konto.</div>'
      + '{{bankverbindung_block}}'
      + '<div class="pg-foot">{{seitenfuss}}</div>';
  }

  var metaBlock = '';
  if (type === 'offer') {
    metaBlock = '<div class="meta-lbl">Angebotsnummer</div><div class="meta-val">{{nummer}}</div>'
      + '<div class="meta-lbl">Datum</div><div class="meta-val">{{datum}}</div>'
      + '<div class="meta-lbl">Gültig bis</div><div class="meta-val">{{faellig_bis}}</div>';
  } else if (type === 'invoice') {
    metaBlock = '<div class="meta-lbl">Rechnungsnummer</div><div class="meta-val">{{nummer}}</div>'
      + '<div class="meta-lbl">Rechnungsdatum</div><div class="meta-val">{{datum}}</div>'
      + '<div class="meta-lbl">Fällig bis</div><div class="meta-val">{{faellig_bis}}</div>'
      + '<div class="meta-lbl" style="margin-top:2mm">{{steuernummer}}</div>';
  } else {
    metaBlock = '<div class="meta-lbl">Auftragsnummer</div><div class="meta-val">{{nummer}}</div>'
      + '<div class="meta-lbl">Datum</div><div class="meta-val">{{datum}}</div>';
  }

  return '<style>' + style + '</style>'
    + '<div class="hdr"><div>{{logo_img}}</div>'
    + '<div class="hdr-r"><div class="co-name">{{firma}}</div><div class="co-info">{{strasse}}<br>{{plz}} {{ort}}<br>{{telefon}} &middot; {{email}}</div></div></div>'
    + '<div class="sender">{{absender_zeile}}</div>'
    + '<div class="addr-row">'
    + '<div class="recip">{{empfaenger_block}}</div>'
    + '<div class="meta">' + metaBlock + '</div>'
    + '</div>'
    + '<div class="doc-title">{{dokument_typ_lang}}: {{titel}}</div>'
    + '{{positionen_tabelle}}'
    + '<div class="sum-wrap"><div class="sum-box">'
    + '<div class="sum-row"><span>Netto</span><span>{{netto}}</span></div>'
    + '{{mwst_zeile}}'
    + '<div class="sum-total"><span>Gesamt</span><span>{{brutto}}</span></div>'
    + '</div></div>'
    + '<div class="foot">{{ku_hinweis}}</div>'
    + '<div class="foot">{{fusstext}}</div>'
    + '{{bankverbindung_block}}'
    + '<div class="pg-foot">{{seitenfuss}}</div>';
}

// ── Template-Zugriff ──────────────────────────────────────────────────────────

function hasCustomTemplate(type) {
  return !!(companyData && companyData.docTemplates && companyData.docTemplates[type] && companyData.docTemplates[type].html);
}

function getDocTemplate(type) {
  return hasCustomTemplate(type) ? companyData.docTemplates[type].html : getDefaultTemplateHtml(type);
}

// ── Vollständiges HTML aufbauen ───────────────────────────────────────────────

function buildFullDocHtml(type, docObj, extra) {
  var tmpl = getDocTemplate(type);
  var data = buildDocData(type, docObj, extra);
  var body = renderDocTemplate(tmpl, data);
  return '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head><body>' + body + '</body></html>';
}

// ── Browser-Druck mit Vorlage ─────────────────────────────────────────────────

function printWithDocTemplate(type, docObj, extra) {
  var fullHtml = buildFullDocHtml(type, docObj, extra);
  // Nur den body-Inhalt (inkl. Style-Tags) in printRoot einfügen
  var inner = fullHtml
    .replace(/^[\s\S]*?<body[^>]*>/i, '')
    .replace(/<\/body>[\s\S]*$/i, '');
  var root = document.getElementById('printRoot');
  if (root) {
    root.innerHTML = inner;
    if (!window.__printAfterBound) {
      window.__printAfterBound = true;
      window.addEventListener('afterprint', function() { var r = document.getElementById('printRoot'); if (r) r.innerHTML = ''; });
    }
    requestAnimationFrame(function() { setTimeout(function() { window.print(); }, 50); });
  }
}

// ── PDF-Export per Electron printToPDF ────────────────────────────────────────

async function exportPdfWithDocTemplate(type, docObj, defaultFileName, extra) {
  if (!hasCustomTemplate(type)) return false;
  var html = buildFullDocHtml(type, docObj, extra);
  if (window.electronAPI && window.electronAPI.htmlToPdf) {
    try {
      var res = await window.electronAPI.htmlToPdf({ html: html, defaultName: defaultFileName });
      if (res && res.ok) {
        showDriveToast('Gespeichert: ' + defaultFileName);
        if (res.filePath && window.electronAPI.openFile) window.electronAPI.openFile(res.filePath).catch(function(){});
        return true;
      }
      if (res && res.canceled) return true;
    } catch(e) { console.error('exportPdfWithDocTemplate', e); }
  }
  printWithDocTemplate(type, docObj, extra);
  return true;
}

async function autoSavePdfWithDocTemplate(type, docObj, defaultFileName, subDir, extra) {
  if (!hasCustomTemplate(type)) return false;
  var html = buildFullDocHtml(type, docObj, extra);
  if (window.electronAPI && window.electronAPI.htmlToPdfAuto) {
    try {
      var res = await window.electronAPI.htmlToPdfAuto({ html: html, defaultName: defaultFileName, subDir: subDir || 'Dokumente' });
      if (res && res.ok) {
        showDriveToast('Gespeichert: ' + defaultFileName);
        if (res.filePath && window.electronAPI.openFile) window.electronAPI.openFile(res.filePath).catch(function(){});
        return true;
      }
    } catch(e) { console.error('autoSavePdfWithDocTemplate', e); }
  }
  return false;
}

// ── Template-Editor ───────────────────────────────────────────────────────────

var _dtEdType      = 'offer';
var _dtPrevTimer   = null;

function openTemplateEditor(type) {
  _dtEdType = type || 'offer';
  var modal = document.getElementById('docTemplateEditorModal');
  if (!modal) return;
  modal.style.display = 'flex';
  _dtSelectType(_dtEdType);
}

function closeTemplateEditor() {
  var modal = document.getElementById('docTemplateEditorModal');
  if (modal) modal.style.display = 'none';
}

function _dtSelectType(type) {
  _dtEdType = type;
  DOC_TEMPLATE_TYPES.forEach(function(t) {
    var btn = document.getElementById('dtTypeBtn_' + t);
    if (!btn) return;
    btn.className = 'btn btn-sm ' + (t === type ? 'btn-primary' : 'btn-secondary');
  });
  var editor = document.getElementById('dtHtmlEditor');
  if (editor) editor.value = getDocTemplate(type);
  _dtUpdatePreview();
  _dtRenderPlaceholders(type);
  var isCustom = hasCustomTemplate(type);
  var resetBtn = document.getElementById('dtResetBtn');
  if (resetBtn) resetBtn.style.display = isCustom ? '' : 'none';
  var badge = document.getElementById('dtCustomBadge');
  if (badge) badge.style.display = isCustom ? '' : 'none';
}

function _dtUpdatePreview() {
  if (_dtPrevTimer) clearTimeout(_dtPrevTimer);
  _dtPrevTimer = setTimeout(function() {
    var editor = document.getElementById('dtHtmlEditor');
    var frame  = document.getElementById('dtPreviewFrame');
    if (!editor || !frame) return;
    var sample   = _dtBuildSample(_dtEdType);
    var rendered = renderDocTemplate(editor.value, sample);
    var fullHtml = '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>html{zoom:.72}body{margin:0}</style></head><body>' + rendered + '</body></html>';
    try {
      var d = frame.contentDocument || frame.contentWindow.document;
      d.open(); d.write(fullHtml); d.close();
    } catch(e) {}
  }, 500);
}

function _dtRenderPlaceholders(type) {
  var c = document.getElementById('dtPlaceholderList');
  if (!c) return;
  var h = '';
  TEMPLATE_PLACEHOLDERS.forEach(function(p) {
    if (p.types && p.types.indexOf(type) === -1) return;
    h += '<div class="dt-ph-row" onclick="dtInsertPlaceholder(\'' + esc(p.key) + '\')" title="Klicken zum Einfügen">'
      + '<code class="dt-ph-code">{{' + esc(p.key) + '}}</code>'
      + '<span class="dt-ph-lbl">' + esc(p.label) + '</span>'
      + (p.isHtml ? '<span class="dt-ph-html">HTML</span>' : '')
      + '</div>';
  });
  c.innerHTML = h;
}

function dtInsertPlaceholder(key) {
  var editor = document.getElementById('dtHtmlEditor');
  if (!editor) return;
  var s = editor.selectionStart, e = editor.selectionEnd;
  var txt = '{{' + key + '}}';
  editor.value = editor.value.slice(0, s) + txt + editor.value.slice(e);
  editor.selectionStart = editor.selectionEnd = s + txt.length;
  editor.focus();
  _dtUpdatePreview();
}

function _dtBuildSample(type) {
  var cs     = companyData || {};
  var accent = normalizeHexColor(cs.letterPrimary, '#0891b2');
  var logoSrc = cs.logoDataUrl || (typeof APP_LOGO_SIDE_URL !== 'undefined' ? APP_LOGO_SIDE_URL : '');
  var logoImg = logoSrc ? '<img src="' + escAttr(logoSrc) + '" alt="Logo" style="max-height:20mm;max-width:60mm;object-fit:contain">' : '';
  var faellig = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  var sampleLines = [
    {pos:1, title:'Dachdeckerarbeiten', description:'Neueindeckung 50 m²', qty:50, unit:'m²', unitPrice:45, lineTotal:2250, costType:'position'},
    {pos:2, title:'Dachdämmung',        description:'',                    qty:50, unit:'m²', unitPrice:22, lineTotal:1100, costType:'position'},
    {pos:3, title:'Frankfurter Pfanne', description:'anthrazit',          qty:500,unit:'Stk.',unitPrice:3.2,lineTotal:1600, costType:'material'},
  ];
  var empf = ['Musterkunde GmbH', 'Herrn Max Mustermann', 'Musterweg 22', '12345 Musterstadt'];
  return {
    firma:          esc(cs.firma    || 'Musterbau GmbH'),
    strasse:        esc(cs.strasse  || 'Handwerkerstr. 5'),
    plz:            esc(cs.plz     || '80331'),
    ort:            esc(cs.ort     || 'München'),
    telefon:        esc(cs.telefon  || '+49 89 123456'),
    email:          esc(cs.email    || 'info@musterbau.de'),
    steuernummer:   esc(cs.steuernummer || 'St.-Nr: 123/456/78901'),
    ust_id:         esc(cs.ustId   || 'DE123456789'),
    logo_img:       logoImg,
    absender_zeile: esc(getSenderAddressLine(cs) || 'Musterbau GmbH · Handwerkerstr. 5 · 80331 München'),
    seitenfuss:     esc(getCompanyFooterFrom(cs) || 'Musterbau GmbH · St.-Nr: 123/456/789 · IBAN: DE12 3456 7890'),
    dokument_typ:   type==='offer'?'ANGEBOT':type==='invoice'?'RECHNUNG':type==='dunning'?'MAHNUNG':'AUFTRAG',
    dokument_typ_lang: type==='offer'?'Angebot':type==='invoice'?'Rechnung':type==='dunning'?'Mahnung':'Auftrag',
    nummer:         type==='offer'?'AN-240512':type==='invoice'?'RE-2024-0042':type==='order'?'AU-240512':'RE-2024-0042',
    datum:          new Date().toISOString().slice(0, 10),
    faellig_bis:    faellig,
    titel:          'Dachsanierung Hauptgebäude',
    empfaenger_block: _dtEmpfBlock(empf),
    netto:          esc(fmtCur(4950)),
    mwst:           esc(fmtCur(940.5)),
    mwst_pct:       '19',
    brutto:         esc(fmtCur(5890.5)),
    mwst_zeile:     '<div style="display:flex;justify-content:space-between;padding:1mm 0;font-size:10pt;border-top:0.3pt solid #e5e7eb"><span>MwSt. 19%</span><span>' + esc(fmtCur(940.5)) + '</span></div>',
    ku_hinweis:     '',
    positionen_tabelle:   _dtPosTable(sampleLines, accent),
    bankverbindung_block: _dtBankBlock(null, cs, accent),
    fusstext:       type==='offer' ? (cs.offerFooterText||'Dieses Angebot ist freibleibend. Vielen Dank für Ihr Interesse.') : (cs.invFooterText||'Zahlbar innerhalb von 14 Tagen ohne Abzug.'),
    akzentfarbe:    accent,
    mahnung_stufe_nr:   '1',
    mahnung_stufe_name: 'Zahlungserinnerung',
    mahnung_text:   'Wir erinnern Sie freundlich daran, dass die Rechnung seit 12 Tagen fällig ist. Bitte überweisen Sie den offenen Betrag innerhalb von 10 Tagen.',
    mahngebuehr:    esc(fmtCur(0)),
    zinsen:         esc(fmtCur(8.23)),
    mahnung_gesamt: esc(fmtCur(5898.73)),
    ueberfaellig_tage: '12',
  };
}

async function dtSaveTemplate() {
  var editor = document.getElementById('dtHtmlEditor');
  if (!editor) return;
  if (!companyData.docTemplates) companyData.docTemplates = {};
  companyData.docTemplates[_dtEdType] = { html: editor.value };
  try { await saveData(); } catch(e) {}
  _dtSelectType(_dtEdType);
  var btn = document.getElementById('dtSaveBtn');
  if (btn) { var lbl = btn.textContent; btn.textContent = 'Gespeichert!'; setTimeout(function(){ btn.textContent = lbl; }, 1600); }
}

async function dtResetTemplate() {
  if (!confirm('Vorlage auf Standard zurücksetzen? Alle eigenen Anpassungen gehen verloren.')) return;
  if (companyData.docTemplates) delete companyData.docTemplates[_dtEdType];
  try { await saveData(); } catch(e) {}
  _dtSelectType(_dtEdType);
}

function dtFormatHtml() {
  var editor = document.getElementById('dtHtmlEditor');
  if (!editor) return;
  try {
    editor.value = editor.value
      .replace(/>\s*</g, '>\n<')
      .replace(/\n{2,}/g, '\n')
      .trim();
    _dtUpdatePreview();
  } catch(e) {}
}
