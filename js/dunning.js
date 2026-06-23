function getDunningNewDays(level){var days=level===3?(companyData.dunningNewDays3!=null?companyData.dunningNewDays3:5):level===2?(companyData.dunningNewDays2!=null?companyData.dunningNewDays2:7):(companyData.dunningNewDays1!=null?companyData.dunningNewDays1:10);return Math.max(1,parseInt(days,10)||1)}
function getDunningEmailSalutation(inv){var salut=String(inv&&inv.customerSalutation||'').trim();var last=String(inv&&inv.customerLastName||'').trim();var company=String(inv&&inv.customerCompany||'').trim();if(company&&!last)return'Sehr geehrte Damen und Herren';if(salut==='Herr'&&last)return'Sehr geehrter Herr '+last;if(salut==='Frau'&&last)return'Sehr geehrte Frau '+last;if(last)return'Sehr geehrte/r '+last;return'Sehr geehrte Damen und Herren'}
function getInvoiceReminderLevel(inv){var max=0;ensureArray(inv&&inv.reminders).forEach(function(r){var lv=parseInt(r&&r.level,10)||0;if(lv>max)max=lv});return max}
function addDaysIso(dateStr,n){var d=new Date(String(dateStr||new Date().toISOString().slice(0,10))+'T00:00:00');if(!isFinite(d.getTime()))d=new Date();d.setDate(d.getDate()+(parseInt(n,10)||0));return d.toISOString().slice(0,10)}
function ensureInvDueDate(inv){if(!inv||inv.status!=='open')return false;if(!inv.dueDate){inv.dueDate=addDaysIso(inv.issueDate||new Date().toISOString().slice(0,10),14);return true}if(inv.dueDate==='sofort'){inv.dueDate=inv.issueDate||new Date().toISOString().slice(0,10);return true}return false}
function isInvoiceOverdue(inv){if(!inv||inv.status!=='open'||!inv.dueDate)return false;var due=inv.dueDate==='sofort'?(inv.issueDate||new Date().toISOString().slice(0,10)):inv.dueDate;return due<new Date().toISOString().slice(0,10)}
function getOverdueDays(inv){if(!inv||!inv.dueDate||inv.dueDate==='sofort')return 0;var due=new Date(inv.dueDate+'T00:00:00').getTime();var today=new Date(new Date().toISOString().slice(0,10)+'T00:00:00').getTime();return Math.max(0,Math.floor((today-due)/86400000))}
function getAutoDunningLevel(days){return days>30?3:days>=15?2:days>=1?1:0}
function getReminderByLevel(inv,level){return ensureArray(inv&&inv.reminders).find(function(r){return (parseInt(r&&r.level,10)||0)===(parseInt(level,10)||0)})||null}
function getDunningCfg(){return{fee1:Number(companyData.dunningFee1||0),fee2:Number(companyData.dunningFee2||0),fee3:Number(companyData.dunningFee3||0),rate:Number(companyData.dunningInterestRate||0),wait2:Math.max(0,parseInt(companyData.dunningWait2,10)||0),wait3:Math.max(0,parseInt(companyData.dunningWait3,10)||0)}}
function addMonthsIso(dateStr,months){var d=new Date(String(dateStr||new Date().toISOString().slice(0,10))+'T00:00:00');if(!isFinite(d.getTime()))d=new Date();d.setMonth(d.getMonth()+Math.max(1,parseInt(months,10)||1));return d.toISOString().slice(0,10)}
function getDunningCharges(inv,level){var cfg=getDunningCfg();var due=inv&&inv.dueDate?inv.dueDate:new Date().toISOString().slice(0,10);var dueTs=new Date(due+'T00:00:00').getTime();var todayTs=new Date(new Date().toISOString().slice(0,10)+'T00:00:00').getTime();var days=Math.max(1,Math.floor((todayTs-dueTs)/86400000));var base=Number(inv&&inv.grossTotal||0);var fee=level===3?cfg.fee3:level===2?cfg.fee2:cfg.fee1;var interest=base*(cfg.rate/100)*(days/365);return{base:base,days:days,fee:fee,interest:interest,total:base+fee+interest}}
function getDunningLevelName(level){return level===1?'Zahlungserinnerung':level===2?'1. Mahnung':'Letzte Mahnung'}
function getDunningText(level,inv){var c=getDunningCharges(inv,level);if(level===2)return 'Trotz unserer 1. Mahnung konnten wir bisher keinen Zahlungseingang feststellen. Bitte begleichen Sie den offenen Betrag inklusive Mahngebühren innerhalb von 7 Tagen.';if(level===3)return 'Letzte Mahnung: Bitte begleichen Sie den Gesamtbetrag aus Hauptforderung und Mahngebühr umgehend, spätestens innerhalb von 5 Tagen.';return 'Wir erinnern Sie freundlich daran, dass die Rechnung seit '+c.days+' Tagen fällig ist. Bitte überweisen Sie den offenen Betrag innerhalb von 10 Tagen.'}

