/* ===== V80 · IA LOCAL GRATUITA ==============================================
   Motor local opcional con WebLLM. No usa API ni servidor propio.
   - WebGPU + cache del navegador.
   - Chat/redacción/corrección/resumen sobre documento actual o importado.
   - Recuperación local de fragmentos para documentos largos.
   Esta capa NO modifica la plantilla SGC base.
============================================================================= */
const EI_AI_BLUE='#001F73';
const EI_AI_YELLOW='#EAC800';
const EI_AI_WEBLLM_URL='https://esm.run/@mlc-ai/web-llm';
const EI_AI_MODELS=[
  {id:'Llama-3.2-1B-Instruct-q4f16_1-MLC',label:'Ligero · Llama 3.2 1B',detail:'≈ 0,9 GB · recomendado'},
  {id:'Llama-3.2-3B-Instruct-q4f16_1-MLC',label:'Calidad+ · Llama 3.2 3B',detail:'≈ 2,3 GB · equipos potentes'}
];
const EI_AI=window.EI_AI=window.EI_AI||{
  engine:null,webllm:null,status:'idle',model:EI_AI_MODELS[0].id,progress:0,progressText:'Modelo no cargado',
  imported:null,lastResult:'',lastAction:'',history:[],selection:null,busy:false
};

function eiAiEscape(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function eiAiPlain(v){
  const d=document.createElement('div');d.innerHTML=String(v||'');return (d.innerText||d.textContent||'').replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').trim();
}
function eiAiNormalizeText(text){
  return String(text||'').replace(/\r/g,'').replace(/[ \t]{2,}/g,' ').replace(/ *\n */g,'\n').replace(/\n{4,}/g,'\n\n\n').trim();
}
function eiAiChunkText(text,maxChars=3200,overlap=320){
  const src=eiAiNormalizeText(text);if(!src)return[];
  const paras=src.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean),out=[];let buf='';
  const push=()=>{if(!buf.trim())return;out.push({id:out.length,text:buf.trim()});const tail=buf.slice(Math.max(0,buf.length-overlap));buf=tail};
  for(const p of paras){if(buf&&buf.length+p.length+2>maxChars)push();buf+=(buf?'\n\n':'')+p;if(buf.length>maxChars*1.35)push()}
  if(buf.trim())out.push({id:out.length,text:buf.trim()});return out;
}
const EI_AI_STOP=new Set('de la el los las un una unos unas y o e u a ante bajo con contra desde durante en entre hacia hasta mediante para por según sin sobre tras que del al se su sus es son fue fueron ser como más menos muy ya si no lo le les este esta estos estas ese esa esos esas'.split(' '));
function eiAiTerms(text){return [...new Set(String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]{3,}/g)||[])].filter(x=>!EI_AI_STOP.has(x)).slice(0,30)}
function eiAiRetrieve(query,chunks,limit=4){
  const terms=eiAiTerms(query);if(!terms.length)return (chunks||[]).slice(0,limit);
  return (chunks||[]).map(c=>{const low=c.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');let score=0;terms.forEach(t=>{const n=low.split(t).length-1;score+=Math.min(n,5)*(t.length>6?2:1)});return{...c,score}}).sort((a,b)=>b.score-a.score||a.id-b.id).slice(0,limit);
}
function eiAiCurrentDocumentText(){
  if(typeof doc==='undefined'||!Array.isArray(doc.sections))return'';
  const out=[];
  doc.sections.forEach((s,i)=>{
    const n=s.n||i+1;out.push(`${n} ${s.t||''}`.trim());if(s.c)out.push(String(s.c));
    (s.sub||[]).forEach((ss,j)=>{out.push(`${ss.n||`${n}.${j+1}`} ${ss.t||''}`.trim());if(ss.c)out.push(String(ss.c));(ss.blocks||[]).forEach(b=>out.push(eiAiBlockText(b))});
    (s.blocks||[]).forEach(b=>out.push(eiAiBlockText(b)));
  });
  return eiAiNormalizeText(out.filter(Boolean).join('\n\n'));
}
function eiAiBlockText(b){
  if(!b)return'';if(['text','callout'].includes(b.type))return b.text||eiAiPlain(b.richText||'');if(b.type==='heading')return b.text||'';
  if(b.type==='list')return (b.items||[]).join('\n');if(b.type==='table')return (b.rows||[]).map(r=>r.join(' | ')).join('\n');
  if(b.type==='chart')return `${b.title||'Gráfica'}\n${(b.labels||[]).map((x,i)=>`${x}: ${(b.values||[])[i]??''}`).join('\n')}`;
  if(b.type==='kpi')return (b.items||[]).map(x=>`${x.label}: ${x.value} ${x.detail||''}`).join('\n');if(b.type==='diagram')return `${b.title||'Diagrama'}\n${(b.nodes||[]).map(x=>x.text||x.label||'').join('\n')}`;return'';
}
function eiAiSelectedText(){
  const sel=window.getSelection?.();if(!sel||!sel.rangeCount||sel.isCollapsed)return'';const r=sel.getRangeAt(0),el=r.commonAncestorContainer.nodeType===1?r.commonAncestorContainer:r.commonAncestorContainer.parentElement;
  const editor=el?.closest?.('.word-rich-editor');if(!editor)return'';EI_AI.selection={editor,range:r.cloneRange()};return sel.toString().trim();
}
function eiAiSourceText(query=''){
  const selected=eiAiSelectedText();if(selected)return{kind:'selection',text:selected,label:'texto seleccionado'};
  if(EI_AI.imported?.text){const chunks=EI_AI.imported.chunks||eiAiChunkText(EI_AI.imported.text);const picked=query?eiAiRetrieve(query,chunks,5):chunks.slice(0,5);return{kind:'imported',text:picked.map(x=>x.text).join('\n\n---\n\n'),label:EI_AI.imported.name||'archivo importado'};}
  const current=eiAiCurrentDocumentText();const chunks=eiAiChunkText(current);const picked=query?eiAiRetrieve(query,chunks,5):chunks.slice(0,5);return{kind:'current',text:picked.map(x=>x.text).join('\n\n---\n\n'),label:'documento actual'};
}
function eiAiSetStatus(status,text,progress=null){EI_AI.status=status;EI_AI.progressText=text||status;if(progress!==null)EI_AI.progress=Math.max(0,Math.min(1,Number(progress)||0));if(typeof eiAiRefreshStatus==='function')eiAiRefreshStatus()}
function eiAiHardware(){return{webgpu:!!navigator.gpu,wasm:typeof WebAssembly!=='undefined',secure:window.isSecureContext!==false}}
async function eiAiLoadModel(modelId=EI_AI.model){
  if(EI_AI.busy)return;const hw=eiAiHardware();if(!hw.webgpu)throw new Error('Este navegador/equipo no expone WebGPU. La lectura y organización local siguen disponibles, pero el modelo generativo requiere WebGPU.');
  EI_AI.busy=true;EI_AI.model=modelId;eiAiSetStatus('loading','Preparando motor local…',0);
  try{
    const webllm=EI_AI.webllm||(EI_AI.webllm=await import(EI_AI_WEBLLM_URL));
    const appConfig={...webllm.prebuiltAppConfig,cacheBackend:'cache'};
    EI_AI.engine=await webllm.CreateMLCEngine(modelId,{appConfig,initProgressCallback:r=>{eiAiSetStatus('loading',r.text||'Descargando modelo…',r.progress??EI_AI.progress)}});
    eiAiSetStatus('ready','IA local lista · todo se procesa en este navegador',1);return EI_AI.engine;
  }catch(err){EI_AI.engine=null;eiAiSetStatus('error',String(err?.message||err),0);throw err}finally{EI_AI.busy=false}
}
function eiAiSystemPrompt(){return `Eres el Asistente Documental Local de ELECTROINGENIERÍA S.A.S. Trabajas en español profesional y claro. Tu prioridad es mejorar documentos técnicos, administrativos y académicos sin inventar datos, normas, fuentes ni referencias. Conserva el significado original salvo que el usuario pida crear contenido. Usa estructura lógica, redacción natural, ortografía impecable y terminología consistente. Cuando no tengas evidencia suficiente, dilo. Nunca afirmes haber consultado Internet. Si recibes fragmentos de un documento, responde solo con base en ellos.`}
async function eiAiGenerate(instruction,{context='',temperature=.25,maxTokens=900,onUpdate=null}={}){
  if(!EI_AI.engine)throw new Error('Primero carga la IA local. El análisis/importación de archivos sí funciona sin descargar el modelo.');
  const messages=[{role:'system',content:eiAiSystemPrompt()}];if(context)messages.push({role:'user',content:`CONTEXTO DEL DOCUMENTO:\n${context.slice(0,12000)}`});messages.push({role:'user',content:instruction});
  EI_AI.busy=true;eiAiSetStatus('thinking','Analizando y redactando…',1);
  try{
    let text='';
    const stream=await EI_AI.engine.chat.completions.create({messages,temperature,max_tokens:maxTokens,stream:true});
    for await(const chunk of stream){text+=chunk?.choices?.[0]?.delta?.content||'';if(onUpdate)onUpdate(text)}
    EI_AI.lastResult=text.trim();EI_AI.history.push({role:'assistant',text:EI_AI.lastResult,at:Date.now()});eiAiSetStatus('ready','IA local lista',1);return EI_AI.lastResult;
  }catch(err){eiAiSetStatus('error',String(err?.message||err),1);throw err}finally{EI_AI.busy=false}
}
function eiAiFallbackClean(text){
  let s=String(text||'');const fixes=[[/\bqeu\b/gi,'que'],[/\bporfavor\b/gi,'por favor'],[/\btambien\b/gi,'también'],[/\bmas\b(?=\s+(?:claro|fácil|rápido|grande|pequeño|completo|importante))/gi,'más'],[/\besta\b(?=\s+(?:bien|mal|listo|correcto))/gi,'está'],[/\bsolo\b(?=\s+(?:debe|deben|quiero|necesito))/gi,'solo']];fixes.forEach(([r,v])=>s=s.replace(r,v));s=s.replace(/[ \t]+([,.;:!?])/g,'$1').replace(/([,.;:!?])([^\s\n”"')\]])/g,'$1 $2').replace(/[ \t]{2,}/g,' ').replace(/\n[ \t]+/g,'\n');return s.trim();
}
function eiAiFallbackSummary(text){const s=eiAiNormalizeText(text);const sentences=s.match(/[^.!?\n]+[.!?]?/g)||[];return sentences.slice(0,Math.min(8,Math.max(3,Math.ceil(sentences.length*.18)))).join(' ').trim()}
function eiAiQuickResult(action,text){
  if(action==='correct')return eiAiFallbackClean(text);
  if(action==='summary')return eiAiFallbackSummary(text);
  if(action==='structure'){const st=typeof eiAiInferStructure==='function'?eiAiInferStructure(text):[];return st.length?st.map((x,i)=>`${i+1}. ${x.title}\n${x.content}`).join('\n\n'):text}
  return text;
}
async function eiAiRunAction(action,customPrompt=''){
  const labels={correct:'Corrección',rewrite:'Mejora de redacción',summary:'Resumen',structure:'Organización',formal:'Redacción formal',audit:'Auditoría documental',table:'Propuesta de tabla',flow:'Flujograma',concept:'Mapa conceptual'};
  const source=eiAiSourceText(customPrompt||labels[action]||'documento');if(!source.text)throw new Error('No hay texto disponible. Selecciona texto, importa un archivo o abre un documento con contenido.');
  if(!EI_AI.engine&&['correct','summary','structure'].includes(action)){
    const result=eiAiQuickResult(action,source.text);EI_AI.lastResult=result;EI_AI.lastAction=action;return result;
  }
  const prompts={
    correct:'Corrige ortografía, tildes, concordancia y puntuación. Mantén el contenido y el tono. Devuelve únicamente el texto corregido.',
    rewrite:'Mejora la redacción para que sea clara, natural, profesional y precisa. No agregues hechos que no existan. Devuelve solo la versión mejorada.',
    summary:'Resume el contenido conservando hechos, cifras, decisiones y conclusiones importantes. Usa párrafos breves y, cuando ayude, viñetas.',
    structure:'Reorganiza el contenido en una estructura documental lógica. Propón títulos y subtítulos jerárquicos, pero no inventes información. Devuelve la propuesta completa.',
    formal:'Reescribe el contenido con tono institucional, técnico y formal, evitando lenguaje artificial o redundante.',
    audit:'Audita el contenido. Identifica vacíos, contradicciones, ambigüedades, problemas de redacción, datos que necesitan fuente y oportunidades de mejora. Separa HALLAZGOS y RECOMENDACIONES.',
    table:'Detecta información que se beneficie de una tabla y devuelve una tabla en texto usando | entre columnas, con título y fuente sugerida si está presente en el contexto.',
    flow:'Convierte el proceso descrito en pasos de flujograma. Usa exactamente una línea por nodo y prefijos [I] Inicio, [P] Proceso, [D] Decisión, [DOC] Documento y [F] Fin.',
    concept:'Crea un mapa conceptual: primera línea = concepto central; líneas siguientes = RELACIÓN | CONCEPTO. Usa relaciones breves y significativas.'
  };
  EI_AI.lastAction=action;return eiAiGenerate(customPrompt||prompts[action]||'Ayuda a mejorar este contenido.',{context:source.text,onUpdate:t=>{EI_AI.lastResult=t;if(typeof eiAiRenderResult==='function')eiAiRenderResult(t,true)}});
}
window.EI_AI_CORE_READY=true;
