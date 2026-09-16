/* ===== V82 · MOTOR IA LOCAL PROFESIONAL =====================================
   Motor gratuito y privado con WebLLM.
   - Modelo rápido por defecto + perfiles de mayor calidad.
   - Web Worker con fallback al hilo principal.
   - Verificación de inferencia REAL antes de declarar "IA lista".
   - Conversación multi-turno y recuperación documental relevante.
   - Streaming directo para una experiencia de chat real.
   NO modifica la plantilla SGC base.
============================================================================= */
const EI_AI_BLUE='#001F73';
const EI_AI_YELLOW='#EAC800';
const EI_AI_WEBLLM_URL='https://esm.run/@mlc-ai/web-llm@0.2.84';
const EI_AI_MODELS=[
  {id:'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',label:'Rápida · Qwen 2.5 0.5B',detail:'≈ 0,95 GB · menor latencia',profile:'fast'},
  {id:'Llama-3.2-1B-Instruct-q4f16_1-MLC',label:'Equilibrada · Llama 3.2 1B',detail:'≈ 0,9 GB · mejor redacción',profile:'balanced'},
  {id:'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',label:'Calidad · Qwen 2.5 1.5B',detail:'≈ 1,6 GB · equipo potente',profile:'quality'}
];
const EI_AI=window.EI_AI=window.EI_AI||{};
Object.assign(EI_AI,{
  engine:EI_AI.engine||null,worker:EI_AI.worker||null,webllm:EI_AI.webllm||null,status:EI_AI.status||'idle',
  model:EI_AI.model||EI_AI_MODELS[0].id,progress:EI_AI.progress||0,progressText:EI_AI.progressText||'Modelo no cargado',
  imported:EI_AI.imported||null,lastResult:EI_AI.lastResult||'',lastAction:EI_AI.lastAction||'',history:Array.isArray(EI_AI.history)?EI_AI.history:[],
  selection:EI_AI.selection||null,busy:false,verified:!!EI_AI.verified,metrics:EI_AI.metrics||{},generationId:0
});
function eiAiEscape(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function eiAiPlain(v){const d=document.createElement('div');d.innerHTML=String(v||'');return(d.innerText||d.textContent||'').replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').trim()}
function eiAiNormalizeText(text){return String(text||'').replace(/\r/g,'').replace(/[ \t]{2,}/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{4,}/g,'\n\n\n').trim()}
function eiAiChunkText(text,maxChars=2200,overlap=180){
  const src=eiAiNormalizeText(text);if(!src)return[];const paras=src.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean),out=[];let buf='';
  const push=()=>{if(!buf.trim())return;out.push({id:out.length,text:buf.trim()});buf=buf.slice(Math.max(0,buf.length-overlap))};
  for(const p of paras){if(buf&&buf.length+p.length+2>maxChars)push();buf+=(buf?'\n\n':'')+p;if(buf.length>maxChars*1.3)push()}if(buf.trim())out.push({id:out.length,text:buf.trim()});return out;
}
const EI_AI_STOP=new Set('de la el los las un una unos unas y o e u a ante bajo con contra desde durante en entre hacia hasta mediante para por según sin sobre tras que del al se su sus es son fue fueron ser como más menos muy ya si no lo le les este esta estos estas ese esa esos esas'.split(' '));
function eiAiTerms(text){return[...new Set(String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]{3,}/g)||[])].filter(x=>!EI_AI_STOP.has(x)).slice(0,28)}
function eiAiRetrieve(query,chunks,limit=3){const terms=eiAiTerms(query);if(!terms.length)return(chunks||[]).slice(0,limit);return(chunks||[]).map(c=>{const low=c.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');let score=0;for(const t of terms){const n=low.split(t).length-1;score+=Math.min(n,4)*(t.length>6?2:1)}return{...c,score}}).sort((a,b)=>b.score-a.score||a.id-b.id).slice(0,limit)}
function eiAiBlockText(b){if(!b)return'';if(['text','callout'].includes(b.type))return b.text||eiAiPlain(b.richText||'');if(b.type==='heading')return b.text||'';if(b.type==='list')return(b.items||[]).join('\n');if(b.type==='table')return(b.rows||[]).map(r=>r.join(' | ')).join('\n');if(b.type==='chart')return`${b.title||'Gráfica'}\n${(b.labels||[]).map((x,i)=>`${x}: ${(b.values||[])[i]??''}`).join('\n')}`;if(b.type==='kpi')return(b.items||[]).map(x=>`${x.label}: ${x.value} ${x.detail||''}`).join('\n');if(b.type==='diagram')return`${b.title||'Diagrama'}\n${(b.nodes||[]).map(x=>x.text||x.label||'').join('\n')}`;return''}
function eiAiCurrentDocumentText(){if(typeof doc==='undefined'||!Array.isArray(doc.sections))return'';const out=[];doc.sections.forEach((s,i)=>{const n=s.n||i+1;out.push(`${n} ${s.t||''}`.trim());if(s.c)out.push(String(s.c));(s.sub||[]).forEach((ss,j)=>{out.push(`${ss.n||`${n}.${j+1}`} ${ss.t||''}`.trim());if(ss.c)out.push(String(ss.c));(ss.blocks||[]).forEach(b=>out.push(eiAiBlockText(b)))});(s.blocks||[]).forEach(b=>out.push(eiAiBlockText(b)))});return eiAiNormalizeText(out.filter(Boolean).join('\n\n'))}
function eiAiSelectedText(){const sel=window.getSelection?.();if(!sel||!sel.rangeCount||sel.isCollapsed)return'';const r=sel.getRangeAt(0),el=r.commonAncestorContainer.nodeType===1?r.commonAncestorContainer:r.commonAncestorContainer.parentElement;const editor=el?.closest?.('.word-rich-editor');if(!editor)return'';EI_AI.selection={editor,range:r.cloneRange()};return sel.toString().trim()}
function eiAiSourceText(query=''){const selected=eiAiSelectedText();if(selected)return{kind:'selection',text:selected.slice(0,6500),label:'texto seleccionado'};const base=EI_AI.imported?.text||eiAiCurrentDocumentText();if(!base)return{kind:'none',text:'',label:'sin contexto'};const chunks=EI_AI.imported?.chunks||eiAiChunkText(base);const picked=query?eiAiRetrieve(query,chunks,3):chunks.slice(0,3);return{kind:EI_AI.imported?'imported':'current',text:picked.map(x=>x.text).join('\n\n---\n\n').slice(0,6500),label:EI_AI.imported?.name||'documento actual'}}
function eiAiSetStatus(status,text,progress=null){EI_AI.status=status;EI_AI.progressText=text||status;if(progress!==null)EI_AI.progress=Math.max(0,Math.min(1,Number(progress)||0));if(typeof eiAiRefreshStatus==='function')eiAiRefreshStatus()}
function eiAiHardware(){return{webgpu:!!navigator.gpu,wasm:typeof WebAssembly!=='undefined',secure:window.isSecureContext!==false}}
function eiAiResetConversation(){EI_AI.history=[];EI_AI.lastResult='';EI_AI.lastAction=''}
function eiAiHistoryForModel(){return(EI_AI.history||[]).filter(x=>x&&['user','assistant'].includes(x.role)&&x.text).slice(-6).map(x=>({role:x.role,content:String(x.text).slice(0,2200)}))}
function eiAiRemember(role,text){const clean=String(text||'').trim();if(!clean)return;EI_AI.history.push({role,text:clean,at:Date.now()});if(EI_AI.history.length>14)EI_AI.history=EI_AI.history.slice(-14)}
async function eiAiCreateEngine(webllm,modelId,appConfig,onProgress){
  if(typeof webllm.CreateWebWorkerMLCEngine==='function'&&typeof Worker!=='undefined'){
    try{
      const workerCode=`import * as webllm from ${JSON.stringify(EI_AI_WEBLLM_URL)};const handler=new webllm.WebWorkerMLCEngineHandler();self.onmessage=(msg)=>handler.onmessage(msg);`;
      const url=URL.createObjectURL(new Blob([workerCode],{type:'text/javascript'}));const worker=new Worker(url,{type:'module'});EI_AI.worker=worker;
      const engine=await webllm.CreateWebWorkerMLCEngine(worker,modelId,{appConfig,initProgressCallback:onProgress,logLevel:'WARN'});URL.revokeObjectURL(url);return engine;
    }catch(err){try{EI_AI.worker?.terminate()}catch{}EI_AI.worker=null;console.warn('WebLLM worker fallback:',err)}
  }
  return webllm.CreateMLCEngine(modelId,{appConfig,initProgressCallback:onProgress,logLevel:'WARN'});
}
async function eiAiVerifyEngine(engine){
  eiAiSetStatus('verifying','Verificando que la IA realmente pueda responder…',1);
  const test=await engine.chat.completions.create({messages:[{role:'system',content:'Responde exactamente: OK'},{role:'user',content:'Prueba'}],temperature:0,max_tokens:6,stream:false});
  const answer=String(test?.choices?.[0]?.message?.content||'').trim();if(!answer)throw new Error('El modelo terminó de cargar, pero no produjo ninguna respuesta de prueba.');return answer;
}
async function eiAiLoadModel(modelId=EI_AI.model){
  if(EI_AI.busy)return EI_AI.engine;const hw=eiAiHardware();if(!hw.webgpu)throw new Error('Este navegador o equipo no expone WebGPU. La lectura y organización de documentos siguen disponibles, pero el chat generativo local necesita WebGPU.');
  EI_AI.busy=true;EI_AI.verified=false;EI_AI.model=modelId;eiAiSetStatus('loading','Preparando motor local…',0);const started=performance.now();
  try{
    const webllm=EI_AI.webllm||(EI_AI.webllm=await import(EI_AI_WEBLLM_URL));const appConfig={...webllm.prebuiltAppConfig,cacheBackend:'cache'};
    const onProgress=r=>eiAiSetStatus('loading',r.text||'Descargando modelo…',r.progress??EI_AI.progress);
    EI_AI.engine=await eiAiCreateEngine(webllm,modelId,appConfig,onProgress);await eiAiVerifyEngine(EI_AI.engine);EI_AI.verified=true;EI_AI.metrics.loadMs=Math.round(performance.now()-started);
    eiAiSetStatus('ready','IA verificada y lista para conversar',1);return EI_AI.engine;
  }catch(err){try{EI_AI.worker?.terminate()}catch{}EI_AI.worker=null;EI_AI.engine=null;EI_AI.verified=false;eiAiSetStatus('error',String(err?.message||err),0);throw err}finally{EI_AI.busy=false}
}
function eiAiSystemPrompt(){return `Eres un asistente documental profesional que trabaja localmente para ELECTROINGENIERÍA S.A.S. Responde en español natural, preciso y útil. Tu trabajo es analizar, redactar y organizar documentos técnicos, administrativos y académicos. REGLAS: 1) no inventes datos, normas, fuentes, autores, cifras ni evidencias; 2) distingue hechos del documento de recomendaciones; 3) si falta información, dilo de forma concreta; 4) conserva el significado cuando corrijas; 5) usa terminología consistente; 6) evita frases genéricas y relleno; 7) cuando el usuario pregunte por un documento, usa primero el contexto suministrado; 8) responde directamente, con estructura solo cuando ayude.`}
async function eiAiGenerate(instruction,{context='',temperature=.18,maxTokens=520,onUpdate=null,conversation=false}={}){
  if(!EI_AI.engine||!EI_AI.verified)throw new Error('La IA local aún no está verificada. Cárgala desde “Modelo” y espera el mensaje “IA verificada y lista”.');
  const userText=String(instruction||'').trim();const messages=[{role:'system',content:eiAiSystemPrompt()}];
  if(context)messages.push({role:'system',content:`CONTEXTO DOCUMENTAL RELEVANTE (no inventes fuera de este contexto cuando la pregunta dependa del documento):\n---\n${String(context).slice(0,6500)}\n---`});
  if(conversation)messages.push(...eiAiHistoryForModel());messages.push({role:'user',content:userText});
  EI_AI.busy=true;const generation=++EI_AI.generationId;eiAiSetStatus('thinking','Redactando respuesta…',1);const start=performance.now();let firstTokenAt=0;
  try{
    let text='';const stream=await EI_AI.engine.chat.completions.create({messages,temperature,top_p:.9,max_tokens:maxTokens,stream:true,stream_options:{include_usage:true}});
    for await(const chunk of stream){if(generation!==EI_AI.generationId)break;const delta=chunk?.choices?.[0]?.delta?.content||'';if(delta&&!firstTokenAt)firstTokenAt=performance.now();text+=delta;if(onUpdate)onUpdate(text,{streaming:true,usage:chunk?.usage||null})}
    text=text.trim();if(!text)throw new Error('El modelo no produjo contenido. Prueba nuevamente o cambia de modelo.');EI_AI.lastResult=text;EI_AI.metrics.lastMs=Math.round(performance.now()-start);EI_AI.metrics.firstTokenMs=firstTokenAt?Math.round(firstTokenAt-start):null;
    if(conversation){eiAiRemember('user',userText);eiAiRemember('assistant',text)}else EI_AI.history.push({role:'assistant',text,at:Date.now()});eiAiSetStatus('ready','IA verificada y lista',1);if(onUpdate)onUpdate(text,{streaming:false});return text;
  }catch(err){eiAiSetStatus('error',String(err?.message||err),1);throw err}finally{EI_AI.busy=false}
}
function eiAiFallbackClean(text){let s=String(text||'');const fixes=[[/\bqeu\b/gi,'que'],[/\bporfavor\b/gi,'por favor'],[/\btambien\b/gi,'también'],[/\best[aá]\s+mal\b/gi,'está mal'],[/\besta\s+bien\b/gi,'está bien']];fixes.forEach(([r,v])=>s=s.replace(r,v));s=s.replace(/[ \t]+([,.;:!?])/g,'$1').replace(/([,.;:!?])([^\s\n”"')\]])/g,'$1 $2').replace(/[ \t]{2,}/g,' ').replace(/\n[ \t]+/g,'\n');return s.trim()}
function eiAiFallbackSummary(text){const s=eiAiNormalizeText(text);const sentences=s.match(/[^.!?\n]+[.!?]?/g)||[];if(sentences.length<=5)return s;const terms=eiAiTerms(s);const scored=sentences.map((x,i)=>({x,i,score:terms.reduce((a,t)=>a+(x.toLowerCase().includes(t)?1:0),0)+(i===0?1:0)})).sort((a,b)=>b.score-a.score).slice(0,Math.min(7,Math.max(3,Math.ceil(sentences.length*.2)))).sort((a,b)=>a.i-b.i);return scored.map(x=>x.x.trim()).join(' ')}
function eiAiFallbackDocumentAnswer(q){const source=eiAiSourceText(q);if(!source.text)return'No encuentro contenido documental para analizar. Carga un archivo o escribe contenido en el documento.';const chunks=eiAiRetrieve(q,eiAiChunkText(source.text),3);if(!chunks.length)return'No encontré fragmentos claramente relacionados con esa pregunta.';return`Sin usar el modelo generativo, encontré estos fragmentos relacionados en ${source.label}:\n\n${chunks.map((c,i)=>`${i+1}. ${c.text}`).join('\n\n')}\n\nCarga la IA local para que pueda interpretarlos y redactar una respuesta elaborada.`}
function eiAiQuickResult(action,text){if(action==='correct')return eiAiFallbackClean(text);if(action==='summary')return eiAiFallbackSummary(text);if(action==='structure'){const st=typeof eiAiInferStructure==='function'?eiAiInferStructure(text):[];return st.length?st.map((x,i)=>`${i+1}. ${x.title}\n${x.content}`).join('\n\n'):text}return''}
async function eiAiRunAction(action,customPrompt='',onUpdate=null){
  const labels={correct:'Corrección ortográfica',rewrite:'Mejora de redacción',summary:'Resumen',structure:'Organización',formal:'Redacción formal',audit:'Auditoría documental',table:'Propuesta de tabla',flow:'Flujograma',concept:'Mapa conceptual'};const source=eiAiSourceText(customPrompt||labels[action]||'documento');if(!source.text)throw new Error('No hay texto disponible. Selecciona un fragmento, importa un archivo o abre un documento con contenido.');
  if((!EI_AI.engine||!EI_AI.verified)&&['correct','summary','structure'].includes(action)){const result=eiAiQuickResult(action,source.text);EI_AI.lastResult=result;EI_AI.lastAction=action;if(onUpdate)onUpdate(result,{streaming:false});return result}
  if(!EI_AI.engine||!EI_AI.verified)throw new Error('Esta herramienta requiere la IA generativa. Carga y verifica un modelo local desde “Modelo”.');
  const prompts={
    correct:'Corrige ortografía, tildes, concordancia, puntuación y errores gramaticales. Mantén todos los datos y el sentido original. Devuelve únicamente el texto corregido.',
    rewrite:'Reescribe el contenido con redacción profesional, natural y precisa. Elimina redundancias y frases sueltas. No inventes información. Devuelve únicamente la versión mejorada.',
    summary:'Resume el contenido conservando decisiones, hechos, cifras, responsables y conclusiones importantes. No agregues información externa.',
    structure:'Reorganiza el contenido con una jerarquía lógica de títulos y subtítulos. Conserva todo dato útil. Indica claramente qué fragmentos quedarían bajo cada encabezado.',
    formal:'Reescribe con tono institucional y técnico, claro y humano. Evita grandilocuencia, muletillas y lenguaje artificial. Conserva datos y significado.',
    audit:'Realiza una auditoría documental rigurosa. Separa: HALLAZGOS, VACÍOS DE INFORMACIÓN, INCONSISTENCIAS, DATOS QUE REQUIEREN SOPORTE y RECOMENDACIONES ACCIONABLES. No inventes requisitos.',
    table:'Identifica la información que conviene estructurar en tabla. Devuelve título, columnas y filas usando | como separador. Solo usa datos presentes en el contexto.',
    flow:'Convierte el proceso en un flujograma lógico. Una línea por nodo: [I] inicio, [P] proceso, [D] decisión, [DOC] documento, [F] fin. No agregues pasos que no se desprendan del texto.',
    concept:'Construye un mapa conceptual. Primera línea: concepto central. Siguientes: RELACIÓN | CONCEPTO. Usa relaciones breves y significativas basadas en el texto.'
  };EI_AI.lastAction=action;return eiAiGenerate(customPrompt||prompts[action]||'Ayuda a mejorar este contenido.',{context:source.text,maxTokens:action==='audit'?700:520,onUpdate,conversation:false})
}
window.EI_AI_CORE_READY=true;