function renderDunningLevelChips(inv) {
  var cfg = getDunningCfg();
  var fees = [0, cfg.fee1, cfg.fee2, cfg.fee3];
  var sentLevel = getInvoiceReminderLevel(inv);
  var days = getOverdueDays(inv);
  var autoLevel = getAutoDunningLevel(days);
  var html = '<div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap">';
  for (var lvl = 1; lvl <= 3; lvl++) {
    var reminder = getReminderByLevel(inv, lvl);
    var isDone = !!(reminder && reminder.date);
    var isRecommended = (lvl === sentLevel + 1 && lvl <= autoLevel);
    var levelName = lvl === 1 ? 'Erinnerung' : lvl === 2 ? 'Mahnung' : 'Letzte';
    var chip, dateRow;
    if (isDone) {
      chip = 'background:#dcfce7;color:#166534;border:1.5px solid #86efac';
      dateRow = '<div style="font-size:10px;color:#16a34a;margin-top:2px">' + esc(reminder.date) + '</div>';
    } else if (isRecommended) {
      chip = 'background:#fff7ed;color:#9a3412;border:1.5px solid #fb923c;box-shadow:0 0 0 2px rgba(251,146,60,0.2)';
      dateRow = '<div style="font-size:10px;color:#ea580c;margin-top:2px">empfohlen</div>';
    } else {
      chip = 'background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0';
      dateRow = '<div style="font-size:10px;color:#94a3b8;margin-top:2px">' + (fees[lvl] > 0 ? fmtCur(fees[lvl]) : 'keine Geb.') + '</div>';
    }
    var icon = isDone ? '&#10003;' : (isRecommended ? '&#9658;' : '&#9675;');
    html += '<div onclick="openDunningModal(\'' + inv.id + '\',' + lvl + ')" title="Stufe ' + lvl + ': ' + getDunningLevelName(lvl) + '" style="cursor:pointer;' + chip + ';padding:5px 9px;border-radius:8px;font-size:11px;font-weight:600;text-align:center;min-width:62px;user-select:none">' + icon + ' Stufe ' + lvl + dateRow + '</div>';
  }
  html += '</div>';
  return html;
}

function renderDunning() {
  var c = document.getElementById('dunningList'); if (!c) return;
  invoices = ensureArray(invoices);
  var changed = false;
  invoices.forEach(function(inv) { if (ensureInvDueDate(inv)) changed = true; });
  if (changed) saveData();
  var list = invoices.filter(isInvoiceOverdue).sort(function(a, b) { return String(a.dueDate || '').localeCompare(String(b.dueDate || '')); });
  if (!list.length) {
    c.innerHTML = '<div style="padding:48px;text-align:center"><div style="font-size:48px;margin-bottom:16px">&#10003;</div><p style="color:#6b7280;font-size:16px">Keine &uuml;berf&auml;lligen Rechnungen.</p></div>';
    return;
  }
  var h = '<div style="overflow-x:auto">';
  h += '<table style="width:100%;border-collapse:collapse;font-size:14px">';
  h += '<thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">';
  h += '<th style="padding:13px 16px;text-align:left;font-weight:600;color:#374151;white-space:nowrap">Rechnungs-Nr.</th>';
  h += '<th style="padding:13px 16px;text-align:left;font-weight:600;color:#374151">Kunde</th>';
  h += '<th style="padding:13px 16px;text-align:left;font-weight:600;color:#374151;white-space:nowrap">F&auml;llig am</th>';
  h += '<th style="padding:13px 16px;text-align:right;font-weight:600;color:#374151;white-space:nowrap">&Uuml;berf&auml;llig</th>';
  h += '<th style="padding:13px 16px;text-align:right;font-weight:600;color:#374151">Betrag</th>';
  h += '<th style="padding:13px 16px;text-align:center;font-weight:600;color:#374151">Mahnstufen</th>';
  h += '<th style="padding:13px 16px;text-align:right;font-weight:600;color:#374151">Aktionen</th>';
  h += '</tr></thead><tbody>';
  list.forEach(function(inv, idx) {
    var days = getOverdueDays(inv);
    var sentLevel = getInvoiceReminderLevel(inv);
    var rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
    var daysBadge;
    if (days > 30) daysBadge = 'background:#fee2e2;color:#991b1b;border:1px solid #f87171';
    else if (days >= 15) daysBadge = 'background:#ffedd5;color:#9a3412;border:1px solid #fb923c';
    else daysBadge = 'background:#fef9c3;color:#854d0e;border:1px solid #fde047';
    h += '<tr style="background:' + rowBg + ';border-bottom:1px solid #f1f5f9">';
    h += '<td style="padding:14px 16px;font-weight:600;color:#1e293b">' + esc(inv.number || '-') + '</td>';
    h += '<td style="padding:14px 16px;color:#374151">' + esc(inv.customerName || '-') + '</td>';
    h += '<td style="padding:14px 16px;color:#6b7280">' + esc(inv.dueDate || '-') + '</td>';
    h += '<td style="padding:14px 16px;text-align:right"><span style="' + daysBadge + ';padding:3px 9px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">' + days + ' Tage</span></td>';
    h += '<td style="padding:14px 16px;text-align:right;font-weight:600;color:#1e293b;white-space:nowrap">' + fmtCur(inv.grossTotal || 0) + '</td>';
    h += '<td style="padding:10px 16px;text-align:center">' + renderDunningLevelChips(inv) + '</td>';
    h += '<td style="padding:14px 16px;text-align:right"><div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">';
    h += '<button onclick="openDunningModal(\'' + inv.id + '\',' + Math.max(1, Math.min(3, sentLevel + 1)) + ')" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">&#9993; Mahnung</button>';
    h += '<button onclick="exportDunningPDF(\'' + inv.id + '\',' + Math.max(1, Math.min(3, sentLevel + 1)) + ')" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">&#128196; PDF</button>';
    h += '<button onclick="markInvoicePaidFromDunning(\'' + inv.id + '\')" style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">&#10003; Bezahlt</button>';
    h += '</div></td>';
    h += '</tr>';
  });
  h += '</tbody></table></div>';
  c.innerHTML = h;
}

