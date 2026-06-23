function getOfferStatusInfo(o){var today=new Date().toISOString().slice(0,10);if((o&&o.offerStatus)==='accepted')return{code:'accepted',label:'Angenommen',badge:'badge-green',canConvert:false};if((o&&o.offerStatus)==='rejected')return{code:'rejected',label:'Abgelehnt',badge:'badge',canConvert:false};if(o&&o.validUntil&&o.validUntil<today)return{code:'expired',label:'Abgelaufen',badge:'badge-purple',canConvert:true};return{code:'open',label:'Offen',badge:'badge-cyan',canConvert:true}}
async function setOfferStatus(offerId,status){offers=ensureArray(offers);status=String(status||'open').toLowerCase();if(['open','accepted','rejected'].indexOf(status)===-1)status='open';var off=offers.find(function(o){return o.id===offerId});if(!off)return;if(off.linkedOrderId&&status!=='accepted'){alert('Status kann nicht geändert werden: Angebot ist bereits in Auftrag übernommen.');return}if(status==='accepted'&&!off.acceptedAt)off.acceptedAt=new Date().toISOString().slice(0,10);if(status!=='accepted')off.acceptedAt='';off.offerStatus=status;addAuditEntry('Angebotsstatus geändert','Angebot',offerId,'Neuer Status: '+status);await saveData();renderOffers()}
function convertOfferToOrder(offerId){offers=ensureArray(offers);orders=ensureArray(orders);var o=offers.find(function(x){return x.id===offerId});if(!o)return;if(o.offerStatus==='accepted'&&o.linkedOrderId&&orders.find(function(or){return or.id===o.linkedOrderId})){alert('Dieses Angebot wurde bereits angenommen.');showSection('orders');return}var n=JSON.parse(JSON.stringify(o));n.id='order_'+Date.now();n.createdAt=Date.now();delete n.offerStatus;delete n.validUntil;delete n.acceptedAt;delete n.linkedOrderId;orders.unshift(n);offers=offers.map(function(x){if(x.id!==offerId)return x;var up=Object.assign({},x);up.offerStatus='accepted';up.acceptedAt=new Date().toISOString().slice(0,10);up.linkedOrderId=n.id;return up});addAuditEntry('Angebot in Auftrag umgewandelt','Angebot',offerId,'Kunde: '+(o.customer||'-')+', Objekt: '+(o.object||'-'));saveData();renderOffers();renderOrders();showSection('orders')}
async function deleteOffer(id){offers=ensureArray(offers);if(!await uiConfirm('Angebot l\u00f6schen?','Angebot'))return;var o=offers.find(function(x){return x.id===id});addAuditEntry('Angebot gel\u00f6scht','Angebot',id,o?'Kunde: '+o.customer+', Objekt: '+o.object:'');offers=offers.filter(function(x){return x.id!==id});saveData();renderOffers()}
function renderOffers(){
var c=document.getElementById('offersList');
if(!c)return;
offers=ensureArray(offers).map(normalizeOrderServices).map(function(o){if(!o)return o;if(!o.validUntil){var d=new Date(o.createdAt||Date.now());d.setDate(d.getDate()+14);o.validUntil=d.toISOString().slice(0,10)}if(!o.offerStatus)o.offerStatus='open';return o});
var objEl=document.getElementById('offersObjectFilter');
var currentObj=objEl?String(objEl.value||'all'):'all';
var objects=ensureArray(offers).map(function(o){return String((o&&o.object)||'').trim()}).filter(Boolean).filter(function(v,idx,arr){return arr.indexOf(v)===idx}).sort(function(a,b){return a.localeCompare(b)});
if(objEl){
objEl.innerHTML='<option value="all">Alle Objekte</option>'+objects.map(function(o){return'<option value="'+escAttr(o)+'">'+esc(o)+'</option>'}).join('');
if(currentObj!=='all'&&objects.indexOf(currentObj)===-1)currentObj='all';
objEl.value=currentObj
}
var q=(document.getElementById('offersSearchInput')?document.getElementById('offersSearchInput').value:'').toLowerCase();
var stFilter=(document.getElementById('offersStatusFilter')?document.getElementById('offersStatusFilter').value:'all');
var data=offers.slice();
if(currentObj&&currentObj!=='all')data=data.filter(function(o){return String((o&&o.object)||'').trim()===currentObj});
if(q)data=data.filter(function(o){return[o.customer,o.object,o.address,getOfferNumber(o)].filter(Boolean).join(' ').toLowerCase().indexOf(q)!==-1});
if(stFilter!=='all')data=data.filter(function(o){return getOfferStatusInfo(o).code===stFilter});
if(!data.length){c.innerHTML='<p class="text-gray-500 text-center py-12">'+(offers.length?'Keine passenden Angebote.':'Noch keine Angebote.')+'</p>';return}
var statusCls={open:'badge-cyan',expired:'badge-purple',accepted:'badge-green',rejected:'badge'};
function renderOfferCards(list){
var h='<div class="space-y-2">';
list.forEach(function(o){
var stInfo=getOfferStatusInfo(o);
var t=calcTotal(o);
var sc=ensureArray(o.services).length;
var numTxt=getOfferNumber(o);
h+='<div class="border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition cursor-pointer hover:border-cyan-200" onclick="openOfferDetailModal(\''+o.id+'\')"><div class="flex flex-wrap justify-between items-center gap-3"><div class="flex-1 min-w-[240px]"><div class="flex items-center gap-2 flex-wrap mb-1"><div class="text-base font-bold text-gray-900">'+esc(numTxt)+'</div><span class="badge '+(statusCls[stInfo.code]||'badge-cyan')+'">'+stInfo.label+'</span>'+(o.importedAt?'<span class="badge" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-size:10px">Importiert</span>':'')+'</div><div class="text-sm font-semibold text-gray-800">'+esc(o.customer||'-')+'</div><div class="text-xs text-gray-500 mt-1">'+esc(o.object||'-')+(sc?' \u00b7 '+sc+' Leistung'+(sc!==1?'en':''):'')+' \u00b7 G\u00fcltig bis: '+esc(o.validUntil||'-')+'</div></div><div class="text-right shrink-0"><div class="text-base font-bold text-gray-900">'+fmtCur(t)+'</div><div class="text-[11px] text-gray-400">Netto</div></div><div class="text-gray-400 text-lg">\u203a</div></div></div>';
});
h+='</div>';
return h
}
if(stFilter==='all'){
var order=['open','accepted','rejected','expired'];
var labels={open:'Offen',accepted:'Angenommen',rejected:'Abgelehnt',expired:'Abgelaufen'};
var colors={open:'text-cyan-700',accepted:'text-green-700',rejected:'text-gray-700',expired:'text-purple-700'};
var groups={open:[],accepted:[],rejected:[],expired:[]};
data.forEach(function(o){var code=getOfferStatusInfo(o).code;if(!groups[code])code='open';groups[code].push(o)});
var out='';
order.forEach(function(code){
var list=groups[code]||[];
if(!list.length)return;
out+='<div class="mb-4"><h3 class="text-base font-bold '+(colors[code]||'text-gray-700')+' mb-2">'+labels[code]+' ('+list.length+')</h3>'+renderOfferCards(list)+'</div>'
});
c.innerHTML=out||renderOfferCards(data)
}else{
c.innerHTML=renderOfferCards(data)
}
if(_openOfferDetailId){var m=document.getElementById('offerDetailModal');if(m&&m.style.display!=='none')renderOfferDetailModal(_openOfferDetailId)}
}
function openOfferDetailModal(id){var modal=document.getElementById('offerDetailModal');if(!modal)return;_openOfferDetailId=id;modal.style.display='flex';document.body.style.overflow='hidden';renderOfferDetailModal(id)}
function closeOfferDetailModal(){var modal=document.getElementById('offerDetailModal');if(modal)modal.style.display='none';document.body.style.overflow='';_openOfferDetailId=null}
function renderOfferDetailModal(id){
offers=ensureArray(offers).map(normalizeOrderServices).map(function(o){if(!o)return o;if(!o.validUntil){var d=new Date(o.createdAt||Date.now());d.setDate(d.getDate()+14);o.validUntil=d.toISOString().slice(0,10)}if(!o.offerStatus)o.offerStatus='open';return o});
var o=offers.find(function(x){return x.id===id});
var titleEl=document.getElementById('offerDetailTitle');
var badgeEl=document.getElementById('offerDetailBadge');
var actionsEl=document.getElementById('offerDetailActions');
var contentEl=document.getElementById('offerDetailContent');
if(!o||!titleEl||!contentEl)return;
var stInfo=getOfferStatusInfo(o);
var statusCls={open:'badge-cyan',expired:'badge-purple',accepted:'badge-green',rejected:'badge'};
titleEl.textContent=getOfferNumber(o);
badgeEl.innerHTML='<span class="badge '+(statusCls[stInfo.code]||'badge-cyan')+'">'+stInfo.label+'</span>';
var acts='';
acts+='<button class="btn btn-secondary btn-sm" onclick="closeOfferDetailModal();showOfferModal(\''+id+'\')">Bearbeiten</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="showAddServiceForm(\''+id+'\',\'offer\')">+ Leistung</button>';
if(stInfo.canConvert)acts+='<button class="btn btn-primary btn-sm" onclick="closeOfferDetailModal();convertOfferToOrder(\''+id+'\')">In Auftrag</button>';
acts+='<select class="input" style="max-width:140px;padding:4px 8px;height:auto" onchange="setOfferStatus(\''+id+'\',this.value)"><option value="open"'+(o.offerStatus==='open'?' selected':'')+'>Offen</option><option value="accepted"'+(o.offerStatus==='accepted'?' selected':'')+'>Angenommen</option><option value="rejected"'+(o.offerStatus==='rejected'?' selected':'')+'>Abgelehnt</option></select>';
acts+='<button class="btn btn-secondary btn-sm" onclick="sendOfferEmail(\''+id+'\')">E-Mail</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="printOffer(\''+id+'\')">Drucken</button>';
acts+='<button class="btn btn-primary btn-sm" onclick="exportOfferPDF(\''+id+'\')">PDF</button>';
acts+='<button class="btn btn-secondary btn-sm btn-danger" onclick="closeOfferDetailModal();deleteOffer(\''+id+'\')">L\u00f6schen</button>';
acts+='<button class="btn btn-secondary btn-sm" onclick="closeOfferDetailModal()">\u2715</button>';
actionsEl.innerHTML=acts;
var _isKU=!!(o.kleinunternehmer!==undefined?o.kleinunternehmer:companyData&&companyData.kleinunternehmer);var _vr=_isKU?0:(companyData&&companyData.defaultVat?companyData.defaultVat:0.19);var t=calcTotal(o),tx=t*_vr,g=t+tx;
var services=ensureArray(o.services);
var infoHtml='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px">';
infoHtml+='<div style="background:#f8fafc;border-radius:12px;padding:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px">KUNDE</div><div style="font-size:13px;font-weight:600;color:#0f172a">'+esc(o.customer||'-')+'</div></div>';
infoHtml+='<div style="background:#f8fafc;border-radius:12px;padding:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px">OBJEKT</div><div style="font-size:13px;font-weight:600;color:#0f172a">'+esc(o.object||'-')+'</div>'+(o.street||o.zip||o.city?'<div style="font-size:11px;color:#64748b;margin-top:4px">'+esc([o.street,o.zip,o.city].filter(Boolean).join(' '))+'</div>':'')+'</div>';
infoHtml+='<div style="background:#f8fafc;border-radius:12px;padding:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px">DATUM</div><div style="font-size:12px;color:#374151"><div>G\u00fcltig bis: <strong>'+esc(o.validUntil||'-')+'</strong></div>'+(o.acceptedAt?'<div style="margin-top:4px;color:#059669">Angenommen: '+esc(o.acceptedAt)+'</div>':'')+'</div></div>';
infoHtml+='<div style="background:#f8fafc;border-radius:12px;padding:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px">SUMME</div><div style="font-size:12px;color:#374151"><div>Netto: <strong>'+fmtCur(t)+'</strong></div>'+(_isKU?'<div style="font-size:11px;color:#94a3b8">§19 UStG keine MwSt.</div>':'<div>MwSt: '+fmtCur(tx)+'</div>')+'<div style="font-weight:700;color:#0891b2">'+(_isKU?'Gesamt':'Brutto')+': '+fmtCur(g)+'</div></div></div>';
infoHtml+='</div>';
var servHtml='<div style="margin-bottom:20px"><div style="font-weight:700;font-size:15px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center"><span>Leistungen ('+services.length+')</span><button onclick="showAddServiceForm(\''+id+'\',\'offer\')" class="btn btn-primary btn-sm">+ Leistung</button></div>';
if(services.length){
servHtml+='<div class="space-y-2">';
services.forEach(function(s,svcIdx){
if(!s)return;
var st=s.costType==='position'?(Number(s.quantity)||0)*(Number(s.unitPrice)||0):((function(){var q=Number(s.quantity);if(!(q>0))q=1;var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;var total=isFinite(mc)&&mc>0?mc:(q*up);return total})());
var detail=s.costType==='position'?(String(s.quantity||0)+' '+String(s.unit||'')+' \u00d7 '+fmtCur(s.unitPrice)):(function(){var q=Number(s.quantity);if(!(q>0))q=1;var u=String(s.unit||'Pauschal');var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;var total=isFinite(mc)&&mc>0?mc:(q*up);return String(q)+' '+u+' \u00d7 '+fmtCur(up)+(total>0?' \u2014 Materialkosten: '+fmtCur(total):'');})()
var matBadge=s.costType==='material'?' <span class="badge badge-purple" style="font-size:10px;vertical-align:middle">Material</span>':'';
servHtml+='<div class="service-card svc-drag-item" draggable="true" ondragstart="svcDragStart(event,'+svcIdx+',\'offer\',\''+id+'\')" ondragover="svcDragOver(event)" ondrop="svcDrop(event,\'offer\',\''+id+'\','+svcIdx+')" ondragend="svcDragEnd()"><div class="flex items-start gap-2"><span style="cursor:grab;color:#d1d5db;font-size:20px;padding:4px 6px 4px 0;user-select:none;flex-shrink:0;display:flex;align-items:center" title="Verschieben">&#x283F;</span><div class="flex-1"><div class="flex justify-between items-start"><div class="flex-1"><div class="font-bold text-gray-800">'+esc(s.title||'-')+matBadge+'</div>'+(s.description?'<div class="text-sm text-gray-600 mt-1">'+esc(s.description)+'</div>':'')+'<div class="text-sm text-gray-500 mt-2">'+detail+'</div></div><div class="flex flex-col items-end gap-2 ml-4"><div class="text-lg font-bold text-green-600">'+fmtCur(st)+'</div><div class="flex gap-2"><button onclick="showEditServiceForm(\''+id+'\',\''+s.id+'\',\'offer\')" class="btn btn-secondary btn-sm">Bearbeiten</button><button onclick="deleteService(\''+id+'\',\''+s.id+'\',\'offer\')" class="btn btn-secondary btn-sm btn-danger">L\u00f6schen</button></div></div></div></div></div></div>';
});
servHtml+='</div>';
}else servHtml+='<p class="text-gray-400 text-center py-4 text-sm italic">Noch keine Leistungen</p>';
servHtml+='</div>';
contentEl.innerHTML=infoHtml+servHtml;
}
