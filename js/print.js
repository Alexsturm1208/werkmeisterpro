function hexToRgb(hex){var h=String(hex||'').replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];if(h.length!==6)return[8,145,178];return[parseInt(h.substring(0,2),16),parseInt(h.substring(2,4),16),parseInt(h.substring(4,6),16)]}
function clamp(n,min,max){n=Number(n);if(!isFinite(n))n=0;return Math.max(min,Math.min(max,n))}
function rgbToHex(rgb){rgb=rgb||[0,0,0];var r=clamp(rgb[0],0,255),g=clamp(rgb[1],0,255),b=clamp(rgb[2],0,255);var to=function(x){var s=Math.round(x).toString(16);return s.length===1?'0'+s:s};return'#'+to(r)+to(g)+to(b)}
function normalizeHexColor(hex,fallback){var s=String(hex||'').trim();if(!s)return String(fallback||'#0891b2');if(s[0]!=='#')s='#'+s;var m=s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(!m)return String(fallback||'#0891b2');if(m[1].length===3){var h=m[1];return('#'+h[0]+h[0]+h[1]+h[1]+h[2]+h[2]).toLowerCase()}return s.toLowerCase()}
function mixRgb(a,b,t){a=a||[0,0,0];b=b||[255,255,255];t=clamp(t,0,1);return[Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)]}
function getInvoiceThemeHex(cs){cs=cs||{};return{accent:normalizeHexColor(cs.letterPrimary,'#0891b2'),secondary:normalizeHexColor(cs.letterSecondary,'#0e7490')}}
function getInvoiceThemeRgb(cs){cs=cs||{};return{accent:hexToRgb(cs.letterPrimary||'#0891b2'),secondary:hexToRgb(cs.letterSecondary||'#0e7490')}}
function isDefaultInvoiceTheme(cs){cs=cs||{};var p=normalizeHexColor(cs.letterPrimary,'#0891b2');var s=normalizeHexColor(cs.letterSecondary,'#0e7490');return p==='#0891b2'&&s==='#0e7490'}
async function extractLogoThemeHex(src){src=String(src||'').trim();if(!src)return null;return await new Promise(function(resolve){var img=new Image();img.crossOrigin='anonymous';img.onload=function(){try{var w=img.naturalWidth||img.width||0,h=img.naturalHeight||img.height||0;if(!w||!h){resolve(null);return}var size=72;var canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;var ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,size,size);var scale=Math.min(size/w,size/h);var dw=Math.max(1,Math.round(w*scale));var dh=Math.max(1,Math.round(h*scale));var dx=Math.floor((size-dw)/2);var dy=Math.floor((size-dh)/2);ctx.drawImage(img,dx,dy,dw,dh);var data=ctx.getImageData(0,0,size,size).data;var buckets={};for(var i=0;i<data.length;i+=4){var a=data[i+3];if(a<140)continue;var r=data[i],g=data[i+1],b=data[i+2];if(r>245&&g>245&&b>245)continue;var lum=(0.2126*r+0.7152*g+0.0722*b);if(lum<15||lum>240)continue;var qR=r>>4,qG=g>>4,qB=b>>4;var key=qR+'_'+qG+'_'+qB;buckets[key]=(buckets[key]||0)+1}var entries=Object.keys(buckets).map(function(k){return{k:k,c:buckets[k]}}).sort(function(a,b){return b.c-a.c});if(!entries.length){resolve(null);return}var toRgb=function(k){var p=k.split('_');return[(parseInt(p[0],10)<<4)+8,(parseInt(p[1],10)<<4)+8,(parseInt(p[2],10)<<4)+8]};var primary=toRgb(entries[0].k);var secondary=null;for(var j=1;j<entries.length&&j<24;j++){var cand=toRgb(entries[j].k);var dist=Math.abs(cand[0]-primary[0])+Math.abs(cand[1]-primary[1])+Math.abs(cand[2]-primary[2]);if(dist>70){secondary=cand;break}}if(!secondary)secondary=mixRgb(primary,[0,0,0],0.25);resolve({primary:rgbToHex(primary),secondary:rgbToHex(secondary)})}catch(_){resolve(null)}};img.onerror=function(){resolve(null)};img.src=src})}
async function applyLogoColorsToLetterTheme(force){force=!!force;var src=(companyData&&companyData.logoDataUrl)?String(companyData.logoDataUrl):'';if(!src){if(force)alert('Bitte zuerst ein Logo hochladen.');return}if(!force&&!isDefaultInvoiceTheme(companyData||{}))return;var theme=null;try{theme=await extractLogoThemeHex(src)}catch(_){theme=null}if(!theme||!theme.primary||!theme.secondary){if(force)alert('Farben konnten nicht aus dem Logo ermittelt werden.');return}companyData.letterPrimary=theme.primary;companyData.letterSecondary=theme.secondary;var pEl=document.getElementById('compLetterPrimary');var sEl=document.getElementById('compLetterSecondary');if(pEl)pEl.value=theme.primary;if(sEl)sEl.value=theme.secondary;renderLetterheadPreview()}
function getLetterTheme(cs){var layout=(cs.letterLayout||'modern');var p=hexToRgb(cs.letterPrimary||'#0891b2');var s=hexToRgb(cs.letterSecondary||'#0e7490');if(layout==='classic')return{layout:layout,primary:[15,23,42],secondary:[100,116,139],accent:p};if(layout==='minimal')return{layout:layout,primary:[31,41,55],secondary:[107,114,128],accent:p};if(layout==='premium')return{layout:layout,primary:[31,41,55],secondary:[120,113,108],accent:[180,140,60]};return{layout:'modern',primary:p,secondary:s,accent:p}}
function applyPdfLetterhead(doc,cs,W,M,cname,cline){var H=doc&&doc.internal&&doc.internal.pageSize&&doc.internal.pageSize.getHeight?doc.internal.pageSize.getHeight():297;if(cs&&cs.letterheadPdfImageDataUrl){try{doc.addImage(cs.letterheadPdfImageDataUrl,'PNG',0,0,W,H)}catch(e){}var top=parseFloat(cs.letterContentTop);if(isNaN(top)||top<10)top=50;return top}var t=getLetterTheme(cs),CW=W-2*M;if(t.layout==='classic'){doc.setFillColor(t.primary[0],t.primary[1],t.primary[2]);doc.rect(0,0,W,28,'F');doc.setFillColor(t.secondary[0],t.secondary[1],t.secondary[2]);doc.rect(0,28,W,.8,'F');drawPdfLogo(doc,cs,M,4,18,18);doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text(cname,M+22,14);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text(cline,M+22,20);return 42}if(t.layout==='minimal'){doc.setFillColor(t.accent[0],t.accent[1],t.accent[2]);doc.rect(0,0,W,6,'F');drawPdfLogo(doc,cs,M,10,15,15);doc.setTextColor(31,41,55);doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text(cname,M+18,16);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(107,114,128);doc.text(cline,M+18,21);doc.setDrawColor(229,231,235);doc.setLineWidth(.4);doc.line(M,26,M+CW,26);return 38}if(t.layout==='premium'){doc.setFillColor(249,246,238);doc.rect(0,0,W,34,'F');doc.setFillColor(t.accent[0],t.accent[1],t.accent[2]);doc.rect(0,0,W,2.5,'F');doc.rect(0,31.5,W,2.5,'F');drawPdfLogo(doc,cs,M,7,20,20);doc.setTextColor(31,41,55);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(cname,M+24,16);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(107,114,128);doc.text(cline,M+24,22);return 46}doc.setFillColor(t.primary[0],t.primary[1],t.primary[2]);doc.rect(0,0,W,38,'F');drawPdfLogo(doc,cs,M,4,30,30);doc.setFont('helvetica','bold');doc.setFontSize(20);doc.setTextColor(255,255,255);doc.text(cname,M+35,18);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.text(cline,M+35,26);doc.setFillColor(t.secondary[0],t.secondary[1],t.secondary[2]);doc.rect(0,38,W,1.5,'F');return 50}
function getPreviewCompanyData(){var get=function(id,fallback){var el=document.getElementById(id);if(!el)return fallback||'';if(el.type==='checkbox')return !!el.checked;return (el.value||'').trim()};return{firma:get('compFirma',companyData.firma||'Ihre Firma'),strasse:get('compStrasse',companyData.strasse||''),plz:get('compPLZ',companyData.plz||''),ort:get('compOrt',companyData.ort||''),telefon:get('compTelefon',companyData.telefon||''),email:get('compEmail',companyData.email||''),iban:get('compIBAN',companyData.iban||''),bic:get('compBIC',companyData.bic||''),bank:get('compBank',companyData.bank||''),steuernummer:get('compSteuernummer',companyData.steuernummer||''),ustId:get('compUstId',companyData.ustId||''),layout:get('compLetterLayout',companyData.letterLayout||'modern'),primary:get('compLetterPrimary',companyData.letterPrimary||'#0891b2'),secondary:get('compLetterSecondary',companyData.letterSecondary||'#0e7490'),contentTop:parseFloat(get('compLetterContentTop',String(companyData.letterContentTop!=null?companyData.letterContentTop:50)))||50,letterheadPdfName:companyData.letterheadPdfName||'',letterheadPdfImageDataUrl:companyData.letterheadPdfImageDataUrl||'',logoDataUrl:companyData.logoDataUrl||''}}
function renderLetterheadPreview(){var box=document.getElementById('letterheadPreview');if(!box)return;var cs=getPreviewCompanyData();if(cs.letterheadPdfImageDataUrl){box.innerHTML='<div style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #d1d5db;box-shadow:0 2px 14px rgba(15,23,42,.08);padding:14px 16px"><div style="font-size:12px;color:#6b7280;margin-bottom:10px">PDF Briefkopf aktiv: <strong>'+esc(cs.letterheadPdfName||'Briefkopf.pdf')+'</strong> · Inhalt startet ab '+esc(String(cs.contentTop||50))+' mm</div><img src="'+escAttr(cs.letterheadPdfImageDataUrl)+'" alt="Briefkopf PDF" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;display:block"></div>';return}var footer=[cs.firma,cs.strasse,[cs.plz,cs.ort].filter(Boolean).join(' '),cs.bank?'Bank: '+cs.bank:'',cs.iban?'IBAN: '+cs.iban:'',cs.bic?'BIC: '+cs.bic:'',cs.steuernummer?'St.-Nr: '+cs.steuernummer:'',cs.ustId?'USt-IdNr: '+cs.ustId:''].filter(Boolean).join(' · ');var logoSrc=cs.logoDataUrl||APP_LOGO_SIDE_URL;var header='<div style="padding:14px 18px"><img src="'+esc(logoSrc)+'" alt="Unternehmenslogo" style="height:44px;max-width:280px;object-fit:contain"></div><div style="height:1px;background:#e5e7eb;margin:0 18px"></div>';box.innerHTML='<div style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #d1d5db;box-shadow:0 2px 14px rgba(15,23,42,.08)">'+header+'<div style="padding:18px 18px 14px 18px;min-height:360px"><div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:16px"><div style="font-size:12px;color:#374151"><div style="font-weight:700;margin-bottom:4px">Empfänger</div><div>Musterkunde GmbH</div><div>Musterweg 22</div><div>12345 Musterstadt</div></div><div style="text-align:right;font-size:12px;color:#6b7280"><div>Datum: '+new Date().toISOString().slice(0,10)+'</div><div style="margin-top:6px">Dokument: RECHNUNG / ANGEBOT</div></div></div><div style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px">Briefkopf Vorschau</div><div style="font-size:12px;color:#4b5563;line-height:1.6">So erscheint Ihr Dokument mit Kopf- und Fußzeile. Alle Firmendaten werden unten im Briefbogen angezeigt und im PDF verwendet.</div></div><div style="border-top:1px solid #e5e7eb;padding:10px 16px;font-size:10.5px;color:#6b7280;line-height:1.5;text-align:center">'+esc(footer||'Bitte Firmendaten vervollständigen.')+'</div></div>'}
function getJsPdfCtor(){return window.jspdf&&window.jspdf.jsPDF?window.jspdf.jsPDF:null}
function showDriveToast(msg){var t=document.getElementById('driveToast');if(!t)return;t.textContent='\u2601\uFE0F '+(msg||'In Google Drive gespeichert');t.classList.add('show');setTimeout(function(){t.classList.remove('show')},3500)}
async function savePdfDocument(doc,defaultName,opts){opts=opts||{};if(opts.autoSave&&window.electronAPI&&window.electronAPI.autoSavePdf){try{var abuf=doc.output('arraybuffer');var ar=await window.electronAPI.autoSavePdf({defaultName:defaultName,data:abuf,subDir:opts.subDir||'Rechnungen'});if(ar&&ar.ok){showDriveToast('Gespeichert: '+defaultName);if(ar.filePath&&window.electronAPI&&window.electronAPI.openFile){window.electronAPI.openFile(ar.filePath).catch(function(){});}return true}}catch(e){}}try{if(window.electronAPI&&window.electronAPI.savePdfFile){var buf=doc.output('arraybuffer');var res=await window.electronAPI.savePdfFile({defaultName:defaultName,data:buf});if(res&&res.ok){if(res.filePath&&window.electronAPI&&window.electronAPI.openFile){window.electronAPI.openFile(res.filePath).catch(function(){});}return true}if(res&&res.canceled)return false}}catch(e){}try{doc.save(defaultName);return true}catch(e){alert('PDF Export fehlgeschlagen.');return false}}
async function exportOfferPDF(id){
try{
var off=offers.find(function(o){return o.id===id});
if(!off){alert('Angebot nicht gefunden.');return}
if(!off.services||!off.services.length){alert('Bitte zuerst mindestens eine Leistung erfassen.');return}
if(hasCustomTemplate&&hasCustomTemplate('offer')){var _cs2=companyData||{};var _isKU2=!!_cs2.kleinunternehmer;var _vr2=_isKU2?0:(_cs2.defaultVat||0.19);var _dt2=new Date(off.createdAt||Date.now()).toISOString().slice(0,10);var _offerNo2=((_cs2.offerPrefix||'AN-').trim()||'AN-')+String(off.createdAt||Date.now()).slice(-6);var _ok=await autoSavePdfWithDocTemplate('offer',{company:_cs2,customer:off.customer||'-',address:off.address||'',services:off.services,nummer:_offerNo2,datum:_dt2,faelligBis:off.validUntil||addDaysIso(_dt2,_cs2.zahlungsziel||14),titel:off.object||'',isKU:_isKU2,vatRate:_vr2,fusstext:_cs2.offerFooterText||''},'Angebot_'+_offerNo2+'.pdf','Angebote');if(!_ok)await exportPdfWithDocTemplate('offer',{company:_cs2,customer:off.customer||'-',address:off.address||'',services:off.services,nummer:_offerNo2,datum:_dt2,faelligBis:off.validUntil||addDaysIso(_dt2,_cs2.zahlungsziel||14),titel:off.object||'',isKU:_isKU2,vatRate:_vr2,fusstext:_cs2.offerFooterText||''},'Angebot_'+_offerNo2+'.pdf');return}
var cs=companyData||{};
var cname=cs.firma||'Werkmeister Pro';
var cline=[cs.strasse,[cs.plz,cs.ort].filter(Boolean).join(' ')].filter(Boolean).join(' \u00b7 ');
if(cs.telefon)cline+=' \u00b7 Tel: '+cs.telefon;
if(cs.email)cline+=' \u00b7 '+cs.email;
var isKU=off.kleinunternehmer!==undefined?!!off.kleinunternehmer:!!cs.kleinunternehmer;
var vatRate=isKU?0:(cs.defaultVat||0.19);
var vatPct=Math.round(vatRate*100);
var net=calcTotal(off);
var vat=isKU?0:net*vatRate;
var gross=net+vat;
var jsPDF=getJsPdfCtor();
if(!jsPDF){alert('PDF-Export nicht verfügbar.');return}
var doc=new jsPDF('p','mm','a4');
var W=210,M=20,CW=W-2*M;
var theme=getInvoiceThemeRgb(cs||{});
var acc=theme.accent||[8,145,178];
var light=mixRgb(acc,[255,255,255],0.9);
var y=applyPdfLetterhead(doc,cs,W,M,cname,cline);
var offerPrefix=(cs.offerPrefix||'AN-').trim()||'AN-';
var offerNo=offerPrefix+String((off.createdAt||Date.now())).slice(-6);
doc.setFont('helvetica','bold');
doc.setFontSize(11);
doc.setTextColor(107,114,128);
doc.text('Nr. '+offerNo,M+CW,y,{align:'right'});
y+=14;
var sender=getSenderAddressLine(cs);
if(sender){
doc.setFont('helvetica','normal');
doc.setFontSize(8);
doc.setTextColor(107,114,128);
doc.text(sender,M,y);
y+=6
}
doc.setFontSize(10);
doc.setTextColor(31,41,55);
doc.setFont('helvetica','bold');
var addrY=y;
doc.text(off.customer||'-',M,y);
doc.setFont('helvetica','normal');
y+=5;
splitAddressLines(off.address||'').forEach(function(line){doc.text(line,M,y);y+=5});
var docDate=new Date(off.createdAt||Date.now()).toISOString().slice(0,10);
var validUntil=off.validUntil||addDaysIso(docDate,cs.zahlungsziel||14);
doc.setFontSize(9);doc.setTextColor(107,114,128);
doc.text('Datum:',M+CW,addrY,{align:'right'});
doc.setFontSize(10);doc.setTextColor(31,41,55);
doc.text(docDate,M+CW,addrY+5,{align:'right'});
doc.setFontSize(9);doc.setTextColor(107,114,128);
doc.text('Gültig bis:',M+CW,addrY+12,{align:'right'});
doc.setFontSize(10);doc.setTextColor(31,41,55);
doc.text(validUntil,M+CW,addrY+17,{align:'right'});
if(cs.steuernummer){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.text('St.-Nr: '+cs.steuernummer+(cs.ustId?' | USt-IdNr: '+cs.ustId:''),M+CW,addrY+24,{align:'right'})}
y+=2;
y+=10;
doc.setFontSize(9);
doc.setTextColor(107,114,128);
doc.setFont('helvetica','normal');
doc.text('Objekt: '+(off.object||'-'),M,y);
y+=13;
doc.setFont('helvetica','bold');
doc.setFontSize(19);
doc.setTextColor(31,41,55);
doc.text('Angebot',M,y);
y+=12;
doc.setFillColor(acc[0],acc[1],acc[2]);
doc.rect(M,y,CW,8,'F');
doc.setFontSize(8);
doc.setTextColor(255,255,255);
doc.setFont('helvetica','bold');
doc.text('Pos.',M+2,y+5.5);
doc.text('Beschreibung',M+15,y+5.5);
doc.text('Menge',M+100,y+5.5,{align:'right'});
doc.text('Einheit',M+115,y+5.5);
doc.text('EP',M+145,y+5.5,{align:'right'});
doc.text('Gesamt',M+CW-2,y+5.5,{align:'right'});
y+=10;
doc.setFont('helvetica','normal');
doc.setTextColor(31,41,55);
(off.services||[]).forEach(function(s,idx){
var lineQty=s.costType==='position'?(Number(s.quantity)||0):((function(){var q=Number(s.quantity);return(q>0)?q:1})());
var lineUnit=s.costType==='position'?(s.unit||'Pauschal'):(s.unit||'Pauschal');
var linePrice=s.costType==='position'?(Number(s.unitPrice)||0):(function(){var q=Number(s.quantity);if(!(q>0))q=1;var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;return isFinite(up)?up:0})();
var lineTotal=lineQty*linePrice;
var title=s.title||'';
var desc=s.description||'';
var descX=M+15;
var descW=72;
doc.setFontSize(9);
var titleLines=doc.splitTextToSize(String(title||''),descW);
if(!titleLines||!titleLines.length)titleLines=[''];
doc.setFontSize(7.5);
var descLines=desc?doc.splitTextToSize(String(desc||''),descW):[];
var mainH=Math.max(7,titleLines.length*4.5+2);
var extraH=descLines.length?(descLines.length*3.5+1):0;
if(y+mainH+extraH>268){doc.addPage();y=applyPdfLetterhead(doc,cs,W,M,cname,cline)}
doc.setFillColor(light[0],light[1],light[2]);
doc.rect(M,y-3,CW,mainH,'F');
doc.setFontSize(9);
doc.setTextColor(31,41,55);
doc.text(String(idx+1),M+2,y+1.5);
doc.text(titleLines,descX,y+1.5);
doc.text(String(lineQty),M+100,y+1.5,{align:'right'});
doc.text(lineUnit,M+115,y+1.5);
doc.text(fmtCur(linePrice),M+145,y+1.5,{align:'right'});
doc.setFont('helvetica','bold');
doc.text(fmtCur(lineTotal),M+CW-2,y+1.5,{align:'right'});
doc.setFont('helvetica','normal');
y+=mainH;
if(descLines.length){
doc.setFontSize(7.5);
doc.setTextColor(156,163,175);
doc.text(descLines,descX,y);
doc.setTextColor(31,41,55);
y+=extraH
}
});
if(y+38>268){doc.addPage();y=applyPdfLetterhead(doc,cs,W,M,cname,cline);}
y+=4;
doc.setDrawColor(acc[0],acc[1],acc[2]);
doc.setLineWidth(0.5);
doc.line(M+CW-60,y,M+CW,y);
y+=6;
doc.setFontSize(10);
doc.setTextColor(31,41,55);
doc.text('Netto:',M+CW-60,y);
doc.text(fmtCur(net),M+CW,y,{align:'right'});
y+=6;
if(isKU){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.text('Gem. \u00a719 UStG keine MwSt.',M+CW-60,y);y+=4}
else{doc.setFontSize(10);doc.setTextColor(31,41,55);doc.text('MwSt. ('+vatPct+'%):',M+CW-60,y);doc.text(fmtCur(vat),M+CW,y,{align:'right'});y+=3}
doc.setFillColor(acc[0],acc[1],acc[2]);
doc.rect(M+CW-62,y,62,10,'F');
doc.setFont('helvetica','bold');
doc.setFontSize(12);
doc.setTextColor(255,255,255);
doc.text(isKU?'Gesamt:':'Brutto:',M+CW-58,y+7);
doc.text(fmtCur(gross),M+CW-2,y+7,{align:'right'});
y+=16;
if(isKU){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.setFont('helvetica','normal');doc.text('Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).',M,y);y+=6}
doc.setFontSize(9);
doc.setTextColor(55,65,81);
doc.setFont('helvetica','normal');
doc.text((cs.offerFooterText||'Dieses Angebot ist freibleibend. Vielen Dank f\u00fcr Ihr Interesse.'),M,y);
var fy=280;
doc.setDrawColor(229,231,235);
doc.setLineWidth(0.3);
doc.line(M,fy,M+CW,fy);
doc.setFontSize(6.5);
doc.setTextColor(156,163,175);
doc.setFont('helvetica','normal');
var footer=getCompanyFooter();
if(footer.length>120){var sp=footer.lastIndexOf(' · ',119);if(sp<1)sp=120;doc.text(footer.substring(0,sp),W/2,fy+3.5,{align:'center'});doc.text(footer.substring(sp===120?120:sp+3),W/2,fy+7,{align:'center'})}
else{doc.text(footer,W/2,fy+4,{align:'center'})}
return await savePdfDocument(doc,'Angebot_'+offerNo+'.pdf')
}catch(e){alert('PDF Export fehlgeschlagen.');return}
}
async function exportOrderPDF(id){
try{
var o=orders.find(function(x){return x.id===id});
if(!o){alert('Auftrag nicht gefunden.');return}
if(!o.services||!o.services.filter(function(s){return s&&s.costType!=='prepayment'}).length){alert('Bitte zuerst mindestens eine Leistung erfassen.');return}
var cs=companyData||{};
var isKU=o.kleinunternehmer!==undefined?!!o.kleinunternehmer:!!cs.kleinunternehmer;
var vatRate=isKU?0:(cs.defaultVat||0.19);
var vatPct=Math.round(vatRate*100);
var cname=cs.firma||'Werkmeister Pro';
var cline=[cs.strasse,[cs.plz,cs.ort].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
if(cs.telefon)cline+=' · Tel: '+cs.telefon;
if(cs.email)cline+=' · '+cs.email;
var net=(o.services||[]).filter(function(s){return s&&s.costType!=='prepayment'}).reduce(function(sum,s){var q=s.costType==='position'?(Number(s.quantity)||0):((function(){var qv=Number(s.quantity);return(qv>0)?qv:1})());var p=s.costType==='position'?(Number(s.unitPrice)||0):(function(){var qv=Number(s.quantity);if(!(qv>0))qv=1;var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/qv;return isFinite(up)?up:0})();return sum+q*p},0);
var vat=isKU?0:net*vatRate;
var gross=net+vat;
var jsPDF=getJsPdfCtor();
if(!jsPDF){alert('PDF-Export nicht verfügbar.');return}
var doc=new jsPDF('p','mm','a4');
var W=210,M=20,CW=W-2*M;
var theme=getInvoiceThemeRgb(cs||{});
var acc=theme.accent||[8,145,178];
var light=mixRgb(acc,[255,255,255],0.9);
var y=applyPdfLetterhead(doc,cs,W,M,cname,cline);
var orderNo=getOrderNumberForPrint(o);
doc.setFont('helvetica','bold');
doc.setFontSize(11);
doc.setTextColor(107,114,128);
doc.text('Nr. '+orderNo,M+CW,y,{align:'right'});
y+=14;
var sender=getSenderAddressLine(cs);
if(sender){
doc.setFont('helvetica','normal');
doc.setFontSize(8);
doc.setTextColor(107,114,128);
doc.text(sender,M,y);
y+=6
}
doc.setFontSize(10);
doc.setTextColor(31,41,55);
doc.setFont('helvetica','bold');
var addrY=y;
doc.text(o.customer||'-',M,y);
doc.setFont('helvetica','normal');
y+=5;
splitAddressLines(o.address||'').forEach(function(line){doc.text(line,M,y);y+=5});
var docDate=new Date(o.createdAt||Date.now()).toISOString().slice(0,10);
var dueDate=addDaysIso(docDate,cs.zahlungsziel||14);
doc.setFontSize(9);doc.setTextColor(107,114,128);
doc.text('Datum:',M+CW,addrY,{align:'right'});
doc.setFontSize(10);doc.setTextColor(31,41,55);
doc.text(docDate,M+CW,addrY+5,{align:'right'});
doc.setFontSize(9);doc.setTextColor(107,114,128);
doc.text('Fällig bis:',M+CW,addrY+12,{align:'right'});
doc.setFontSize(10);doc.setTextColor(31,41,55);
doc.text(dueDate,M+CW,addrY+17,{align:'right'});
if(cs.steuernummer){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.text('St.-Nr: '+cs.steuernummer+(cs.ustId?' | USt-IdNr: '+cs.ustId:''),M+CW,addrY+24,{align:'right'})}
y+=2;
y+=10;
doc.setFontSize(9);
doc.setTextColor(107,114,128);
doc.setFont('helvetica','normal');
doc.text('Objekt: '+(o.object||'-'),M,y);
y+=13;
doc.setFont('helvetica','bold');
doc.setFontSize(19);
doc.setTextColor(31,41,55);
doc.text('Auftrag',M,y);
y+=12;
doc.setFillColor(acc[0],acc[1],acc[2]);
doc.rect(M,y,CW,8,'F');
doc.setFontSize(8);
doc.setTextColor(255,255,255);
doc.setFont('helvetica','bold');
doc.text('Pos.',M+2,y+5.5);
doc.text('Beschreibung',M+15,y+5.5);
doc.text('Menge',M+100,y+5.5,{align:'right'});
doc.text('Einheit',M+115,y+5.5);
doc.text('EP',M+145,y+5.5,{align:'right'});
doc.text('Gesamt',M+CW-2,y+5.5,{align:'right'});
y+=10;
doc.setFont('helvetica','normal');
doc.setTextColor(31,41,55);
(o.services||[]).filter(function(s){return s&&s.costType!=='prepayment'}).forEach(function(s,idx){
var lineQty=s.costType==='position'?(Number(s.quantity)||0):((function(){var q=Number(s.quantity);return(q>0)?q:1})());
var lineUnit=s.unit||'Pauschal';
var linePrice=s.costType==='position'?(Number(s.unitPrice)||0):(function(){var q=Number(s.quantity);if(!(q>0))q=1;var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;return isFinite(up)?up:0})();
var lineTotal=lineQty*linePrice;
var title=s.title||'';
var desc=s.description||'';
var descX=M+15;
var descW=72;
doc.setFontSize(9);
var titleLines=doc.splitTextToSize(String(title||''),descW);
if(!titleLines||!titleLines.length)titleLines=[''];
doc.setFontSize(7.5);
var descLines=desc?doc.splitTextToSize(String(desc||''),descW):[];
var mainH=Math.max(7,titleLines.length*4.5+2);
var extraH=descLines.length?(descLines.length*3.5+1):0;
if(y+mainH+extraH>268){doc.addPage();y=applyPdfLetterhead(doc,cs,W,M,cname,cline)}
doc.setFillColor(light[0],light[1],light[2]);
doc.rect(M,y-3,CW,mainH,'F');
doc.setFontSize(9);
doc.setTextColor(31,41,55);
doc.text(String(idx+1),M+2,y+1.5);
doc.text(titleLines,descX,y+1.5);
doc.text(String(lineQty),M+100,y+1.5,{align:'right'});
doc.text(lineUnit,M+115,y+1.5);
doc.text(fmtCur(linePrice),M+145,y+1.5,{align:'right'});
doc.setFont('helvetica','bold');
doc.text(fmtCur(lineTotal),M+CW-2,y+1.5,{align:'right'});
doc.setFont('helvetica','normal');
y+=mainH;
if(descLines.length){
doc.setFontSize(7.5);
doc.setTextColor(156,163,175);
doc.text(descLines,descX,y);
doc.setTextColor(31,41,55);
y+=extraH
}
});
if(y+38>268){doc.addPage();y=applyPdfLetterhead(doc,cs,W,M,cname,cline);}
y+=4;
doc.setDrawColor(acc[0],acc[1],acc[2]);
doc.setLineWidth(0.5);
doc.line(M+CW-60,y,M+CW,y);
y+=6;
doc.setFontSize(10);
doc.setTextColor(31,41,55);
doc.text('Netto:',M+CW-60,y);
doc.text(fmtCur(net),M+CW,y,{align:'right'});
y+=6;
if(isKU){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.text('Gem. §19 UStG keine MwSt.',M+CW-60,y);y+=4}
else{doc.setFontSize(10);doc.setTextColor(31,41,55);doc.text('MwSt. ('+vatPct+'%):',M+CW-60,y);doc.text(fmtCur(vat),M+CW,y,{align:'right'});y+=3}
doc.setFillColor(acc[0],acc[1],acc[2]);
doc.rect(M+CW-62,y,62,10,'F');
doc.setFont('helvetica','bold');
doc.setFontSize(12);
doc.setTextColor(255,255,255);
doc.text(isKU?'Gesamt:':'Brutto:',M+CW-58,y+7);
doc.text(fmtCur(gross),M+CW-2,y+7,{align:'right'});
y+=16;
if(isKU){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.setFont('helvetica','normal');doc.text('Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).',M,y);y+=6}
doc.setFontSize(9);
doc.setTextColor(55,65,81);
doc.setFont('helvetica','normal');
doc.text(cs.orderFooterText||'Vielen Dank für Ihren Auftrag.',M,y);
var fy=280;
doc.setDrawColor(229,231,235);
doc.setLineWidth(0.3);
doc.line(M,fy,M+CW,fy);
doc.setFontSize(6.5);
doc.setTextColor(156,163,175);
doc.setFont('helvetica','normal');
var footer=getCompanyFooter();
if(footer.length>120){var sp=footer.lastIndexOf(' · ',119);if(sp<1)sp=120;doc.text(footer.substring(0,sp),W/2,fy+3.5,{align:'center'});doc.text(footer.substring(sp===120?120:sp+3),W/2,fy+7,{align:'center'})}
else{doc.text(footer,W/2,fy+4,{align:'center'})}
return await savePdfDocument(doc,'Auftrag_'+orderNo+'.pdf')
}catch(e){alert('PDF Export fehlgeschlagen.');return}
}
async function buildInvoicePdfDoc(id){
try{
var inv=invoices.find(function(i){return i.id===id});
if(!inv){alert('Rechnung nicht gefunden.');return null}
if(inv.status==='draft'){alert('Bitte zuerst finalisieren.');return null}
var cs=inv.companySnapshot||companyData;
var theme=getInvoiceThemeRgb(cs||{});
var acc=theme.accent||[8,145,178];
var light=mixRgb(acc,[255,255,255],0.9);
var border=mixRgb(acc,[255,255,255],0.72);
var cname=cs.firma||'Werkmeister Pro';
var cline=[cs.strasse,[cs.plz,cs.ort].filter(Boolean).join(' ')].filter(Boolean).join(' \u00b7 ');
if(cs.telefon)cline+=' \u00b7 Tel: '+cs.telefon;
if(cs.email)cline+=' \u00b7 '+cs.email;
var isKU=inv.kleinunternehmer;
var vatPct=Math.round((inv.vatRate||0)*100);
var jsPDF=getJsPdfCtor();
if(!jsPDF){alert('PDF-Export nicht verfügbar.');return}
var doc=new jsPDF('p','mm','a4');
var W=210,M=20,CW=W-2*M;
var y=applyPdfLetterhead(doc,cs,W,M,cname,cline);
doc.setFont('helvetica','bold');
doc.setFontSize(11);
doc.setTextColor(107,114,128);
doc.text('Nr. '+inv.number,M+CW,y,{align:'right'});
y+=14;
var sender=getSenderAddressLine(cs);
if(sender){
doc.setFont('helvetica','normal');
doc.setFontSize(8);
doc.setTextColor(107,114,128);
doc.text(sender,M,y);
y+=6
}
doc.setFontSize(10);
doc.setTextColor(31,41,55);
doc.setFont('helvetica','normal');
var addrY=y;
if(inv.customerSalutation){doc.text(inv.customerSalutation,M,y);y+=5}
if(inv.customerCompany){doc.setFont('helvetica','bold');doc.text(inv.customerCompany,M,y);doc.setFont('helvetica','normal');y+=5}
var invNm=[inv.customerFirstName,inv.customerLastName].filter(Boolean).join(' ');
if(invNm){doc.text(invNm,M,y);y+=5}
splitAddressLines(inv.customerAddress||'').forEach(function(line){doc.text(line,M,y);y+=5});
doc.setFontSize(9);doc.setTextColor(107,114,128);
doc.text('Rechnungsdatum:',M+CW,addrY,{align:'right'});
doc.setFontSize(10);doc.setTextColor(31,41,55);
doc.text(inv.issueDate,M+CW,addrY+5,{align:'right'});
doc.setFontSize(9);doc.setTextColor(107,114,128);
doc.text(inv.dueDate==='sofort'?'F\u00e4lligkeit:':'F\u00e4llig bis:',M+CW,addrY+12,{align:'right'});
doc.setFontSize(10);doc.setTextColor(31,41,55);
doc.text(inv.dueDate==='sofort'?'Sofort':inv.dueDate,M+CW,addrY+17,{align:'right'});
if(cs.steuernummer){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.text('St.-Nr: '+cs.steuernummer+(cs.ustId?' | USt-IdNr: '+cs.ustId:''),M+CW,addrY+24,{align:'right'})}
y+=2;
y+=10;
doc.setFontSize(9);
doc.setTextColor(107,114,128);
doc.setFont('helvetica','normal');
doc.text('Objekt: '+inv.object,M,y);
y+=13;
doc.setFont('helvetica','bold');
doc.setFontSize(19);
doc.setTextColor(31,41,55);
doc.text('Rechnung',M,y);
y+=12;
doc.setFillColor(acc[0],acc[1],acc[2]);
doc.rect(M,y,CW,8,'F');
doc.setFontSize(8);
doc.setTextColor(255,255,255);
doc.setFont('helvetica','bold');
doc.text('Pos.',M+2,y+5.5);
doc.text('Beschreibung',M+15,y+5.5);
doc.text('Menge',M+100,y+5.5,{align:'right'});
doc.text('Einheit',M+115,y+5.5);
doc.text('EP',M+145,y+5.5,{align:'right'});
doc.text('Gesamt',M+CW-2,y+5.5,{align:'right'});
y+=10;
doc.setFont('helvetica','normal');
doc.setTextColor(31,41,55);
var allLines=inv.lines||[];
var firstVorausIdx=allLines.findIndex(function(l){return(Number(l.lineTotal)||0)<0||(Number(l.unitPrice)||0)<0});
var firstMaterialIdx=allLines.findIndex(function(l){return l.costType==='material'});
allLines.forEach(function(l,idx){
var isVoraus=(Number(l.lineTotal)||0)<0||(Number(l.unitPrice)||0)<0;
var title=l.title||'';
var desc=l.description||'';
var descX=M+15;
var descW=72;
doc.setFontSize(9);
var titleLines=doc.splitTextToSize(String(title||''),descW);
if(!titleLines||!titleLines.length)titleLines=[''];
doc.setFontSize(7.5);
var descLines=desc?doc.splitTextToSize(String(desc||''),descW):[];
var mainH=Math.max(7,titleLines.length*4.5+2);
var extraH=descLines.length?(descLines.length*3.5+1):0;
var isMatHdr=l.costType==='material'&&idx===firstMaterialIdx&&idx>0;
var isVzHdr=isVoraus&&idx===firstVorausIdx&&idx>0;
var hdrH=(isMatHdr||isVzHdr)?10:0;
if(y+hdrH+mainH+extraH>268){doc.addPage();y=applyPdfLetterhead(doc,cs,W,M,cname,cline)}
if(isMatHdr){
y+=2;
doc.setDrawColor(109,40,217);doc.setLineWidth(0.25);doc.line(M,y,M+CW,y);
y+=3;
doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(109,40,217);
doc.text('MATERIALBEDARF',M,y);
y+=4;
doc.setFont('helvetica','normal');doc.setTextColor(31,41,55);
}
if(isVzHdr){
y+=2;
doc.setDrawColor(180,83,9);doc.setLineWidth(0.25);doc.line(M,y,M+CW,y);
y+=3;
doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(180,83,9);
doc.text('VORAUSZAHLUNGEN',M,y);
y+=4;
doc.setFont('helvetica','normal');doc.setTextColor(31,41,55);
}
if(isVoraus){
doc.setFillColor(254,243,199);
}else if(l.costType==='material'){
doc.setFillColor(237,233,254);
}else{
doc.setFillColor(light[0],light[1],light[2]);
}
doc.rect(M,y-3,CW,mainH,'F');
doc.setFontSize(9);
if(isVoraus){doc.setTextColor(146,64,14);}else if(l.costType==='material'){doc.setTextColor(109,40,217);}else{doc.setTextColor(31,41,55);}
doc.text(String(l.pos),M+2,y+1.5);
doc.text(titleLines,descX,y+1.5);
doc.text(String(l.qty),M+100,y+1.5,{align:'right'});
doc.text(l.unit||'',M+115,y+1.5);
doc.text(fn(l.unitPrice),M+145,y+1.5,{align:'right'});
doc.setFont('helvetica','bold');
doc.text(fn(l.lineTotal),M+CW-2,y+1.5,{align:'right'});
doc.setFont('helvetica','normal');
doc.setTextColor(31,41,55);
y+=mainH;
if(descLines.length){
doc.setFontSize(7.5);
doc.setTextColor(isVoraus?180:156,isVoraus?83:163,isVoraus?9:175);
doc.text(descLines,descX,y);
doc.setTextColor(31,41,55);
y+=extraH
}
});
if(y+38>268){doc.addPage();y=applyPdfLetterhead(doc,cs,W,M,cname,cline);}
y+=4;
doc.setDrawColor(acc[0],acc[1],acc[2]);
doc.setLineWidth(0.5);
doc.line(M+CW-60,y,M+CW,y);
y+=6;
doc.setFontSize(10);
doc.setTextColor(31,41,55);
doc.text('Netto:',M+CW-60,y);
doc.text(fn(inv.netTotal)+' \u20ac',M+CW,y,{align:'right'});
y+=6;
if(isKU){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.text('Gem. \u00a719 UStG keine MwSt.',M+CW-60,y);y+=4}
else{doc.text('MwSt. ('+vatPct+'%):',M+CW-60,y);doc.text(fn(inv.vatTotal)+' \u20ac',M+CW,y,{align:'right'});y+=3}
doc.setFillColor(acc[0],acc[1],acc[2]);
doc.rect(M+CW-62,y,62,10,'F');
doc.setFont('helvetica','bold');
doc.setFontSize(12);
doc.setTextColor(255,255,255);
doc.text(isKU?'Gesamt:':'Brutto:',M+CW-58,y+7);
doc.text(fn(inv.grossTotal)+' \u20ac',M+CW-2,y+7,{align:'right'});
y+=16;
if(isKU){doc.setFontSize(8);doc.setTextColor(107,114,128);doc.setFont('helvetica','normal');doc.text('Gem\u00e4\u00df \u00a719 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).',M,y);y+=6}
var ftxt=cs.invFooterText||(inv.dueDate==='sofort'?'Zahlbar sofort ohne Abzug.':'Zahlbar innerhalb von '+(cs.zahlungsziel||14)+' Tagen ohne Abzug.');
doc.setFontSize(9);
doc.setTextColor(55,65,81);
doc.setFont('helvetica','normal');
doc.text(ftxt,M,y);
y+=6;
if(inv.bankAccount&&inv.bankAccount.iban){
if(y>242){doc.addPage();y=applyPdfLetterhead(doc,cs,W,M,cname,cline);y+=5}
doc.setDrawColor(acc[0],acc[1],acc[2]);doc.setLineWidth(0.5);doc.line(M,y,M+CW,y);y+=4;
doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(acc[0],acc[1],acc[2]);
doc.text('BANKVERBINDUNG',M,y);y+=5;
var baRows=[];if(inv.bankAccount.owner)baRows.push({k:'Kontoinhaber',v:inv.bankAccount.owner});if(inv.bankAccount.bank)baRows.push({k:'Bank',v:inv.bankAccount.bank});baRows.push({k:'IBAN',v:inv.bankAccount.iban});if(inv.bankAccount.bic)baRows.push({k:'BIC',v:inv.bankAccount.bic});baRows.push({k:'Verwendungszweck',v:inv.number||''});
var boxH=baRows.length*6+5;
doc.setFillColor(light[0],light[1],light[2]);doc.setDrawColor(border[0],border[1],border[2]);doc.setLineWidth(0.25);
doc.roundedRect(M,y,CW,boxH,2,2,'FD');
var ry=y+4.5;
baRows.forEach(function(row){doc.setFontSize(8.5);doc.setFont('helvetica','bold');doc.setTextColor(100,116,139);doc.text(row.k+':',M+4,ry);doc.setFont('helvetica','normal');doc.setTextColor(30,41,59);doc.text(String(row.v),M+50,ry);ry+=6});
y+=boxH+4;
}
var fy=280;
doc.setDrawColor(229,231,235);
doc.setLineWidth(0.3);
doc.line(M,fy,M+CW,fy);
doc.setFontSize(6.5);
doc.setTextColor(156,163,175);
doc.setFont('helvetica','normal');
var footer=getCompanyFooter();
if(footer.length>120){var sp=footer.lastIndexOf(' · ',119);if(sp<1)sp=120;doc.text(footer.substring(0,sp),W/2,fy+3.5,{align:'center'});doc.text(footer.substring(sp===120?120:sp+3),W/2,fy+7,{align:'center'})}
else{doc.text(footer,W/2,fy+4,{align:'center'})}
return {doc:doc,inv:inv}
}catch(e){console.error('buildInvoicePdfDoc',e);return null}
}
function getCompanyLine(){var p=[];if(companyData.strasse)p.push(companyData.strasse);if(companyData.plz||companyData.ort)p.push([companyData.plz,companyData.ort].filter(Boolean).join(' '));if(companyData.telefon)p.push('Tel: '+companyData.telefon);if(companyData.email)p.push(companyData.email);return p.join(' \u00b7 ')}
function getCompanyFooter(){var p=[];if(companyData.firma)p.push(companyData.firma);if(companyData.inhaber)p.push('Inh. '+companyData.inhaber);if(companyData.strasse)p.push(companyData.strasse);if(companyData.plz||companyData.ort)p.push([companyData.plz,companyData.ort].filter(Boolean).join(' '));if(companyData.finanzamt)p.push('Finanzamt: '+companyData.finanzamt);if(companyData.steuernummer)p.push('St.-Nr: '+companyData.steuernummer);if(companyData.ustId)p.push('USt-IdNr: '+companyData.ustId);var hr=String(companyData.handelsregister||'').trim();if(hr&&hr.toLowerCase().indexOf('inhaber')===-1)p.push(hr);return p.join(' \u00b7 ')}
function splitAddressLines(addr){var s=String(addr||'').replace(/\r/g,'').trim();if(!s)return[];return s.split(/\n|,/).map(function(x){return String(x||'').trim()}).filter(Boolean)}
function getCompanyFooterFrom(cs){cs=cs||{};var p=[];if(cs.firma)p.push(cs.firma);if(cs.inhaber)p.push('Inh. '+cs.inhaber);if(cs.strasse)p.push(cs.strasse);if(cs.plz||cs.ort)p.push([cs.plz,cs.ort].filter(Boolean).join(' '));if(cs.finanzamt)p.push('Finanzamt: '+cs.finanzamt);if(cs.steuernummer)p.push('St.-Nr: '+cs.steuernummer);if(cs.ustId)p.push('USt-IdNr: '+cs.ustId);var hr=String(cs.handelsregister||'').trim();if(hr&&hr.toLowerCase().indexOf('inhaber')===-1)p.push(hr);return p.join(' \u00b7 ')}
function getOfferNumberForPrint(o){var cs=companyData||{};var offerPrefix=(cs.offerPrefix||'AN-').trim()||'AN-';return offerPrefix+String((o&&o.createdAt)||Date.now()).slice(-6)}
function getOrderNumberForPrint(o){return'AU-'+String((o&&o.createdAt)||Date.now()).slice(-6)}
function servicesToPrintLines(services){services=ensureArray(services);return services.map(function(s,idx){var ct=(s&&s.costType)||'position';var qty=ct==='position'?(Number(s.quantity)||0):((function(){var q=Number(s&&s.quantity);return(q>0)?q:1})());var unit=ct==='position'?(s.unit||'Pauschal'):(s.unit||'Pauschal');var up=ct==='position'?(Number(s.unitPrice)||0):(function(){var q=Number(s&&s.quantity);if(!(q>0))q=1;var u=Number(s&&s.unitPrice);var mc=Number(s&&s.materialCost||0);if((!isFinite(u)||u<=0)&&mc>0)u=mc/q;return isFinite(u)?u:0})();var total=qty*up;return{pos:idx+1,title:(s&&s.title)||'',description:(s&&s.description)||'',qty:qty,unit:unit,unitPrice:up,lineTotal:total,costType:ct}})}
function buildPrintTableRows(lines){var out='';var matHdrShown=false;ensureArray(lines).forEach(function(l){if(l.costType==='material'&&!matHdrShown){matHdrShown=true;out+='<tr class="print-section-header"><td colspan="6">MATERIALBEDARF</td></tr>';}out+='<tr'+(l.costType==='material'?' class="print-row-material"':'')+'><td class="print-col-pos">'+esc(String(l.pos||''))+'</td><td class="print-desc">'+esc(l.title||'')+(l.description?'<span class="sub">'+esc(l.description)+'</span>':'')+'</td><td class="print-col-qty">'+esc(fmtNum(l.qty))+'</td><td class="print-col-unit">'+esc(l.unit||'')+'</td><td class="print-col-up">'+esc(fmtCur(l.unitPrice))+'</td><td class="print-col-total">'+esc(fmtCur(l.lineTotal))+'</td></tr>';});return out;}
function setPrintRootHtml(html){var root=document.getElementById('printRoot');if(!root)return;root.innerHTML=html}
function runPrint(){if(!window.__printAfterBound){window.__printAfterBound=true;window.addEventListener('afterprint',function(){var root=document.getElementById('printRoot');if(root)root.innerHTML=''})}requestAnimationFrame(function(){setTimeout(function(){window.print()},50)})}
function buildPrintHtml2(doc){
doc=doc||{};
var cs=doc.companySnapshot||doc.company||companyData||{};
var theme=getInvoiceThemeHex(cs);
var vars='--doc-accent:'+theme.accent+';--doc-accent2:'+theme.secondary+';';
var sender=getSenderAddressLine(cs);
var recip=ensureArray(doc.recipientLines);
var meta=ensureArray(doc.metaRows);
var footer=getCompanyFooterFrom(cs)||getCompanyFooter()||'';
var rowsHtml=buildPrintTableRows(doc.lines||[]);
var vatPct=Math.round((doc.vatRate||0)*100);
var vatLine=doc.isKU?'<div class="print-summary-row"><span>MwSt.</span><span>0,00 EUR</span></div>':'<div class="print-summary-row"><span>MwSt. '+vatPct+'%</span><span>'+esc(fmtCur(doc.vatTotal||0))+'</span></div>';
var payDue=doc.paymentDue||doc.metaDue||'';
var payText=doc.paymentText||('Bitte überweisen Sie den Gesamtbetrag'+(payDue?' bis zum '+esc(payDue):'')+' auf folgendes Konto:');
var bankRows=[];
if(doc.bankAccount&&doc.bankAccount.iban){if(doc.bankAccount.owner)bankRows.push({k:'Kontoinhaber',v:doc.bankAccount.owner});bankRows.push({k:'IBAN',v:doc.bankAccount.iban});if(doc.bankAccount.bic)bankRows.push({k:'BIC',v:doc.bankAccount.bic});if(doc.bankAccount.bank)bankRows.push({k:'Bank',v:doc.bankAccount.bank});if(doc.invoiceNumber)bankRows.push({k:'Verwendungszweck',v:doc.invoiceNumber})}
else if(cs.iban){if(cs.firma)bankRows.push({k:'Empfänger',v:cs.firma});if(cs.bank)bankRows.push({k:'Bank',v:cs.bank});bankRows.push({k:'IBAN',v:cs.iban});if(cs.bic)bankRows.push({k:'BIC',v:cs.bic})}
var bankHtml=bankRows.map(function(r){return'<div class="k">'+esc(r.k)+'</div><div>'+esc(r.v)+'</div>'}).join('');
return ''+
'<div class="print-doc" style="'+escAttr(vars)+'">'+
'<div class="print-header">'+
'<div class="print-left">'+
'<div class="print-sender-line">'+esc(sender)+'</div>'+
'<div class="print-sender-sep"></div>'+
'<div class="print-recipient">'+recip.map(function(x){return'<div>'+esc(x)+'</div>'}).join('')+'</div>'+
'</div>'+
'<div class="print-right">'+
'<div class="print-doctype">'+esc(doc.type||'')+'</div>'+
'<div class="print-meta">'+meta.map(function(r){return'<div class="print-meta-row"><div class="lbl">'+esc(r.label||'')+'</div><div class="val">'+esc(r.value||'')+'</div></div>'}).join('')+'</div>'+
'</div>'+
'</div>'+
'<div class="print-subject">'+esc(doc.subject||'')+'</div>'+
'<table class="print-table">'+
'<thead><tr>'+
'<th class="print-col-pos">Pos.</th>'+
'<th>Bezeichnung</th>'+
'<th class="print-col-qty">Menge</th>'+
'<th class="print-col-unit">Einheit</th>'+
'<th class="print-col-up">Einzelpreis</th>'+
'<th class="print-col-total">Gesamt</th>'+
'</tr></thead>'+
'<tbody>'+rowsHtml+'</tbody>'+
'</table>'+
'<div class="print-summary"><div class="print-summary-box">'+
'<div class="print-summary-row"><span>Netto</span><span>'+esc(fmtCur(doc.netTotal||0))+'</span></div>'+
vatLine+
'<div class="print-summary-row total"><span>Gesamt</span><span>'+esc(fmtCur(doc.grossTotal||0))+'</span></div>'+
'</div></div>'+
'<div class="print-payment">'+
'<div class="print-payment-title">Zahlungshinweis</div>'+
'<div>'+payText+'</div>'+
(bankHtml?'<div class="print-bank">'+bankHtml+'</div>':'')+
'</div>'+
'</div>'+
'<div class="print-footer">'+esc(footer)+'</div>'
}
function buildPrintHtml(doc){doc=doc||{};var cs=doc.companySnapshot||doc.company||companyData||{};var sender=getSenderAddressLine(cs);var recip=ensureArray(doc.recipientLines);var meta=ensureArray(doc.metaRows);var footer=getCompanyFooterFrom(cs)||getCompanyFooter()||'';var rowsHtml=buildPrintTableRows(doc.lines||[]);var vatPct=Math.round((doc.vatRate||0)*100);var vatLine=(doc.isKU?'<div class="print-summary-row"><span>MwSt.</span><span>0,00 EUR</span></div>':'<div class="print-summary-row"><span>MwSt. '+vatPct+'%</span><span>'+esc(fmtCur(doc.vatTotal||0))+'</span></div>');var payDue=doc.paymentDue||doc.metaDue||'';var payText=doc.paymentText||('Bitte überweisen Sie den Gesamtbetrag'+(payDue?' bis zum '+esc(payDue):'')+' auf folgendes Konto:');var bankRows=[];if(doc.bankAccount&&doc.bankAccount.iban){bankRows.push({k:'IBAN',v:doc.bankAccount.iban});if(doc.bankAccount.bic)bankRows.push({k:'BIC',v:doc.bankAccount.bic});if(doc.bankAccount.bank)bankRows.push({k:'Bank',v:doc.bankAccount.bank});if(doc.invoiceNumber)bankRows.push({k:'Verwendungszweck',v:doc.invoiceNumber})}else if(cs.iban){if(cs.firma)bankRows.push({k:'Empf\u00e4nger',v:cs.firma});if(cs.bank)bankRows.push({k:'Bank',v:cs.bank});bankRows.push({k:'IBAN',v:cs.iban});if(cs.bic)bankRows.push({k:'BIC',v:cs.bic})}var bankHtml=bankRows.map(function(r){return'<div class="k">'+esc(r.k)+'</div><div>'+esc(r.v)+'</div>'}).join('');return'<div class="print-doc"><div class="print-header"><div class="print-left"><div class="print-sender-line">'+esc(sender)+'</div><div class="print-sender-sep"></div><div class="print-recipient">'+recip.map(function(x){return'<div>'+esc(x)+'</div>'}).join('')+'</div></div><div class="print-right"><div class="print-doctype">'+esc(doc.type||'')+'</div><div class="print-meta">'+meta.map(function(r){return'<div class="print-meta-row"><div class="lbl">'+esc(r.label||'')+'</div><div class="val">'+esc(r.value||'')+'</div></div>'}).join('')+'</div></div></div><div class="print-subject">'+esc(doc.subject||'')+'</div><table class="print-table"><thead><tr><th class="print-col-pos">Pos.</th><th>Bezeichnung</th><th class="print-col-qty">Menge</th><th class="print-col-unit">Einheit</th><th class="print-col-up">Einzelpreis</th><th class="print-col-total">Gesamt</th></tr></thead><tbody>'+rowsHtml+'</tbody></table><div class="print-summary"><div class="print-summary-box"><div class="print-summary-row"><span>Netto</span><span>'+esc(fmtCur(doc.netTotal||0))+'</span></div>'+vatLine+'<div class="print-summary-row total"><span>Gesamt</span><span>'+esc(fmtCur(doc.grossTotal||0))+'</span></div></div></div><div class="print-payment"><div class="print-payment-title">Zahlungshinweis</div><div>'+payText+'</div>'+(bankHtml?'<div class="print-bank">'+bankHtml+'</div>':'')+'</div></div><div class="print-footer">'+esc(footer)+'</div>'}
function printInvoice(id){var inv=invoices.find(function(i){return i.id===id});if(!inv){alert('Rechnung nicht gefunden.');return}if(inv.status==='draft'){alert('Bitte Rechnung zuerst finalisieren.');return}if(hasCustomTemplate&&hasCustomTemplate('invoice')){printWithDocTemplate('invoice',inv);return}var cs=inv.companySnapshot||companyData||{};var recip=[];if(inv.customerSalutation)recip.push(inv.customerSalutation);if(inv.customerCompany)recip.push(inv.customerCompany);var nm=[inv.customerFirstName,inv.customerLastName].filter(Boolean).join(' ');if(nm)recip.push(nm);recip=recip.concat(splitAddressLines(inv.customerAddress||''));var lines=ensureArray(inv.lines).map(function(l){return{pos:l.pos,title:l.title||'',description:l.description||'',qty:l.qty,unit:l.unit||'',unitPrice:l.unitPrice||0,lineTotal:l.lineTotal||0}});var doc={type:'RECHNUNG',subject:inv.object||'Leistungen',companySnapshot:cs,recipientLines:recip,metaRows:[{label:'Nr.',value:inv.number||''},{label:'Datum',value:inv.issueDate||''},{label:'Fällig',value:inv.dueDate==='sofort'?'Sofort':inv.dueDate||''}],metaDue:inv.dueDate||'',lines:lines,netTotal:inv.netTotal||0,vatRate:inv.vatRate||0,vatTotal:inv.vatTotal||0,grossTotal:inv.grossTotal||0,isKU:!!inv.kleinunternehmer,paymentDue:inv.dueDate||'',bankAccount:inv.bankAccount||null,invoiceNumber:inv.number||''};setPrintRootHtml(buildPrintHtml2(doc));runPrint()}
function printOffer(id){var off=offers.find(function(o){return o.id===id});if(!off){alert('Angebot nicht gefunden.');return}if(!off.services||!off.services.length){alert('Bitte zuerst mindestens eine Leistung erfassen.');return}if(hasCustomTemplate&&hasCustomTemplate('offer')){var _cs=companyData||{};var _isKU=!!_cs.kleinunternehmer;var _vr=_isKU?0:(_cs.defaultVat||0.19);var _dt=new Date(off.createdAt||Date.now()).toISOString().slice(0,10);printWithDocTemplate('offer',{company:_cs,customer:off.customer||'-',address:off.address||'',services:off.services,nummer:getOfferNumberForPrint(off),datum:_dt,faelligBis:off.validUntil||addDaysIso(_dt,_cs.zahlungsziel||14),titel:off.object||'',isKU:_isKU,vatRate:_vr,fusstext:_cs.offerFooterText||''});return}var cs=companyData||{};var recip=[off.customer||'-'].concat(splitAddressLines(off.address||''));var lines=servicesToPrintLines(off.services||[]);var isKU=!!cs.kleinunternehmer;var vatRate=isKU?0:(cs.defaultVat||0.19);var net=calcTotal(off);var vat=isKU?0:(net*vatRate);var gross=net+vat;var docDate=new Date(off.createdAt||Date.now()).toISOString().slice(0,10);var due=off.validUntil||addDaysIso(docDate,cs.zahlungsziel||14);var doc={type:'ANGEBOT',subject:off.object||'Leistungen',company:cs,recipientLines:recip,metaRows:[{label:'Nr.',value:getOfferNumberForPrint(off)},{label:'Datum',value:docDate},{label:'Fällig',value:due}],metaDue:due,lines:lines,netTotal:net,vatRate:vatRate,vatTotal:vat,grossTotal:gross,isKU:isKU,paymentDue:due};setPrintRootHtml(buildPrintHtml2(doc));runPrint()}
function printOrder(id){var o=orders.find(function(x){return x.id===id});if(!o){alert('Auftrag nicht gefunden.');return}if(!o.services||!o.services.length){alert('Bitte zuerst mindestens eine Leistung erfassen.');return}if(hasCustomTemplate&&hasCustomTemplate('order')){var _cs=companyData||{};var _isKU=!!_cs.kleinunternehmer;var _vr=_isKU?0:(_cs.defaultVat||0.19);var _dt=new Date(o.createdAt||Date.now()).toISOString().slice(0,10);printWithDocTemplate('order',{company:_cs,customer:o.customer||'-',address:o.address||'',services:o.services,nummer:getOrderNumberForPrint(o),datum:_dt,faelligBis:addDaysIso(_dt,_cs.zahlungsziel||14),titel:o.object||'',isKU:_isKU,vatRate:_vr});return}var cs=companyData||{};var recip=[o.customer||'-'].concat(splitAddressLines(o.address||''));var lines=servicesToPrintLines(o.services||[]);var isKU=!!cs.kleinunternehmer;var vatRate=isKU?0:(cs.defaultVat||0.19);var net=calcTotal(o);var vat=isKU?0:(net*vatRate);var gross=net+vat;var docDate=new Date(o.createdAt||Date.now()).toISOString().slice(0,10);var due=addDaysIso(docDate,cs.zahlungsziel||14);var doc={type:'AUFTRAG',subject:o.object||'Leistungen',company:cs,recipientLines:recip,metaRows:[{label:'Nr.',value:getOrderNumberForPrint(o)},{label:'Datum',value:docDate},{label:'Fällig',value:due}],metaDue:due,lines:lines,netTotal:net,vatRate:vatRate,vatTotal:vat,grossTotal:gross,isKU:isKU,paymentDue:due};setPrintRootHtml(buildPrintHtml2(doc));runPrint()}
function getSenderAddressLine(cs){cs=cs||companyData||{};var p=[];if(cs.firma)p.push(cs.firma);if(cs.strasse)p.push(cs.strasse);var city=[cs.plz,cs.ort].filter(Boolean).join(' ');if(city)p.push(city);return p.join(' \u00b7 ')}
function getOfferNumber(off){var p=(companyData&&companyData.offerPrefix?companyData.offerPrefix:'AN-').trim()||'AN-';return p+String((off&&off.createdAt)||Date.now()).slice(-6)}