function openDunningModal(id, preselectLevel) {
  var inv = invoices.find(function(i) { return i.id === id; });
  if (!inv) return;
  preselectLevel = Math.max(1, Math.min(3, parseInt(preselectLevel, 10) || 1));
  var cfg = getDunningCfg();
  var fees = [0, cfg.fee1, cfg.fee2, cfg.fee3];
  var sentLevel = getInvoiceReminderLevel(inv);
  var today = new Date().toISOString().slice(0, 10);

  var m = document.getElementById('dunningModal');
  if (!m) return;
  document.getElementById('dunningModalInvNum').textContent = inv.number || '-';
  document.getElementById('dunningModalCustomer').textContent = inv.customerName || '-';
  document.getElementById('dunningModalAmount').textContent = fmtCur(inv.grossTotal || 0);
  document.getElementById('dunningModalDue').textContent = inv.dueDate || '-';
  document.getElementById('dunningModalDays').textContent = getOverdueDays(inv) + ' Tage';
  m._invId = id;

  var lvlHtml = '';
  for (var lvl = 1; lvl <= 3; lvl++) {
    var reminder = getReminderByLevel(inv, lvl);
    var isDone = !!(reminder && reminder.date);
    var isSelected = (lvl === preselectLevel);
    var fee = fees[lvl];
    var newDue = addDaysIso(today, getDunningNewDays(lvl));
    var name = getDunningLevelName(lvl);
    var statusHtml;
    if (isDone) {
      statusHtml = '<span style="color:#16a34a;font-size:12px;font-weight:600">&#10003; Erstellt am ' + esc(reminder.date) + '</span>';
    } else if (lvl <= sentLevel + 1) {
      statusHtml = '<span style="color:#ea580c;font-size:12px">Noch nicht erstellt</span>';
    } else {
      statusHtml = '<span style="color:#94a3b8;font-size:12px">Vorherige Stufe ausstehend</span>';
    }
    var cardBorder = isSelected ? 'border:2px solid #0891b2;background:#f0f9ff' : 'border:2px solid #e5e7eb;background:#fff';
    lvlHtml += '<div onclick="selectDunningLevel(' + lvl + ')" id="dunningLvlCard' + lvl + '" style="cursor:pointer;' + cardBorder + ';border-radius:12px;padding:14px 16px;transition:all .15s">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<div id="dunningLvlRadio' + lvl + '" style="width:18px;height:18px;border-radius:50%;border:2px solid ' + (isSelected ? '#0891b2' : '#d1d5db') + ';background:' + (isSelected ? '#0891b2' : '#fff') + ';flex-shrink:0"></div>' +
      '<span style="font-weight:700;font-size:15px;color:#1e293b">Stufe ' + lvl + ': ' + esc(name) + '</span>' +
      (isDone ? ' <span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">&#10003; erledigt</span>' : '') +
      '</div>' +
      '<span style="font-weight:700;color:' + (fee > 0 ? '#dc2626' : '#6b7280') + ';font-size:13px">' + (fee > 0 ? '+ ' + fmtCur(fee) + ' Gebühr' : 'Keine Gebühr') + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:16px;font-size:12px;color:#6b7280">' +
      '<span>Neue Frist: <strong style="color:#374151">' + esc(newDue) + '</strong></span>' +
      statusHtml +
      '</div>' +
      '</div>';
  }
  document.getElementById('dunningModalLevels').innerHTML = lvlHtml;
  m._selectedLevel = preselectLevel;
  m.style.display = 'flex';
  m.classList.add('active');
}

