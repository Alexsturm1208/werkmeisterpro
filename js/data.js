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
var arrays=['invoices','customers','orders','offers','articles','appointments','expenses','expenseDocuments','expenseLineItems','expenseExtractions','accounts'];
var stats={};
var existing={invoices:invoices.slice(),customers:customers.slice(),orders:orders.slice(),offers:offers.slice(),articles:articles.slice(),appointments:(typeof appointments!=='undefined'?appointments.slice():[]),expenses:(typeof expenses!=='undefined'?expenses.slice():[]),expenseDocuments:(typeof expenseDocuments!=='undefined'?expenseDocuments.slice():[]),expenseLineItems:(typeof expenseLineItems!=='undefined'?expenseLineItems.slice():[]),expenseExtractions:(typeof expenseExtractions!=='undefined'?expenseExtractions.slice():[]),accounts:(typeof accounts!=='undefined'?accounts.slice():[])};
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
if(typeof expenses!=='undefined')expenses=ensureArray(existing.expenses);
if(typeof expenseDocuments!=='undefined')expenseDocuments=ensureArray(existing.expenseDocuments);
if(typeof expenseLineItems!=='undefined')expenseLineItems=ensureArray(existing.expenseLineItems);
if(typeof expenseExtractions!=='undefined')expenseExtractions=ensureArray(existing.expenseExtractions);
if(typeof accounts!=='undefined')accounts=ensureArray(existing.accounts);
saveData();renderInvoices();renderCustomers();renderOrders();updateDashboard();
var lines=[['Rechnungen','invoices'],['Kunden','customers'],['Aufträge','orders'],['Angebote','offers'],['Artikel','articles'],['Termine','appointments']];
lines.push(['Ausgaben','expenses'],['Belege','expenseDocuments'],['Positionen','expenseLineItems'],['Konten','accounts']);
var rows=lines.map(function(l){return'<div class="flex justify-between py-1 text-sm border-b border-gray-100"><span class="text-gray-600">'+l[0]+'</span><span class="font-bold '+(stats[l[1]]>0?'text-green-600':'text-gray-400')+'">+'+(stats[l[1]]||0)+'</span></div>'}).join('');
var total=Object.values(stats).reduce(function(a,b){return a+(b||0)},0);
if(resultEl){resultEl.className='mt-6';resultEl.innerHTML='<div class="bg-green-50 border border-green-200 rounded-xl p-5"><div class="flex items-center gap-2 mb-3"><div class="text-xl">&#10003;</div><div class="font-bold text-green-800">Import abgeschlossen</div></div>'+rows+'<div class="flex justify-between py-2 text-sm font-bold"><span>Gesamt importiert</span><span class="text-green-700">'+total+' Einträge</span></div>'+(total===0?'<div class="text-xs text-gray-500 mt-2">Alle Einträge waren bereits vorhanden – nichts wurde doppelt importiert.</div>':'<div class="text-xs text-gray-500 mt-2">Daten wurden importiert und lokal gespeichert.</div>')+'</div>'}
};
reader.readAsText(file);
};
input.click();
}
function ensureArray(v){
if(Array.isArray(v))return v.slice();
if(!v||typeof v!=='object')return [];
return Object.keys(v).map(function(k){
var item=v[k];
if(item&&typeof item==='object'){
if(!item.id)item.id=k;
return item;
}
return null;
}).filter(Boolean);
}
async function loadData(opts){
  var d={};
  if(window.electronAPI&&window.electronAPI.loadData){try{var loaded=await window.electronAPI.loadData();if(loaded)d=loaded;}catch(e){}}
  if(!d||!Object.keys(d).length){try{var raw=localStorage.getItem('wm_data');if(raw)d=JSON.parse(raw)}catch(e){}}
  orders=ensureArray(d.orders).map(normalizeOrderServices);
  offers=ensureArray(d.offers).map(normalizeOrderServices);
  customers=ensureArray(d.customers);
  articles=ensureArray(d.articles);
  invoices=ensureArray(d.invoices);
  expenses=ensureArray(d.expenses);
  expenseDocuments=ensureArray(d.expenseDocuments);
  expenseLineItems=ensureArray(d.expenseLineItems);
  expenseExtractions=ensureArray(d.expenseExtractions);
  accounts=ensureArray(d.accounts);
  if(!accounts.length){
    accounts=[
      {id:'acc_'+Date.now()+'_mat',code:'',name:'Material'},
      {id:'acc_'+Date.now()+'_srv',code:'',name:'Fremdleistung'},
      {id:'acc_'+Date.now()+'_adm',code:'',name:'Büro / Verwaltung'},
      {id:'acc_'+Date.now()+'_car',code:'',name:'Fahrzeug'},
      {id:'acc_'+Date.now()+'_tool',code:'',name:'Werkzeug'},
      {id:'acc_'+Date.now()+'_rent',code:'',name:'Miete'},
      {id:'acc_'+Date.now()+'_ins',code:'',name:'Versicherung'},
      {id:'acc_'+Date.now()+'_tel',code:'',name:'Telefon / Internet'}
    ];
  }
  appointments=ensureArray(d.appointments);
  try{migrateERechnungFields();}catch(eMig){console.warn('migrateERechnungFields:',eMig);}
  users=ensureArray(d.users);
  auditLog=ensureArray(d.auditLog);
  recurringSchedules=ensureArray(d.recurringSchedules);
  templates=ensureArray(d.templates);
  quickTemplates=ensureArray(d.quickTemplates);
  if(d.companySettings)companyData=Object.assign({},companyData,d.companySettings||{});
  try{if(typeof applyCompanySettingsToForm==='function')applyCompanySettingsToForm();}catch(e){console.warn('applyCompanySettingsToForm:',e);}
  try{if(typeof applyPermissions==='function')applyPermissions();}catch(e){console.warn('applyPermissions:',e);}
  try{if(typeof updateDashboard==='function')updateDashboard();}catch(e){console.warn('updateDashboard:',e);}
  try{if(typeof renderOrders==='function')renderOrders();}catch(e){console.warn('renderOrders:',e);}
  try{if(typeof renderOffers==='function')renderOffers();}catch(e){console.warn('renderOffers:',e);}
  try{if(typeof renderTemplates==='function')renderTemplates();}catch(e){console.warn('renderTemplates:',e);}
  try{if(typeof renderQuickTemplates==='function')renderQuickTemplates();}catch(e){console.warn('renderQuickTemplates:',e);}
  try{if(typeof renderCustomers==='function')renderCustomers();}catch(e){console.warn('renderCustomers:',e);}
  try{if(typeof renderArticles==='function')renderArticles();}catch(e){console.warn('renderArticles:',e);}
  try{if(typeof renderInvoices==='function')renderInvoices();}catch(e){console.warn('renderInvoices:',e);}
  try{if(typeof renderDunning==='function')renderDunning();}catch(e){console.warn('renderDunning:',e);}
  try{if(typeof renderAppointments==='function')renderAppointments();}catch(e){console.warn('renderAppointments:',e);}
  try{if(typeof updateApptStats==='function')updateApptStats();}catch(e){console.warn('updateApptStats:',e);}
}
function migrateERechnungFields(){
  customers=ensureArray(customers).map(function(c){
    if(c.ustId===undefined)c.ustId='';
    if(c.kundennummer===undefined)c.kundennummer='';
    if(c.buyerReference===undefined)c.buyerReference='';
    if(c.leitwegId===undefined)c.leitwegId='';
    if(!c.countryCode)c.countryCode='DE';
    return c;
  });
  invoices=ensureArray(invoices).map(function(inv){
    if(inv.serviceDateFrom===undefined)inv.serviceDateFrom=inv.leistungsdatum||'';
    if(inv.serviceDateTo===undefined)inv.serviceDateTo='';
    if(inv.bestellnummerKunde===undefined)inv.bestellnummerKunde='';
    if(inv.buyerReference===undefined)inv.buyerReference='';
    var defRate=Number(inv.vatRate)||0;
    var defCat=inv.kleinunternehmer?'E':(defRate>0?'S':'Z');
    inv.lines=ensureArray(inv.lines).map(function(l){
      if(l.vatRate===undefined||l.vatRate===null||l.vatRate==='')l.vatRate=defRate;
      if(!l.taxCategory)l.taxCategory=defCat;
      if(!l.unitCode)l.unitCode=(typeof unitCode==='function'?unitCode(l.unit):'C62');
      return l;
    });
    return inv;
  });
}
async function saveData(){
  if(_saveDebounceTimer){clearTimeout(_saveDebounceTimer);_saveDebounceTimer=null}
  var payload={orders:ensureArray(orders),offers:ensureArray(offers),customers:ensureArray(customers),articles:ensureArray(articles),invoices:ensureArray(invoices),expenses:ensureArray(expenses),expenseDocuments:ensureArray(expenseDocuments),expenseLineItems:ensureArray(expenseLineItems),expenseExtractions:ensureArray(expenseExtractions),accounts:ensureArray(accounts),appointments:ensureArray(appointments),users:ensureArray(users),auditLog:ensureArray(auditLog),recurringSchedules:ensureArray(recurringSchedules),templates:ensureArray(templates).filter(function(t){return t&&!t.isDraft}),quickTemplates:ensureArray(quickTemplates),companySettings:companyData||{}};
  if(window.electronAPI&&window.electronAPI.saveData){var ok=await window.electronAPI.saveData(payload);if(ok===false){try{localStorage.setItem('wm_data',JSON.stringify(payload))}catch(e){}}}
  else{try{localStorage.setItem('wm_data',JSON.stringify(payload))}catch(e){console.error(e)}}
}
var _saveDebounceTimer=null;
var SAVE_DEBOUNCE_MS=700;
function saveDataSoon(){
  if(_saveDebounceTimer)clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer=setTimeout(function(){_saveDebounceTimer=null;saveData()},SAVE_DEBOUNCE_MS);
}
function flushPendingSave(){
  if(!_saveDebounceTimer)return Promise.resolve();
  clearTimeout(_saveDebounceTimer);_saveDebounceTimer=null;
  return saveData();
}
