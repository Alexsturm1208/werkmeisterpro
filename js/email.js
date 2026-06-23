// email.js – SMTP E-Mail-Versand mit Vorschau-Modal
// Enthält: HTML-Vorlagen, Vorschau-Modal, SMTP-Einstellungen, Verbindungstest

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────
function replaceTemplate(txt,map){var s=String(txt||'');Object.keys(map||{}).forEach(function(k){var val=map[k]==null?'':String(map[k]);s=s.split('{{'+k+'}}').join(val)});return s}
function openMailClient(to,subject,body){var q=[];if(subject)q.push('subject='+encodeURIComponent(subject));if(body)q.push('body='+encodeURIComponent(body));var href='mailto:'+(to||'')+(q.length?('?'+q.join('&')):'');if(window.electronAPI&&window.electronAPI.openExternal){window.electronAPI.openExternal(href).catch(function(){});}else{try{window.open(href,'_blank')||window.location.assign(href);}catch(_){window.location.href=href;}}}
function getCustomerEmailById(cid){customers=ensureArray(customers);var c=customers.find(function(x){return x.id===cid});return c&&c.email?String(c.email).trim():''}

// ── Datum-Hilfsfunktion ──────────────────────────────────────────────────────
function addDaysToDate(days){var d=new Date();d.setDate(d.getDate()+(parseInt(days,10)||0));return d.toISOString().slice(0,10)}