function selectDunningLevel(lvl) {
  var m = document.getElementById('dunningModal');
  if (!m) return;
  m._selectedLevel = lvl;
  for (var i = 1; i <= 3; i++) {
    var card = document.getElementById('dunningLvlCard' + i);
    var radio = document.getElementById('dunningLvlRadio' + i);
    if (!card || !radio) continue;
    var active = (i === lvl);
    card.style.border = active ? '2px solid #0891b2' : '2px solid #e5e7eb';
    card.style.background = active ? '#f0f9ff' : '#fff';
    radio.style.border = '2px solid ' + (active ? '#0891b2' : '#d1d5db');
    radio.style.background = active ? '#0891b2' : '#fff';
  }
}

function closeDunningModal() {
  var m = document.getElementById('dunningModal');
  if (!m) return;
  m.style.display = 'none';
  m.classList.remove('active');
}

async function dunningModalAction(action) {
  var m = document.getElementById('dunningModal');
  if (!m) return;
  var id = m._invId;
  var level = parseInt(m._selectedLevel, 10) || 1;
  var inv = invoices.find(function(i) { return i.id === id; });
  if (!inv) return;

  var sentLevel = getInvoiceReminderLevel(inv);
  if (level > sentLevel + 1 && sentLevel < level - 1) {
    var skip = await uiConfirm('Stufe ' + (sentLevel + 1) + ' wurde noch nicht erstellt.\nWirklich direkt Stufe ' + level + ' (' + getDunningLevelName(level) + ') erstellen?', 'Stufe überspringen');
    if (!skip) return;
  }

  closeDunningModal();

  if (action === 'email') {
    await createDunningNotice(id, level);
  } else if (action === 'pdf') {
    await exportDunningPDF(id, level);
  } else {
    await sendDunning(id, level);
  }
}

async function recordDunning(inv, level, channel) {
  inv.reminders = ensureArray(inv.reminders);
  var existing = inv.reminders.find(function(r) { return (parseInt(r.level, 10) || 0) === level; });
  var dt = new Date().toISOString().slice(0, 10);
  var text = getDunningText(level, inv);
  if (existing) {
    existing.date = dt;
    existing.text = text;
    existing.channel = channel || existing.channel || 'manual';
  } else {
    inv.reminders.push({ id: 'mah_' + Date.now() + '_' + level, level: level, date: dt, text: text, channel: channel || 'manual' });
  }
  addAuditEntry('Mahnung erstellt', 'Rechnung', inv.number || inv.id, 'Stufe ' + level + ' via ' + (channel || 'manual') + ', Faellig: ' + (inv.dueDate || '-'));
  await saveData();
  renderDunning();
  renderInvoices();
  if (selectedInvoiceId === inv.id) renderInvoicePreview(inv.id);
}

async function sendDunning(id, level) {
  var inv = invoices.find(function(i) { return i.id === id; });
  if (!inv) { alert('Rechnung nicht gefunden.'); return; }
  level = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  if (!await uiConfirm('Mahnung „' + getDunningLevelName(level) + '" für Rechnung ' + (inv.number || '-') + ' erfassen?', 'Mahnung erfassen')) return;
  await recordDunning(inv, level, 'manual');
  alert('Mahnung Stufe ' + level + ' gespeichert.');
}

async function sendDunningEmail(id, level) {
  level = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  if (typeof isSmtpConfigured === 'function' && isSmtpConfigured()) {
    if (typeof openEmailPreviewModal === 'function') {
      await openEmailPreviewModal('dunning', id, { level: level });
      return;
    }
  }
  await createDunningNotice(id, level);
}

