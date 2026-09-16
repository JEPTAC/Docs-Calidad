function bind(){
  const homeTopBtn=$('homeTopBtn');if(homeTopBtn)homeTopBtn.onclick=()=>setMode('home');
  const clearHistoryBtn=$('clearProjectHistory');if(clearHistoryBtn)clearHistoryBtn.onclick=()=>clearProjectHistory();renderProjectHistory();
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setMode(b.dataset.open));
  $('goHome').onclick=()=>setMode('home');$('openProcedure').onclick=openProcedure;
  $('zoomIn').onclick=()=>setZoom(zoom+.05);$('zoomOut').onclick=()=>setZoom(zoom-.05);$('zoomFit').onclick=()=>setZoom(.72);
  const printBtn=$('printPdf');if(printBtn)printBtn.onclick=()=>exportPdf();
  const docxBtn=$('exportDocx');if(docxBtn)docxBtn.onclick=()=>exportWordDocx();
  const saveCacheBtn=$('saveCache');if(saveCacheBtn)saveCacheBtn.onclick=()=>saveToBrowserCache();
  const saveBtn=$('saveJson');if(saveBtn)saveBtn.onclick=saveJson;const openBtn=$('openJson');if(openBtn)openBtn.onchange=openJson;
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','asuntoCircular','remitente','cargo'].forEach(id=>{const el=$(id);if(el)el.oninput=e=>{if(id==='wordType'){doc.wordType=e.target.value;onWordTypeChanged()}else{doc[fieldMap(id)]=e.target.value;render()}}});
  $('docBody').oninput=e=>{doc.body=e.target.value;render()};const addSectionBtn=$('addSection');if(addSectionBtn)addSectionBtn.onclick=()=>addTypedWordSection('NUEVA SECCIÓN');
  ['instrTitle','instrCode','instrVersion','objective','scope'].forEach(id=>{const el=$(id);if(el)el.oninput=e=>{doc[id]=e.target.value;render()}});['objectiveAlign','scopeAlign'].forEach(id=>{const el=$(id);if(el)el.onchange=e=>{doc[id]=e.target.value;render()}});
  $('addStep').onclick=()=>createFirstStep();$('addNote').onclick=()=>{if(!doc.steps.length)createFirstStep();const i=Number(doc.activeStep||0);doc.steps[i].notes=doc.steps[i].notes||[];doc.steps[i].notes.push({text:'',align:'left'});render()};$('activeStep').onchange=e=>{doc.activeStep=Number(e.target.value)||0;render()};
}

function sanitizeImportedDocument(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Estructura de proyecto inválida');
  const clone=JSON.parse(JSON.stringify(data,(k,v)=>['__proto__','prototype','constructor'].includes(k)?undefined:v));
  const walk=o=>{if(!o||typeof o!=='object')return;Object.keys(o).forEach(k=>{const v=o[k];if(typeof v==='string'&&/(image|src)$/i.test(k))o[k]=safeImageSrc(v);else if(v&&typeof v==='object')walk(v)})};walk(clone);return clone;
}
function openJson(e){
  const f=e.target.files?.[0];if(!f)return;if(f.size>12*1024*1024){alert('El proyecto supera 12 MB. Reduzca el peso de las imágenes antes de abrirlo.');e.target.value='';return}
  const r=new FileReader();r.onload=()=>{try{const parsed=sanitizeImportedDocument(JSON.parse(r.result));doc={...doc,...parsed};ensureDocDefaults();ensureSubDefaults();ensureWordSubtitles();render()}catch(err){alert('JSON inválido o proyecto incompatible: '+err.message)}finally{e.target.value=''}};r.readAsText(f)
}

function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function safeFileName(v){return (String(v||'documento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'documento')}
function dataUriToBytes(uri){const m=String(uri||'').match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);if(!m)return null;const bin=atob(m[2].replace(/\s/g,'')),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return {type:m[1].toLowerCase().replace('jpeg','jpg'),data:out}}
async function srcToImageBytes(src){const safe=safeImageSrc(src);if(!safe)return null;const d=dataUriToBytes(safe);if(d)return d;const res=await fetch(safe);if(!res.ok)return null;const type=(res.headers.get('content-type')||'image/png').split('/')[1].replace('jpeg','jpg');return {type,data:new Uint8Array(await res.arrayBuffer())}}
async function chartPngBytes(block){
  const svg=chartSvgMarkup(block,true),blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
  try{const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url});const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=560;const ctx=canvas.getContext('2d');ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.95));return new Uint8Array(await png.arrayBuffer())}finally{URL.revokeObjectURL(url)}
}