// ── HTML-E-Mail-Vorlage: RECHNUNG ────────────────────────────────────────────
function buildInvoiceEmailHtmlNew(d){
  var num=esc(d.number||'');var datum=esc(d.datum||'');var betrag=esc(d.betrag||'');
  var objekt=esc(d.objekt||'');var inhaber=esc(d.inhaber||'');
  var iban=esc(d.iban||'');var bank=esc(d.bank||'');
  var strasse=esc(d.strasse||'');var plz=esc(d.plz||'');var ort=esc(d.ort||'');
  var senderEmail=esc(d.senderEmail||'mail@toms-handwerkerservice.com');
  var cityStr=esc([d.plz,d.ort].filter(Boolean).join(' '));
  var addrStr=esc([d.strasse,[d.plz,d.ort].filter(Boolean).join(' ')].filter(Boolean).join(' · '));
  var bankBlock='';
  if(d.iban){
    bankBlock='<tr><td style="padding:0 0 20px 0"><div style="background:#EEF4FF;border-radius:8px;padding:16px">'
      +'<div style="font-size:10px;font-weight:bold;color:#2E5BA8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;font-family:Arial,sans-serif">Bankverbindung</div>'
      +'<table width="100%" cellpadding="0" cellspacing="0" border="0">'
      +(inhaber?'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;width:140px;font-family:Arial,sans-serif">Kontoinhaber</td><td style="font-size:13px;color:#1f2937;padding:3px 0;font-family:Arial,sans-serif">'+inhaber+'</td></tr>':'')
      +(iban?'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:Arial,sans-serif">IBAN</td><td style="font-size:13px;color:#1f2937;font-family:monospace;padding:3px 0">'+iban+'</td></tr>':'')
      +(bank?'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:Arial,sans-serif">Bank</td><td style="font-size:13px;color:#1f2937;padding:3px 0;font-family:Arial,sans-serif">'+bank+'</td></tr>':'')
      +'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:Arial,sans-serif">Verwendungszweck</td><td style="font-size:13px;color:#1f2937;font-weight:bold;padding:3px 0;font-family:Arial,sans-serif">'+num+'</td></tr>'
      +'</table></div></td></tr>';
  }
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
    +'<body style="margin:0;padding:32px 16px;background:#f3f4f6;font-family:Arial,sans-serif">'
    +'<table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#ffffff;border-radius:8px 8px 0 0;width:600px;max-width:100%">'
    +'<tr><td style="padding:28px">'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0">'
    // 1. Anschreiben blauer linker Rand
    +'<tr><td style="padding:0 0 20px 0">'
    +'<div style="border-left:3px solid #2E5BA8;padding:12px 16px;color:#374151;font-size:14px;line-height:1.7;font-family:Arial,sans-serif">'
    +'Sehr geehrte Damen und Herren,<br><br>'
    +'anbei erhalten Sie unsere Rechnung Nr. <strong>'+num+'</strong> vom '+datum+'.<br>'
    +'Die Rechnung ist als PDF beigef&uuml;gt.'
    +'</div></td></tr>'
    // 2. Grauer Info-Block
    +'<tr><td style="padding:0 0 20px 0">'
    +'<div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px">'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0">'
    +(objekt?'<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Objekt</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+objekt+'</td></tr>':'')
    +'<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Rechnungsdatum</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+datum+'</td></tr>'
    +'<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Zahlungsbedingung</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">Sofort nach Erhalt</td></tr>'
    +'<tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding:0;height:1px"></td></tr>'
    +'<tr><td style="font-size:13px;color:#6b7280;padding:8px 0 4px;font-family:Arial,sans-serif">Gesamtbetrag</td><td align="right" style="font-size:16px;color:#2E5BA8;font-weight:bold;padding:8px 0 4px;font-family:Arial,sans-serif">'+betrag+'</td></tr>'
    +'</table></div></td></tr>'
    // 3. Blauer Bankdaten-Block
    +bankBlock
    // 4. Grußtext
    +'<tr><td style="padding:0 0 20px 0">'
    +'<p style="font-size:12px;color:#5A6A7A;line-height:1.6;margin:0;font-family:Arial,sans-serif">'
    +'Bei Fragen stehen wir Ihnen gerne zur Verf&uuml;gung.<br>'
    +'Wir bedanken uns f&uuml;r Ihren Auftrag und freuen uns auf die weitere Zusammenarbeit.'
    +'</p></td></tr>'
    // 5. Grußformel
    +'<tr><td style="padding:0">'
    +'<p style="margin:0 0 4px 0;font-size:13px;color:#9ca3af;font-family:Arial,sans-serif">Mit freundlichen Gr&uuml;&szlig;en</p>'
    +'<p style="margin:0 0 4px 0;font-size:14px;font-weight:bold;color:#1f2937;font-family:Arial,sans-serif">'+inhaber+'</p>'
    +'<p style="margin:0;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif">Tom&#39;s Handwerkerservice'+(addrStr?' &middot; '+addrStr:'')+'</p>'
    +'</td></tr>'
    +'</table>'
    +'</td></tr>'
    // Footer
    +'<tr><td bgcolor="#1E2A3A" style="background:#1E2A3A;border-radius:0 0 8px 8px;padding:14px 28px">'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    +'<td style="font-size:10px;color:#8AA8CC;font-family:Arial,sans-serif">'+senderEmail+'</td>'
    +'<td align="right" style="font-size:10px;color:#8AA8CC;font-family:Arial,sans-serif">'+cityStr+'</td>'
    +'</tr></table>'
    +'</td></tr>'
    +'</table>'
    +'</body></html>';
}

// ── HTML-E-Mail-Vorlage: MAHNUNG ─────────────────────────────────────────────
function buildDunningEmailHtmlNew(inv,level){
  level=Math.max(1,Math.min(3,parseInt(level,10)||1));
  var cs=inv.companySnapshot||companyData||{};
  var ba=inv.bankAccount||{};
  var inhaber=esc(ba.owner||cs.inhaber||cs.firma||'');
  var iban=esc(ba.iban||'');var bank=esc(ba.bank||'');
  var invNum=esc(inv.number||'');
  var issueDate=esc(inv.issueDate||'');
  var dueDate=esc(inv.dueDate||'');
  var gross=Number(inv.grossTotal||0);
  var betragStr=esc(fmtCur(gross));
  var senderEmail=esc(companyData.smtpFrom||companyData.email||'mail@toms-handwerkerservice.com');
  var inhaberName=esc(cs.inhaber||cs.firma||'');
  var strasse=esc(cs.strasse||'');var plz=esc(cs.plz||'');var ort=esc(cs.ort||'');
  var cityStr=esc([cs.plz,cs.ort].filter(Boolean).join(' '));
  var addrStr=esc([cs.strasse,[cs.plz,cs.ort].filter(Boolean).join(' ')].filter(Boolean).join(' · '));

  // Konfigurierbare Tage
  var newDays=[0,
    parseInt(companyData.dunningNewDays1,10)||14,
    parseInt(companyData.dunningNewDays2,10)||10,
    parseInt(companyData.dunningNewDays3,10)||7];
  var newDue=addDaysToDate(newDays[level]);
  var cfg=typeof getDunningCfg==='function'?getDunningCfg():{fee1:Number(companyData.dunningFee1||5),fee2:Number(companyData.dunningFee2||10),fee3:Number(companyData.dunningFee3||15)};

  // Farben je Stufe
  var borderColor=level===3?'#DC2626':'#2E5BA8';
  var infoBg=level===3?'#FEF2F2':'#f8fafc';
  var infoBorder=level===3?'#FECACA':'#e5e7eb';

  // Info-Block
  var infoRows='';
  if(level===1){
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Rechnungsnummer</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+invNum+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Rechnungsdatum</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+issueDate+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Urspr. F&auml;lligkeit</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+dueDate+'</td></tr>';
    infoRows+='<tr><td colspan="2" style="border-top:1px solid '+infoBorder+';padding:0;height:1px"></td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:8px 0 4px;font-family:Arial,sans-serif">Offener Betrag</td><td align="right" style="font-size:15px;color:#2E5BA8;font-weight:bold;padding:8px 0 4px;font-family:Arial,sans-serif">'+betragStr+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:4px 0;font-family:Arial,sans-serif">Neue Zahlungsfrist</td><td align="right" style="font-size:13px;color:#DC2626;font-weight:bold;padding:4px 0;font-family:Arial,sans-serif">'+esc(newDue)+'</td></tr>';
  } else if(level===2){
    var total2=gross+cfg.fee1;
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Urspr. Rechnungsbetrag</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+betragStr+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Mahngeb&uuml;hr</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+esc(fmtCur(cfg.fee1))+'</td></tr>';
    infoRows+='<tr><td colspan="2" style="border-top:1px solid '+infoBorder+';padding:0;height:1px"></td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:8px 0 4px;font-family:Arial,sans-serif">Gesamtbetrag</td><td align="right" style="font-size:15px;color:#DC2626;font-weight:bold;padding:8px 0 4px;font-family:Arial,sans-serif">'+esc(fmtCur(total2))+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:4px 0;font-family:Arial,sans-serif">Zahlungsfrist</td><td align="right" style="font-size:13px;color:#DC2626;font-weight:bold;padding:4px 0;font-family:Arial,sans-serif">'+esc(newDue)+'</td></tr>';
  } else {
    var total3=gross+cfg.fee1+cfg.fee2;
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Urspr. Rechnungsbetrag</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+betragStr+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Mahngeb&uuml;hr Stufe 2</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+esc(fmtCur(cfg.fee1))+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:Arial,sans-serif">Mahngeb&uuml;hr Stufe 3</td><td align="right" style="font-size:13px;color:#1f2937;padding:6px 0;font-family:Arial,sans-serif">'+esc(fmtCur(cfg.fee2))+'</td></tr>';
    infoRows+='<tr><td colspan="2" style="border-top:1px solid '+infoBorder+';padding:0;height:1px"></td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:8px 0 4px;font-family:Arial,sans-serif">Gesamtbetrag</td><td align="right" style="font-size:16px;color:#DC2626;font-weight:bold;padding:8px 0 4px;font-family:Arial,sans-serif">'+esc(fmtCur(total3))+'</td></tr>';
    infoRows+='<tr><td style="font-size:13px;color:#6b7280;padding:4px 0;font-family:Arial,sans-serif">Zahlungsfrist</td><td align="right" style="font-size:13px;color:#DC2626;font-weight:bold;padding:4px 0;font-family:Arial,sans-serif">'+esc(newDue)+'</td></tr>';
  }

  // Anschreiben je Stufe
  var anschreiben='';
  if(level===1){
    anschreiben='Sehr geehrte Damen und Herren,<br><br>'
      +'wir erlauben uns, Sie freundlich daran zu erinnern, dass die Zahlung unserer Rechnung Nr. <strong>'+invNum+'</strong> vom '+issueDate+' &uuml;ber <strong>'+betragStr+'</strong> noch aussteht.<br><br>'
      +'M&ouml;glicherweise hat sich diese Zahlung mit Ihrer &Uuml;berweisung gekreuzt. In diesem Fall betrachten Sie dieses Schreiben bitte als gegenstandslos.';
  } else if(level===2){
    anschreiben='Sehr geehrte Damen und Herren,<br><br>'
      +'trotz unserer Zahlungserinnerung haben wir bis heute keinen Zahlungseingang f&uuml;r unsere Rechnung Nr. <strong>'+invNum+'</strong> vom '+issueDate+' festgestellt.<br><br>'
      +'Wir fordern Sie hiermit auf, den ausstehenden Betrag zuz&uuml;glich einer Mahngeb&uuml;hr von <strong>'+esc(fmtCur(cfg.fee1))+'</strong> innerhalb von '+newDays[level]+' Tagen zu begleichen.';
  } else {
    anschreiben='Sehr geehrte Damen und Herren,<br><br>'
      +'obwohl wir Sie bereits mehrfach zur Zahlung aufgefordert haben, ist der ausstehende Betrag unserer Rechnung Nr. <strong>'+invNum+'</strong> bis heute nicht eingegangen.<br><br>'
      +'Dies ist unsere letzte Zahlungsaufforderung vor der &Uuml;bergabe an ein Inkassounternehmen.';
  }

  // Grußtext je Stufe
  var grusstext='';
  if(level===1){
    grusstext='F&uuml;r R&uuml;ckfragen stehen wir Ihnen gerne zur Verf&uuml;gung.';
  } else if(level===2){
    grusstext='Bitte beachten Sie, dass wir uns bei Nichtzahlung vorbehalten, rechtliche Schritte einzuleiten.';
  } else {
    grusstext='<span style="color:#DC2626">Bei Nichtzahlung bis zum <strong>'+esc(newDue)+'</strong> werden wir die Forderung ohne weitere Ank&uuml;ndigung an ein Inkassounternehmen &uuml;bergeben. Die dabei entstehenden zus&auml;tzlichen Kosten gehen zu Ihren Lasten.</span>';
  }

  var bankBlock2='';
  if(ba.iban){
    bankBlock2='<tr><td style="padding:0 0 20px 0"><div style="background:#EEF4FF;border-radius:8px;padding:16px">'
      +'<div style="font-size:10px;font-weight:bold;color:#2E5BA8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;font-family:Arial,sans-serif">Bankverbindung</div>'
      +'<table width="100%" cellpadding="0" cellspacing="0" border="0">'
      +(inhaber?'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;width:140px;font-family:Arial,sans-serif">Kontoinhaber</td><td style="font-size:13px;color:#1f2937;padding:3px 0;font-family:Arial,sans-serif">'+inhaber+'</td></tr>':'')
      +(iban?'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:Arial,sans-serif">IBAN</td><td style="font-size:13px;color:#1f2937;font-family:monospace;padding:3px 0">'+iban+'</td></tr>':'')
      +(bank?'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:Arial,sans-serif">Bank</td><td style="font-size:13px;color:#1f2937;padding:3px 0;font-family:Arial,sans-serif">'+bank+'</td></tr>':'')
      +'<tr><td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:Arial,sans-serif">Verwendungszweck</td><td style="font-size:13px;color:#1f2937;font-weight:bold;padding:3px 0;font-family:Arial,sans-serif">'+invNum+'</td></tr>'
      +'</table></div></td></tr>';
  }

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
    +'<body style="margin:0;padding:32px 16px;background:#f3f4f6;font-family:Arial,sans-serif">'
    +'<table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#ffffff;border-radius:8px 8px 0 0;width:600px;max-width:100%">'
    +'<tr><td style="padding:28px">'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0">'
    // Anschreiben
    +'<tr><td style="padding:0 0 20px 0">'
    +'<div style="border-left:3px solid '+borderColor+';padding:12px 16px;color:#374151;font-size:14px;line-height:1.7;font-family:Arial,sans-serif">'+anschreiben+'</div>'
    +'</td></tr>'
    // Info-Block
    +'<tr><td style="padding:0 0 20px 0">'
    +'<div style="background:'+infoBg+';border:1px solid '+infoBorder+';border-radius:8px;padding:16px">'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0">'+infoRows+'</table></div></td></tr>'
    // Bankdaten
    +bankBlock2
    // Grußtext
    +'<tr><td style="padding:0 0 20px 0">'
    +'<p style="font-size:12px;color:#5A6A7A;line-height:1.6;margin:0;font-family:Arial,sans-serif">'+grusstext+'</p>'
    +'</td></tr>'
    // Grußformel
    +'<tr><td style="padding:0">'
    +'<p style="margin:0 0 4px 0;font-size:13px;color:#9ca3af;font-family:Arial,sans-serif">Mit freundlichen Gr&uuml;&szlig;en</p>'
    +'<p style="margin:0 0 4px 0;font-size:14px;font-weight:bold;color:#1f2937;font-family:Arial,sans-serif">'+inhaberName+'</p>'
    +'<p style="margin:0;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif">Tom&#39;s Handwerkerservice'+(addrStr?' &middot; '+addrStr:'')+'</p>'
    +'</td></tr>'
    +'</table>'
    +'</td></tr>'
    +'<tr><td bgcolor="#1E2A3A" style="background:#1E2A3A;border-radius:0 0 8px 8px;padding:14px 28px">'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    +'<td style="font-size:10px;color:#8AA8CC;font-family:Arial,sans-serif">'+senderEmail+'</td>'
    +'<td align="right" style="font-size:10px;color:#8AA8CC;font-family:Arial,sans-serif">'+cityStr+'</td>'
    +'</tr></table>'
    +'</td></tr>'
    +'</table>'
    +'</body></html>';
}

// ── Legacy HTML-E-Mail für Outlook-Fallback ──────────────────────────────────
function buildInvoiceEmailHtml(d){
  var firma=esc(d.firma||'');var invNum=esc(d.number||'');var datum=esc(d.datum||'');var faellig=esc(d.faellig||'');var betrag=esc(d.betrag||'');
  var iban=esc(d.iban||'');var bic=esc(d.bic||'');var bank=esc(d.bank||'');var inhaber=esc(d.inhaber||'');var tel=esc(d.tel||'');
  var addrParts=[];if(d.strasse)addrParts.push(esc(d.strasse||''));var cityPart=[d.plz,d.ort].filter(Boolean).join(' ');if(cityPart)addrParts.push(esc(cityPart));var footerParts=[];if(d.firma)footerParts.push(firma);if(addrParts.length)footerParts.push(addrParts.join(', '));
  var footerLine=footerParts.join(' &middot; ');
  var TD='style="font-family:Arial,sans-serif"';
  var infoRow=function(label,val,last){return'<tr><td '+TD+' style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#6b7280;'+(last?'':' border-bottom:1px solid #e0f2fe;')+'">'+label+'</td><td align="right" '+TD+' style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;font-weight:bold;color:#0c4a6e;'+(last?'':' border-bottom:1px solid #e0f2fe;')+'">'+val+'</td></tr>'};
  var bankRows='';
  if(d.iban){
    if(d.inhaber)bankRows+='<tr><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280;width:140px">Kontoinhaber</td><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">'+inhaber+'</td></tr>';
    if(d.bank)bankRows+='<tr><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">Bank</td><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">'+bank+'</td></tr>';
    bankRows+='<tr><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">IBAN</td><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">'+iban+'</td></tr>';
    if(d.bic)bankRows+='<tr><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">BIC</td><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#1f2937">'+bic+'</td></tr>';
    bankRows+='<tr><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;color:#6b7280">Verwendungszweck</td><td '+TD+' style="font-family:Arial,sans-serif;padding:5px 0;font-size:13px;font-weight:bold;color:#0891b2">'+invNum+'</td></tr>';
  }
  return '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    +'<head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>'
    +'<body style="margin:0;padding:0;background-color:#f3f4f6">'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6"><tr><td align="center" style="padding:32px 16px">'
    +'<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color:#ffffff;width:600px">'
    +'<tr><td bgcolor="#0891b2" style="background-color:#0891b2;padding:28px 32px"><p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif">Rechnung '+invNum+'</p></td></tr>'
    +'<tr><td style="padding:32px;font-family:Arial,sans-serif">'
    +'<p style="margin:0 0 22px 0;font-size:15px;color:#374151;line-height:1.6;font-family:Arial,sans-serif">'+esc(d.salutation||'Sehr geehrte Damen und Herren')+',<br><br>anbei erhalten Sie unsere Rechnung <strong>'+invNum+'</strong> vom '+datum+'.<br>Im Anhang finden Sie die Rechnung als PDF-Datei.</p>'
    +'<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f9ff" style="background-color:#f0f9ff;border:1px solid #bae6fd;margin-bottom:24px">'
    +infoRow('Rechnungsnummer',invNum)+infoRow('Rechnungsdatum',datum)+infoRow('F&auml;llig am',faellig)+infoRow('Betrag','<span style="font-size:15px">'+betrag+'</span>',true)
    +'</table>'
    +(d.iban?'<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9fafb" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px"><tr><td colspan="2" style="padding:14px 16px 6px;font-size:12px;font-weight:bold;color:#0891b2;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.05em">Bankverbindung</td></tr>'+bankRows.replace(/<tr>/g,'<tr><td width="16" style="padding:0 0 0 16px"></td>').replace(/<\/tr>/g,'<td width="16"></td></tr>')+'<tr><td height="10"></td></tr></table>':'')
    +'<p style="font-size:13px;color:#4b5563;margin:0 0 20px 0;line-height:1.6;font-family:Arial,sans-serif">Bei Fragen zu dieser Rechnung stehen wir Ihnen gerne zur Verf&uuml;gung.'+(tel?' Tel: '+tel+'.':'')+' Bitte &uuml;berweisen Sie den Betrag bis zum angegebenen F&auml;lligkeitsdatum.</p>'
    +'<p style="font-size:14px;color:#1f2937;margin:0;font-family:Arial,sans-serif">Mit freundlichen Gr&uuml;&szlig;en<br><strong>'+firma+'</strong></p>'
    +'</td></tr>'
    +'<tr><td bgcolor="#f9fafb" style="background-color:#f9fafb;border-top:2px solid #e5e7eb;padding:14px 32px;font-size:11px;color:#9ca3af;text-align:center;font-family:Arial,sans-serif">'+footerLine+'</td></tr>'
    +'</table>'
    +'</td></tr></table>'
    +'</body></html>';
}

// ── SMTP-Einstellungen ───────────────────────────────────────────────────────
function isSmtpConfigured(){
  return !!(companyData.smtpServer&&companyData.smtpUser&&companyData.smtpPasswordEncrypted);
}

function loadSmtpSettingsToForm(){
  var s=document.getElementById('smtpServer');
  var p=document.getElementById('smtpPort');
  var sl=document.getElementById('smtpSsl');
  var fn=document.getElementById('smtpFromName');
  var f=document.getElementById('smtpFrom');
  var r=document.getElementById('smtpReplyTo');
  var u=document.getElementById('smtpUser');
  var pw=document.getElementById('smtpPassword');
  var hint=document.getElementById('smtpPasswordHint');
  if(s)s.value=companyData.smtpServer||'';
  if(p)p.value=String(companyData.smtpPort||587);
  if(sl)sl.checked=companyData.smtpSsl===true;
  if(fn)fn.value=companyData.smtpFromName||'';
  if(f)f.value=companyData.smtpFrom||'';
  if(r)r.value=companyData.smtpReplyTo||'';
  if(u)u.value=companyData.smtpUser||'';
  if(pw)pw.value='';
  if(hint){
    hint.classList.toggle('hidden',!companyData.smtpPasswordEncrypted);
    var disp=document.getElementById('smtpStoredPwDisplay');
    if(disp){disp.classList.add('hidden');disp.textContent='';}
  }
}

async function saveSmtpSettings(e){
  if(e)e.preventDefault();
  var s=document.getElementById('smtpServer');
  var p=document.getElementById('smtpPort');
  var sl=document.getElementById('smtpSsl');
  var f=document.getElementById('smtpFrom');
  var u=document.getElementById('smtpUser');
  var pw=document.getElementById('smtpPassword');
  var msg=document.getElementById('smtpSaveMsg');
  companyData.smtpServer=(s?s.value.trim():'');
  companyData.smtpPort=parseInt(p?p.value:587,10)||587;
  companyData.smtpSsl=sl?sl.checked:false;
  companyData.smtpFromName=(document.getElementById('smtpFromName')?document.getElementById('smtpFromName').value.trim():'');
  companyData.smtpFrom=(f?f.value.trim():'');
  companyData.smtpReplyTo=(document.getElementById('smtpReplyTo')?document.getElementById('smtpReplyTo').value.trim():'');
  companyData.smtpUser=(u?u.value.trim():'');
  var newPw=String(pw?pw.value:'').trim();
  if(newPw&&window.electronAPI&&window.electronAPI.encryptValue){
    var enc=await window.electronAPI.encryptValue(newPw);
    if(enc)companyData.smtpPasswordEncrypted=enc;
  }
  if(pw)pw.value='';
  var hint=document.getElementById('smtpPasswordHint');
  if(hint){
    hint.classList.toggle('hidden',!companyData.smtpPasswordEncrypted);
    var disp2=document.getElementById('smtpStoredPwDisplay');
    if(disp2){disp2.classList.add('hidden');disp2.textContent='';}
  }
  await saveData();
  if(msg){msg.classList.remove('hidden');setTimeout(function(){msg.classList.add('hidden')},1800)}
}

async function showStoredSmtpPassword(){
  var box=document.getElementById('smtpStoredPwDisplay');
  if(!box)return;
  if(!box.classList.contains('hidden')){box.classList.add('hidden');box.textContent='';return}
  if(!companyData.smtpPasswordEncrypted){box.textContent='(kein Passwort gespeichert)';box.classList.remove('hidden');return}
  if(!window.electronAPI||!window.electronAPI.decryptValue){box.textContent='(Entschlüsselung nicht verfügbar)';box.classList.remove('hidden');return}
  var pw=await window.electronAPI.decryptValue(companyData.smtpPasswordEncrypted);
  box.textContent=pw||'(Entschlüsselung fehlgeschlagen)';
  box.classList.remove('hidden');
  setTimeout(function(){box.classList.add('hidden');box.textContent=''},10000);
}

function toggleSmtpPasswordVisibility(){
  var pw=document.getElementById('smtpPassword');
  var btn=document.getElementById('smtpPasswordToggle');
  if(!pw)return;
  pw.type=pw.type==='password'?'text':'password';
  if(btn)btn.textContent=pw.type==='password'?'👁':'👁‍🗨';
}

// ── Verbindung testen ────────────────────────────────────────────────────────
async function testSmtpConnection(){
  if(!window.electronAPI||!window.electronAPI.testSmtpConnection){
    alert('SMTP-Test nicht verfügbar (kein Electron-Kontext).');return;
  }
  var btn=document.getElementById('smtpTestBtn');
  var resultEl=document.getElementById('smtpTestResult');
  if(btn){btn.disabled=true;btn.textContent='⏳ Teste...';}
  if(resultEl){resultEl.classList.add('hidden');resultEl.textContent='';}
  var pw='';
  if(companyData.smtpPasswordEncrypted&&window.electronAPI.decryptValue){
    pw=await window.electronAPI.decryptValue(companyData.smtpPasswordEncrypted)||'';
  }
  var result=await window.electronAPI.testSmtpConnection({
    smtp:    companyData.smtpServer||'',
    port:    companyData.smtpPort||465,
    secure:  companyData.smtpSsl!==false,
    user:    companyData.smtpUser||'',
    password:pw,
  });
  if(btn){btn.disabled=false;btn.textContent='🔌 Verbindung testen';}
  if(!resultEl)return;
  resultEl.style.whiteSpace='pre-wrap';
  if(result&&result.ok){
    resultEl.textContent='✅ Verbindung erfolgreich! Server erreichbar und Login OK.';
    resultEl.style.color='#16a34a';
  } else {
    var errMsg=String((result&&result.error)||'Unbekannter Fehler');
    var debugInfo=String((result&&result.debug)||'');
    resultEl.textContent='❌ Verbindung fehlgeschlagen:\n'+errMsg+(debugInfo?'\n\nSMTP-Log:\n'+debugInfo:'');
    resultEl.style.color='#dc2626';
  }
  resultEl.classList.remove('hidden');
}

// ── E-Mail-Vorschau-Modal: Zustand ───────────────────────────────────────────
var _emailPreviewState={type:'',htmlBody:'',pdfPath:'',pdfName:'',invoiceId:null,defaultTo:'',defaultSubject:'',isTest:false};
var _COPY_PREF_KEY='wm_email_copy_to_self';

function openEmailPreviewModalUI(){
  var state=_emailPreviewState;
  var modal=document.getElementById('emailPreviewModal');
  if(!modal)return;
  // Felder befüllen
  var toEl=document.getElementById('emailPreviewTo');
  var fromEl=document.getElementById('emailPreviewFrom');
  var copyEl=document.getElementById('emailPreviewCopy');
  var copyEmailEl=document.getElementById('emailPreviewCopyEmail');
  var copyWarnEl=document.getElementById('emailPreviewCopyWarning');
  var subjEl=document.getElementById('emailPreviewSubject');
  var attachRow=document.getElementById('emailPreviewAttachmentRow');
  var attachName=document.getElementById('emailPreviewAttachmentName');
  var iframeEl=document.getElementById('emailPreviewIframe');
  var errEl=document.getElementById('emailPreviewError');
  var sendBtn=document.getElementById('emailPreviewSendBtn');
  var toWarnEl=document.getElementById('emailPreviewToWarning');
  if(toEl){
    toEl.value=state.defaultTo||'';
    if(toWarnEl)toWarnEl.classList.toggle('hidden',!!(state.defaultTo));
  }
  if(fromEl)fromEl.value=companyData.smtpFrom||companyData.smtpUser||'';
  // CC-Checkbox
  var ccEmail=String(companyData.email||'').trim();
  var savedCopy=localStorage.getItem(_COPY_PREF_KEY);
  if(copyEl){
    copyEl.checked=ccEmail?(savedCopy!=='false'):false;
    copyEl.disabled=!ccEmail;
  }
  if(copyEmailEl)copyEmailEl.textContent=ccEmail||'';
  if(copyWarnEl)copyWarnEl.classList.toggle('hidden',!!ccEmail);
  if(subjEl)subjEl.value=state.defaultSubject||'';
  // Anhang
  if(attachRow&&attachName){
    if(state.pdfPath&&!state.isTest){
      attachRow.classList.remove('hidden');
      attachName.textContent=state.pdfName||'Anhang.pdf';
    } else {
      attachRow.classList.add('hidden');
    }
  }
  // iframe Vorschau
  if(iframeEl){
    iframeEl.srcdoc=state.htmlBody||'<p>Keine Vorschau verfügbar</p>';
  }
  if(errEl)errEl.classList.add('hidden');
  if(sendBtn){sendBtn.disabled=false;sendBtn.textContent='✉ Jetzt senden';}
  modal.classList.add('active');
}

function closeEmailPreviewModal(){
  var modal=document.getElementById('emailPreviewModal');
  if(modal)modal.classList.remove('active');
  _emailPreviewState={type:'',htmlBody:'',pdfPath:'',pdfName:'',invoiceId:null,defaultTo:'',defaultSubject:'',isTest:false};
}

function saveEmailCopyPref(){
  var el=document.getElementById('emailPreviewCopy');
  if(el)try{localStorage.setItem(_COPY_PREF_KEY,String(el.checked))}catch(_){}
}

// ── Senden aus Modal ─────────────────────────────────────────────────────────
async function sendEmailFromPreviewModal(){
  if(!window.electronAPI||!window.electronAPI.sendEmail){
    alert('SMTP-Versand nicht verfügbar.');return;
  }
  var toEl=document.getElementById('emailPreviewTo');
  var subjEl=document.getElementById('emailPreviewSubject');
  var copyEl=document.getElementById('emailPreviewCopy');
  var sendBtn=document.getElementById('emailPreviewSendBtn');
  var errEl=document.getElementById('emailPreviewError');
  var to=String(toEl?toEl.value:'').trim();
  var subject=String(subjEl?subjEl.value:'').trim();
  var copyChecked=copyEl?copyEl.checked:false;
  if(!to){
    if(errEl){errEl.textContent='Bitte eine Empfänger-E-Mail-Adresse eingeben.';errEl.classList.remove('hidden');}
    return;
  }
  if(sendBtn){sendBtn.disabled=true;sendBtn.innerHTML='<span style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:wmSpin 0.7s linear infinite;vertical-align:middle;margin-right:6px"></span>Wird gesendet...';}
  if(errEl)errEl.classList.add('hidden');
  // Passwort entschlüsseln
  var pw='';
  if(companyData.smtpPasswordEncrypted&&window.electronAPI.decryptValue){
    pw=await window.electronAPI.decryptValue(companyData.smtpPasswordEncrypted)||'';
  }
  if(!pw){
    if(errEl){errEl.textContent='Kein SMTP-Passwort hinterlegt. Bitte in den E-Mail-Einstellungen speichern.';errEl.classList.remove('hidden');}
    if(sendBtn){sendBtn.disabled=false;sendBtn.textContent='✉ Jetzt senden';}
    return;
  }
  var fromAddr=companyData.smtpFrom||companyData.smtpUser||'';
  var fromName=companyData.smtpFromName||'';
  var fromFull=fromName?'"'+fromName.replace(/"/g,'\\"')+'" <'+fromAddr+'>':fromAddr;
  var opts={
    smtp:companyData.smtpServer||'',
    port:companyData.smtpPort||587,
    secure:companyData.smtpSsl===true,
    user:companyData.smtpUser||'',
    password:pw,
    from:fromFull,
    replyTo:companyData.smtpReplyTo||'',
    to:to,
    subject:subject,
    html:_emailPreviewState.htmlBody||'',
  };
  var ccEmail=String(companyData.email||'').trim();
  if(copyChecked&&ccEmail)opts.cc=ccEmail;
  if(_emailPreviewState.pdfPath&&!_emailPreviewState.isTest){
    opts.attachments=[{filename:_emailPreviewState.pdfName||'Anhang.pdf',path:_emailPreviewState.pdfPath}];
  }
  var result=await window.electronAPI.sendEmail(opts);
  if(result&&result.ok){
    // State sichern bevor Modal schließt
    var _invId=_emailPreviewState.invoiceId;
    var _hadEmail=_emailPreviewState._hadCustomerEmail;
    var _isDunning=_emailPreviewState.type==='dunning';
    var _dunLvl=_emailPreviewState.dunningLevel;
    // Mahnung nach erfolgreichem Versand erfassen
    if(_isDunning&&_dunLvl&&typeof recordDunning==='function'){
      var dInv=invoices.find(function(i){return i.id===_invId});
      if(dInv)await recordDunning(dInv,_dunLvl,'email');
    }
    closeEmailPreviewModal();
    showDriveToast('✅ E-Mail gesendet an '+to);
    // Falls Kunden-E-Mail leer war und wir eine eingegeben haben → fragen ob speichern
    if(_invId&&!_hadEmail&&to){
      var sentInv=invoices.find(function(i){return i.id===_invId});
      if(sentInv){
        var save=await uiConfirm('E-Mail-Adresse beim Kunden speichern?\n'+to,'E-Mail speichern');
        if(save){
          sentInv.customerEmail=to;
          var cust=customers.find(function(c){return c.id===sentInv.customerId});
          if(cust)cust.email=to;
          await saveData();
        }
      }
    }
  } else {
    var errMsg=String((result&&result.error)||'Unbekannter Fehler');
    var errHint='';
    if(errMsg.indexOf('ENOTFOUND')!==-1)errHint=' → SMTP-Server nicht erreichbar. Bitte SMTP-Server in den Einstellungen prüfen (z.B. mail.dogado.de statt smtp.dogado.de).';
    else if(errMsg.indexOf('ECONNREFUSED')!==-1)errHint=' → Verbindung abgelehnt. Port oder SSL-Einstellung prüfen.';
    else if(errMsg.indexOf('AUTH')!==-1||errMsg.indexOf('535')!==-1)errHint=' → Authentifizierung fehlgeschlagen. Benutzername/Passwort prüfen.';
    else if(errMsg.indexOf('ETIMEDOUT')!==-1)errHint=' → Verbindungs-Timeout. Server oder Firewall prüfen.';
    var debugInfo=String((result&&result.debug)||'');
    var debugSuffix=debugInfo?'\nDebug: '+debugInfo:'';
    if(errEl){errEl.style.whiteSpace='pre-wrap';errEl.textContent='❌ Fehler beim Senden: '+errMsg+errHint+debugSuffix;errEl.classList.remove('hidden');}
    if(sendBtn){sendBtn.disabled=false;sendBtn.textContent='✉ Jetzt senden';}
  }
}

// ── Rechnung per E-Mail senden (öffnet Outlook mit HTML-Vorlage + PDF-Anhang) ──
async function sendInvoiceEmail(id){
  invoices=ensureArray(invoices);
  var inv=invoices.find(function(i){return i.id===id});
  if(!inv){alert('Rechnung nicht gefunden.');return}
  if(inv.status==='draft'){alert('Bitte Rechnung zuerst finalisieren.');return}
  var to=(inv.customerEmail||getCustomerEmailById(inv.customerId)||'').trim();
  if(!to){to=await uiPrompt('Keine Kunden-E-Mail gefunden. Bitte E-Mail eingeben:','','E-Mail eingeben','kunde@beispiel.de')||''}
  to=String(to||'').trim();
  if(!to){alert('Kein Empfänger angegeben.');return}
  var cs=inv.companySnapshot||companyData||{};
  var ba=inv.bankAccount||{};
  var firma=String(cs.firma||'Werkmeister Pro');
  var map={nummer:inv.number||'',kunde:inv.customerName||'',betrag:fmtCur(inv.grossTotal||0),datum:inv.issueDate||'',faellig:(inv.dueDate==='sofort'?'Sofort':inv.dueDate||''),firma:firma};
  var subject=replaceTemplate(companyData.invoiceMailSubject||'Rechnung {{nummer}} von {{firma}}',map);
  // HTML-Vorlage aufbauen
  var d={number:inv.number||'',datum:inv.issueDate||'',faellig:(inv.dueDate==='sofort'?'Sofort':inv.dueDate||''),betrag:fmtCur(inv.grossTotal||0),objekt:inv.object||'',inhaber:String(ba.owner||cs.inhaber||cs.firma||''),iban:ba.iban||'',bank:ba.bank||'',strasse:cs.strasse||'',plz:cs.plz||'',ort:cs.ort||'',senderEmail:companyData.smtpFrom||companyData.email||''};
  var htmlBody=buildInvoiceEmailHtmlNew(d);
  // PDF erzeugen und auto-speichern
  var pdfPath='';
  try{
    var r=await buildInvoicePdfDoc(id);
    if(r){
      var pdfName='Rechnung_'+r.inv.number+'.pdf';
      var gdrivePath=String(companyData.googleDrivePath||'').trim();
      var sp={defaultName:pdfName,data:r.doc.output('arraybuffer')};
      if(gdrivePath)sp.overrideSaveDir=gdrivePath.replace(/[\/\\]$/,'')+'/Rechnungen';
      var saved=await window.electronAPI.autoSavePdf(sp);
      if(saved&&saved.ok)pdfPath=saved.filePath||'';
    }
  }catch(e){console.warn('PDF Fehler:',e)}
  // Outlook via PowerShell COM öffnen (HTML-Body + PDF-Anhang)
  if(window.electronAPI&&window.electronAPI.runPowerShell){
    var escPs=function(s){return String(s||'').replace(/`/g,'``').replace(/"/g,'`"').replace(/\$/g,'`$');};
    var attachLine=pdfPath?('$mail.Attachments.Add(\''+pdfPath.replace(/'/g,"''")+'\')' ):'';
    var psScript='$html = [System.IO.File]::ReadAllText("{{HTML_PATH}}", [System.Text.Encoding]::UTF8)\r\n'
      +'try {\r\n'
      +'  $outlook = New-Object -ComObject Outlook.Application\r\n'
      +'  $mail = $outlook.CreateItem(0)\r\n'
      +'  $mail.To = "'+escPs(to)+'"\r\n'
      +'  $mail.Subject = "'+escPs(subject)+'"\r\n'
      +'  $mail.HTMLBody = $html\r\n'
      +(attachLine?'  '+attachLine+'\r\n':'')
      +'  $mail.Display()\r\n'
      +'} catch {\r\n'
      +'  Write-Error $_.Exception.Message\r\n'
      +'}\r\n';
    var result=await window.electronAPI.runPowerShell({psScript:psScript,htmlContent:htmlBody});
    if(result&&result.ok)return;
    console.warn('Outlook COM fehlgeschlagen:',result&&result.error,result&&result.stderr);
  }
  // Fallback: mailto: (kein HTML, kein Anhang)
  openMailClient(to,subject,'');
}

// ── Rechnung per SMTP senden (Vorschau-Modal) ─────────────────────────────────
async function sendInvoiceEmailSmtp(id){
  invoices=ensureArray(invoices);
  var inv=invoices.find(function(i){return i.id===id});
  if(!inv){alert('Rechnung nicht gefunden.');return}
  if(inv.status==='draft'){alert('Bitte Rechnung zuerst finalisieren.');return}
  if(!isSmtpConfigured()){alert('SMTP ist nicht konfiguriert. Bitte zuerst die E-Mail-Einstellungen unter Einstellungen → E-Mail einrichten.');return}
  await openEmailPreviewModal('invoice',id,{});
}

// ── Hauptfunktion: E-Mail-Vorschau öffnen ────────────────────────────────────
async function openEmailPreviewModal(type,id,opts){
  opts=opts||{};
  var inv=invoices.find(function(i){return i.id===id});
  if(!inv){alert('Dokument nicht gefunden.');return}
  var cs=inv.companySnapshot||companyData||{};
  var ba=inv.bankAccount||{};
  var firma=String(cs.firma||'Tom\'s Handwerkerservice');
  var toEmail=String(inv.customerEmail||getCustomerEmailById(inv.customerId)||'').trim();
  var hadCustomerEmail=!!toEmail;
  var number=String(inv.number||'');
  var gdrivePath=String(companyData.googleDrivePath||'').trim();
  // Betreff je Typ
  var subject='';
  if(type==='invoice'){
    subject='Rechnung '+number+' – '+firma;
  } else if(type==='dunning'){
    var level=parseInt(opts.level,10)||1;
    if(level===1)subject='Zahlungserinnerung – Rechnung '+number+' – '+firma;
    else if(level===2)subject='1. Mahnung – Rechnung '+number+' – '+firma;
    else subject='Letzte Mahnung – Rechnung '+number+' – Drohende Inkassoübergabe';
  }
  // HTML-Body erstellen
  var htmlBody='';
  var pdfPath='';
  var pdfName='';
  if(type==='invoice'){
    var d={
      number:inv.number||'',datum:inv.issueDate||'',faellig:(inv.dueDate==='sofort'?'Sofort':inv.dueDate||''),
      betrag:fmtCur(inv.grossTotal||0),objekt:inv.object||'',
      inhaber:esc(ba.owner||cs.inhaber||cs.firma||''),iban:ba.iban||'',bank:ba.bank||'',
      strasse:cs.strasse||'',plz:cs.plz||'',ort:cs.ort||'',
      senderEmail:companyData.smtpFrom||companyData.email||''
    };
    htmlBody=buildInvoiceEmailHtmlNew(d);
    // PDF erzeugen
    try{
      var r=await buildInvoicePdfDoc(id);
      if(r){
        pdfName='Rechnung_'+r.inv.number+'.pdf';
        var savePayload={defaultName:pdfName,data:r.doc.output('arraybuffer')};
        if(gdrivePath)savePayload.overrideSaveDir=gdrivePath.replace(/[\/\\]$/,'')+'/Rechnungen';
        var saved=await window.electronAPI.autoSavePdf(savePayload);
        if(saved&&saved.ok)pdfPath=saved.filePath||'';
      }
    }catch(e){console.warn('PDF Fehler:',e)}
  } else if(type==='dunning'){
    var lvl=parseInt(opts.level,10)||1;
    htmlBody=buildDunningEmailHtmlNew(inv,lvl);
    // PDF erzeugen
    try{
      var pdfR=typeof buildDunningPdfDoc==='function'?await buildDunningPdfDoc(id,lvl):null;
      if(pdfR){
        pdfName=pdfR.pdfName||('Mahnung_'+number+'_Stufe'+lvl+'.pdf');
        var dSavePayload={defaultName:pdfName,data:pdfR.doc.output('arraybuffer'),subDir:'Mahnungen'};
        if(gdrivePath)dSavePayload.overrideSaveDir=gdrivePath.replace(/[\/\\]$/,'')+'/Mahnungen';
        var dSaved=await window.electronAPI.autoSavePdf(dSavePayload);
        if(dSaved&&dSaved.ok)pdfPath=dSaved.filePath||'';
      }
    }catch(e){console.warn('Mahnung PDF Fehler:',e)}
  }
  _emailPreviewState={
    type:type,htmlBody:htmlBody,pdfPath:pdfPath,pdfName:pdfName,
    invoiceId:id,defaultTo:toEmail,defaultSubject:subject,
    isTest:false,_hadCustomerEmail:hadCustomerEmail,
    dunningLevel:(type==='dunning'?parseInt(opts&&opts.level,10)||1:0)
  };
  openEmailPreviewModalUI();
}

// ── Angebote per E-Mail (bestehende Funktion) ─────────────────────────────────
async function sendOfferEmail(id){
  offers=ensureArray(offers);
  var off=offers.find(function(o){return o.id===id});
  if(!off){alert('Angebot nicht gefunden.');return}
  var to=getCustomerEmailById(off.customerId)||'';
  if(!to){to=await uiPrompt('Keine Kunden-E-Mail gefunden. Bitte E-Mail eingeben:','','E-Mail eingeben','kunde@beispiel.de')||''}
  to=String(to||'').trim();
  if(!to){alert('Kein Empfänger angegeben.');return}
  var no=getOfferNumber(off);
  var dt=new Date(off.createdAt||Date.now()).toISOString().slice(0,10);
  var gross=calcTotal(off)*(1+(companyData.kleinunternehmer?0:(companyData.defaultVat||0.19)));
  var subjTpl=companyData.offerMailSubject||'Angebot {{nummer}} von {{firma}}';
  var bodyTpl=companyData.offerMailBody||'Guten Tag,\n\nanbei erhalten Sie unser Angebot {{nummer}} vom {{datum}}.\nGesamtsumme: {{betrag}}.\n\nMit freundlichen Grussen\n{{firma}}';
  var map={nummer:no,kunde:off.customer||'',betrag:fmtCur(gross),datum:dt,faellig:'',firma:(companyData.firma||'Werkmeister Pro')};
  openMailClient(to,replaceTemplate(subjTpl,map),replaceTemplate(bodyTpl,map)+'\n\nHinweis: PDF in der App über den PDF-Button exportieren und anhängen.');
}