function buildDunningEmailHtml(inv, level) {
  var cs = inv.companySnapshot || companyData || {};
  var firma = esc(cs.firma || 'Werkmeister Pro');
  var ba = inv.bankAccount || {};
  var iban = esc(ba.iban || '');
  var bic = esc(ba.bic || '');
  var bank = esc(ba.bank || '');
  var inhaber = esc(ba.owner || cs.firma || '');
  var invNum = esc(inv.number || '');
  var issueDate = esc(inv.issueDate || '');
  var dueDate = esc(inv.dueDate || '');
  var gross = Number(inv.grossTotal || 0);
  var footerEmail = esc(cs.email || '');
  var footerCity = esc([cs.plz, cs.ort].filter(Boolean).join(' ') || '');
  var today = new Date().toISOString().slice(0, 10);
  var cfg = getDunningCfg();
  var fees = [0, cfg.fee1, cfg.fee2, cfg.fee3];
  var bankRows = '';
  if (ba.iban) {
    if (inhaber) bankRows += '<tr><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280;width:140px">Kontoinhaber</td><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">' + inhaber + '</td></tr>';
    if (bank) bankRows += '<tr><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">Bank</td><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">' + bank + '</td></tr>';
    bankRows += '<tr><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">IBAN</td><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">' + iban + '</td></tr>';
    if (bic) bankRows += '<tr><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">BIC</td><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">' + bic + '</td></tr>';
    bankRows += '<tr><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">Verwendungszweck</td><td style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;font-weight:bold;color:#0891b2">' + invNum + '</td></tr>';
  }
  var bankBlock = ba.iban ? '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9fafb" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px"><tr><td colspan="2" style="padding:14px 16px 6px;font-size:12px;font-weight:bold;color:#0891b2;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.05em">Bankverbindung</td></tr>' + bankRows.replace(/<tr>/g, '<tr><td width="16" style="padding:0 0 0 16px"></td>').replace(/<\/tr>/g, '<td width="16"></td></tr>') + '<tr><td height="10"></td></tr></table>' : '';
  var footerHtml = '<tr><td bgcolor="#1E2A3A" style="background-color:#1E2A3A;padding:16px 28px;border-radius:0 0 8px 8px"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:12px;color:#94a3b8;font-family:Arial,sans-serif">' + footerEmail + '</td><td align="right" style="font-size:12px;color:#94a3b8;font-family:Arial,sans-serif">' + footerCity + '</td></tr></table></td></tr>';
  var wOpen = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body style="margin:0;padding:0;background-color:#f3f4f6"><table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6" style="background-color:#f3f4f6"><tr><td align="center" style="padding:32px 16px"><table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color:#ffffff;width:600px;border-radius:8px 8px 0 0"><tr><td style="padding:28px;font-family:Arial,sans-serif;border-radius:8px 8px 0 0">';
  var wClose = '</td></tr>' + footerHtml + '</table></td></tr></table></body></html>';
  var dunSalut = getDunningEmailSalutation(inv);
  var body = '';
  if (level === 1) {
    var newDue1 = addDaysIso(today, getDunningNewDays(1));
    body =
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid #2E5BA8;margin-bottom:24px"><tr><td style="padding:0 0 0 16px;font-family:Arial,sans-serif">' +
      '<p style="margin:0 0 16px 0;font-size:15px;color:#374151;line-height:1.7">' + esc(dunSalut) + ',</p>' +
      '<p style="margin:0 0 14px 0;font-size:15px;color:#374151;line-height:1.7">wir erlauben uns, Sie freundlich daran zu erinnern, dass die Zahlung unserer Rechnung Nr. <strong>' + invNum + '</strong> vom ' + issueDate + ' &uuml;ber <strong>' + fmtCur(gross) + '</strong> noch aussteht.</p>' +
      '<p style="margin:0;font-size:15px;color:#374151;line-height:1.7">M&ouml;glicherweise hat sich diese Zahlung mit Ihrer &Uuml;berweisung gekreuzt. In diesem Fall betrachten Sie dieses Schreiben bitte als gegenstandslos.</p>' +
      '</td></tr></table>' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9fafb" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px">' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb">Rechnungsnummer</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:1px solid #e5e7eb">' + invNum + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb">Rechnungsdatum</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:1px solid #e5e7eb">' + issueDate + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb">Urspr&uuml;ngliche F&auml;lligkeit</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:1px solid #e5e7eb">' + dueDate + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb">Offener Betrag</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:15px;font-weight:bold;color:#2E5BA8;border-bottom:1px solid #e5e7eb">' + fmtCur(gross) + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280">Neue Zahlungsfrist</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#dc2626">' + newDue1 + '</td></tr>' +
      '</table>' +
      bankBlock +
      '<p style="font-size:14px;color:#374151;margin:0 0 20px 0;line-height:1.6;font-family:Arial,sans-serif">F&uuml;r R&uuml;ckfragen stehen wir Ihnen gerne zur Verf&uuml;gung.</p>' +
      '<p style="font-size:14px;color:#1f2937;margin:0;font-family:Arial,sans-serif">Mit freundlichen Gr&uuml;&szlig;en<br><strong>' + firma + '</strong></p>';
  } else if (level === 2) {
    var newDue2 = addDaysIso(today, getDunningNewDays(2));
    var fee2 = fees[2];
    var total2 = gross + fee2;
    var r1 = getReminderByLevel(inv, 1);
    var r1part = r1 && r1.date ? 'vom <strong>' + esc(r1.date) + '</strong> ' : '';
    body =
      '<p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.7;font-family:Arial,sans-serif">' + esc(dunSalut) + ',</p>' +
      '<p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.7;font-family:Arial,sans-serif">trotz unserer Zahlungserinnerung ' + r1part + 'haben wir bis heute keinen Zahlungseingang f&uuml;r unsere Rechnung Nr. <strong>' + invNum + '</strong> vom ' + issueDate + ' festgestellt.</p>' +
      '<p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.7;font-family:Arial,sans-serif">Wir fordern Sie hiermit auf, den ausstehenden Betrag zuz&uuml;glich einer Mahngeb&uuml;hr von <strong>' + fmtCur(fee2) + '</strong> innerhalb von ' + getDunningNewDays(2) + ' Tagen zu begleichen.</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9fafb" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px">' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb">Urspr&uuml;nglicher Rechnungsbetrag</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:1px solid #e5e7eb">' + fmtCur(gross) + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:2px solid #d1d5db">Mahngeb&uuml;hr</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:2px solid #d1d5db">' + fmtCur(fee2) + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:11px 16px;font-size:14px;font-weight:bold;color:#374151;border-bottom:1px solid #e5e7eb">Gesamtbetrag</td><td align="right" style="font-family:Arial,sans-serif;padding:11px 16px;font-size:16px;font-weight:bold;color:#dc2626;border-bottom:1px solid #e5e7eb">' + fmtCur(total2) + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280">Zahlungsfrist</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#dc2626">' + newDue2 + '</td></tr>' +
      '</table>' +
      bankBlock +
      '<p style="font-size:14px;color:#374151;margin:0 0 20px 0;line-height:1.6;font-family:Arial,sans-serif">Bitte beachten Sie, dass wir uns bei Nichtzahlung vorbehalten, rechtliche Schritte einzuleiten.</p>' +
      '<p style="font-size:14px;color:#1f2937;margin:0;font-family:Arial,sans-serif">Mit freundlichen Gr&uuml;&szlig;en<br><strong>' + firma + '</strong></p>';
  } else {
    var newDue3 = addDaysIso(today, getDunningNewDays(3));
    var fee2b = fees[2];
    var fee3 = fees[3];
    var total3 = gross + fee2b + fee3;
    body =
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid #DC2626;margin-bottom:24px"><tr><td style="padding:0 0 0 16px;font-family:Arial,sans-serif">' +
      '<p style="margin:0 0 16px 0;font-size:15px;color:#374151;line-height:1.7">' + esc(dunSalut) + ',</p>' +
      '<p style="margin:0 0 14px 0;font-size:15px;color:#374151;line-height:1.7">obwohl wir Sie bereits mehrfach zur Zahlung aufgefordert haben, ist der ausstehende Betrag unserer Rechnung Nr. <strong>' + invNum + '</strong> bis heute nicht eingegangen.</p>' +
      '<p style="margin:0;font-size:15px;color:#374151;line-height:1.7"><strong>Dies ist unsere letzte Zahlungsaufforderung vor der &Uuml;bergabe an ein Inkassounternehmen.</strong></p>' +
      '</td></tr></table>' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FEF2F2" style="background-color:#FEF2F2;border:1px solid #fca5a5;margin-bottom:24px">' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:1px solid #fca5a5">Urspr&uuml;nglicher Rechnungsbetrag</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:1px solid #fca5a5">' + fmtCur(gross) + '</td></tr>' +
      (fee2b > 0 ? '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:1px solid #fca5a5">Mahngeb&uuml;hr Stufe 2</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:1px solid #fca5a5">' + fmtCur(fee2b) + '</td></tr>' : '') +
      (fee3 > 0 ? '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-bottom:2px solid #f87171">Mahngeb&uuml;hr Stufe 3</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;border-bottom:2px solid #f87171">' + fmtCur(fee3) + '</td></tr>' : '') +
      '<tr><td style="font-family:Arial,sans-serif;padding:11px 16px;font-size:15px;font-weight:bold;color:#991b1b;border-bottom:1px solid #fca5a5">Gesamtbetrag</td><td align="right" style="font-family:Arial,sans-serif;padding:11px 16px;font-size:18px;font-weight:bold;color:#dc2626;border-bottom:1px solid #fca5a5">' + fmtCur(total3) + '</td></tr>' +
      '<tr><td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#991b1b">Zahlungsfrist</td><td align="right" style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#dc2626">' + newDue3 + '</td></tr>' +
      '</table>' +
      bankBlock +
      '<p style="font-size:14px;color:#dc2626;margin:0 0 20px 0;line-height:1.6;font-family:Arial,sans-serif">Bei Nichtzahlung bis zum <strong>' + newDue3 + '</strong> werden wir die Forderung ohne weitere Ank&uuml;ndigung an ein Inkassounternehmen &uuml;bergeben. Die dabei entstehenden zus&auml;tzlichen Kosten gehen zu Ihren Lasten.</p>' +
      '<p style="font-size:14px;color:#1f2937;margin:0;font-family:Arial,sans-serif">Mit freundlichen Gr&uuml;&szlig;en<br><strong>' + firma + '</strong></p>';
  }
  return wOpen + body + wClose;
}

