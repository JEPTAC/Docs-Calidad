/* ===== V80 · IMPORTACIÓN DOCUMENTAL LOCAL ==================================
   Lee DOCX, PDF, XLSX/XLS/CSV y TXT/MD en el navegador. No sube archivos.
   Mammoth/PDF.js/SheetJS se cargan solo cuando hacen falta.
============================================================================= */
const EI_AI_MAX_FILE=25*1024*1024;
const EI_AI_MAMMOTH='https://cdn.jsdelivr.net/npm/mammoth@1.12.3/mammoth.browser.min.js';
const EI_AI_PDF='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.mjs';
const EI_AI_PDF_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.mjs';
const EI_AI_XLSX='https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
const eiAiLibPromises={};
function eiAiLoadScript(src,key){
  if(key&&window[key])return Promise.resolve(window[key]);if(eiAiLibPromises[src])return eiAiLibPromises[src];
  eiAiLibPromises[src]=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>resolve(key?window[key]:true);s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));document.head.appendChild(s)});return eiAiLibPromises[src];
}
function eiAiKnownHeading(line){
  const clean=String(line||'').trim().replace(/^\d+(?:\.\d+)*[.)]?\s*/,'').toUpperCase();
  return /^(OBJETIVO|ALCANCE|DEFINICIONES|RESPONSABILIDADES|CONTENIDO|DESARROLLO|METODOLOG[IÍ]A|RESULTADOS|AN[AÁ]LISIS|CONCLUSIONES|RECOMENDACIONES|REFERENCIAS|BIBLIOGRAF[IÍ]A|ANEXOS|CONTROL DE CAMBIOS|MARCO (?:TE[OÓ]RICO|NORMATIVO)|INTRODUCCI[OÓ]N)$/.test(clean);
}
function eiAiLooksHeading(line){
  const s=String(line||'').trim();if(!s||s.length>110)return false;if(/^\d+(?:\.\d+){0,5}[.)]?\s+\S+/.test(s))return true;if(eiAiKnownHeading(s))return true;
  const letters=s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g,'');if(letters.length<4)return false;const upper=[...letters].filter(c=>c===c.toUpperCase()).length/letters.length;return upper>.82&&s.split(/\s+/).length<=12;
}
function eiAiInferStructure(text,knownHeadings=[]){
  const lines=String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean),sections=[];let current=null;
  const headingMap=new Map((knownHeadings||[]).map(h=>[String(h.text||'').trim(),Math.max(1,Math.min(6,Number(h.level)||1))]));
  for(const line of lines){const isHead=headingMap.has(line)||eiAiLooksHeading(line);if(isHead){if(current)sections.push(current);current={title:line.replace(/^\d+(?:\.\d+)*[.)]?\s*/,''),level:headingMap.get(line)||((line.match(/^(\d+(?:\.\d+)*)/)?.[1]?.split('.').length)||1),content:''}}else{if(!current)current={title:'CONTENIDO',level:1,content:''};current.content+=(current.content?'\n':'')+line}}
  if(current)sections.push(current);return sections.filter(x=>x.title||x.content).slice(0,120);
}
function eiAiTableText(rows){return (rows||[]).map(r=>(r||[]).map(c=>String(c??'').trim()).join(' | ')).join('\n')}
function eiAiDocxExtractStructure(html){
  const parsed=new DOMParser().parseFromString(String(html||''),'text/html'),headings=[],tables=[];
  parsed.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h=>headings.push({level:Number(h.tagName.slice(1)),text:(h.textContent||'').trim()}));
  parsed.querySelectorAll('table').forEach(t=>{const rows=[...t.rows].map(r=>[...r.cells].map(c=>(c.textContent||'').trim()));if(rows.length)tables.push(rows)});
  return{headings,tables};
}
async function eiAiReadDocx(file){
  await eiAiLoadScript(EI_AI_MAMMOTH,'mammoth');if(!window.mammoth)throw new Error('Mammoth no está disponible.');const buf=await file.arrayBuffer();
  const [raw,html]=await Promise.all([window.mammoth.extractRawText({arrayBuffer:buf}),window.mammoth.convertToHtml({arrayBuffer:buf})]);const meta=eiAiDocxExtractStructure(html.value);
  return{text:eiAiNormalizeText(raw.value),headings:meta.headings,tables:meta.tables,pages:null,warnings:[...(raw.messages||[]),...(html.messages||[])].map(x=>x.message||String(x)).slice(0,20)};
}
async function eiAiReadPdf(file){
  const pdfjs=await import(EI_AI_PDF);pdfjs.GlobalWorkerOptions.workerSrc=EI_AI_PDF_WORKER;const data=new Uint8Array(await file.arrayBuffer()),pdf=await pdfjs.getDocument({data}).promise;const pageTexts=[];
  for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),content=await p.getTextContent();let line='',lastY=null,lines=[];for(const item of content.items||[]){if(!('str'in item))continue;const y=item.transform?.[5];if(lastY!==null&&Math.abs(y-lastY)>4){if(line.trim())lines.push(line.trim());line=''}line+=(line?' ':'')+item.str;lastY=y}if(line.trim())lines.push(line.trim());pageTexts.push(lines.join('\n'))}
  const text=pageTexts.map((x,i)=>`[Página ${i+1}]\n${x}`).join('\n\n');return{text:eiAiNormalizeText(text),headings:[],tables:[],pages:pdf.numPages,warnings:[]};
}
async function eiAiReadSpreadsheet(file){
  const XLSX=await import(EI_AI_XLSX),wb=XLSX.read(await file.arrayBuffer(),{type:'array'}),tables=[],parts=[];for(const name of wb.SheetNames){const ws=wb.Sheets[name],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});tables.push(rows);parts.push(`HOJA: ${name}\n${eiAiTableText(rows)}`)}return{text:eiAiNormalizeText(parts.join('\n\n')),headings:wb.SheetNames.map(x=>({level:1,text:x})),tables,pages:null,warnings:[]};
}
async function eiAiReadText(file){return{text:eiAiNormalizeText(await file.text()),headings:[],tables:[],pages:null,warnings:[]}}
async function eiAiImportFile(file){
  if(!file)return null;if(file.size>EI_AI_MAX_FILE)throw new Error('El archivo supera el límite local de 25 MB.');const ext=(file.name.split('.').pop()||'').toLowerCase();eiAiSetStatus('reading',`Leyendo ${file.name}…`,0);
  let data;if(ext==='docx')data=await eiAiReadDocx(file);else if(ext==='pdf')data=await eiAiReadPdf(file);else if(['xlsx','xls','xlsb','ods','csv'].includes(ext))data=await eiAiReadSpreadsheet(file);else if(['txt','md','text'].includes(ext)||file.type.startsWith('text/'))data=await eiAiReadText(file);else throw new Error('Formato no soportado. Use DOCX, PDF, XLSX/XLS/CSV, TXT o MD.');
  const structure=eiAiInferStructure(data.text,data.headings);EI_AI.imported={name:file.name,type:ext,size:file.size,text:data.text,headings:data.headings||[],tables:data.tables||[],pages:data.pages||null,warnings:data.warnings||[],structure,chunks:eiAiChunkText(data.text),loadedAt:Date.now()};
  eiAiSetStatus(EI_AI.engine?'ready':'idle',EI_AI.engine?'IA local lista':'Documento leído localmente · modelo opcional',EI_AI.engine?1:0);if(typeof eiAiRefreshImported==='function')eiAiRefreshImported();return EI_AI.imported;
}
function eiAiBuildSectionsFromImported(imported=EI_AI.imported){
  if(!imported?.text)return[];const structure=imported.structure?.length?imported.structure:eiAiInferStructure(imported.text,imported.headings);const roots=[];let root=null;
  structure.forEach((x,idx)=>{if(x.level<=1||!root){root={n:String(roots.length+1),t:String(x.title||`SECCIÓN ${roots.length+1}`).toUpperCase(),c:String(x.content||''),richContent:typeof premiumEscapeText==='function'?premiumEscapeText(x.content||''):String(x.content||''),sub:[],blocks:[]};roots.push(root)}else{const sub={n:`${root.n}.${root.sub.length+1}`,t:String(x.title||`Subtítulo ${root.sub.length+1}`),c:String(x.content||''),richContent:typeof premiumEscapeText==='function'?premiumEscapeText(x.content||''):String(x.content||''),sub:[],blocks:[]};root.sub.push(sub)}});
  if(!roots.length)roots.push({n:'1',t:'CONTENIDO IMPORTADO',c:imported.text,richContent:typeof premiumEscapeText==='function'?premiumEscapeText(imported.text):imported.text,sub:[],blocks:[]});return roots.slice(0,40);
}
function eiAiImportIntoWordStudio({replace=false}={}){
  if(!EI_AI.imported)throw new Error('Primero importe un documento.');const sections=eiAiBuildSectionsFromImported();if(!sections.length)throw new Error('No se pudo construir una estructura.');if(replace){if(!confirm('Esto reemplazará las secciones actuales por la estructura detectada. ¿Continuar?'))return false;doc.sections=sections}else{const start=(doc.sections?.length||0)+1;sections.forEach((s,i)=>{s.n=String(start+i);s.sub.forEach((ss,j)=>ss.n=`${s.n}.${j+1}`)});doc.sections=[...(doc.sections||[]),...sections]}
  if(typeof ensureWordSubtitles==='function')ensureWordSubtitles();if(typeof render==='function')render();return true;
}
function eiAiImportedStats(){const d=EI_AI.imported;if(!d)return null;return{chars:d.text.length,words:d.text.split(/\s+/).filter(Boolean).length,chunks:d.chunks.length,sections:d.structure.length,tables:d.tables.length,pages:d.pages};}
window.EI_AI_IMPORT_READY=true;
