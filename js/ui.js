function toggleKleinunternehmer(){var ku=!!document.getElementById('compKleinunternehmer').checked;var hint=document.getElementById('compKleinunternehmerHint');if(hint)hint.textContent=ku?'Kleinunternehmer aktiv: Es wird keine MwSt. ausgewiesen.':'Wenn aktiv, wird keine MwSt. auf Rechnungen ausgewiesen.'}
function renderCompanyLogoPreview(){var img=document.getElementById('compLogoPreview');var btn=document.getElementById('compLogoClearBtn');if(!img||!btn)return;var src=(companyData&&companyData.logoDataUrl)||'';if(src){img.src=src;img.classList.remove('hidden');btn.classList.remove('hidden')}else{img.removeAttribute('src');img.classList.add('hidden');btn.classList.add('hidden')}}
function applySidebarBrandLogoSource(){var el=document.getElementById('sidebarBrandLogoImg');if(!el)return;var src=(companyData&&companyData.logoDataUrl)?String(companyData.logoDataUrl):'';if(src){el.onerror=null;el.src=src}else{setImageWithFallback(el,APP_LOGO_MENU_CANDIDATES)}}
function handleCompanyLogoUpload(e){var f=e&&e.target&&e.target.files&&e.target.files[0]?e.target.files[0]:null;if(!f)return;if(!/^image\//i.test(f.type)){alert('Bitte eine Bilddatei auswählen (PNG/JPG/WEBP).');return}if(f.size>2*1024*1024){alert('Das Logo ist zu groß (max. 2 MB).');return}var r=new FileReader();r.onload=function(ev){companyData.logoDataUrl=String((ev&&ev.target&&ev.target.result)||'');renderCompanyLogoPreview();try{applyLogoColorsToLetterTheme(false)}catch(_){}renderLetterheadPreview();try{applyStaticLogoSources();applySidebarBrandLogoSource()}catch(e){}};r.readAsDataURL(f)}
function clearCompanyLogo(){companyData.logoDataUrl='';var inp=document.getElementById('compLogoFile');if(inp)inp.value='';renderCompanyLogoPreview();renderLetterheadPreview();try{applyStaticLogoSources();applySidebarBrandLogoSource()}catch(e){}}
function updateLetterheadPdfUi(){var info=document.getElementById('compLetterPdfInfo');var btn=document.getElementById('compLetterPdfClearBtn');if(info)info.textContent=companyData.letterheadPdfName?('Aktiv: '+companyData.letterheadPdfName):'Kein PDF ausgewählt.';if(btn)btn.classList.toggle('hidden',!companyData.letterheadPdfImageDataUrl)}
async function handleLetterheadPdfUpload(e){var f=e&&e.target&&e.target.files&&e.target.files[0]?e.target.files[0]:null;if(!f)return;if(!(String(f.type||'').toLowerCase()==='application/pdf'||/\.pdf$/i.test(f.name||''))){alert('Bitte eine PDF-Datei auswählen.');return}if(f.size>8*1024*1024){alert('Die PDF ist zu groß (max. 8 MB).');return}var ok=false;try{ok=window.__ensurePdfJs?await window.__ensurePdfJs():false}catch(_){ok=false}if(!ok||!window.pdfjsLib||!window.pdfjsLib.getDocument){var det='';try{det=String(window.__pdfJsLastError||'').trim()}catch(_){}var msg='PDF Import nicht verfügbar.\nBitte einmal im Ordner \"werkmeister-pro\" \"npm install\" ausführen\n(pdfjs-dist), danach App neu starten.'+(det?('\n\nDetails: '+det):'');alert(msg);return}
try{var buf=await f.arrayBuffer();var pdf=await pdfjsLib.getDocument({data:buf}).promise;var page=await pdf.getPage(1);var viewport=page.getViewport({scale:2});var canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);var ctx=canvas.getContext('2d');await page.render({canvasContext:ctx,viewport:viewport}).promise;companyData.letterheadPdfImageDataUrl=canvas.toDataURL('image/png');companyData.letterheadPdfName=String(f.name||'Briefkopf.pdf');updateLetterheadPdfUi();renderLetterheadPreview()}catch(err){console.error(err);alert('PDF konnte nicht verarbeitet werden.')}
}
function clearLetterheadPdf(){companyData.letterheadPdfImageDataUrl='';companyData.letterheadPdfName='';var inp=document.getElementById('compLetterPdfFile');if(inp)inp.value='';updateLetterheadPdfUi();renderLetterheadPreview()}
function getPdfLogoSource(cs){var src=(cs&&cs.logoDataUrl)||companyData.logoDataUrl||LOGO_DATA_SM;var fmt='PNG';var m=String(src).match(/^data:image\/(png|jpe?g|webp)/i);if(m&&m[1]&&m[1].toLowerCase().indexOf('jp')===0)fmt='JPEG';return{src:src,fmt:fmt}}
function drawPdfLogo(doc,cs,x,y,w,h){var lg=getPdfLogoSource(cs);try{doc.addImage(lg.src,lg.fmt,x,y,w,h)}catch(e){try{doc.addImage(LOGO_DATA_SM,'PNG',x,y,w,h)}catch(_){}}}
function getOpenAiApiKey(){try{return String(localStorage.getItem('wm_openai_api_key')||'')}catch(_){return''}}
function setOpenAiApiKey(key){try{localStorage.setItem('wm_openai_api_key',String(key||''))}catch(_){}}
function applyCompanySettingsToForm(){var legacyKey=String((companyData&&companyData.aiApiKey)||'').trim();var localKey=String(getOpenAiApiKey()||'').trim();if(legacyKey&&!localKey){setOpenAiApiKey(legacyKey);localKey=legacyKey}if(companyData&&companyData.aiApiKey!==undefined)delete companyData.aiApiKey;document.getElementById('compFirma').value=companyData.firma||'';document.getElementById('compRechtsform').value=companyData.rechtsform||'';document.getElementById('compInhaber').value=companyData.inhaber||'';document.getElementById('compHandelsregister').value=companyData.handelsregister||'';document.getElementById('compStrasse').value=companyData.strasse||'';document.getElementById('compPLZ').value=companyData.plz||'';document.getElementById('compOrt').value=companyData.ort||'';document.getElementById('compTelefon').value=companyData.telefon||'';document.getElementById('compMobil').value=companyData.mobil||'';document.getElementById('compEmail').value=companyData.email||'';document.getElementById('compWebsite').value=companyData.website||'';document.getElementById('compSteuernummer').value=companyData.steuernummer||'';document.getElementById('compFinanzamt').value=companyData.finanzamt||'';document.getElementById('compUstId').value=companyData.ustId||'';document.getElementById('compKleinunternehmer').checked=!!companyData.kleinunternehmer;document.getElementById('compBank').value=companyData.bank||'';document.getElementById('compIBAN').value=companyData.iban||'';document.getElementById('compBIC').value=companyData.bic||'';document.getElementById('compDefaultVat').value=String(companyData.defaultVat!=null?companyData.defaultVat:0.19);document.getElementById('compZahlungsziel').value=String(companyData.zahlungsziel||14);document.getElementById('compInvPrefix').value=companyData.invPrefix||'RE-';document.getElementById('compOfferPrefix').value=companyData.offerPrefix||'AN-';document.getElementById('compInvFooterText').value=companyData.invFooterText||'';document.getElementById('compOfferFooterText').value=companyData.offerFooterText||'';document.getElementById('compOfferMailSubject').value=companyData.offerMailSubject||'Angebot {{nummer}} von {{firma}}';document.getElementById('compOfferMailBody').value=companyData.offerMailBody||'Guten Tag,\n\nanbei erhalten Sie unser Angebot {{nummer}} vom {{datum}}.\nGesamtsumme: {{betrag}}.\n\nBei Fragen melden Sie sich gerne.\n\nMit freundlichen Grussen\n{{firma}}';document.getElementById('compInvoiceMailSubject').value=companyData.invoiceMailSubject||'Rechnung {{nummer}} von {{firma}}';document.getElementById('compInvoiceMailBody').value=companyData.invoiceMailBody||'Guten Tag,\n\nanbei erhalten Sie unsere Rechnung {{nummer}} vom {{datum}}.\nRechnungsbetrag: {{betrag}}.\nFallig am: {{faellig}}.\n\nMit freundlichen Grussen\n{{firma}}';document.getElementById('compDunningFee1').value=String(companyData.dunningFee1!=null?companyData.dunningFee1:5);document.getElementById('compDunningFee2').value=String(companyData.dunningFee2!=null?companyData.dunningFee2:10);document.getElementById('compDunningFee3').value=String(companyData.dunningFee3!=null?companyData.dunningFee3:15);document.getElementById('compDunningInterestRate').value=String(companyData.dunningInterestRate!=null?companyData.dunningInterestRate:5);document.getElementById('compDunningWait2').value=String(companyData.dunningWait2!=null?companyData.dunningWait2:7);document.getElementById('compDunningWait3').value=String(companyData.dunningWait3!=null?companyData.dunningWait3:7);document.getElementById('compDunningNewDays1').value=String(companyData.dunningNewDays1!=null?companyData.dunningNewDays1:10);document.getElementById('compDunningNewDays2').value=String(companyData.dunningNewDays2!=null?companyData.dunningNewDays2:7);document.getElementById('compDunningNewDays3').value=String(companyData.dunningNewDays3!=null?companyData.dunningNewDays3:5);document.getElementById('compDunningMailSubject').value=companyData.dunningMailSubject||'Mahnung Stufe {{stufe}} – Rechnung {{nummer}}';document.getElementById('compLetterLayout').value=companyData.letterLayout||'modern';document.getElementById('compLetterPrimary').value=companyData.letterPrimary||'#0891b2';document.getElementById('compLetterSecondary').value=companyData.letterSecondary||'#0e7490';document.getElementById('compLetterContentTop').value=String(companyData.letterContentTop!=null?companyData.letterContentTop:50);if(!companyData.bankAccounts)companyData.bankAccounts=[];if(!companyData.bankAccounts.length&&companyData.iban){companyData.bankAccounts=[{id:'ba_default',label:'Hauptkonto',bank:companyData.bank||'',owner:companyData.inhaber||companyData.firma||'',iban:companyData.iban||'',bic:companyData.bic||''}]}toggleKleinunternehmer();renderCompanyLogoPreview();applySidebarBrandLogoSource();updateLetterheadPdfUi();renderLetterheadPreview();var aiEl=document.getElementById('compAiApiKey');if(aiEl)aiEl.value=localKey;var aiPrImp=document.getElementById('compAiPromptImprove');if(aiPrImp)aiPrImp.value=companyData.aiPromptImprove||'';var aiPrChkInv=document.getElementById('compAiPromptCheckInvoice');if(aiPrChkInv)aiPrChkInv.value=companyData.aiPromptCheckInvoice||'';var aiPrChkOrd=document.getElementById('compAiPromptCheckOrder');if(aiPrChkOrd)aiPrChkOrd.value=companyData.aiPromptCheckOrder||'';renderBankAccountsList();var gdpEl=document.getElementById('compGoogleDrivePath');if(gdpEl)gdpEl.value=companyData.googleDrivePath||'';var seEl=document.getElementById('compSenderEmail');if(seEl)seEl.value=companyData.senderEmail||'';}
function loadCompanySettings(){applyCompanySettingsToForm()}
function importJson(){
var input=document.createElement('input');
input.type='file';input.accept='.json';
input.onchange=function(e){
var file=e.target.files&&e.target.files[0];
if(!file)return;
var resultEl=document.getElementById('importResult');
if(resultEl){resultEl.className='mt-6';resultEl.innerHTML='<div class="text-gray-500 text-sm">Import läuft…</div>'}
var reader=new FileReader();
reader.onload=function(ev){
var text=ev.target.result;
var importData;
try{importData=JSON.parse(text);}catch(err){if(resultEl){resultEl.innerHTML='<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"><strong>Fehler:</strong> Ungültige JSON-Datei: '+esc(String(err.message||err))+'</div>'}return}
var now=new Date().toISOString().slice(0,10);
var arrays=['invoices','customers','orders','offers','articles','appointments'];
var stats={};
var existing={invoices:invoices.slice(),customers:customers.slice(),orders:orders.slice(),offers:offers.slice(),articles:articles.slice(),appointments:(typeof appointments!=='undefined'?appointments.slice():[])};
for(var i=0;i<arrays.length;i++){
var key=arrays[i];
var ea=Array.isArray(existing[key])?existing[key]:[];
var ia=Array.isArray(importData[key])?importData[key]:[];
var ids=new Set(ea.map(function(x){return x&&x.id}).filter(Boolean));
var ni=ia.filter(function(x){return x&&x.id&&!ids.has(x.id)}).map(function(x){return Object.assign({},x,{importedAt:now,importSource:'JSON-Import'})});
existing[key]=ea.concat(ni);
stats[key]=ni.length;
}
invoices=ensureArray(existing.invoices);customers=ensureArray(existing.customers);orders=ensureArray(existing.orders).map(normalizeOrderServices);offers=ensureArray(existing.offers);articles=ensureArray(existing.articles);if(typeof appointments!=='undefined')appointments=ensureArray(existing.appointments);
saveData();renderInvoices();renderCustomers();renderOrders();updateDashboard();
var lines=[['Rechnungen','invoices'],['Kunden','customers'],['Aufträge','orders'],['Angebote','offers'],['Artikel','articles'],['Termine','appointments']];
var rows=lines.map(function(l){return'<div class="flex justify-between py-1 text-sm border-b border-gray-100"><span class="text-gray-600">'+l[0]+'</span><span class="font-bold '+(stats[l[1]]>0?'text-green-600':'text-gray-400')+'">+'+(stats[l[1]]||0)+'</span></div>'}).join('');
var total=Object.values(stats).reduce(function(a,b){return a+(b||0)},0);
if(resultEl){resultEl.className='mt-6';resultEl.innerHTML='<div class="bg-green-50 border border-green-200 rounded-xl p-5"><div class="flex items-center gap-2 mb-3"><div class="text-xl">&#10003;</div><div class="font-bold text-green-800">Import abgeschlossen</div></div>'+rows+'<div class="flex justify-between py-2 text-sm font-bold"><span>Gesamt importiert</span><span class="text-green-700">'+total+' Einträge</span></div>'+(total===0?'<div class="text-xs text-gray-500 mt-2">Alle Einträge waren bereits vorhanden – nichts wurde doppelt importiert.</div>':'<div class="text-xs text-gray-500 mt-2">Daten wurden importiert und lokal gespeichert.</div>')+'</div>'}
};
reader.readAsText(file);
};
input.click();
}
function saveCompanySettings(e){if(e)e.preventDefault();companyData.firma=document.getElementById('compFirma').value.trim();companyData.rechtsform=document.getElementById('compRechtsform').value.trim();companyData.inhaber=document.getElementById('compInhaber').value.trim();companyData.handelsregister=document.getElementById('compHandelsregister').value.trim();companyData.strasse=document.getElementById('compStrasse').value.trim();companyData.plz=document.getElementById('compPLZ').value.trim();companyData.ort=document.getElementById('compOrt').value.trim();companyData.telefon=document.getElementById('compTelefon').value.trim();companyData.mobil=document.getElementById('compMobil').value.trim();companyData.email=document.getElementById('compEmail').value.trim();companyData.website=document.getElementById('compWebsite').value.trim();companyData.steuernummer=document.getElementById('compSteuernummer').value.trim();companyData.finanzamt=(document.getElementById('compFinanzamt').value||'').trim();companyData.ustId=document.getElementById('compUstId').value.trim();companyData.kleinunternehmer=!!document.getElementById('compKleinunternehmer').checked;companyData.bank=document.getElementById('compBank').value.trim();companyData.iban=document.getElementById('compIBAN').value.trim();companyData.bic=document.getElementById('compBIC').value.trim();companyData.defaultVat=parseFloat(document.getElementById('compDefaultVat').value)||0;companyData.zahlungsziel=parseInt(document.getElementById('compZahlungsziel').value,10)||14;companyData.invPrefix=(document.getElementById('compInvPrefix').value||'RE-').trim();companyData.offerPrefix=(document.getElementById('compOfferPrefix').value||'AN-').trim();companyData.invFooterText=(document.getElementById('compInvFooterText').value||'').trim();companyData.offerFooterText=(document.getElementById('compOfferFooterText').value||'').trim();companyData.offerMailSubject=(document.getElementById('compOfferMailSubject').value||'Angebot {{nummer}} von {{firma}}').trim();companyData.offerMailBody=(document.getElementById('compOfferMailBody').value||'').trim();companyData.invoiceMailSubject=(document.getElementById('compInvoiceMailSubject').value||'Rechnung {{nummer}} von {{firma}}').trim();companyData.invoiceMailBody=(document.getElementById('compInvoiceMailBody').value||'').trim();companyData.dunningFee1=parseFloat(document.getElementById('compDunningFee1').value)||0;companyData.dunningFee2=parseFloat(document.getElementById('compDunningFee2').value)||0;companyData.dunningFee3=parseFloat(document.getElementById('compDunningFee3').value)||0;companyData.dunningInterestRate=parseFloat(document.getElementById('compDunningInterestRate').value)||0;companyData.dunningWait2=parseInt(document.getElementById('compDunningWait2').value,10);if(isNaN(companyData.dunningWait2)||companyData.dunningWait2<0)companyData.dunningWait2=7;companyData.dunningWait3=parseInt(document.getElementById('compDunningWait3').value,10);if(isNaN(companyData.dunningWait3)||companyData.dunningWait3<0)companyData.dunningWait3=7;companyData.dunningNewDays1=parseInt(document.getElementById('compDunningNewDays1').value,10);if(isNaN(companyData.dunningNewDays1)||companyData.dunningNewDays1<1)companyData.dunningNewDays1=10;companyData.dunningNewDays2=parseInt(document.getElementById('compDunningNewDays2').value,10);if(isNaN(companyData.dunningNewDays2)||companyData.dunningNewDays2<1)companyData.dunningNewDays2=7;companyData.dunningNewDays3=parseInt(document.getElementById('compDunningNewDays3').value,10);if(isNaN(companyData.dunningNewDays3)||companyData.dunningNewDays3<1)companyData.dunningNewDays3=5;companyData.dunningMailSubject=(document.getElementById('compDunningMailSubject').value||'Mahnung Stufe {{stufe}} – Rechnung {{nummer}}').trim();companyData.letterLayout=document.getElementById('compLetterLayout').value||'modern';companyData.letterPrimary=document.getElementById('compLetterPrimary').value||'#0891b2';companyData.letterSecondary=document.getElementById('compLetterSecondary').value||'#0e7490';companyData.letterContentTop=parseFloat(document.getElementById('compLetterContentTop').value);if(isNaN(companyData.letterContentTop)||companyData.letterContentTop<10)companyData.letterContentTop=50;var aiApiEl=document.getElementById('compAiApiKey');if(aiApiEl)setOpenAiApiKey(String(aiApiEl.value||'').trim());if(companyData&&companyData.aiApiKey!==undefined)delete companyData.aiApiKey;var aiPrImpEl=document.getElementById('compAiPromptImprove');if(aiPrImpEl)companyData.aiPromptImprove=(aiPrImpEl.value||'').trim();var aiPrChkInvEl=document.getElementById('compAiPromptCheckInvoice');if(aiPrChkInvEl)companyData.aiPromptCheckInvoice=(aiPrChkInvEl.value||'').trim();var aiPrChkOrdEl=document.getElementById('compAiPromptCheckOrder');if(aiPrChkOrdEl)companyData.aiPromptCheckOrder=(aiPrChkOrdEl.value||'').trim();var gdpEl=document.getElementById('compGoogleDrivePath');if(gdpEl)companyData.googleDrivePath=gdpEl.value.trim();var seEl=document.getElementById('compSenderEmail');if(seEl)companyData.senderEmail=seEl.value.trim();updateLetterheadPdfUi();renderLetterheadPreview();saveData();applyPermissions();var m=document.getElementById('companySaveMsg');if(m){m.classList.remove('hidden');setTimeout(function(){m.classList.add('hidden')},1800)}}
function loadAppointments(){}
function saveAppointments(){saveData()}
function toggleWhiteBack(on){document.body.classList.toggle('theme-dark',!on)}
function applyTheme(){toggleWhiteBack(true);var t=document.getElementById('whiteBackToggle');if(t)t.checked=true}
function showAppointmentModal(aid){aid=aid||null;document.getElementById('apptModalTitle').textContent=aid?'Termin bearbeiten':'Neuer Termin';document.getElementById('appointmentForm').reset();document.getElementById('apptId').value='';document.getElementById('apptTimeStart').value='09:00';document.getElementById('apptTimeEnd').value='10:00';document.getElementById('apptAllDay').checked=false;document.getElementById('apptTimeFields').classList.remove('hidden');var sel=document.getElementById('apptCustomerSelect');sel.innerHTML='<option value="">-- Kein Kunde --</option>';customers.forEach(function(c){var n=getCustomerDisplayName(c);var o=document.createElement('option');o.value=c.id;o.textContent=n;sel.appendChild(o)});if(!aid){var td=new Date();document.getElementById('apptDate').value=td.toISOString().slice(0,10)}if(aid){var a=appointments.find(function(x){return x.id===aid});if(a){document.getElementById('apptId').value=a.id;document.getElementById('apptTitle').value=a.title;document.getElementById('apptDate').value=a.date;document.getElementById('apptAllDay').checked=!!a.allDay;if(a.allDay){document.getElementById('apptTimeFields').classList.add('hidden')}else{document.getElementById('apptTimeStart').value=a.timeStart||'09:00';document.getElementById('apptTimeEnd').value=a.timeEnd||'10:00'}document.getElementById('apptCustomerSelect').value=a.customerId||'';document.getElementById('apptLocation').value=a.location||'';document.getElementById('apptDescription').value=a.description||'';document.getElementById('apptReminder').value=String(a.reminder||0)}}document.getElementById('appointmentModal').classList.add('active')}
function hideAppointmentModal(){document.getElementById('appointmentModal').classList.remove('active')}
function toggleApptTime(){var ad=document.getElementById('apptAllDay').checked;document.getElementById('apptTimeFields').classList.toggle('hidden',ad);if(ad){document.getElementById('apptTimeStart').required=false;document.getElementById('apptTimeEnd').required=false}else{document.getElementById('apptTimeStart').required=true;document.getElementById('apptTimeEnd').required=true}}
function saveAppointment(e){e.preventDefault();var aid=document.getElementById('apptId').value;var isNew=!aid;var cid=document.getElementById('apptCustomerSelect').value;var cust=cid?customers.find(function(c){return c.id===cid}):null;var a={id:aid||'appt_'+Date.now(),title:document.getElementById('apptTitle').value,date:document.getElementById('apptDate').value,allDay:document.getElementById('apptAllDay').checked,timeStart:document.getElementById('apptTimeStart').value,timeEnd:document.getElementById('apptTimeEnd').value,customerId:cid,customerName:cust?getCustomerDisplayName(cust):'',location:document.getElementById('apptLocation').value,description:document.getElementById('apptDescription').value,reminder:parseInt(document.getElementById('apptReminder').value)||0,createdAt:Date.now()};if(!a.allDay&&a.timeStart>=a.timeEnd){alert('Endzeit muss nach Startzeit liegen.');return}if(aid){appointments=appointments.filter(function(x){return x.id!==aid})}appointments.push(a);delete apptReminderSeen[a.id];saveAppointmentReminderSeen();appointments.sort(function(x,y){var da=x.date+' '+(x.timeStart||'00:00');var db=y.date+' '+(y.timeStart||'00:00');return da.localeCompare(db)});saveAppointments();hideAppointmentModal();renderAppointments();updateApptStats();generateICS(a)}
async function deleteAppointment(id){if(!await uiConfirm('Termin löschen?','Termin'))return;appointments=appointments.filter(function(a){return a.id!==id});delete apptReminderSeen[String(id||'')];saveAppointmentReminderSeen();saveAppointments();renderAppointments();updateApptStats()}
function generateICS(a){var uid=a.id+'@werkmeisterpro';var now=new Date();var stamp=formatICSDate(now);var lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WerkmeisterPro//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+stamp];if(a.allDay){lines.push('DTSTART;VALUE=DATE:'+a.date.replace(/-/g,''));var nd=new Date(a.date);nd.setDate(nd.getDate()+1);lines.push('DTEND;VALUE=DATE:'+nd.toISOString().slice(0,10).replace(/-/g,''))}else{var ds=new Date(a.date+'T'+a.timeStart+':00');var de=new Date(a.date+'T'+a.timeEnd+':00');lines.push('DTSTART:'+formatICSDate(ds));lines.push('DTEND:'+formatICSDate(de))}lines.push('SUMMARY:'+escICS(a.title));if(a.location)lines.push('LOCATION:'+escICS(a.location));if(a.description)lines.push('DESCRIPTION:'+escICS(a.description));if(a.reminder>0){lines.push('BEGIN:VALARM');lines.push('TRIGGER:-PT'+a.reminder+'M');lines.push('ACTION:DISPLAY');lines.push('DESCRIPTION:Erinnerung');lines.push('END:VALARM')}lines.push('END:VEVENT');lines.push('END:VCALENDAR');var blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download=a.title.replace(/[^a-zA-Z0-9\u00c0-\u024F]/g,'_').substring(0,30)+'.ics';document.body.appendChild(link);link.click();document.body.removeChild(link);URL.revokeObjectURL(url)}
function formatICSDate(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}
function escICS(s){return(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n')}
var APPT_REMINDER_SEEN_KEY='wm_appt_reminders_seen';
function loadAppointmentReminderSeen(){try{apptReminderSeen=JSON.parse(localStorage.getItem(APPT_REMINDER_SEEN_KEY)||'{}')||{}}catch(e){apptReminderSeen={}}}
function saveAppointmentReminderSeen(){try{localStorage.setItem(APPT_REMINDER_SEEN_KEY,JSON.stringify(apptReminderSeen||{}))}catch(e){}}
function getReminderMoment(a){if(!a||a.allDay||!a.date||!a.timeStart||!a.reminder)return null;var start=new Date(a.date+'T'+a.timeStart+':00');if(!isFinite(start.getTime()))return null;var remind=new Date(start.getTime()-(Math.max(0,parseInt(a.reminder,10)||0)*60000));return{start:start,remind:remind}}
function dismissAppointmentReminder(apptId){apptId=String(apptId||'');if(!apptId)return;apptReminderSeen[apptId]=new Date().toISOString();saveAppointmentReminderSeen();renderAppointmentReminderBanner()}
function renderAppointmentReminderBanner(){var box=document.getElementById('apptReminderBanner');if(!box)return;appointments=ensureArray(appointments);var now=new Date();var due=appointments.filter(function(a){var m=getReminderMoment(a);if(!m)return false;if(now<m.remind||now>m.start)return false;return !apptReminderSeen[a.id]}).sort(function(a,b){return (a.date+' '+a.timeStart).localeCompare(b.date+' '+b.timeStart)});if(!due.length){box.innerHTML='';return}var a=due[0];box.innerHTML='<div class="card mb-4" style="border-left:4px solid #f59e0b"><div class="flex flex-wrap items-center justify-between gap-3"><div><div class="font-bold text-amber-700">Erinnerung: '+esc(a.title||'Termin')+'</div><div class="text-sm text-gray-600">'+esc(a.date||'')+(a.allDay?' (ganztägig)':' · '+esc(a.timeStart||''))+(a.customerName?' · '+esc(a.customerName):'')+'</div></div><div class="flex gap-2"><button class="btn btn-secondary btn-sm" onclick="showAppointmentModal(\''+a.id+'\')">Öffnen</button><button class="btn btn-secondary btn-sm" onclick="dismissAppointmentReminder(\''+a.id+'\')">Ausblenden</button></div></div></div>'}
function renderAppointments(){var c=document.getElementById('appointmentsList');if(!c)return;renderAppointmentReminderBanner();var q=(document.getElementById('apptSearchInput')?document.getElementById('apptSearchInput').value:'').toLowerCase();var filter=document.getElementById('apptFilterTime')?document.getElementById('apptFilterTime').value:'upcoming';var today=new Date().toISOString().slice(0,10);var weekEnd=new Date();weekEnd.setDate(weekEnd.getDate()+7);var wEnd=weekEnd.toISOString().slice(0,10);var monthEnd=new Date();monthEnd.setDate(monthEnd.getDate()+30);var mEnd=monthEnd.toISOString().slice(0,10);var f=appointments;if(filter==='upcoming')f=f.filter(function(a){return a.date>=today});else if(filter==='today')f=f.filter(function(a){return a.date===today});else if(filter==='week')f=f.filter(function(a){return a.date>=today&&a.date<=wEnd});else if(filter==='month')f=f.filter(function(a){return a.date>=today&&a.date<=mEnd});else if(filter==='past')f=f.filter(function(a){return a.date<today});if(q)f=f.filter(function(a){return[a.title,a.customerName,a.location,a.description].filter(Boolean).join(' ').toLowerCase().indexOf(q)!==-1});if(!f.length){c.innerHTML='<p class="text-gray-500 text-center py-12">Keine Termine gefunden</p>';return}var h='<div class="space-y-3">';var lastDate='';f.forEach(function(a){var isPast=a.date<today;if(a.date!==lastDate){lastDate=a.date;var dd=new Date(a.date+'T12:00:00');var dayName=['So','Mo','Di','Mi','Do','Fr','Sa'][dd.getDay()];var dateStr=dayName+', '+dd.toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'});h+='<div class="text-sm font-bold text-gray-500 mt-4 mb-2 uppercase tracking-wide'+(isPast?' text-gray-400':'')+'">'+dateStr+'</div>'}h+='<div class="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all'+(isPast?' opacity-50':'')+'" style="border-left:4px solid '+(isPast?'#d1d5db':a.date===today?'#10b981':'#0891b2')+'">';h+='<div class="flex flex-wrap justify-between items-start gap-4"><div class="flex-1">';h+='<div class="flex items-center gap-3 mb-1"><h3 class="text-lg font-bold text-gray-800">'+esc(a.title)+'</h3>';if(a.allDay)h+='<span class="badge badge-cyan">Ganzt\u00e4gig</span>';h+='</div>';if(!a.allDay)h+='<p class="text-cyan-700 font-semibold">'+a.timeStart+' \u2013 '+a.timeEnd+' Uhr</p>';if(a.customerName)h+='<p class="text-gray-600 text-sm mt-1"><strong>Kunde:</strong> '+esc(a.customerName)+'</p>';if(a.location)h+='<p class="text-gray-500 text-sm mt-1">&#128205; '+esc(a.location)+'</p>';if(a.description)h+='<p class="text-gray-400 text-sm mt-1 italic">'+esc(a.description)+'</p>';h+='</div><div class="flex flex-wrap gap-2">';h+='<button onclick="generateICS(appointments.find(function(x){return x.id===\''+a.id+'\'}))" class="btn btn-primary btn-sm">&#128197; .ics</button>';h+='<button onclick="showAppointmentModal(\''+a.id+'\')" class="btn btn-secondary btn-sm">Bearbeiten</button>';h+='<button onclick="deleteAppointment(\''+a.id+'\')" class="btn btn-secondary btn-sm btn-danger">L\u00f6schen</button>';h+='</div></div></div>'});c.innerHTML=h+'</div>'}
function updateApptStats(){var today=new Date().toISOString().slice(0,10);var weekEnd=new Date();weekEnd.setDate(weekEnd.getDate()+7);var wEnd=weekEnd.toISOString().slice(0,10);var tCount=appointments.filter(function(a){return a.date===today}).length;var wCount=appointments.filter(function(a){return a.date>=today&&a.date<=wEnd}).length;var el1=document.getElementById('stat-appt-today');if(el1)el1.textContent=tCount;var el2=document.getElementById('stat-appt-week');if(el2)el2.textContent=wCount;var el3=document.getElementById('stat-appt-total');if(el3)el3.textContent=appointments.length}
// Steuerauswertung: Jahr/Monat-Auswahl befuellen und Auswertung anzeigen
function fillTaxYearSelect(){
	invoices=ensureArray(invoices);
	orders=ensureArray(orders).map(normalizeOrderServices);
	expenses=ensureArray(typeof expenses!=='undefined'?expenses:[]);
	var years=[];
	invoices.forEach(function(i){var d=String(i.issueDate||'').trim();if(d)years.push(parseInt(d.slice(0,4),10))});
	orders.forEach(function(o){years.push(new Date(o.createdAt).getFullYear())});
	expenses.forEach(function(e){var d=String((e&&e.date)||'').trim();if(d)years.push(parseInt(d.slice(0,4),10))});
	years=years.filter(function(y){return isFinite(y)&&y>2000});
	var uniqueYears=Array.from(new Set(years)).sort(function(a,b){return b-a});
	if(!uniqueYears.length)uniqueYears=[new Date().getFullYear()];
	var sel=document.getElementById('taxYearSelect');
	sel.innerHTML='';
	uniqueYears.forEach(function(y){var opt=document.createElement('option');opt.value=String(y);opt.textContent=String(y);sel.appendChild(opt)});
	sel.value=String(uniqueYears[0]);
}

function renderTaxReport(){
	invoices=ensureArray(invoices);
	orders=ensureArray(orders).map(normalizeOrderServices);
	expenses=ensureArray(typeof expenses!=='undefined'?expenses:[]);
	expenseLineItems=ensureArray(typeof expenseLineItems!=='undefined'?expenseLineItems:[]);
	var year=String(document.getElementById('taxYearSelect').value||new Date().getFullYear());
	var month=String(document.getElementById('taxMonthSelect').value||'all');
	var invFiltered=invoices.filter(function(inv){
		if(!inv||inv.status==='draft'||inv.status==='storniert')return false;
		var d=String(inv.issueDate||'');
		if(!d||d.length<7)return false;
		var y=d.slice(0,4),m=parseInt(d.slice(5,7),10);
		return y===year&&(month==='all'||m===parseInt(month,10))
	});
	var incNet=invFiltered.reduce(function(s,inv){return s+(Number(inv.netTotal)||0)},0);
	var incTax=invFiltered.reduce(function(s,inv){return s+(Number(inv.vatTotal)||0)},0);
	var incGross=invFiltered.reduce(function(s,inv){return s+(Number(inv.grossTotal)||0)},0);
	var count=invFiltered.length;
	var sourceLabel='Rechnungen';
	if(!count){
		var ordFiltered=orders.filter(function(o){var d=new Date(o.createdAt);return String(d.getFullYear())===year&&(month==='all'||(d.getMonth()+1)===parseInt(month,10))});
		incNet=ordFiltered.reduce(function(s,o){return s+calcTotal(o)},0);
		incTax=incNet*0.19;
		incGross=incNet+incTax;
		count=ordFiltered.length;
		sourceLabel='Auftraege (Fallback)';
	}
	function _taxParseAmt(v){
		if(v==null)return 0;
		if(typeof v==='number')return isFinite(v)?v:0;
		var s=String(v||'').trim();
		if(!s)return 0;
		if(typeof _parseEuro==='function'){var pe=_parseEuro(s);return isFinite(pe)?pe:0}
		s=s.replace(/\s/g,'').replace(/€/g,'');
		if(s.indexOf(',')!==-1&&s.indexOf('.')!==-1)s=s.replace(/\./g,'').replace(',','.');
		else if(s.indexOf(',')!==-1)s=s.replace(',','.');
		var n=parseFloat(s);
		return isFinite(n)?n:0
	}
	function _taxParseRate(v){
		if(v==null)return 0;
		if(typeof v==='number'){if(!isFinite(v))return 0;return v>1?v/100:v}
		var s=String(v||'').trim();
		if(!s)return 0;
		var m=s.match(/-?\d+([.,]\d+)?/);
		if(!m)return 0;
		var t=m[0].replace(',','.');
		var n=parseFloat(t);
		if(!isFinite(n))return 0;
		return n>1?n/100:n
	}
	function _calcExpenseTotals(exp){
		var items=expenseLineItems.filter(function(li){return li&&li.expenseId===exp.id});
		var gross=0,net=0,vat=0;
		if(items.length){
			items.forEach(function(it){
				var g=_taxParseAmt(it.lineTotal);
				if(!(g>0)){
					var q=_taxParseAmt(it.qty);
					var up=_taxParseAmt(it.unitPrice);
					g=q>0&&up!==0?q*up:0
				}
				if(!(g>0))return;
				var r=_taxParseRate(it.taxRate);
				if(r>0){
					var n=g/(1+r);
					net+=n;
					vat+=(g-n);
					gross+=g;
				}else{
					net+=g;
					gross+=g;
				}
			});
		}else{
			var tg=(exp.totalGross!==''&&exp.totalGross!=null)?Number(exp.totalGross):0;
			if(isFinite(tg)&&tg>0){gross=tg;net=tg;vat=0}
		}
		return{net:net,vat:vat,gross:gross}
	}
	var expFiltered=expenses.filter(function(e){
		if(!e)return false;
		var d=String(e.date||'');
		if(!d||d.length<7)return false;
		var y=d.slice(0,4),m=parseInt(d.slice(5,7),10);
		return y===year&&(month==='all'||m===parseInt(month,10))
	});
	var expRows=expFiltered.map(function(e){var t=_calcExpenseTotals(e);return{exp:e,net:t.net,vat:t.vat,gross:t.gross}});
	var expNet=expRows.reduce(function(s,r){return s+(Number(r.net)||0)},0);
	var expVat=expRows.reduce(function(s,r){return s+(Number(r.vat)||0)},0);
	var expGross=expRows.reduce(function(s,r){return s+(Number(r.gross)||0)},0);
	var profitNet=incNet-expNet;
	var isKU=!!(companyData&&companyData.kleinunternehmer);
	var vatPayable=isKU?0:(incTax-expVat);
	var html='';
	html+='<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">';
	html+='<div class="stat-card"><div class="text-sm font-semibold text-gray-600 mb-1">Einnahmen Netto</div><div class="stat-number text-green-700">'+fmtCur(incNet)+'</div><div class="stat-trend text-green-600">'+count+' Belege</div></div>';
	html+='<div class="stat-card"><div class="text-sm font-semibold text-gray-600 mb-1">USt. (Ausgang)</div><div class="stat-number text-purple-700">'+fmtCur(isKU?0:incTax)+'</div><div class="stat-trend text-purple-600">'+(isKU?'Kleinunternehmer':'Quelle: '+sourceLabel)+'</div></div>';
	html+='<div class="stat-card"><div class="text-sm font-semibold text-gray-600 mb-1">Einnahmen Brutto</div><div class="stat-number text-cyan-700">'+fmtCur(incGross)+'</div><div class="stat-trend text-cyan-600">inkl. USt.</div></div>';
	html+='<div class="stat-card"><div class="text-sm font-semibold text-gray-600 mb-1">Zeitraum</div><div class="stat-number">'+(month==='all'?'Jahr '+year:(('0'+month).slice(-2)+'.'+year))+'</div><div class="stat-trend text-gray-600">'+(count+' Einnahmen · '+expFiltered.length+' Ausgaben')+'</div></div>';
	html+='</div>';
	html+='<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">';
	html+='<div class="stat-card"><div class="text-sm font-semibold text-gray-600 mb-1">Ausgaben Netto</div><div class="stat-number text-red-700">'+fmtCur(expNet)+'</div><div class="stat-trend text-red-600">'+expFiltered.length+' Belege</div></div>';
	html+='<div class="stat-card"><div class="text-sm font-semibold text-gray-600 mb-1">Vorsteuer</div><div class="stat-number text-purple-700">'+fmtCur(isKU?0:expVat)+'</div><div class="stat-trend text-purple-600">'+(isKU?'Kleinunternehmer':'aus Ausgaben')+'</div></div>';
	html+='<div class="stat-card"><div class="text-sm font-semibold text-gray-600 mb-1">Ergebnis (Netto)</div><div class="stat-number '+(profitNet>=0?'text-green-700':'text-red-700')+'">'+fmtCur(profitNet)+'</div><div class="stat-trend '+(vatPayable>=0?'text-purple-600':'text-green-600')+'">'+(isKU?'USt.-Zahllast: 0,00 EUR':('USt.-Zahllast: '+fmtCur(vatPayable)))+'</div></div>';
	html+='</div>';
	if(invFiltered.length){
		html+='<div class="overflow-x-auto"><table class="table"><thead><tr><th>Datum</th><th>Nr.</th><th>Kunde</th><th>Netto</th><th>MwSt.</th><th>Brutto</th></tr></thead><tbody>';
		invFiltered.forEach(function(inv){html+='<tr><td>'+esc(inv.issueDate||'-')+'</td><td>'+esc(inv.number||'-')+'</td><td>'+esc(inv.customerName||'-')+'</td><td>'+fmtCur(inv.netTotal||0)+'</td><td>'+fmtCur(inv.vatTotal||0)+'</td><td>'+fmtCur(inv.grossTotal||0)+'</td></tr>'});
		html+='</tbody></table></div>';
	}else if(count){
		html+='<div class="text-amber-700 text-sm mb-3">Keine finalen Rechnungen im Zeitraum. Es werden Auftragswerte als Fallback angezeigt.</div>';
	}else{
		html+='<div class="text-gray-500 text-center py-12">Keine Daten im gewaehlten Zeitraum.</div>';
	}
	if(expRows.length){
		html+='<div class="mt-8 overflow-x-auto"><table class="table"><thead><tr><th>Datum</th><th>Lieferant</th><th>Nr.</th><th>Netto</th><th>MwSt.</th><th>Brutto</th></tr></thead><tbody>';
		expRows.slice().sort(function(a,b){return String(b.exp.date||'').localeCompare(String(a.exp.date||''))}).forEach(function(r){
			var e=r.exp;
			html+='<tr><td>'+esc(e.date||'-')+'</td><td>'+esc(e.vendorName||'-')+'</td><td>'+esc(e.invoiceNo||'-')+'</td><td>'+fmtCur(r.net||0)+'</td><td>'+fmtCur(r.vat||0)+'</td><td>'+fmtCur(r.gross||0)+'</td></tr>'
		});
		html+='</tbody></table></div>';
	}else{
		html+='<div class="mt-8 text-gray-500 text-sm">Keine Ausgaben im gewaehlten Zeitraum.</div>';
	}
	document.getElementById('taxReportResult').innerHTML=html;
}

function setTaxTab(tab){
	var next=String(tab||'report');
	window.activeTaxTab=next;
	document.querySelectorAll('#tax [data-tax-tab-btn]').forEach(function(btn){btn.classList.toggle('active',btn.getAttribute('data-tax-tab-btn')===next)});
	document.querySelectorAll('#tax [data-tax-tab]').forEach(function(panel){panel.classList.toggle('hidden',panel.getAttribute('data-tax-tab')!==next)});
	if(next==='export')renderTaxExportPreview();
}

function getTaxExportFilters(){
	var year=String((document.getElementById('taxExportYear')||{}).value||new Date().getFullYear());
	var month=String((document.getElementById('taxExportMonth')||{}).value||'all');
	var status=String((document.getElementById('taxExportStatus')||{}).value||'final');
	return{year:year,month:month,status:status};
}

function filterInvoicesByPeriod(list,year,month){
	list=ensureArray(list);
	return list.filter(function(inv){
		if(!inv)return false;
		var d=String(inv.issueDate||'');
		if(!d||d.length<7)return false;
		var y=d.slice(0,4),m=parseInt(d.slice(5,7),10);
		if(y!==String(year))return false;
		if(month!=='all'&&m!==parseInt(month,10))return false;
		return true;
	});
}

function getTaxExportInvoices(){
	invoices=ensureArray(invoices);
	var f=getTaxExportFilters();
	var list=filterInvoicesByPeriod(invoices,f.year,f.month);
	if(f.status==='final')list=list.filter(function(i){return i.status!=='draft'});
	else if(f.status!=='all')list=list.filter(function(i){return String(i.status||'')===f.status});
	return list;
}

function renderTaxExportPreview(){
	var el=document.getElementById('taxExportPreview');
	if(!el)return;
	var list=getTaxExportInvoices();
	if(!list.length){el.innerHTML='<div class="text-gray-500 text-center py-12">Keine passenden Rechnungen.</div>';return}
	var rows=list.slice().sort(function(a,b){return String(b.issueDate||'').localeCompare(String(a.issueDate||''))});
	var html='<div class="overflow-x-auto"><table class="table"><thead><tr><th>Datum</th><th>Nr.</th><th>Kunde</th><th>Status</th><th>Netto</th><th>MwSt.</th><th>Brutto</th></tr></thead><tbody>';
	rows.forEach(function(inv){
		html+='<tr><td>'+esc(inv.issueDate||'-')+'</td><td>'+esc(inv.number||'-')+'</td><td>'+esc(inv.customerName||'-')+'</td><td>'+esc(inv.status||'-')+'</td><td>'+fmtCur(inv.netTotal||0)+'</td><td>'+fmtCur(inv.vatTotal||0)+'</td><td>'+fmtCur(inv.grossTotal||0)+'</td></tr>';
	});
	html+='</tbody></table></div>';
	el.innerHTML=html;
}

function csvEscape(v){
	var s=String(v==null?'':v);
	s=s.replace(/\r?\n/g,' ').replace(/"/g,'""');
	return'"'+s+'"';
}

async function saveTextContent(defaultName,content){
	try{
		if(window.electronAPI&&window.electronAPI.saveTextFile){
			var res=await window.electronAPI.saveTextFile({defaultName:defaultName,data:content});
			if(res&&res.ok)return true;
			if(res&&res.canceled)return false;
		}
	}catch(e){}
	try{
		var blob=new Blob([content],{type:'text/csv;charset=utf-8'});
		var url=URL.createObjectURL(blob);
		var a=document.createElement('a');
		a.href=url;
		a.download=defaultName;
		document.body.appendChild(a);
		a.click();
		setTimeout(function(){URL.revokeObjectURL(url);a.remove()},0);
		return true;
	}catch(e){
		alert('Export fehlgeschlagen.');
		return false;
	}
}

async function exportTaxInvoicesCsv(){
	var f=getTaxExportFilters();
	var list=getTaxExportInvoices();
	if(!list.length){alert('Keine passenden Rechnungen.');return}
	var header=['Datum','Nr','Kunde','Objekt','Status','Netto','MwSt','Brutto'];
	var lines=[header.map(csvEscape).join(';')];
	list.slice().sort(function(a,b){return String(a.issueDate||'').localeCompare(String(b.issueDate||''))}).forEach(function(inv){
		lines.push([
			inv.issueDate||'',
			inv.number||'',
			inv.customerName||'',
			inv.object||'',
			inv.status||'',
			fn(inv.netTotal||0),
			fn(inv.vatTotal||0),
			fn(inv.grossTotal||0)
		].map(csvEscape).join(';'));
	});
	var monthLabel=f.month==='all'?'all':('0'+f.month).slice(-2);
	var name='Rechnungen_'+f.year+'_'+monthLabel+'.csv';
	await saveTextContent(name,lines.join('\r\n'));
}

async function exportTaxInvoicesPdf(){
	var f=getTaxExportFilters();
	var list=getTaxExportInvoices();
	if(!list.length){alert('Keine passenden Rechnungen.');return}
	var jsPDF=getJsPdfCtor();
	if(!jsPDF){alert('PDF-Export nicht verfügbar.');return}
	var doc=new jsPDF('p','mm','a4');
	var W=210,M=15,CW=W-2*M;
	var y=18;
	doc.setFont('helvetica','bold');
	doc.setFontSize(16);
	doc.setTextColor(31,41,55);
	doc.text('Rechnungs-Export',M,y);
	y+=7;
	doc.setFont('helvetica','normal');
	doc.setFontSize(10);
	doc.setTextColor(107,114,128);
	var monthLabel=f.month==='all'?'Gesamt':(('0'+f.month).slice(-2)+'.');
	doc.text('Zeitraum: '+monthLabel+f.year+' · Status: '+f.status,M,y);
	y+=10;
	var cols=[
		{h:'Datum',w:22},
		{h:'Nr.',w:26},
		{h:'Kunde',w:58},
		{h:'Netto',w:22},
		{h:'MwSt.',w:22},
		{h:'Brutto',w:22},
		{h:'Status',w:18}
	];
	doc.setFillColor(8,145,178);
	doc.rect(M,y,CW,8,'F');
	doc.setTextColor(255,255,255);
	doc.setFont('helvetica','bold');
	doc.setFontSize(8);
	var x=M+2;
	cols.forEach(function(c){doc.text(c.h,x,y+5.5);x+=c.w});
	y+=10;
	doc.setFont('helvetica','normal');
	doc.setTextColor(31,41,55);
	doc.setFontSize(8.5);
	list.slice().sort(function(a,b){return String(a.issueDate||'').localeCompare(String(b.issueDate||''))}).forEach(function(inv,idx){
		if(y>276){doc.addPage();y=18}
		var bg=idx%2===0?[240,249,255]:[255,255,255];
		doc.setFillColor(bg[0],bg[1],bg[2]);
		doc.rect(M,y-3,CW,7,'F');
		var cx=M+2;
		doc.text(String(inv.issueDate||''),cx,y+1.5);cx+=cols[0].w;
		doc.text(String(inv.number||''),cx,y+1.5);cx+=cols[1].w;
		var cust=String(inv.customerName||'');
		var custShort=cust.length>38?cust.slice(0,37)+'…':cust;
		doc.text(custShort,cx,y+1.5);cx+=cols[2].w;
		doc.text(fn(inv.netTotal||0),cx+cols[3].w-2,y+1.5,{align:'right'});cx+=cols[3].w;
		doc.text(fn(inv.vatTotal||0),cx+cols[4].w-2,y+1.5,{align:'right'});cx+=cols[4].w;
		doc.text(fn(inv.grossTotal||0),cx+cols[5].w-2,y+1.5,{align:'right'});cx+=cols[5].w;
		doc.text(String(inv.status||''),cx,y+1.5);
		y+=7;
	});
	var name='Rechnungen_'+f.year+'_'+(f.month==='all'?'all':('0'+f.month).slice(-2))+'.pdf';
	await savePdfDocument(doc,name);
}

// Initialisierung für Steuerauswertung
document.addEventListener('DOMContentLoaded', function() {
	_gsInit();
	loadAppointmentReminderSeen();
	applyTheme();
	var taxSection = document.getElementById('tax');
	if (taxSection) {
		fillTaxYearSelect();
		document.getElementById('taxMonthSelect').value = 'all';
		document.getElementById('taxYearSelect').addEventListener('change', renderTaxReport);
		document.getElementById('taxMonthSelect').addEventListener('change', renderTaxReport);
		setTaxTab(window.activeTaxTab||'report');
		var taxY=document.getElementById('taxExportYear');if(taxY)taxY.innerHTML=document.getElementById('taxYearSelect').innerHTML;
		var taxM=document.getElementById('taxExportMonth');if(taxM)taxM.value='all';
		var taxS=document.getElementById('taxExportStatus');if(taxS)taxS.value='final';
		if(taxY)taxY.addEventListener('change',renderTaxExportPreview);
		if(taxM)taxM.addEventListener('change',renderTaxExportPreview);
		if(taxS)taxS.addEventListener('change',renderTaxExportPreview);
	}
});
initUiDialog();
bindLetterPreviewLive();