async function createDunningNotice(id, level) {
  var inv = invoices.find(function(i) { return i.id === id; });
  if (!inv) { alert('Rechnung nicht gefunden.'); return; }
  level = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  var levelNames = { 1: 'Zahlungserinnerung', 2: '1. Mahnung', 3: 'Letzte Mahnung' };
  if (!await uiConfirm('Mahnung „' + levelNames[level] + '" für Rechnung ' + (inv.number || '-') + ' erstellen und in Outlook öffnen?', 'Mahnung erstellen')) return;
  var to = (inv.customerEmail || getCustomerEmailById(inv.customerId) || '').trim();
  if (!to) { to = await uiPrompt('Keine Kunden-E-Mail gefunden. Bitte E-Mail eingeben:', '', 'E-Mail eingeben', 'kunde@beispiel.de') || ''; }
  to = String(to || '').trim();
  if (!to) { alert('Kein Empfänger angegeben.'); return; }
  await recordDunning(inv, level, 'email');
  var cs = inv.companySnapshot || companyData || {};
  var sender = String(companyData.smtpFrom || companyData.senderEmail || cs.email || '').trim();
  var replyTo = String(companyData.smtpReplyTo || '').trim();
  var invNum = inv.number || '';
  var stufenName = { 1: 'Zahlungserinnerung', 2: '1. Mahnung', 3: 'Letzte Mahnung' };
  var subjectTpl = String(companyData.dunningMailSubject || 'Mahnung Stufe {{stufe}} – Rechnung {{nummer}}');
  var subject = subjectTpl.replace(/\{\{stufe\}\}/g, stufenName[level] || ('Stufe ' + level)).replace(/\{\{nummer\}\}/g, invNum).replace(/\{\{firma\}\}/g, String((inv.companySnapshot || companyData || {}).firma || ''));
  var htmlBody = buildDunningEmailHtml(inv, level);
  if (window.electronAPI && window.electronAPI.runPowerShell) {
    var pdfPath = '';
    var pdfR = await buildDunningPdfDoc(id, level);
    if (pdfR && window.electronAPI.autoSavePdf) {
      try {
        var gdrivePath = String(companyData.googleDrivePath || '').trim();
        var savePayload = { defaultName: pdfR.pdfName, data: pdfR.doc.output('arraybuffer'), subDir: 'Mahnungen' };
        if (gdrivePath) savePayload.overrideSaveDir = gdrivePath.replace(/[\/\\]$/, '') + '/Mahnungen';
        var saved = await window.electronAPI.autoSavePdf(savePayload);
        if (saved && saved.ok) pdfPath = saved.filePath || '';
      } catch (e) {}
    }
    var psTo = to.replace(/'/g, "''");
    var psSender = sender.replace(/'/g, "''");
    var psSubject = subject.replace(/'/g, "''");
    var psPdf = pdfPath ? pdfPath.replace(/\//g, '\\').replace(/'/g, "''") : '';
    var psReplyTo = replyTo.replace(/'/g, "''");
    var psScript =
      "$outlook = New-Object -ComObject Outlook.Application\r\n" +
      "$mail = $outlook.CreateItem(0)\r\n" +
      "$mail.To = '" + psTo + "'\r\n" +
      (psSender ? "$account = $outlook.Session.Accounts | Where-Object { $_.SmtpAddress -eq '" + psSender + "' }\r\nif ($account) { $mail.SendUsingAccount = $account }\r\n" : "") +
      (psReplyTo ? "$replyRec = $mail.ReplyRecipients.Add('" + psReplyTo + "')\r\n$replyRec.Resolve()\r\n" : "") +
      "$mail.Subject = '" + psSubject + "'\r\n" +
      (psPdf ? "try { $null = $mail.Attachments.Add('" + psPdf + "', 1) } catch { Write-Warning \"Anhang-Fehler: $_\" }\r\n" : "") +
      "$mail.HTMLBody = [System.IO.File]::ReadAllText('{{HTML_PATH}}')\r\n" +
      "$mail.Display()";
    var res = await window.electronAPI.runPowerShell({ psScript: psScript, htmlContent: htmlBody });
    if (!res || !res.ok) { alert('Outlook konnte nicht geöffnet werden.\n' + (res && res.error || '') + (res && res.stderr ? '\n\nPowerShell-Fehler:\n' + res.stderr : '')); return; }
  } else {
    openMailClient(to, subject, 'Mahnung für Rechnung ' + invNum + ' – bitte Outlook-Version in der Electron-App verwenden.');
  }
}

async function markInvoicePaidFromDunning(id) {
  var inv = invoices.find(function(i) { return i.id === id; });
  if (!inv) return;
  if (!await uiConfirm('Rechnung ' + (inv.number || '-') + ' als bezahlt markieren?', 'Als bezahlt markieren')) return;
  var oldStatus = inv.status;
  inv.status = 'paid';
  addAuditEntry('Rechnungsstatus geändert', 'Rechnung', inv.number || inv.id, oldStatus + ' → paid (Mahnwesen)');
  await saveData();
  renderDunning();
  renderInvoices();
}

async function buildDunningPdfDoc(id, level) {
  try {
    var inv = invoices.find(function(i) { return i.id === id; });
    if (!inv) { alert('Rechnung nicht gefunden.'); return null; }
    level = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
    var ch = getDunningCharges(inv, level);
    var cs = inv.companySnapshot || companyData || {};
    var cname = cs.firma || 'Werkmeister Pro';
    var cline = [cs.strasse, [cs.plz, cs.ort].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
    if (cs.telefon) cline += (cline ? ' · ' : '') + 'Tel: ' + cs.telefon;
    if (cs.email) cline += (cline ? ' · ' : '') + cs.email;
    var jsPDF = getJsPdfCtor();
    if (!jsPDF) { alert('PDF-Export nicht verfügbar.'); return null; }
    var doc = new jsPDF('p', 'mm', 'a4');
    var W = 210, M = 20, CW = W - 2 * M;
    var y = applyPdfLetterhead(doc, cs, W, M, cname, cline);
    var sender = getSenderAddressLine(cs);
    if (sender) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(sender, M, y);
      y += 6;
    }
    var addrY = y;
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    if (inv.customerSalutation) { doc.text(inv.customerSalutation, M, y); y += 5; }
    if (inv.customerCompany) { doc.setFont('helvetica', 'bold'); doc.text(inv.customerCompany, M, y); doc.setFont('helvetica', 'normal'); y += 5; }
    var dunNm = [inv.customerFirstName, inv.customerLastName].filter(Boolean).join(' ');
    if (dunNm) { doc.text(dunNm, M, y); y += 5; }
    splitAddressLines(inv.customerAddress || '').forEach(function(line) { doc.text(line, M, y); y += 5; });
    doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text('Datum:', M + CW, addrY, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(31, 41, 55);
    doc.text(new Date().toISOString().slice(0, 10), M + CW, addrY + 5, { align: 'right' });
    doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text('Rechnungs-Nr.:', M + CW, addrY + 12, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(31, 41, 55);
    doc.text(inv.number || '-', M + CW, addrY + 17, { align: 'right' });
    doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text('Fällig seit:', M + CW, addrY + 24, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(31, 41, 55);
    doc.text(inv.dueDate || '-', M + CW, addrY + 29, { align: 'right' });
    var pdfNewDue = addDaysIso(new Date().toISOString().slice(0, 10), getDunningNewDays(level));
    doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text('Neue Zahlungsfrist:', M + CW, addrY + 36, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(220, 38, 38);
    doc.text(pdfNewDue, M + CW, addrY + 41, { align: 'right' });
    y = Math.max(y, addrY + 48);
    y += 14;
    var betreffTitle = getDunningLevelName(level);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('Betreff: ' + betreffTitle + ' – Rechnung Nr. ' + (inv.number || '-') + ' vom ' + (inv.issueDate || '-'), M, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    var bodyLines = doc.splitTextToSize(getDunningText(level, inv), CW);
    doc.text(bodyLines, M, y);
    y += bodyLines.length * 5 + 14;
    doc.setDrawColor(229, 231, 235);
    doc.line(M, y, M + CW, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Forderungsaufstellung', M, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('Hauptforderung:', M, y);
    doc.text(fmtCur(ch.base), M + CW, y, { align: 'right' });
    y += 6;
    if (level > 1) {
      doc.text('Mahngebühr (Stufe ' + level + '):', M, y);
      doc.text(fmtCur(ch.fee), M + CW, y, { align: 'right' });
      y += 6;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Gesamtbetrag:', M, y);
    doc.text(fmtCur(level === 1 ? ch.base : ch.base + ch.fee), M + CW, y, { align: 'right' });
    y += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Mit freundlichen Grüßen', M, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(cname, M, y);
    var fy = 280;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(M, fy, M + CW, fy);
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    var footer = getCompanyFooter();
    if (footer.length > 120) { doc.text(footer.substring(0, 120), W / 2, fy + 3.5, { align: 'center' }); doc.text(footer.substring(120), W / 2, fy + 7, { align: 'center' }); }
    else { doc.text(footer, W / 2, fy + 4, { align: 'center' }); }
    var pdfName = (level === 1 ? 'Zahlungserinnerung' : 'Mahnung_' + level) + '_' + (inv.number || id) + '.pdf';
    return { doc: doc, inv: inv, pdfName: pdfName };
  } catch (e) { alert('PDF Export fehlgeschlagen.'); return null; }
}

async function exportDunningPDF(id, level) {
  level = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  if (hasCustomTemplate && hasCustomTemplate('dunning')) {
    var _inv = invoices.find(function(i) { return i.id === id; });
    if (!_inv) { alert('Rechnung nicht gefunden.'); return; }
    var _ch  = getDunningCharges(_inv, level);
    var _extra = {
      level:            level,
      dunningLevelName: getDunningLevelName(level),
      dunningText:      getDunningText(level, _inv),
      fee:     _ch.fee,
      interest: _ch.interest,
      total:   _ch.total,
      days:    _ch.days,
    };
    var _fn = (level === 1 ? 'Zahlungserinnerung' : 'Mahnung_' + level) + '_' + (_inv.number || id) + '.pdf';
    var _ok = await autoSavePdfWithDocTemplate('dunning', _inv, _fn, 'Mahnungen', _extra);
    if (!_ok) await exportPdfWithDocTemplate('dunning', _inv, _fn, _extra);
    return;
  }
  var r = await buildDunningPdfDoc(id, level);
  if (!r) return;
  return await savePdfDocument(r.doc, r.pdfName, { autoSave: true, subDir: 'Mahnungen' });
}
