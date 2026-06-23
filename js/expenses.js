var _expenseReviewState={open:false,documentId:null,doc:null,header:{},items:[],preview:{kind:null,url:null},rawText:'',fileAb:null,fileMime:''};
function _wmId(prefix){return String(prefix||'id')+'_'+Date.now()+'_'+Math.random().toString(16).slice(2,10)}
function _asNum(v){var n=Number(v);return isFinite(n)?n:0}
function _parseEuro(s){
  var t=String(s||'').trim();
  if(!t)return NaN;
  t=t.replace(/\s/g,'');
  t=t.replace(/€/g,'');
  var m=t.match(/-?\d{1,3}(\.\d{3})*(,\d{1,2})|-?\d+(,\d{1,2})|-?\d+(\.\d{1,2})?/);
  if(!m)return NaN;
  var x=m[0];
  if(x.indexOf(',')!==-1&&x.indexOf('.')!==-1){x=x.replace(/\./g,'').replace(',','.')}
  else if(x.indexOf(',')!==-1){x=x.replace(',','.')}
  var n=parseFloat(x);
  return isFinite(n)?n:NaN
}
function _parseDateDE(s){
  var m=String(s||'').match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
  if(!m)return'';
  var d=m[1].padStart(2,'0');
  var mo=m[2].padStart(2,'0');
  var y=m[3];if(y.length===2)y='20'+y;
  return y+'-'+mo+'-'+d
}
function _toArrayBuffer(data){
  try{
    if(!data)return null;
    if(data instanceof ArrayBuffer)return data;
    if(ArrayBuffer.isView(data)){
      return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
    }
    if(typeof Buffer!=='undefined'&&data instanceof Buffer){
      var u8a=new Uint8Array(data);
      return u8a.buffer.slice(u8a.byteOffset,u8a.byteOffset+u8a.byteLength);
    }
    if(data&&data.type==='Buffer'&&Array.isArray(data.data)){
      var u8=new Uint8Array(data.data);
      return u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);
    }
    if(Array.isArray(data)){
      var u82=new Uint8Array(data);
      return u82.buffer.slice(u82.byteOffset,u82.byteOffset+u82.byteLength);
    }
  }catch(_){}
  return null
}
function _mimeFromName(name){
  var n=String(name||'').toLowerCase();
  if(n.endsWith('.pdf'))return'application/pdf';
  if(n.endsWith('.png'))return'image/png';
  if(n.endsWith('.jpg')||n.endsWith('.jpeg'))return'image/jpeg';
  if(n.endsWith('.webp'))return'image/webp';
  if(n.endsWith('.gif'))return'image/gif';
  return''
}
function _base64ToArrayBuffer(b64){
  try{
    var s=String(b64||'').replace(/\s/g,'');
    if(!s)return null;
    var bin=atob(s);
    var len=bin.length;
    var u8=new Uint8Array(len);
    for(var i=0;i<len;i++)u8[i]=bin.charCodeAt(i);
    return u8.buffer;
  }catch(_){return null}
}
function _filePathToFileUrl(p){
  var s=String(p||'');
  if(!s)return'';
  s=s.replace(/\\/g,'/');
  if(!/^[a-zA-Z]:\//.test(s))return'';
  return 'file:///'+encodeURI(s);
}
function _cloneU8FromArrayBuffer(ab){
  try{
    if(!(ab instanceof ArrayBuffer))return null;
    return new Uint8Array(ab).slice();
  }catch(_){return null}
}
function _clonePdfData(data){
  try{
    if(data instanceof Uint8Array)return data.slice();
    if(data instanceof ArrayBuffer)return new Uint8Array(data).slice();
    if(ArrayBuffer.isView(data))return new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
  }catch(_){}
  return null
}
function _guessHeaderFromLines(lines){
  var header={vendorName:'',invoiceNo:'',date:'',totalGross:''};
  for(var i=0;i<Math.min(12,lines.length);i++){
    var l=String(lines[i]||'').trim();
    if(!header.date){var d=_parseDateDE(l);if(d)header.date=d}
    if(!header.invoiceNo){
      var m=l.match(/(rechnungs?\s*(nr|nummer)|beleg\s*nr|invoice\s*(no|number))\s*[:#]?\s*([A-Za-z0-9\-\/]+)\b/i);
      if(m&&m[4])header.invoiceNo=String(m[4]).trim();
    }
  }
  for(var j=0;j<lines.length;j++){
    var lj=String(lines[j]||'');
    if(/(gesamt|summe)\s*(brutto)?/i.test(lj)&&/€|\d/.test(lj)){
      var amt=_parseEuro(lj);
      if(isFinite(amt)&&amt>0){header.totalGross=amt;break}
    }
  }
  var candidates=lines.slice(0,8).map(function(x){return String(x||'').trim()}).filter(Boolean);
  if(candidates.length)header.vendorName=candidates[0].slice(0,80);
  return header
}
function _looksLikeLineItem(line){
  var s=String(line||'').trim();
  if(s.length<6)return false;
  if(/^(seite|page)\s+\d+/i.test(s))return false;
  if(/(summe|gesamt|zwischensumme|mwst|umsatzsteuer|netto|brutto)\b/i.test(s))return false;
  var hasAmt=/(\d{1,3}(\.\d{3})*(,\d{2})|\d+(,\d{2})|\d+(\.\d{2}))\s*€?/.test(s);
  if(!hasAmt)return false;
  if(!/[A-Za-zÄÖÜäöü]/.test(s))return false;
  return true
}
function _guessItemsFromLines(lines){
  var items=[];
  lines.forEach(function(line){
    if(!_looksLikeLineItem(line))return;
    var amt=_parseEuro(line);
    items.push({id:_wmId('expi'),description:String(line).trim().slice(0,240),qty:'',unit:'',unitPrice:'',taxRate:'',lineTotal:isFinite(amt)?amt:''});
  });
  if(items.length>60)items=items.slice(0,60);
  return items
}
async function _extractPdfTextLines(pdfData){
  var ok=false;
  try{ok=window.__ensurePdfJs?await window.__ensurePdfJs():false}catch(_){ok=false}
  if(!ok||!window.pdfjsLib||!window.pdfjsLib.getDocument)throw new Error('PDFJS_NOT_AVAILABLE');
  var data=_clonePdfData(pdfData);
  if(!data||!data.byteLength)throw new Error('NO_PDF_DATA');
  var pdf=await pdfjsLib.getDocument({data:data}).promise;
  var all=[];
  for(var p=1;p<=pdf.numPages;p++){
    var page=await pdf.getPage(p);
    var tc=await page.getTextContent();
    var items=tc&&tc.items?tc.items:[];
    var rows=[];
    items.forEach(function(it){
      if(!it||!it.str)return;
      var tr=it.transform||[];
      var x=tr[4]||0;
      var y=tr[5]||0;
      rows.push({str:String(it.str||''),x:x,y:y});
    });
    rows.sort(function(a,b){
      if(Math.abs(a.y-b.y)>2)return b.y-a.y;
      return a.x-b.x
    });
    var grouped=[];
    rows.forEach(function(r){
      var last=grouped.length?grouped[grouped.length-1]:null;
      if(!last||Math.abs(last.y-r.y)>2){grouped.push({y:r.y,parts:[r]})}
      else last.parts.push(r);
    });
    grouped.forEach(function(g){
      var txt=g.parts.map(function(pp){return pp.str}).join(' ').replace(/\s+/g,' ').trim();
      if(txt)all.push(txt);
    });
  }
  return all
}
async function _renderPdfPreview(pdfData,canvas){
  var ok=false;
  try{ok=window.__ensurePdfJs?await window.__ensurePdfJs():false}catch(_){ok=false}
  if(!ok||!window.pdfjsLib||!window.pdfjsLib.getDocument)throw new Error('PDFJS_NOT_AVAILABLE');
  var data=_clonePdfData(pdfData);
  if(!data||!data.byteLength)throw new Error('NO_PDF_DATA');
  var pdf=await pdfjsLib.getDocument({data:data}).promise;
  var page=await pdf.getPage(1);
  var viewport=page.getViewport({scale:1.6});
  canvas.width=Math.ceil(viewport.width);
  canvas.height=Math.ceil(viewport.height);
  var ctx=canvas.getContext('2d');
  await page.render({canvasContext:ctx,viewport:viewport}).promise;
}
function _clearExpensePreview(){
  if(_expenseReviewState.preview&&_expenseReviewState.preview.url){
    try{URL.revokeObjectURL(_expenseReviewState.preview.url)}catch(_){}
  }
  _expenseReviewState.preview={kind:null,url:null}
}
async function openExpenseFilePicker(){
  var inp=document.getElementById('expenseFileInput');
  if(inp)inp.click();
}
async function handleExpenseFileInput(e){
  var files=e&&e.target&&e.target.files?Array.prototype.slice.call(e.target.files):[];
  if(e&&e.target)e.target.value='';
  await _importExpenseFiles(files);
}
async function _importExpenseFiles(files){
  if(!files||!files.length)return;
  if(!window.electronAPI||!window.electronAPI.importExpenseDocument){
    await uiAlert('Beleg-Import ist nur in der Desktop-App verfügbar.','Ausgaben');
    return;
  }
  if(!window.electronAPI.importExpenseDocumentBuffer){
    await uiAlert('Beleg-Import ist noch nicht vollständig verfügbar. Bitte App neu starten.','Ausgaben');
    return;
  }
  for(var i=0;i<files.length;i++){
    var f=files[i];
    if(!f)continue;
    var name=String(f.name||'');
    var ext=name.toLowerCase();
    var isPdf=(String(f.type||'').toLowerCase()==='application/pdf')||/\.pdf$/i.test(ext);
    var isImg=/^image\//i.test(String(f.type||''))||/\.(png|jpe?g|webp|gif)$/i.test(ext);
    if(!isPdf&&!isImg){continue}
    await _importSingleExpenseFile(f);
  }
  saveData();
  renderExpenses();
}
async function _importSingleExpenseFile(file){
  var path=String(file.path||'');
  var originalName=String(file.name||'beleg');
  var res=null;
  if(path){
    res=await window.electronAPI.importExpenseDocument({srcPath:path,originalName:originalName});
  } else if(window.electronAPI.importExpenseDocumentBuffer&&file&&file.arrayBuffer){
    try{
      var ab=await file.arrayBuffer();
      var b64=_abToBase64(ab);
      res=await window.electronAPI.importExpenseDocumentBuffer({dataBase64:b64,originalName:originalName});
    }catch(_){res=null}
  }
  if(!res||!res.ok||!res.doc){
    var detail='';
    try{detail=res&&res.error?String(res.error):''}catch(_){detail=''}
    await uiAlert('Beleg konnte nicht importiert werden.'+(detail?('\n\nDetails: '+detail):''),'Ausgaben');
    return;
  }
  var doc=res.doc;
  expenseDocuments=ensureArray(expenseDocuments);
  var existing=expenseDocuments.find(function(d){return d&&d.sha256&&doc.sha256&&d.sha256===doc.sha256});
  if(existing){
    var okExisting=false;
    try{
      if(window.electronAPI&&window.electronAPI.readFile&&existing.storedPath){
        var chk=await window.electronAPI.readFile(existing.storedPath);
        okExisting=!!(chk&&chk.ok&&chk.base64);
      }
    }catch(_){okExisting=false}
    if(okExisting){
      try{await openExpenseReview(existing.id)}catch(_){}
      return;
    }
    try{
      existing.fileName=doc.fileName;
      existing.originalName=doc.originalName;
      existing.ext=doc.ext;
      existing.size=doc.size;
      existing.storedPath=doc.storedPath;
      existing.createdAt=doc.createdAt;
      await openExpenseReviewFromFile(existing,file);
    }catch(_){}
    return;
  }
  expenseDocuments.unshift(doc);
  try{
    await openExpenseReviewFromFile(doc,file);
  }catch(err){
    try{
      var modal=document.getElementById('expenseReviewModal');
      if(modal)modal.classList.add('active');
      var previewWrap=document.getElementById('expenseReviewPreview');
      if(previewWrap)previewWrap.innerHTML='<div class="text-red-500 text-sm">Beleg wurde importiert, aber das Prüf-Fenster konnte nicht geöffnet werden.</div>';
    }catch(_){}
  }
}
async function openExpenseReview(docId){
  var doc=ensureArray(expenseDocuments).find(function(d){return d&&d.id===docId});
  if(!doc){await uiAlert('Beleg nicht gefunden.','Ausgaben');return}
  await openExpenseReviewFromFile(doc,null);
}
async function openExpenseReviewFromFile(doc,file){
  _clearExpensePreview();
  _expenseReviewState.open=true;
  _expenseReviewState.documentId=doc.id;
  _expenseReviewState.doc=doc;
  _expenseReviewState.header={vendorName:'',invoiceNo:'',date:'',totalGross:'',note:''};
  _expenseReviewState.items=[];
  _expenseReviewState.rawText='';
  _expenseReviewState.expenseId=null;

  var modal=document.getElementById('expenseReviewModal');
  if(modal)modal.classList.add('active');
  var title=document.getElementById('expenseReviewTitle');
  if(title)title.textContent='Beleg prüfen';
  var sub=document.getElementById('expenseReviewSub');
  if(sub)sub.textContent=String(doc.originalName||doc.fileName||'');
  var previewWrap=document.getElementById('expenseReviewPreview');
  if(previewWrap)previewWrap.innerHTML='<div class="text-gray-500 text-sm">Wird verarbeitet…</div>';

  var ab=null;
  var readErr='';
  try{
    if(file&&file.arrayBuffer)ab=await file.arrayBuffer();
    else if(window.electronAPI&&window.electronAPI.readFile){
      var rr=await window.electronAPI.readFile(doc.storedPath);
      if(rr&&rr.ok&&rr.base64)ab=_base64ToArrayBuffer(rr.base64);
      else if(rr&&rr.ok&&rr.data)ab=_toArrayBuffer(rr.data);
      else readErr=(rr&&rr.error)?String(rr.error):'READ_FAILED';
    }
  }catch(e){readErr=String((e&&e.message)||e||'READ_FAILED')}

  var ext=String(doc.ext||'').toLowerCase();
  var isPdf=/\.pdf$/i.test(doc.fileName||'')||ext==='.pdf'||ext==='pdf';
  _expenseReviewState.fileAb=ab||null;
  _expenseReviewState.fileMime=(file&&file.type)?String(file.type||''):_mimeFromName(doc.originalName||doc.fileName||'');
  if(isPdf&&!_expenseReviewState.fileMime)_expenseReviewState.fileMime='application/pdf';
  var aiStatus=document.getElementById('expenseAiStatus');
  if(aiStatus)aiStatus.innerHTML='';
  if(ab){
    if(isPdf){
      var u8Master=_cloneU8FromArrayBuffer(ab);
      try{
        var lines=await _extractPdfTextLines(u8Master||ab);
        _expenseReviewState.rawText=lines.join('\n');
        _expenseReviewState.header=_guessHeaderFromLines(lines);
        _expenseReviewState.items=_guessItemsFromLines(lines);
      }catch(_){}
      try{
        if(previewWrap)previewWrap.innerHTML='<canvas id="expensePdfCanvas" style="width:100%;height:auto;border:1px solid #e5e7eb;border-radius:12px"></canvas>';
        var canvas=document.getElementById('expensePdfCanvas');
        if(canvas)await _renderPdfPreview(u8Master||ab,canvas);
      }catch(ePrev){
        var fileUrl=_filePathToFileUrl(doc&&doc.storedPath);
        if(fileUrl&&previewWrap){
          previewWrap.innerHTML='<embed src="'+esc(fileUrl)+'" type="application/pdf" style="width:100%;height:560px;border:1px solid #e5e7eb;border-radius:12px"></embed>';
        } else if(previewWrap){
          var det='';
          try{det=String((ePrev&&ePrev.message)||ePrev||'')}catch(_){det=''}
          var libErr='';
          try{libErr=String(window.__pdfJsLastError||'').trim()}catch(_){libErr=''}
          previewWrap.innerHTML='<div class="text-gray-500 text-sm">Vorschau nicht verfügbar.</div>'+(det?('<div class="text-xs text-gray-400 mt-1 break-all">'+esc(det)+'</div>'):'')+(libErr?('<div class="text-xs text-gray-400 mt-1 break-all">pdf.js: '+esc(libErr)+'</div>'):'');
        }
      }
    } else {
      try{
        var mime=(file&&file.type)?String(file.type||''):_mimeFromName(doc.originalName||doc.fileName||'');
        var blob=new Blob([ab],{type:mime||'application/octet-stream'});
        var url=URL.createObjectURL(blob);
        _expenseReviewState.preview={kind:'image',url:url};
        if(previewWrap)previewWrap.innerHTML='<img src="'+esc(url)+'" style="max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:12px">';
      }catch(_){
        if(previewWrap)previewWrap.innerHTML='<div class="text-gray-500 text-sm">Vorschau nicht verfügbar.</div>';
      }
    }
  } else {
    if(previewWrap)previewWrap.innerHTML='<div class="text-gray-500 text-sm">Datei konnte nicht gelesen werden.'+(readErr?(' ('+esc(readErr)+')'):'')+'</div><div class="text-xs text-gray-400 mt-1 break-all">'+esc(String(doc&&doc.storedPath||''))+'</div>';
  }

  var ex=ensureArray(expenseExtractions).find(function(x){return x&&x.documentId===doc.id});
  if(ex&&ex.header){_expenseReviewState.header=Object.assign({},_expenseReviewState.header,ex.header||{});if(Array.isArray(ex.items)&&ex.items.length)_expenseReviewState.items=ex.items.map(function(it){return Object.assign({id:_wmId('expi')},it)})}
  var existingExp=ensureArray(typeof expenses!=='undefined'?expenses:[]).find(function(e){return e&&e.documentId===doc.id});
  if(existingExp){
    _expenseReviewState.expenseId=existingExp.id;
    _expenseReviewState.header=Object.assign({},_expenseReviewState.header,{vendorName:String(existingExp.vendorName||''),invoiceNo:String(existingExp.invoiceNo||''),date:String(existingExp.date||''),totalGross:(existingExp.totalGross===''||existingExp.totalGross==null)?'':String(existingExp.totalGross),note:String(existingExp.note||'')});
    var existingItems=ensureArray(typeof expenseLineItems!=='undefined'?expenseLineItems:[]).filter(function(li){return li&&li.expenseId===existingExp.id});
    if(existingItems.length){
      _expenseReviewState.items=existingItems.map(function(li){return{id:li.id||_wmId('expi'),accountId:String(li.accountId||''),description:String(li.description||''),qty:String(li.qty||''),unit:String(li.unit||''),unitPrice:String(li.unitPrice||''),taxRate:String(li.taxRate||''),lineTotal:String(li.lineTotal||'')}});
    }
  }
  var saveBtn=document.getElementById('expenseSaveBtn');if(saveBtn)saveBtn.textContent=_expenseReviewState.expenseId?'Änderungen speichern':'Als Ausgabe speichern';
  _renderExpenseReviewForm();
}
function _getExpensePreviewImageDataUrl(){
  try{
    var canvas=document.getElementById('expensePdfCanvas');
    if(canvas&&canvas.toDataURL)return canvas.toDataURL('image/jpeg',0.75);
  }catch(_){}
  return''
}
function _abToBase64(ab){
  try{
    var u8=new Uint8Array(ab);
    var s='';
    var chunk=0x8000;
    for(var i=0;i<u8.length;i+=chunk){
      s+=String.fromCharCode.apply(null,u8.subarray(i,i+chunk));
    }
    return btoa(s);
  }catch(_){return''}
}
function _normalizeAiNumber(n){
  if(n==null||n==='')return'';
  if(typeof n==='number'&&isFinite(n))return n;
  var p=_parseEuro(String(n));
  return isFinite(p)?p:''
}
function _normalizeAiDate(d){
  var s=String(d||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  var de=_parseDateDE(s);
  if(de)return de;
  return''
}
async function runAiExtractExpense(){
  var apiKey=String(getOpenAiApiKey&&getOpenAiApiKey()||'').trim();
  if(!apiKey){await uiAlert('Bitte zuerst einen OpenAI API-Key in den Einstellungen (Firmendaten → KI-Assistent) hinterlegen.','Ausgaben');return}
  if(!_expenseReviewState.doc){await uiAlert('Kein Beleg geöffnet.','Ausgaben');return}
  var btn=document.getElementById('expenseAiBtn');
  var status=document.getElementById('expenseAiStatus');
  if(btn){btn.disabled=true;btn.textContent='...'}
  if(status)status.innerHTML='<div class="text-sm text-gray-500">KI extrahiert Daten…</div>';
  try{
    var doc=_expenseReviewState.doc;
    var isPdf=/\.pdf$/i.test(doc.fileName||'')||String(doc.ext||'').toLowerCase()==='.pdf'||String(doc.ext||'').toLowerCase()==='pdf';
    var sys='Extrahiere aus einem Beleg (Rechnung) strukturierte Daten für eine Ausgabe. Antworte ausschließlich als gültiges JSON-Objekt im Format {"vendorName":"","invoiceNo":"","date":"YYYY-MM-DD","totalGross":0,"currency":"EUR","items":[{"description":"","qty":1,"unit":"","unitPrice":0,"taxRate":0.19,"lineTotal":0}]}. Verwende Zahlen als Zahl (nicht als String). Wenn Werte fehlen, nutze leere Strings oder null. taxRate als Dezimalzahl (0.19 oder 0.07), falls erkennbar, sonst null.';
    var text=_expenseReviewState.rawText||'';
    if(text.length>14000)text=text.slice(0,14000);
    var previewUrl='';
    if(isPdf)previewUrl=_getExpensePreviewImageDataUrl();
    else if(_expenseReviewState.fileAb){
      if(_expenseReviewState.fileAb.byteLength>3*1024*1024&&text){
        previewUrl='';
      } else if(_expenseReviewState.fileAb.byteLength>3*1024*1024&&!text){
        throw new Error('Bild ist zu groß für KI-Extraktion. Bitte als PDF importieren oder vorher komprimieren.');
      }
      var b64=_abToBase64(_expenseReviewState.fileAb);
      if(b64){
        var mime2=_expenseReviewState.fileMime||'image/jpeg';
        previewUrl='data:'+mime2+';base64,'+b64;
      }
    }
    var messages=[{role:'system',content:sys}];
    if(previewUrl&&previewUrl.indexOf('data:image/')===0){
      messages.push({role:'user',content:[{type:'text',text:'Hier ist der Beleg. Extrahiere die Daten.'+(text?'\n\nZusätzlicher Textauszug:\n'+text:'')},{type:'image_url',image_url:{url:previewUrl}}]});
    } else {
      messages.push({role:'user',content:'Extrahiere die Daten aus folgendem Beleg-Text:\n\n'+(text||'')});
    }
    if(!text&&isPdf&&previewUrl&&previewUrl.indexOf('data:image/')!==0){
      try{
        var canvas=document.getElementById('expensePdfCanvas');
        if(canvas&&canvas.toDataURL){
          previewUrl=canvas.toDataURL('image/jpeg',0.75);
          messages=[{role:'system',content:sys},{role:'user',content:[{type:'text',text:'Hier ist der Beleg. Extrahiere die Daten.'},{type:'image_url',image_url:{url:previewUrl}}]}];
        }
      }catch(_){}
    }
    if(!text&&!previewUrl){
      if(status)status.innerHTML='<div class="text-sm text-red-500">Keine Daten für KI-Extraktion verfügbar.</div>';
      if(btn){btn.disabled=false;btn.innerHTML='&#10024; KI extrahieren'}
      return;
    }
    var resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',temperature:0.1,response_format:{type:'json_object'},messages:messages})});
    var data=await resp.json().catch(function(){return null});
    if(!resp.ok){
      var msg=data&&data.error&&data.error.message?data.error.message:('API-Fehler '+resp.status);
      throw new Error(msg);
    }
    var content=data&&data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'';
    var parsed=null;
    try{parsed=JSON.parse(String(content||'').trim())}catch(_){try{var m=String(content||'').match(/\{[\s\S]*\}/);if(m)parsed=JSON.parse(m[0])}catch(__){}}
    if(!parsed)throw new Error('KI-Antwort konnte nicht verarbeitet werden.');
    var header={vendorName:String(parsed.vendorName||''),invoiceNo:String(parsed.invoiceNo||''),date:_normalizeAiDate(parsed.date),totalGross:_normalizeAiNumber(parsed.totalGross)};
    var items=Array.isArray(parsed.items)?parsed.items:[];
    _expenseReviewState.header=header;
    _expenseReviewState.items=items.slice(0,80).map(function(it){
      return{
        id:_wmId('expi'),
        description:String((it&&it.description)||'').trim().slice(0,240),
        qty:(it&&it.qty!=null&&it.qty!=='')?String(it.qty):'',
        unit:String((it&&it.unit)||'').trim().slice(0,20),
        unitPrice:(it&&it.unitPrice!=null&&it.unitPrice!=='')?String(it.unitPrice):'',
        taxRate:(it&&it.taxRate!=null&&it.taxRate!=='')?String(it.taxRate):'',
        lineTotal:(it&&it.lineTotal!=null&&it.lineTotal!=='')?String(it.lineTotal):''
      }
    }).filter(function(it){return it.description||it.lineTotal});
    expenseExtractions=ensureArray(expenseExtractions);
    var exIdx=expenseExtractions.findIndex(function(x){return x&&x.documentId===_expenseReviewState.documentId});
    var ex={documentId:_expenseReviewState.documentId,header:header,items:_expenseReviewState.items,extractedAt:Date.now(),engine:'openai:gpt-4o-mini'};
    if(exIdx>=0)expenseExtractions[exIdx]=Object.assign({},expenseExtractions[exIdx],ex);
    else expenseExtractions.push(ex);
    await saveData();
    _renderExpenseReviewForm();
    if(status)status.innerHTML='<div class="text-sm text-green-700">KI-Extraktion übernommen. Bitte kurz prüfen.</div>';
  }catch(err){
    if(status)status.innerHTML='<div class="text-sm text-red-500">KI-Fehler: '+esc(err.message||String(err))+'</div>';
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML='&#10024; KI extrahieren'}
  }
}
function closeExpenseReviewModal(){
  var modal=document.getElementById('expenseReviewModal');
  if(modal)modal.classList.remove('active');
  _expenseReviewState.open=false;
  _expenseReviewState.documentId=null;
  _expenseReviewState.doc=null;
  _expenseReviewState.header={};
  _expenseReviewState.items=[];
  _expenseReviewState.rawText='';
  _expenseReviewState.fileAb=null;
  _expenseReviewState.fileMime='';
  _clearExpensePreview();
}
function _renderExpenseReviewForm(){
  var h=_expenseReviewState.header||{};
  var vendor=document.getElementById('expVendor');
  var inv=document.getElementById('expInvoiceNo');
  var dt=document.getElementById('expDate');
  var total=document.getElementById('expTotalGross');
  var note=document.getElementById('expNote');
  if(vendor)vendor.value=h.vendorName||'';
  if(inv)inv.value=h.invoiceNo||'';
  if(dt)dt.value=h.date||'';
  if(total)total.value=(h.totalGross===''||h.totalGross==null)?'':String(h.totalGross);
  if(note)note.value=h.note||'';
  renderExpenseLineItemsEditor();
}
function renderExpenseLineItemsEditor(){
  var wrap=document.getElementById('expenseLineItemsEditor');
  if(!wrap)return;
  var items=ensureArray(_expenseReviewState.items);
  if(!items.length){
    wrap.innerHTML='<p class="text-gray-500 text-sm">Keine Positionen erkannt. Du kannst Positionen manuell hinzufügen.</p>';
    return;
  }
  function _accLabel(id){
    var list=ensureArray(typeof accounts!=='undefined'?accounts:[]);
    var a=list.find(function(x){return x&&x.id===id});
    if(!a)return'';
    var c=String(a.code||'').trim();
    var n=String(a.name||'').trim();
    return (c?(c+' '):'')+n
  }
  function _accOptions(selected){
    var list=ensureArray(typeof accounts!=='undefined'?accounts:[]).slice().filter(function(a){return a&&(a.name||a.code)}).sort(function(a,b){return String((a.code||'')+(a.name||'')).localeCompare(String((b.code||'')+(b.name||'')))});
    var html='<option value="">-- Konto/Kategorie --</option>';
    list.forEach(function(a){
      var id=String(a.id||'');
      var label=_accLabel(id);
      html+='<option value="'+escAttr(id)+'"'+(String(selected||'')===id?' selected':'')+'>'+esc(label||'-')+'</option>';
    });
    return html
  }
  var cards=items.map(function(it,idx){
    var id=it.id||('row_'+idx);
    return'<div class="border border-gray-200 rounded-xl p-3 bg-white">'+
      '<div class="grid grid-cols-1 gap-2">'+
        '<div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">'+
          '<div class="md:col-span-11">'+
            '<div class="text-[11px] text-gray-500 font-semibold mb-1">Konto / Kategorie</div>'+
            '<select class="input" onchange="updateExpenseItemField(\''+esc(id)+'\',\'accountId\',this.value)">'+_accOptions(it.accountId)+'</select>'+
          '</div>'+
          '<div class="md:col-span-1 flex justify-end">'+
            '<button type="button" class="btn btn-secondary btn-sm" onclick="addExpenseAccountPrompt()" title="Neues Konto anlegen">+ Konto</button>'+
          '</div>'+
        '</div>'+
        '<div>'+
          '<div class="text-[11px] text-gray-500 font-semibold mb-1">Beschreibung</div>'+
          '<textarea rows="2" class="input" style="width:100%;min-height:54px;resize:vertical" oninput="updateExpenseItemField(\''+esc(id)+'\',\'description\',this.value)" placeholder="z.B. Material / Leistung / Artikel…">'+esc(it.description||'')+'</textarea>'+
        '</div>'+
        '<div class="grid grid-cols-2 md:grid-cols-12 gap-2 items-end">'+
          '<div class="md:col-span-2">'+
            '<div class="text-[11px] text-gray-500 font-semibold mb-1">Menge</div>'+
            '<input class="input" value="'+esc(it.qty||'')+'" oninput="updateExpenseItemField(\''+esc(id)+'\',\'qty\',this.value)" placeholder="1" />'+
          '</div>'+
          '<div class="md:col-span-2">'+
            '<div class="text-[11px] text-gray-500 font-semibold mb-1">Einheit</div>'+
            '<input class="input" value="'+esc(it.unit||'')+'" oninput="updateExpenseItemField(\''+esc(id)+'\',\'unit\',this.value)" placeholder="Stk" />'+
          '</div>'+
          '<div class="md:col-span-3">'+
            '<div class="text-[11px] text-gray-500 font-semibold mb-1">Einzelpreis</div>'+
            '<input class="input" value="'+esc(it.unitPrice||'')+'" oninput="updateExpenseItemField(\''+esc(id)+'\',\'unitPrice\',this.value)" placeholder="0,00" />'+
          '</div>'+
          '<div class="md:col-span-2">'+
            '<div class="text-[11px] text-gray-500 font-semibold mb-1">MwSt</div>'+
            '<input class="input" value="'+esc(it.taxRate||'')+'" oninput="updateExpenseItemField(\''+esc(id)+'\',\'taxRate\',this.value)" placeholder="0,19" />'+
          '</div>'+
          '<div class="md:col-span-2">'+
            '<div class="text-[11px] text-gray-500 font-semibold mb-1">Summe</div>'+
            '<input class="input" value="'+esc(it.lineTotal||'')+'" oninput="updateExpenseItemField(\''+esc(id)+'\',\'lineTotal\',this.value)" placeholder="0,00" />'+
          '</div>'+
          '<div class="md:col-span-1 flex justify-end">'+
            '<button type="button" class="btn btn-secondary btn-sm btn-danger" onclick="removeExpenseItem(\''+esc(id)+'\')" title="Position löschen">&times;</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'
  }).join('');
  wrap.innerHTML='<div class="space-y-2">'+cards+'</div>';
}
function addExpenseItem(){
  _expenseReviewState.items=ensureArray(_expenseReviewState.items);
  _expenseReviewState.items.push({id:_wmId('expi'),description:'',qty:'',unit:'',unitPrice:'',taxRate:'',lineTotal:''});
  renderExpenseLineItemsEditor();
}
function removeExpenseItem(id){
  _expenseReviewState.items=ensureArray(_expenseReviewState.items).filter(function(it){return it&&it.id!==id});
  renderExpenseLineItemsEditor();
}
function updateExpenseItemField(id,field,value){
  var items=ensureArray(_expenseReviewState.items);
  var it=items.find(function(x){return x&&x.id===id});
  if(!it)return;
  it[field]=value;
}
async function addExpenseAccountPrompt(){
  accounts=ensureArray(typeof accounts!=='undefined'?accounts:[]);
  var raw=await uiPrompt('Neues Konto/Kategorie:', '', 'Konto anlegen', 'z. B. 3400 Material');
  if(!raw)return;
  var s=String(raw||'').trim();
  if(!s)return;
  var code='';
  var name=s;
  var m=s.match(/^(\d{3,6})\s+(.+)$/);
  if(m){code=m[1];name=m[2]}
  name=String(name||'').trim();
  if(!name)return;
  var dup=accounts.find(function(a){return a&&(String(a.code||'').trim()===code&&code)||String(a.name||'').trim().toLowerCase()===name.toLowerCase()});
  if(dup){await uiAlert('Dieses Konto existiert bereits.','Konto');return}
  accounts.push({id:'acc_'+Date.now()+'_'+Math.random().toString(16).slice(2),code:code,name:name});
  await saveData();
  renderExpenseLineItemsEditor();
}
function _collectExpenseReviewData(){
  var vendor=(document.getElementById('expVendor')||{}).value||'';
  var invoiceNo=(document.getElementById('expInvoiceNo')||{}).value||'';
  var date=(document.getElementById('expDate')||{}).value||'';
  var totalGross=(document.getElementById('expTotalGross')||{}).value||'';
  var note=(document.getElementById('expNote')||{}).value||'';
  var items=ensureArray(_expenseReviewState.items).map(function(it){
    return{
      id:_wmId('expli'),
      accountId:String(it.accountId||'').trim(),
      description:String(it.description||'').trim(),
      qty:String(it.qty||'').trim(),
      unit:String(it.unit||'').trim(),
      unitPrice:String(it.unitPrice||'').trim(),
      taxRate:String(it.taxRate||'').trim(),
      lineTotal:String(it.lineTotal||'').trim()
    }
  }).filter(function(it){return it.description||it.lineTotal});
  var totalVal=_parseEuro(totalGross);
  if(!isFinite(totalVal)||totalVal<=0){
    var sum=items.reduce(function(a,it){var n=_parseEuro(it.lineTotal);return a+(isFinite(n)?n:0)},0);
    if(sum>0)totalVal=sum;
  }
  return{vendorName:vendor,invoiceNo:invoiceNo,date:date,totalGross:totalVal>0?totalVal:'',note:note,items:items}
}
async function saveExpenseFromReview(){
  if(!_expenseReviewState.documentId||!_expenseReviewState.doc){await uiAlert('Kein Beleg ausgewählt.','Ausgaben');return}
  var data=_collectExpenseReviewData();
  if(!data.vendorName&&!data.invoiceNo){await uiAlert('Bitte mindestens Lieferant oder Rechnungsnummer eintragen.','Ausgaben');return}
  expenses=ensureArray(expenses);
  expenseLineItems=ensureArray(expenseLineItems);
  var existingExp=expenses.find(function(e){return e&&e.documentId===_expenseReviewState.documentId});
  var expId=existingExp?existingExp.id:_wmId('exp');
  if(existingExp){
    existingExp.vendorName=String(data.vendorName||'');
    existingExp.invoiceNo=String(data.invoiceNo||'');
    existingExp.date=String(data.date||'');
    existingExp.totalGross=data.totalGross===''?'':Number(data.totalGross);
    existingExp.note=String(data.note||'');
    expenseLineItems=expenseLineItems.filter(function(li){return li&&li.expenseId!==expId});
  }else{
    var exp={id:expId,documentId:_expenseReviewState.documentId,vendorName:String(data.vendorName||''),invoiceNo:String(data.invoiceNo||''),date:String(data.date||''),totalGross:data.totalGross===''?'':Number(data.totalGross),currency:'EUR',status:'open',note:String(data.note||''),createdAt:Date.now()};
    expenses.unshift(exp);
  }
  data.items.forEach(function(it){
    expenseLineItems.push({id:it.id,expenseId:expId,accountId:it.accountId||'',description:it.description,qty:it.qty,unit:it.unit,unitPrice:it.unitPrice,taxRate:it.taxRate,lineTotal:it.lineTotal});
  });

  expenseExtractions=ensureArray(expenseExtractions);
  var exIdx=expenseExtractions.findIndex(function(x){return x&&x.documentId===_expenseReviewState.documentId});
  var ex={documentId:_expenseReviewState.documentId,header:{vendorName:data.vendorName,invoiceNo:data.invoiceNo,date:data.date,totalGross:data.totalGross,note:data.note},items:ensureArray(_expenseReviewState.items),extractedAt:Date.now()};
  if(exIdx>=0)expenseExtractions[exIdx]=Object.assign({},expenseExtractions[exIdx],ex);
  else expenseExtractions.push(ex);

  await saveData();
  closeExpenseReviewModal();
  renderExpenses();
}
async function deleteExpense(id){
  if(!await uiConfirm('Ausgabe wirklich löschen?','Löschen'))return;
  expenses=ensureArray(expenses).filter(function(e){return e&&e.id!==id});
  expenseLineItems=ensureArray(expenseLineItems).filter(function(li){return li&&li.expenseId!==id});
  await saveData();
  renderExpenses();
}
function _expenseListRow(exp){
  var date=exp.date||'';
  var amt=(exp.totalGross!==''&&exp.totalGross!=null)?fmtCur(Number(exp.totalGross)||0):'';
  var title=[exp.vendorName||'-',exp.invoiceNo?('· '+exp.invoiceNo):''].join(' ').trim();
  var sub=[date,amt].filter(Boolean).join(' · ');
  return'<div class="flex items-center justify-between gap-3 py-3 border-b border-gray-100">'+
    '<div class="min-w-0">'+
      '<div class="font-semibold text-gray-800 truncate">'+esc(title)+'</div>'+
      (sub?'<div class="text-sm text-gray-500 truncate">'+esc(sub)+'</div>':'')+
    '</div>'+
    '<div class="flex gap-2 flex-shrink-0">'+
      '<button class="btn btn-secondary btn-sm" onclick="openExpenseReview(\''+esc(exp.documentId||'')+'\')">Beleg</button>'+
      '<button class="btn btn-secondary btn-sm" onclick="deleteExpense(\''+esc(exp.id)+'\')">Löschen</button>'+
    '</div>'+
  '</div>'
}
function renderExpenses(){
  var list=document.getElementById('expensesList');
  if(!list)return;
  try{_initExpensesUi()}catch(_){}
  expenses=ensureArray(expenses);
  if(!expenses.length){list.innerHTML='<p class="text-gray-500 text-center py-12">Noch keine Ausgaben.</p>';return}
  list.innerHTML=expenses.map(function(e){return _expenseListRow(e)}).join('');
}
function _bindExpenseDrop(){
  var dz=document.getElementById('expenseDropZone');
  if(!dz||dz.__bound)return;
  dz.__bound=true;
  function stop(e){e.preventDefault();e.stopPropagation()}
  dz.addEventListener('dragenter',function(e){stop(e);dz.classList.add('ring-2','ring-cyan-400')});
  dz.addEventListener('dragover',function(e){stop(e);dz.classList.add('ring-2','ring-cyan-400')});
  dz.addEventListener('dragleave',function(e){stop(e);dz.classList.remove('ring-2','ring-cyan-400')});
  dz.addEventListener('drop',async function(e){
    stop(e);
    dz.classList.remove('ring-2','ring-cyan-400');
    var files=e.dataTransfer&&e.dataTransfer.files?Array.prototype.slice.call(e.dataTransfer.files):[];
    await _importExpenseFiles(files);
  });
}
function _initExpensesUi(){
  try{_bindExpenseDrop()}catch(_){}
  try{
    if(document.__wmExpenseGlobalDnD)return;
    document.__wmExpenseGlobalDnD=true;
    document.addEventListener('dragover',function(e){try{e.preventDefault()}catch(_){}},false);
    document.addEventListener('drop',function(e){try{e.preventDefault()}catch(_){}},false);
  }catch(_){}
}
try{_initExpensesUi()}catch(_){}
try{document.addEventListener('DOMContentLoaded',function(){_initExpensesUi()})}catch(_){}
