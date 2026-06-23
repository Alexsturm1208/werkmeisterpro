function renderTemplates(){var c=document.getElementById('templatesList');if(!c)return;templates=ensureArray(templates).filter(function(t){return t&&!t.isDraft});if(!templates.length){c.innerHTML='<p class="text-gray-500 text-center py-12 col-span-3">Noch keine Vorlagen. Klicke auf &quot;+ Neue Vorlage&quot; um zu beginnen.</p>';return}var h='';templates.forEach(function(t){var services=ensureArray(t.services).filter(function(s){return s&&s.costType!=='prepayment'});var total=calcTotal(t);h+='<div class="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-lg transition-all flex flex-col gap-3">';h+='<div><div class="flex items-start justify-between gap-2 mb-1"><div class="font-bold text-gray-800 text-base">'+esc(t.name||'Unbenannte Vorlage')+'</div><span class="badge badge-cyan shrink-0">Vorlage</span></div>';if(t.description)h+='<div class="text-sm text-gray-500">'+esc(t.description)+'</div>';h+='</div>';h+='<div class="flex items-center gap-4 text-sm"><span class="text-gray-500">&#128196; '+services.length+' Position'+(services.length!==1?'en':'')+'</span><span class="font-semibold text-gray-800 ml-auto">'+fmtCur(total)+'</span></div>';h+='<div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100">';h+='<button class="btn btn-primary btn-sm" onclick="useTemplateAs(\''+esc(t.id)+'\',\'order\')">&#128203; Als Auftrag</button>';h+='<button class="btn btn-secondary btn-sm" onclick="useTemplateAs(\''+esc(t.id)+'\',\'offer\')">&#128221; Als Angebot</button>';h+='<button class="btn btn-secondary btn-sm" onclick="showTemplateModal(\''+esc(t.id)+'\')">Bearbeiten</button>';h+='<button class="btn btn-secondary btn-sm btn-danger" onclick="deleteTemplate(\''+esc(t.id)+'\')">L\u00f6schen</button>';h+='</div></div>';});c.innerHTML=h}
function showTemplateModal(id){id=id||null;templates=ensureArray(templates);document.getElementById('templateModalTitle').textContent=id?'Vorlage bearbeiten':'Neue Vorlage';document.getElementById('templateForm').reset();if(id){_templateDraftId=id;document.getElementById('templateId').value=id;var t=templates.find(function(x){return x.id===id});if(t){document.getElementById('templateName').value=t.name||'';document.getElementById('templateDescription').value=t.description||''}}else{_templateDraftId='tmpl_draft_'+Date.now();document.getElementById('templateId').value=_templateDraftId;templates.push({id:_templateDraftId,name:'',description:'',services:[],isDraft:true,createdAt:Date.now()})}renderTemplateModalServices();document.getElementById('templateModal').classList.add('active')}
function hideTemplateModal(){var id=_templateDraftId;templates=ensureArray(templates);var t=id?templates.find(function(x){return x.id===id}):null;if(t&&t.isDraft){templates=templates.filter(function(x){return x.id!==id});saveData()}document.getElementById('templateModal').classList.remove('active');_templateDraftId=null}
async function saveTemplate(e){e.preventDefault();templates=ensureArray(templates);var id=(document.getElementById('templateId').value||'').trim();var name=(document.getElementById('templateName').value||'').trim();var description=(document.getElementById('templateDescription').value||'').trim();if(!name){alert('Bitte Name eingeben.');return}var existing=id?templates.find(function(x){return x.id===id}):null;if(existing){existing.name=name;existing.description=description;delete existing.isDraft}else{templates.unshift({id:id||('tmpl_'+Date.now()),name:name,description:description,services:[],createdAt:Date.now()})}try{await saveData()}catch(err){console.error(err)}document.getElementById('templateModal').classList.remove('active');_templateDraftId=null;renderTemplates()}
async function deleteTemplate(id){templates=ensureArray(templates);if(!await uiConfirm('Vorlage l\u00f6schen?','Vorlage'))return;templates=templates.filter(function(t){return t.id!==id});try{await saveData()}catch(err){console.error(err)}renderTemplates()}
function useTemplateAs(templateId,type){templates=ensureArray(templates);var t=templates.find(function(x){return x.id===templateId});if(!t)return;_pendingTemplateServices=ensureArray(t.services).map(function(s){return Object.assign({},s,{id:'service_'+Date.now()+'_'+Math.random().toString(16).slice(2)})});showEntityModal(type,null)}
function addTemplateServiceForm(){var id=_templateDraftId||(document.getElementById('templateId').value||'');if(!id)return;showAddServiceForm(id,'template')}
function _newTemplateServiceId(){return 'service_'+Date.now()+'_'+Math.random().toString(16).slice(2)}
function _openNewTemplateDraft(name,description,services){
templates=ensureArray(templates);
var modal=document.getElementById('templateModal');
var form=document.getElementById('templateForm');
var idEl=document.getElementById('templateId');
var nameEl=document.getElementById('templateName');
var descEl=document.getElementById('templateDescription');
var titleEl=document.getElementById('templateModalTitle');
if(!modal||!form||!idEl||!nameEl||!descEl||!titleEl){alert('Vorlagen-Dialog nicht verfügbar.');return}
var id='tmpl_draft_'+Date.now()+'_'+Math.random().toString(16).slice(2);
templates.push({id:id,name:String(name||''),description:String(description||''),services:ensureArray(services),isDraft:true,createdAt:Date.now()});
_templateDraftId=id;
titleEl.textContent='Neue Vorlage';
form.reset();
idEl.value=id;
nameEl.value=String(name||'');
descEl.value=String(description||'');
renderTemplateModalServices();
modal.classList.add('active')
}
function createTemplateFromOrder(orderId){
orderId=String(orderId||'');
orders=ensureArray(orders).map(normalizeOrderServices);
var o=orders.find(function(x){return x&&String(x.id||'')===orderId});
if(!o){alert('Auftrag nicht gefunden.');return}
var services=ensureArray(o.services).filter(function(s){return s&&s.costType!=='prepayment'}).map(function(s){
return{id:_newTemplateServiceId(),title:String(s.title||''),description:String(s.description||''),costType:(String(s.costType||'position')==='material'?'material':'position'),quantity:(Number(s.quantity)||0),unit:String(s.unit||'Pauschal'),unitPrice:(Number(s.unitPrice)||0),materialCost:(Number(s.materialCost)||0),articleId:s.articleId||''}
}).filter(function(s){return s.title||s.description});
if(!services.length){alert('Keine passenden Leistungen für eine Vorlage gefunden.');return}
var nameBase=String(o.object||'').trim()||'Auftrag';
var desc='Aus Auftrag '+getOrderNumberForPrint(o)+(o.customer?(' · '+String(o.customer)):'');
_openNewTemplateDraft('Vorlage: '+nameBase,desc,services)
}
function createTemplateFromInvoice(invoiceId){
invoiceId=String(invoiceId||'');
invoices=ensureArray(invoices);
var inv=invoices.find(function(i){return i&&String(i.id||'')===invoiceId});
if(!inv){alert('Rechnung nicht gefunden.');return}
var services=ensureArray(inv.lines).filter(function(l){
if(!l)return false;
if((Number(l.lineTotal)||0)<0)return false;
return !!(String(l.title||'').trim()||String(l.description||'').trim())
}).map(function(l){
return{id:_newTemplateServiceId(),title:String(l.title||''),description:String(l.description||''),costType:'position',quantity:(Number(l.qty)||0),unit:String(l.unit||'Pauschal'),unitPrice:(Number(l.unitPrice)||0),materialCost:0,articleId:''}
});
if(!services.length){alert('Keine passenden Positionen für eine Vorlage gefunden.');return}
var nameBase=String(inv.object||'').trim()||String(inv.number||'').trim()||'Rechnung';
var invLabel=String(inv.number||'ENTWURF');
var desc='Aus Rechnung '+invLabel+(inv.customerName?(' · '+String(inv.customerName)):'');
_openNewTemplateDraft('Vorlage: '+nameBase,desc,services)
}
function renderTemplateModalServices(){var listEl=document.getElementById('templateServicesList');var totalEl=document.getElementById('templateServicesTotal');if(!listEl)return;templates=ensureArray(templates);var id=_templateDraftId||(document.getElementById('templateId')?document.getElementById('templateId').value:'');var t=id?templates.find(function(x){return x.id===id}):null;var services=t?ensureArray(t.services).filter(function(s){return s&&s.costType!=='prepayment'}):[];if(!services.length){listEl.innerHTML='<p class="text-gray-400 text-sm text-center py-4 italic">Noch keine Positionen.</p>';if(totalEl)totalEl.textContent='0,00 EUR';return}var h='<div class="space-y-2">';services.forEach(function(s){var amount=s.costType==='material'?((function(){var q=Number(s.quantity);if(!(q>0))q=1;var up=Number(s.unitPrice);var mc=Number(s.materialCost||0);if((!isFinite(up)||up<=0)&&mc>0)up=mc/q;return (isFinite(mc)&&mc>0)?mc:(q*up)})()):((Number(s.quantity)||0)*(Number(s.unitPrice)||0));h+='<div class="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">';h+='<div class="flex-1 min-w-0"><div class="font-semibold text-sm text-gray-800 truncate">'+esc(s.title||'-')+'</div>';h+='<div class="text-xs text-gray-500">'+(s.costType==='material'?'Material':'Pos.')+(s.unit?' \u00b7 '+esc(s.unit):'')+((s.costType==='material'?((Number(s.quantity)>0)?(' \u00b7 '+fn(s.quantity)):(' \u00b7 '+fn(1))):(s.quantity?(' \u00b7 '+fn(s.quantity)):' ')))+'</div></div>';h+='<div class="shrink-0 text-sm font-semibold text-gray-700 min-w-[70px] text-right">'+fmtCur(amount)+'</div>';h+='<div class="flex gap-1 shrink-0">';h+='<button type="button" class="btn btn-secondary btn-sm" onclick="showEditServiceForm(\''+esc(id)+'\',\''+esc(s.id)+'\',\'template\')" title="Bearbeiten">&#9998;</button>';h+='<button type="button" class="btn btn-secondary btn-sm btn-danger" onclick="deleteService(\''+esc(id)+'\',\''+esc(s.id)+'\',\'template\')" title="L\u00f6schen">&#215;</button>';h+='</div></div>';});h+='</div>';if(totalEl)totalEl.textContent=fmtCur(t?calcTotal(t):0);listEl.innerHTML=h}
