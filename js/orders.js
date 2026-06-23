function getOrderPhotoPublicUrl(storagePath){
  return '';
}
function cloneOrderPhotos(photos){
  photos=photos||{before:[],after:[]};
  return{before:ensureArray(photos.before).map(function(p){return Object.assign({},p)}),after:ensureArray(photos.after).map(function(p){return Object.assign({},p)})};
}
function resetOrderPhotoDraft(){
  orderPhotoDraft={before:[],after:[]};
}
function setOrderPhotoDraftFromEntity(o){
  orderPhotoDraft=cloneOrderPhotos(o&&o.photos?o.photos:{before:[],after:[]});
}
function collectOrderPhotoStoragePaths(photos){
  var paths=[];
  ensureArray(photos&&photos.before).forEach(function(p){if(p&&p.storagePath)paths.push(p.storagePath);});
  ensureArray(photos&&photos.after).forEach(function(p){if(p&&p.storagePath)paths.push(p.storagePath);});
  return paths;
}
async function removeOrderPhotoStoragePaths(paths){
  return;
}
async function syncOrderPhotosToStorage(entityId,photos,oldPhotos){
  return cloneOrderPhotos(photos);
}
function populateCustomerSelect(sel){sel=sel||'';var s=document.getElementById('orderCustomerSelect');s.innerHTML='<option value="">-- Kunde --</option>';customers.sort(function(a,b){return(a.company||a.lastName||'').localeCompare(b.company||b.lastName||'')}).forEach(function(c){var n=c.company?c.company+([c.firstName,c.lastName].filter(Boolean).length?' ('+[c.firstName,c.lastName].filter(Boolean).join(' ')+')':''):[c.firstName,c.lastName].filter(Boolean).join(' ');var o=document.createElement('option');o.value=c.id;o.textContent=n;if(c.id===sel)o.selected=true;s.appendChild(o)})}
function onCustomerSelected(){var id=document.getElementById('orderCustomerSelect').value,info=document.getElementById('orderCustomerInfo');if(id){var c=customers.find(function(x){return x.id===id});if(c){var p=[];if(c.street)p.push(c.street);if(c.zip||c.city)p.push([c.zip,c.city].filter(Boolean).join(' '));if(c.phone)p.push('Tel: '+c.phone);if(c.email)p.push(c.email);info.textContent=p.join(' \u00b7 ');info.classList.toggle('hidden',!p.length)}}else info.classList.add('hidden')}
function toggleOrderAddress(){document.getElementById('orderAddressFields').classList.toggle('hidden',!document.getElementById('orderDifferentAddress').checked)}
function openNewCustomerFromOrder(){pendingOrderReturn=true;pendingEntityType=document.getElementById('orderEntityType').value||'order';hideOrderModal();showCustomerModal()}
function getArticleLabel(a){var parts=[a.title||''];if(a.sku)parts.push('['+a.sku+']');if(a.costType==='material')parts.push('Material');if(Number(a.price||0)>0)parts.push(fmtCur(a.price));return parts.filter(Boolean).join(' · ')}
function populateServiceArticleSelect(selectedId){selectedId=selectedId||'';var sel=document.getElementById('serviceArticleSelect');if(!sel)return;articles=ensureArray(articles);sel.innerHTML='<option value="">-- Manuell eingeben --</option>';articles.sort(function(a,b){return(a.title||'').localeCompare(b.title||'')}).forEach(function(a){var o=document.createElement('option');o.value=a.id;o.textContent=getArticleLabel(a);if(a.id===selectedId)o.selected=true;sel.appendChild(o)})}
function applySelectedArticleToService(){var sel=document.getElementById('serviceArticleSelect');if(!sel||!sel.value)return;articles=ensureArray(articles);var a=articles.find(function(x){return x.id===sel.value});if(!a)return;document.getElementById('serviceTitle').value=a.title||'';document.getElementById('serviceDescription').value=a.description||'';document.getElementById('serviceCostType').value=a.costType||'position';updateCostTypeFields(false);if((a.costType||'position')==='position'){document.getElementById('serviceQuantity').value=String(a.quantity!=null?a.quantity:1);document.getElementById('serviceUnit').value=a.unit||'Pauschal';document.getElementById('serviceUnitPrice').value=String(a.price||0)}else{document.getElementById('serviceQuantity').value=String(a.quantity!=null?a.quantity:1);document.getElementById('serviceUnit').value=a.unit||'Pauschal';document.getElementById('serviceUnitPrice').value=String(a.price||0)}calculateServicePrice()}
function getEntityList(type){offers=ensureArray(offers).map(normalizeOrderServices);orders=ensureArray(orders).map(normalizeOrderServices);if(type==='template')return ensureArray(templates);return type==='offer'?offers:orders}
function showOrderModal(oid){showEntityModal('order',oid)}
function showOfferModal(oid){showEntityModal('offer',oid)}
function showEntityModal(type,id){
id=id||null;
var isOffer=type==='offer';
document.getElementById('orderModalTitle').textContent=id?(isOffer?'Angebot bearbeiten':'Auftrag bearbeiten'):(isOffer?'Neues Angebot':'Neuer Auftrag');
document.getElementById('orderForm').reset();
document.getElementById('orderId').value='';
document.getElementById('orderEntityType').value=type;
document.getElementById('orderCustomerInfo').classList.add('hidden');
document.getElementById('orderDifferentAddress').checked=false;
document.getElementById('orderAddressFields').classList.add('hidden');
var photoSec=document.getElementById('orderPhotoSection');
if(photoSec)photoSec.style.display=isOffer?'none':'block';
var ppSec=document.getElementById('orderPrepaymentsSection');
if(ppSec)ppSec.style.display='none';
renderOrderPrepayments([]);
resetOrderPhotoDraft();
populateCustomerSelect();
var _kuel=document.getElementById('orderKleinunternehmer');
if(_kuel){_kuel.checked=!!(companyData&&companyData.kleinunternehmer)}
var _kueh=document.getElementById('orderKUHint');
if(_kueh)_kueh.style.display=(_kuel&&_kuel.checked)?'block':'none';
if(id){
var list=getEntityList(type);
var o=list.find(function(x){return x.id===id});
if(o){
document.getElementById('orderId').value=o.id;
document.getElementById('orderObject').value=o.object;
if(o.customerId){populateCustomerSelect(o.customerId);onCustomerSelected()}
if(o.street||o.zip||o.city){
document.getElementById('orderDifferentAddress').checked=true;
document.getElementById('orderAddressFields').classList.remove('hidden');
document.getElementById('orderStreet').value=o.street||'';
document.getElementById('orderZip').value=o.zip||'';
document.getElementById('orderCity').value=o.city||''
}
if(!isOffer){
setOrderPhotoDraftFromEntity(o);
renderOrderPrepayments(o.prepayments||[])
}
if(o.kleinunternehmer!==undefined){if(_kuel)_kuel.checked=!!o.kleinunternehmer;if(_kueh)_kueh.style.display=(_kuel&&_kuel.checked)?'block':'none';}
}
}
if(_pendingTemplateServices&&_pendingTemplateServices.length&&!id){var notice=document.getElementById('orderFromTemplateNotice');if(!notice){notice=document.createElement('div');notice.id='orderFromTemplateNotice';notice.className='mt-3 text-xs text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2';var form=document.getElementById('orderForm');if(form)form.parentNode.insertBefore(notice,form)}notice.textContent='\u2714 '+_pendingTemplateServices.length+' Position'+((_pendingTemplateServices.length!==1)?'en':'')+ ' aus Vorlage werden \xfcbernommen'}
document.getElementById('orderModal').classList.add('active')
}
function hideOrderModal(){document.getElementById('orderModal').classList.remove('active');resetOrderPhotoDraft();_pendingTemplateServices=null;var notice=document.getElementById('orderFromTemplateNotice');if(notice)notice.remove()}
function toggleOrderKU(){var c=document.getElementById('orderKleinunternehmer');var h=document.getElementById('orderKUHint');if(h)h.style.display=c&&c.checked?'block':'none'}
async function saveOrder(e){e.preventDefault();try{customers=ensureArray(customers);var type=document.getElementById('orderEntityType').value||'order';var list=getEntityList(type);var oid=document.getElementById('orderId').value,isNew=!oid,cid=document.getElementById('orderCustomerSelect').value;var cust=customers.find(function(c){return c.id===cid});if(!cust){alert('Bitte Kunde auswählen.');return}var cn=cust.company?cust.company+([cust.firstName,cust.lastName].filter(Boolean).length?' ('+[cust.firstName,cust.lastName].filter(Boolean).join(' ')+')':''):[cust.firstName,cust.lastName].filter(Boolean).join(' ');var obj=document.getElementById('orderObject').value,ct='netto';var st,zp,ci;if(document.getElementById('orderDifferentAddress').checked){st=document.getElementById('orderStreet').value;zp=document.getElementById('orderZip').value;ci=document.getElementById('orderCity').value}else{st=cust.street||'';zp=cust.zip||'';ci=cust.city||''}var ap=[];if(st)ap.push(st);if(zp||ci)ap.push([zp,ci].filter(Boolean).join(' '));var valid=new Date();valid.setDate(valid.getDate()+14);var _tmplSvcs=isNew&&_pendingTemplateServices&&_pendingTemplateServices.length?_pendingTemplateServices.slice():null;var entity={id:oid||(type==='offer'?'offer_':'order_')+Date.now(),customerId:cid,customer:cn,object:obj,street:st,zip:zp,city:ci,address:ap.join(', '),calculationType:ct,kleinunternehmer:!!document.getElementById('orderKleinunternehmer').checked,services:_tmplSvcs||[],photos:{before:[],after:[]},createdAt:Date.now(),offerStatus:type==='offer'?'open':'',validUntil:type==='offer'?valid.toISOString().slice(0,10):'',acceptedAt:'',linkedOrderId:''};var oldEntity=null;if(oid){oldEntity=list.find(function(o){return o.id===oid})||null;if(oldEntity){entity.services=ensureArray(oldEntity.services);entity.createdAt=oldEntity.createdAt;if(type==='offer'){entity.offerStatus=oldEntity.offerStatus||'open';entity.validUntil=oldEntity.validUntil||entity.validUntil;entity.acceptedAt=oldEntity.acceptedAt||'';entity.linkedOrderId=oldEntity.linkedOrderId||''}}if(type==='offer')offers=ensureArray(offers).filter(function(o){return o.id!==oid});else orders=ensureArray(orders).filter(function(o){return o.id!==oid})}if(type!=='offer'){entity.photos=cloneOrderPhotos(orderPhotoDraft);if((!entity.photos.before.length)&&(!entity.photos.after.length)&&oldEntity&&oldEntity.photos)entity.photos=cloneOrderPhotos(oldEntity.photos);entity.photos=await syncOrderPhotosToStorage(entity.id,entity.photos,oldEntity&&oldEntity.photos?oldEntity.photos:null)}if(type==='offer'){offers=ensureArray(offers);offers.unshift(entity)}else{orders=ensureArray(orders);orders.unshift(entity)}try{var photoCnt=type==='offer'?0:((entity.photos.before||[]).length+(entity.photos.after||[]).length);addAuditEntry(isNew?(type==='offer'?'Angebot erstellt':'Auftrag erstellt'):(type==='offer'?'Angebot bearbeitet':'Auftrag bearbeitet'),type==='offer'?'Angebot':'Auftrag',entity.id,'Kunde: '+cn+', Objekt: '+obj+(type==='offer'?'':' , Bilder: '+photoCnt))}catch(err){console.error('Audit-Log Fehler:',err)}try{await saveData()}catch(err){console.error(err)}hideOrderModal();if(type==='offer')renderOffers();else renderOrders();updateDashboard();if(type==='offer')showSection('offers');else showSection('orders');if(isNew&&!_tmplSvcs){showAddServiceForm(entity.id,type)}}catch(err){console.error('saveOrder Fehler:',err);alert('Speichern fehlgeschlagen: '+(err.message||'Unbekannter Fehler'))}}
async function deleteOrder(id){orders=ensureArray(orders);if(!await uiConfirm('Auftrag l\u00f6schen?','Auftrag'))return;var o=orders.find(function(x){return x.id===id});if(o&&o.photos)await removeOrderPhotoStoragePaths(collectOrderPhotoStoragePaths(o.photos));addAuditEntry('Auftrag gel\u00f6scht','Auftrag',id,o?'Kunde: '+o.customer+', Objekt: '+o.object:'');orders=orders.filter(function(o){return o.id!==id});saveData();renderOrders();updateDashboard()}
var _openOrderDetailId=null;
var _openOfferDetailId=null;
function renderOrders(){
var c=document.getElementById('ordersList');
if(!c)return;
orders=ensureArray(orders).map(normalizeOrderServices);
invoices=ensureArray(invoices);
var invByOrderId={};
invoices.forEach(function(inv){
  if(!inv||inv.status==='storniert')return;
  var oid=String(inv.orderId||'');
  if(!oid)return;
  var prev=invByOrderId[oid];
  var t=Number(inv.createdAt||0);
  var pt=prev?Number(prev.createdAt||0):0;
  if(!prev||t>=pt)invByOrderId[oid]=inv;
});
var objEl=document.getElementById('ordersObjectFilter');
var currentObj=objEl?String(objEl.value||'all'):'all';
var objects=ensureArray(orders).map(function(o){return String((o&&o.object)||'').trim()}).filter(Boolean).filter(function(v,idx,arr){return arr.indexOf(v)===idx}).sort(function(a,b){return a.localeCompare(b)});
if(objEl){
objEl.innerHTML='<option value="all">Alle Objekte</option>'+objects.map(function(o){return'<option value="'+escAttr(o)+'">'+esc(o)+'</option>'}).join('');
if(currentObj!=='all'&&objects.indexOf(currentObj)===-1)currentObj='all';
objEl.value=currentObj
}
var q=(document.getElementById('ordersSearchInput')?document.getElementById('ordersSearchInput').value:'').toLowerCase();
var data=orders.slice();
if(currentObj&&currentObj!=='all')data=data.filter(function(o){return String((o&&o.object)||'').trim()===currentObj});
if(q)data=data.filter(function(o){return[o.customer,o.object,o.street,o.city,getOrderNumberForPrint(o)].filter(Boolean).join(' ').toLowerCase().indexOf(q)!==-1});
if(!data.length){c.innerHTML='<p class="text-gray-500 text-center py-12 text-lg">'+(orders.length?'Keine passenden Auftr\u00e4ge.':'Noch keine Auftr\u00e4ge.')+'</p>';return}
var h='<div class="space-y-2">';
data.forEach(function(o){
var net=calcTotal(o);
var sc=ensureArray(o.services).length;
var before=ensureArray((o.photos||{}).before),after=ensureArray((o.photos||{}).after);
var photoCount=before.length+after.length;
var numTxt=getOrderNumberForPrint(o);
var inv=invByOrderId[String(o.id||'')]||null;
var cardCls=inv?'border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 hover:shadow-md transition cursor-pointer hover:border-emerald-300':'border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition cursor-pointer hover:border-cyan-200';
var invBadge='';
if(inv){
  var st=String(inv.status||'');
  var bCls=st==='paid'?'badge badge-green':(st==='draft'?'badge badge-blue':'badge badge-cyan');
  var bTxt=st==='paid'?'Abgerechnet':(st==='draft'?'Rechnung-Entwurf':'In Rechnung');
  invBadge='<span class="'+bCls+'" style="font-size:10px;padding:3px 10px">'+esc(bTxt)+'</span>';
}
h+='<div class="'+cardCls+'" onclick="openOrderDetailModal(\''+o.id+'\')"><div class="flex flex-wrap justify-between items-center gap-3"><div class="flex-1 min-w-[240px]"><div class="flex items-center gap-2 flex-wrap mb-1"><div class="text-base font-bold text-gray-900">'+esc(numTxt)+'</div>'+(o.importedAt?'<span class="badge" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-size:10px">Importiert</span>':'')+invBadge+'</div><div class="text-sm font-semibold text-gray-800">'+esc(o.customer||'-')+'</div><div class="text-xs text-gray-500 mt-1">'+esc(o.object||'-')+(sc?' \u00b7 '+sc+' Leistung'+(sc!==1?'en':''):'')+(photoCount?' \u00b7 \uD83D\uDCF7 '+photoCount+' Foto'+(photoCount!==1?'s':''):'')+'</div></div><div class="text-right shrink-0"><div class="text-base font-bold text-gray-900">'+fmtCur(net)+'</div><div class="text-[11px] text-gray-400">Netto</div></div><div class="text-gray-400 text-lg">\u203a</div></div></div>';
});
h+='</div>';
c.innerHTML=h;
if(_openOrderDetailId){var m=document.getElementById('orderDetailModal');if(m&&m.style.display!=='none')renderOrderDetailModal(_openOrderDetailId)}
}
function openOrderDetailModal(id){var modal=document.getElementById('orderDetailModal');if(!modal)return;_openOrderDetailId=id;modal.style.display='flex';document.body.style.overflow='hidden';renderOrderDetailModal(id)}
function closeOrderDetailModal(){var modal=document.getElementById('orderDetailModal');if(modal)modal.style.display='none';document.body.style.overflow='';_openOrderDetailId=null}
function renderOrderDetailModal(id){
orders=ensureArray(orders).map(normalizeOrderServices);
var o=orders.find(function(x){return x.id===id});
var titleEl=document.getElementById('orderDetailTitle');
var actionsEl=document.getElementById('orderDetailActions');
var contentEl=document.getElementById('orderDetailContent');
if(!o||!titleEl||!contentEl)return;
titleEl.textContent=getOrderNumberForPrint(o);
var acts='';
acts+='<button class="btn btn-secondary btn-sm" onclick="closeOrderDetailModal();showOrderModal(\''+id+'\')">Bearbeiten</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="showAddServiceForm(\''+id+'\',\'order\')">+ Leistung</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="showAddServiceForm(\''+id+'\',\'order\',\'prepayment\')">Vorauszahlung</button>';
acts+='<button class="btn btn-primary btn-sm" onclick="closeOrderDetailModal();createInvoiceFromOrder(\''+id+'\')">Rechnung</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="closeOrderDetailModal();createTemplateFromOrder(\''+id+'\')">Als Vorlage</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="printOrder(\''+id+'\')">Drucken</button>';
acts+='<button class="btn btn-primary btn-sm" onclick="exportOrderPDF(\''+id+'\')">PDF</button>';
acts+='<button class="btn btn-secondary btn-sm btn-danger" onclick="closeOrderDetailModal();deleteOrder(\''+id+'\')">L\u00f6schen</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="closeOrderDetailModal()">\u2715</button>';
actionsEl.innerHTML=acts;
var isKU=!!(o.kleinunternehmer!==undefined?o.kleinunternehmer:companyData&&companyData.kleinunternehmer);
var _vatR=isKU?0:(companyData&&companyData.defaultVat?companyData.defaultVat:0.19);
var net=calcTotal(o),vat=net*_vatR,gross=net+vat;
var ppNet=getEntityPrepaymentNetTotal(o),restGross=gross-(ppNet*(1+_vatR));
var services=ensureArray(o.services);
var before=ensureArray((o.photos||{}).before),after=ensureArray((o.photos||{}).after);
var infoHtml='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px">';
infoHtml+='<div style="background:#f8fafc;border-radius:12px;padding:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px">KUNDE</div><div style="font-size:13px;font-weight:600;color:#0f172a">'+esc(o.customer||'-')+'</div></div>';
infoHtml+='<div style="background:#f8fafc;border-radius:12px;padding:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px">OBJEKT</div><div style="font-size:13px;font-weight:600;color:#0f172a">'+esc(o.object||'-')+'</div>'+(o.street||o.zip||o.city?'<div style="font-size:11px;color:#64748b;margin-top:4px">'+esc([o.street,o.zip,o.city].filter(Boolean).join(' '))+'</div>':'')+'</div>';
infoHtml+='<div style="background:#f8fafc;border-radius:12px;padding:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px">SUMME</div><div style="font-size:12px;color:#374151"><div>Netto: <strong>'+fmtCur(net)+'</strong></div>'+(isKU?'<div style="font-size:11px;color:#94a3b8">§19 UStG keine MwSt.</div>':'<div>MwSt: '+fmtCur(vat)+'</div>')+'<div style="font-weight:700">'+(isKU?'Gesamt':'Brutto')+': <strong>'+fmtCur(gross)+'</strong></div>'+(ppNet>0?'<div style="color:#dc2626;margin-top:4px">Vorauszahlung: -'+fmtCur(ppNet)+'</div><div style="font-weight:700">Rest: '+fmtCur(Math.max(0,restGross))+'</div>':'')+'</div></div>';
infoHtml+='</div>';
var servHtml='<div style="margin-bottom:20px"><div style="font-weight:700;font-size:15px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center"><span>Leistungen ('+services.length+')</span><div style="display:flex;gap:8px"><button id="orderKiBtn" onclick="runKiPruefungOrder(\''+id+'\')" class="btn btn-secondary btn-sm">&#10024; KI-Pr\u00fcfung</button><button onclick="showAddServiceForm(\''+id+'\',\'order\')" class="btn btn-primary btn-sm">+ Leistung</button><button onclick="showAddServiceForm(\''+id+'\',\'order\',\'prepayment\')" class="btn btn-secondary btn-sm">Vorauszahlung</button></div></div>';
if(services.length){
servHtml+='<div class="space-y-2">';
services.forEach(function(s,svcIdx){
if(!s)return;
if(s.costType==='prepayment'){var pn=Number(s.prepaymentNet!=null?s.prepaymentNet:s.prepaymentGross)||0;var dp=[];if(s.prepaymentDate)dp.push(String(s.prepaymentDate));if(s.description)dp.push(String(s.description));servHtml+='<div class="service-card svc-drag-item" draggable="true" ondragstart="svcDragStart(event,'+svcIdx+',\'order\',\''+id+'\')" ondragover="svcDragOver(event)" ondrop="svcDrop(event,\'order\',\''+id+'\','+svcIdx+')" ondragend="svcDragEnd()"><div class="flex items-start gap-2"><span style="cursor:grab;color:#d1d5db;font-size:20px;padding:4px 6px 4px 0;user-select:none;flex-shrink:0;display:flex;align-items:center" title="Verschieben">&#x283F;</span><div class="flex-1"><div class="flex justify-between items-start"><div class="flex-1"><div class="font-bold text-gray-800">'+esc(String(s.title||'Vorauszahlung'))+'</div>'+(dp.length?'<div class="text-sm text-gray-600 mt-1">'+esc(dp.join(' \u00b7 '))+'</div>':'')+'<div class="text-sm text-gray-500 mt-2">Vorauskasse (Netto)</div></div><div class="flex flex-col items-end gap-2 ml-4"><div class="text-lg font-bold text-red-600">-'+fmtCur(pn)+'</div><div class="flex gap-2"><button onclick="showEditServiceForm(\''+id+'\',\''+s.id+'\',\'order\')" class="btn btn-secondary btn-sm">Bearbeiten</button><button onclick="deleteService(\''+id+'\',\''+s.id+'\',\'order\')" class="btn btn-secondary btn-sm btn-danger">L\u00f6schen</button></div></div></div></div></div></div>';return}
var st=s.costType==='position'?(Number(s.quantity)||0)*(Number(s.unitPrice)||0):((function(){var q=Number(s.quantity);if(!(q>0))q=1;var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;var total=isFinite(mc)&&mc>0?mc:(q*up);return total})());
var detail=s.costType==='position'?(String(s.quantity||0)+' '+String(s.unit||'')+' \u00d7 '+fmtCur(s.unitPrice)):(function(){var q=Number(s.quantity);if(!(q>0))q=1;var u=String(s.unit||'Pauschal');var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;var total=isFinite(mc)&&mc>0?mc:(q*up);return String(q)+' '+u+' \u00d7 '+fmtCur(up)+(total>0?' \u2014 Materialkosten: '+fmtCur(total):'');})()
var matBadge=s.costType==='material'?' <span class="badge badge-purple" style="font-size:10px;vertical-align:middle">Material</span>':'';
servHtml+='<div class="service-card svc-drag-item" draggable="true" ondragstart="svcDragStart(event,'+svcIdx+',\'order\',\''+id+'\')" ondragover="svcDragOver(event)" ondrop="svcDrop(event,\'order\',\''+id+'\','+svcIdx+')" ondragend="svcDragEnd()"><div class="flex items-start gap-2"><span style="cursor:grab;color:#d1d5db;font-size:20px;padding:4px 6px 4px 0;user-select:none;flex-shrink:0;display:flex;align-items:center" title="Verschieben">&#x283F;</span><div class="flex-1"><div class="flex justify-between items-start"><div class="flex-1"><div class="font-bold text-gray-800">'+esc(s.title)+matBadge+'</div>'+(s.description?'<div class="text-sm text-gray-600 mt-1">'+esc(s.description)+'</div>':'')+'<div class="text-sm text-gray-500 mt-2">'+detail+'</div></div><div class="flex flex-col items-end gap-2 ml-4"><div class="text-lg font-bold text-green-600">'+fmtCur(st)+'</div><div class="flex gap-2"><button onclick="showEditServiceForm(\''+id+'\',\''+s.id+'\',\'order\')" class="btn btn-secondary btn-sm">Bearbeiten</button><button onclick="deleteService(\''+id+'\',\''+s.id+'\',\'order\')" class="btn btn-secondary btn-sm btn-danger">L\u00f6schen</button></div></div></div></div></div></div>';
});
servHtml+='</div>';
}else servHtml+='<p class="text-gray-400 text-center py-4 text-sm italic">Noch keine Leistungen</p>';
servHtml+='<div id="orderKiResult"></div></div>';
var photoHtml='';
if(before.length||after.length){
photoHtml='<div style="margin-bottom:20px"><div style="font-weight:700;font-size:15px;margin-bottom:12px">Dokumentation \u00b7 Vorher: '+before.length+' \u00b7 Nachher: '+after.length+'</div>';
if(before.length)photoHtml+='<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:6px">VORHER</div><div class="order-photo-grid">'+before.slice(0,6).map(function(p){return'<div class="order-photo-card"><img src="'+esc(getOrderPhotoSrc(p))+'" alt="Vorher"><div class="order-photo-meta">'+esc(p.name||'Foto')+'</div></div>'}).join('')+'</div></div>';
if(after.length)photoHtml+='<div><div style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:6px">NACHHER</div><div class="order-photo-grid">'+after.slice(0,6).map(function(p){return'<div class="order-photo-card"><img src="'+esc(getOrderPhotoSrc(p))+'" alt="Nachher"><div class="order-photo-meta">'+esc(p.name||'Foto')+'</div></div>'}).join('')+'</div></div>';
photoHtml+='</div>';
}
contentEl.innerHTML=infoHtml+servHtml+photoHtml;
}
function showAddServiceForm(oid,entityType,presetCostType){
entityType=entityType||'order';
document.getElementById('serviceFormTitle').textContent='Neue Leistung';
document.getElementById('serviceForm').reset();
document.getElementById('serviceOrderId').value=oid;
document.getElementById('serviceEntityType').value=entityType;
document.getElementById('serviceId').value='';
document.getElementById('serviceQuantity').value='1';
populateServiceArticleSelect('');
var opt=document.getElementById('optServicePrepayment');
if(opt){opt.disabled=entityType!=='order';opt.style.display=entityType!=='order'?'none':''}
document.getElementById('serviceCostType').value=(presetCostType&&entityType==='order')?presetCostType:'position';
updateCostTypeFields();
calculateServicePrice();
document.getElementById('serviceFormModal').classList.add('active')
}
function updateCostTypeFields(r){
if(r===undefined)r=true;
var ct=document.getElementById('serviceCostType').value;
document.getElementById('positionFields').classList.add('hidden');
document.getElementById('materialFields').classList.add('hidden');
document.getElementById('prepaymentFields').classList.add('hidden');
document.getElementById('calcPositionRow').classList.add('hidden');
document.getElementById('calcMaterialRow').classList.add('hidden');
document.getElementById('calcPrepaymentRow').classList.add('hidden');
if(r){
document.getElementById('serviceQuantity').value='1';
document.getElementById('serviceUnitPrice').value='0';
document.getElementById('serviceMaterialCost').value='0';
var pDate=document.getElementById('servicePrepaymentDate');if(pDate)pDate.value='';
var pNet=document.getElementById('servicePrepaymentNet');if(pNet)pNet.value='0'
}
if(ct==='position'){
document.getElementById('positionFields').classList.remove('hidden');
document.getElementById('calcPositionRow').classList.remove('hidden');
document.getElementById('descriptionLabel').textContent='Beschreibung'
}else if(ct==='material'){
document.getElementById('positionFields').classList.remove('hidden');
document.getElementById('materialFields').classList.remove('hidden');
document.getElementById('calcMaterialRow').classList.remove('hidden');
document.getElementById('descriptionLabel').textContent='Beschreibung'
}else{
document.getElementById('prepaymentFields').classList.remove('hidden');
document.getElementById('calcPrepaymentRow').classList.remove('hidden');
document.getElementById('descriptionLabel').textContent='Notiz';
var tEl=document.getElementById('serviceTitle');if(tEl&&!String(tEl.value||'').trim())tEl.value='Vorauszahlung'
}
calculateServicePrice()
}
function showEditServiceForm(oid,sid,entityType){
entityType=entityType||'order';
var list=getEntityList(entityType);
var o=list.find(function(x){return x.id===oid});
if(!o)return;
var s=o.services.find(function(x){return x.id===sid});
if(!s)return;
document.getElementById('serviceFormTitle').textContent='Leistung bearbeiten';
document.getElementById('serviceOrderId').value=oid;
document.getElementById('serviceEntityType').value=entityType;
document.getElementById('serviceId').value=sid;
populateServiceArticleSelect(s.articleId||'');
document.getElementById('serviceTitle').value=s.title;
document.getElementById('serviceDescription').value=s.description||'';
var opt=document.getElementById('optServicePrepayment');
if(opt){opt.disabled=entityType!=='order';opt.style.display=entityType!=='order'?'none':''}
document.getElementById('serviceCostType').value=(entityType==='order'&&s.costType==='prepayment')?'prepayment':(s.costType||'position');
if(s.costType==='position'){
document.getElementById('serviceQuantity').value=s.quantity;
document.getElementById('serviceUnit').value=s.unit;
document.getElementById('serviceUnitPrice').value=s.unitPrice
}else if(s.costType==='material'){
var mq=Number(s.quantity);if(!(mq>0))mq=1;
var mu=s.unit||'Pauschal';
var mt=Number(s.materialCost||0);if(!isFinite(mt))mt=0;
var mup=Number(s.unitPrice);if(!isFinite(mup)||mup<=0)mup=(mq>0?mt/mq:0);
document.getElementById('serviceQuantity').value=String(mq);
document.getElementById('serviceUnit').value=mu;
document.getElementById('serviceUnitPrice').value=String(isFinite(mup)?mup:0);
document.getElementById('serviceMaterialCost').value=String(isFinite(mt)?mt:0)
}else{
var pDate=document.getElementById('servicePrepaymentDate');if(pDate)pDate.value=normalizeIsoDate(s.prepaymentDate);
var pNet=document.getElementById('servicePrepaymentNet');if(pNet)pNet.value=String(isFinite(Number(s.prepaymentNet!=null?s.prepaymentNet:s.prepaymentGross))?Number(s.prepaymentNet!=null?s.prepaymentNet:s.prepaymentGross):0)
}
updateCostTypeFields(false);
calculateServicePrice();
document.getElementById('serviceFormModal').classList.add('active')
}
function hideServiceForm(){document.getElementById('serviceFormModal').classList.remove('active')}
function calculateServicePrice(source){
var ct=document.getElementById('serviceCostType').value,t=0;
if(ct==='position'){
var q=parseFloat(document.getElementById('serviceQuantity').value)||0,up=parseFloat(document.getElementById('serviceUnitPrice').value)||0;
t=q*up;
document.getElementById('calcPosition').textContent=q.toFixed(2)+' \u00d7 '+up.toFixed(2)+' = '+t.toFixed(2)+' EUR'
}else if(ct==='material'){
var mq=parseFloat(document.getElementById('serviceQuantity').value)||0;
var mup=parseFloat(document.getElementById('serviceUnitPrice').value)||0;
if(source==='materialTotal'){
t=parseFloat(document.getElementById('serviceMaterialCost').value)||0;
if(mq>0){
mup=t/mq;
document.getElementById('serviceUnitPrice').value=String(mup)
}
}else{
t=mq*mup;
document.getElementById('serviceMaterialCost').value=String(t)
}
document.getElementById('calcMaterial').textContent=mq.toFixed(2)+' \u00d7 '+mup.toFixed(2)+' = '+t.toFixed(2)+' EUR'
}else{
var net=parseFloat(document.getElementById('servicePrepaymentNet').value)||0;
t=-net;
document.getElementById('calcPrepayment').textContent='-'+net.toFixed(2)+' EUR'
}
document.getElementById('calcTotal').textContent=t.toFixed(2)+' EUR'
}
function saveService(e){
e.preventDefault();
var oid=document.getElementById('serviceOrderId').value,entityType=document.getElementById('serviceEntityType').value||'order',sid=document.getElementById('serviceId').value,articleId=document.getElementById('serviceArticleSelect')?document.getElementById('serviceArticleSelect').value:'';
var list=getEntityList(entityType);
var o=list.find(function(x){return x.id===oid});
if(!o)return;
var ct=document.getElementById('serviceCostType').value;
var s={id:sid||'service_'+Date.now(),articleId:articleId||'',title:document.getElementById('serviceTitle').value,description:document.getElementById('serviceDescription').value,costType:ct,quantity:0,unit:'Pauschal',unitPrice:0,materialCost:0,prepaymentDate:'',prepaymentNet:0};
if(ct==='position'){
s.quantity=parseFloat(document.getElementById('serviceQuantity').value);
s.unit=document.getElementById('serviceUnit').value;
s.unitPrice=parseFloat(document.getElementById('serviceUnitPrice').value)
}else if(ct==='material'){
var mq=parseFloat(document.getElementById('serviceQuantity').value)||0;
var mu=document.getElementById('serviceUnit').value;
var mup=parseFloat(document.getElementById('serviceUnitPrice').value)||0;
var mt=parseFloat(document.getElementById('serviceMaterialCost').value)||0;
if(mq>0&&mt>0&&(!mup||!isFinite(mup)))mup=mt/mq;
if(mq>0&&mup>0&&(!mt||!isFinite(mt)))mt=mq*mup;
s.quantity=mq;
s.unit=mu;
s.unitPrice=mup;
s.materialCost=mt
}else{
s.title=String(s.title||'').trim()||'Vorauszahlung';
s.prepaymentDate=normalizeIsoDate(document.getElementById('servicePrepaymentDate').value);
s.prepaymentNet=parseFloat(document.getElementById('servicePrepaymentNet').value)||0;
if(!(s.prepaymentNet>0)){alert('Bitte einen Betrag > 0 eingeben.');return}
}
if(!o.services)o.services=[];
if(sid){
var i=o.services.findIndex(function(x){return x.id===sid});
if(i!==-1)o.services[i]=s
}else o.services.push(s);
if(ct==='position'||ct==='material')rememberQuickTemplateFromService(s);
saveData();
hideServiceForm();
if(entityType==='template'){renderTemplateModalServices();}else if(entityType==='offer'){renderOffers();updateDashboard();}else{renderOrders();updateDashboard();}
}
async function deleteService(oid,sid,entityType){entityType=entityType||'order';if(!await uiConfirm('Leistung l\u00f6schen?','Leistung'))return;var list=getEntityList(entityType);var o=list.find(function(x){return x.id===oid});if(!o)return;o.services=o.services.filter(function(s){return s.id!==sid});saveData();if(entityType==='template'){renderTemplateModalServices();}else if(entityType==='offer'){renderOffers();updateDashboard();}else{renderOrders();updateDashboard();}}
function normalizeIsoDate(s){s=String(s||'').trim();return/^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function getOrderPrepaymentsFromForm(){var list=document.getElementById('orderPrepaymentsList');if(!list)return[];var rows=Array.prototype.slice.call(list.querySelectorAll('[data-pp-row="1"]'));var out=[];rows.forEach(function(r){var dateEl=r.querySelector('[data-pp-date="1"]');var amtEl=r.querySelector('[data-pp-amount="1"]');var noteEl=r.querySelector('[data-pp-note="1"]');var date=normalizeIsoDate(dateEl?dateEl.value:'');var amountRaw=String(amtEl?amtEl.value:'').replace(',','.');var amount=parseFloat(amountRaw);if(!isFinite(amount)||amount<=0)return;var note=(noteEl?String(noteEl.value||'').trim():'');out.push({id:String(r.getAttribute('data-pp-id')||('pp_'+Date.now()+'_'+Math.random().toString(16).slice(2))),date:date,amount:amount,note:note})});return out}
function getOrderPrepaymentsTotal(p){return ensureArray(p).reduce(function(s,x){return s+(Number(x&&x.amount)||0)},0)}
function getEntityPrepaymentServices(entity){return ensureArray(entity&&entity.services).filter(function(s){return s&&s.costType==='prepayment'})}
function getEntityPrepaymentNetTotal(entity){var a=getEntityPrepaymentServices(entity).reduce(function(s,x){return s+(Number(x&&(x.prepaymentNet!=null?x.prepaymentNet:x.prepaymentGross))||0)},0);var b=getOrderPrepaymentsTotal(entity&&entity.prepayments);return a+b}
function updateOrderPrepaymentsSummary(){var sum=getOrderPrepaymentsTotal(getOrderPrepaymentsFromForm());var el=document.getElementById('orderPrepaymentsSummary');if(el)el.textContent=sum>0?('Summe: '+fmtCur(sum)):'';
}
function renderOrderPrepayments(prepayments){prepayments=ensureArray(prepayments);var list=document.getElementById('orderPrepaymentsList');if(!list)return;var rows='';prepayments.forEach(function(p){var id=String(p.id||('pp_'+Date.now()+'_'+Math.random().toString(16).slice(2)));var dt=normalizeIsoDate(p.date);var amt=isFinite(Number(p.amount))?String(p.amount):'';var note=String(p.note||'');rows+=('<div class="p-3 bg-gray-50 rounded-lg border border-gray-200" data-pp-row="1" data-pp-id="'+escAttr(id)+'"><div class="grid grid-cols-12 gap-2 items-end"><div class="col-span-3"><label class="block text-[11px] text-gray-500 mb-1">Datum</label><input type="date" class="input" data-pp-date="1" value="'+escAttr(dt)+'" onchange="updateOrderPrepaymentsSummary()"></div><div class="col-span-3"><label class="block text-[11px] text-gray-500 mb-1">Betrag (EUR)</label><input type="number" step="0.01" min="0" class="input" data-pp-amount="1" value="'+escAttr(amt)+'" oninput="updateOrderPrepaymentsSummary()"></div><div class="col-span-5"><label class="block text-[11px] text-gray-500 mb-1">Notiz</label><input type="text" class="input" data-pp-note="1" value="'+escAttr(note)+'" placeholder="z.B. Anzahlung bar"></div><div class="col-span-1 text-right"><button type="button" class="btn btn-secondary btn-sm btn-danger" style="padding:.25rem .6rem;font-size:.75rem" onclick="removeOrderPrepaymentRow(\''+escAttr(id)+'\')">&times;</button></div></div></div>')});if(!rows)rows='<div class="text-sm text-gray-400">Keine Vorauszahlungen erfasst.</div>';list.innerHTML=rows;updateOrderPrepaymentsSummary()}
function addOrderPrepaymentRow(){var list=document.getElementById('orderPrepaymentsList');if(!list)return;var cur=getOrderPrepaymentsFromForm();cur.push({id:'pp_'+Date.now(),date:new Date().toISOString().slice(0,10),amount:'',note:''});renderOrderPrepayments(cur)}
function removeOrderPrepaymentRow(id){id=String(id||'');var cur=getOrderPrepaymentsFromForm().filter(function(p){return String(p.id||'')!==id});renderOrderPrepayments(cur)}
async function runKiPruefungOrder(orderId){var apiKey=String(getOpenAiApiKey()||'').trim();if(!apiKey){alert('Bitte zuerst einen OpenAI API-Key in den Einstellungen (Firmendaten \u2192 KI-Assistent) hinterlegen.');return}var o=orders.find(function(x){return x.id===orderId});if(!o)return;var services=ensureArray(o.services).filter(function(s){return s&&s.costType!=='prepayment'});if(!services.length){alert('Keine Leistungen vorhanden.');return}var btn=document.getElementById('orderKiBtn');var result=document.getElementById('orderKiResult');if(btn){btn.disabled=true;btn.textContent='...'}if(result)result.innerHTML='<div class="text-sm text-gray-500 py-2 text-center">KI pr\u00fcft Leistungen...</div>';try{var posText=services.map(function(s,i){var detail=s.costType==='position'?((s.quantity||0)+' '+(s.unit||'')+' \u00d7 '+(s.unitPrice||0)+'\u20ac'):(function(){var q=Number(s.quantity);if(!(q>0))q=1;var u=String(s.unit||'Pauschal');var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;return(q+' '+u+' \u00d7 '+(isFinite(up)?up:0)+'\u20ac')})();return(i+1)+'. '+(s.title||'')+(s.description?' \u2014 '+s.description:'')+' | '+detail}).join('\n');var resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',temperature:0.3,response_format:{type:'json_object'},messages:[{role:'system',content:'Du bist ein erfahrener Handwerksmeister und Auftragsberater. Pr\u00fcfe die Leistungspositionen auf Vollst\u00e4ndigkeit, Klarheit und Professionalit\u00e4t. Antworte ausschlie\u00dflich als g\u00fcltiges JSON-Objekt im Format {"ergebnisse":[{"pos":1,"titel":"...","status":"ok","meldung":"...","verbesserung":"..."}]}. Status ist entweder "ok" (alles in Ordnung) oder "warnung" (Verbesserungsbedarf). "verbesserung" enth\u00e4lt den verbesserten Leistungstitel oder einen leeren String bei Status "ok".'},{role:'user',content:'Pr\u00fcfe folgende Leistungen eines Handwerksbetriebs:\n\n'+posText}]})});var data=await resp.json().catch(function(){return null});if(!resp.ok){var msg=data&&data.error&&data.error.message?data.error.message:('API-Fehler '+resp.status);throw new Error(msg)}var content=data&&data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'';var parsed=null;try{parsed=JSON.parse(String(content||'').trim())}catch(_){try{var m2=String(content||'').match(/\{[\s\S]*\}/);if(m2)parsed=JSON.parse(m2[0])}catch(__){}}var ergebnisse=parsed&&Array.isArray(parsed.ergebnisse)?parsed.ergebnisse:[];if(!ergebnisse.length){if(result)result.innerHTML='<div class="text-sm text-amber-600 py-2">KI-Antwort konnte nicht verarbeitet werden.</div>';}else{var html='<div class="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50"><div class="font-bold text-sm text-gray-700 mb-3">&#10024; KI-Pr\u00fcfungsergebnis</div>';ergebnisse.forEach(function(e){var isOk=e.status==='ok';var icon=isOk?'<span style="color:#16a34a">&#10003;</span>':'<span style="color:#d97706">&#9888;</span>';html+='<div class="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">';html+='<div class="flex-shrink-0 mt-0.5 text-base">'+icon+'</div>';html+='<div class="flex-1 min-w-0"><div class="font-semibold text-sm text-gray-800">Pos. '+esc(String(e.pos||''))+': '+esc(String(e.titel||''))+'</div>';html+='<div class="text-xs text-gray-600 mt-0.5">'+esc(String(e.meldung||''))+'</div>';if(!isOk&&e.verbesserung){var svcIdx=(Number(e.pos)||1)-1;var svc=services[svcIdx];html+='<div class="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1">'+esc(String(e.verbesserung))+'</div>';if(svc)html+='<button type="button" onclick="applyKiVerbesserungOrder(\''+orderId+'\',\''+svc.id+'\',\''+escAttr(String(e.verbesserung||''))+'\')" class="btn btn-secondary btn-sm mt-1" style="font-size:.75rem;padding:.25rem .6rem">\u00dcbernehmen</button>'}html+='</div></div>'});html+='</div>';if(result)result.innerHTML=html}}catch(err){if(result)result.innerHTML='<div class="text-sm text-red-500 py-2">KI-Fehler: '+esc(err.message||String(err))+'</div>'}if(btn){btn.disabled=false;btn.innerHTML='&#10024; KI-Pr\u00fcfung'}}
async function applyKiVerbesserungOrder(orderId,serviceId,verbesserung){var o=orders.find(function(x){return x.id===orderId});if(!o)return;var s=ensureArray(o.services).find(function(x){return x.id===serviceId});if(!s)return;s.title=String(verbesserung||'');await saveData();renderOrderDetail(orderId)}
function renderOrderDetail(id){if(_openOrderDetailId&&id===_openOrderDetailId)renderOrderDetailModal(id);else renderOrders();}
var _svcDragSrcIdx=null;
function svcDragStart(e,idx,entityType,entityId){_svcDragSrcIdx=idx;e.currentTarget.style.opacity='0.5';e.currentTarget.style.background='#f8fafc';e.dataTransfer.effectAllowed='move'}
function svcDragOver(e){e.preventDefault();e.currentTarget.style.borderColor='#0891b2';e.dataTransfer.dropEffect='move';return false}
function svcDrop(e,entityType,entityId,toIdx){e.stopPropagation();e.currentTarget.style.borderColor='';if(_svcDragSrcIdx!==null&&_svcDragSrcIdx!==toIdx)moveService(entityType,entityId,_svcDragSrcIdx,toIdx);_svcDragSrcIdx=null;return false}
function svcDragEnd(){_svcDragSrcIdx=null;document.querySelectorAll('.svc-drag-item').forEach(function(el){el.style.opacity='1';el.style.background='';el.style.borderColor=''})}
function moveService(entityType,entityId,fromIdx,toIdx){var list=getEntityList(entityType);var o=list.find(function(x){return x.id===entityId});if(!o||fromIdx===toIdx)return;var moved=o.services.splice(fromIdx,1)[0];o.services.splice(toIdx,0,moved);saveDataSoon();if(entityType==='offer'){renderOffers();if(_openOfferDetailId===entityId)renderOfferDetailModal(entityId)}else{renderOrderDetail(entityId)}}
