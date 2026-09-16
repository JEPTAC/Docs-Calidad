/* ===== V86 · IA DOCUMENTAL INTELIGENTE =====================================
   Capa aditiva sobre V83–V85. No modifica la plantilla SGC.
   - Perfiles de modelos más capaces (1B / 3B / 8B) con fallback Transformers.js 1.5B.
   - Longitud de respuesta Breve / Normal / Extensa / Profunda.
   - Recuperación BM25 por secciones para comprender mejor documentos largos.
   - Investigación: fuentes oficiales preconfiguradas + Jina Reader sin clave.
   - Búsqueda web general opcional con clave gratuita de Jina, guardada solo localmente.
   - Lectura de URL pública como fuente adicional del chat.
============================================================================= */
const V86_BLUE='#001F73';
const V86_YELLOW='#EAC800';
const V86_HF_FAST='onnx-community/Qwen2.5-0.5B-Instruct';
const V86_HF_BALANCED='onnx-community/Qwen2.5-1.5B-Instruct';
const V86_PROFILES=[
  {id:'smart:auto',label:'Automática inteligente',detail:'3B si WebGPU lo soporta · fallback 1.5B',web:['Hermes-3-Llama-3.2-3B-q4f16_1-MLC','Llama-3.2-1B-Instruct-q4f16_1-MLC'],hf:V86_HF_BALANCED},
  {id:'smart:fast',label:'Rápida',detail:'Llama 1B · fallback Qwen 0.5B',web:['Llama-3.2-1B-Instruct-q4f16_1-MLC'],hf:V86_HF_FAST},
  {id:'smart:quality',label:'Calidad',detail:'Hermes/Llama 3B · ~2.3 GB VRAM',web:['Hermes-3-Llama-3.2-3B-q4f16_1-MLC','Llama-3.2-3B-Instruct-q4f16_1-MLC','Llama-3.2-1B-Instruct-q4f16_1-MLC'],hf:V86_HF_BALANCED},
  {id:'smart:expert',label:'Experta',detail:'Hermes/Llama 8B · ~4.9 GB VRAM',web:['Hermes-3-Llama-3.1-8B-q4f16_1-MLC','Hermes-3-Llama-3.2-3B-q4f16_1-MLC','Llama-3.2-1B-Instruct-q4f16_1-MLC'],hf:V86_HF_BALANCED}
];
const V86_LENGTHS={
  short:{label:'Breve',max:320,context:3600,instruction:'Responde de forma breve y directa.'},
  normal:{label:'Normal',max:700,context:5600,instruction:'Desarrolla la respuesta con el detalle necesario, sin relleno.'},
  long:{label:'Extensa',max:1150,context:5000,instruction:'Desarrolla una respuesta extensa, cohesionada y sustancial. Usa varios párrafos o secciones cuando aporte claridad.'},
  deep:{label:'Profunda',max:1500,context:4300,instruction:'Desarrolla una respuesta profunda y completa. Explica razonamiento técnico, matices, pasos y conclusiones sin inventar datos.'}
};
const V86=window.V86_AI=window.V86_AI||{cache:new Map(),external:[],lastSources:[]};
V86.responseMode=localStorage.getItem('ei-ai-response-mode')||'normal';
V86.jinaKey=localStorage.getItem('ei-ai-jina-key')||'';
V86.autoResearch=localStorage.getItem('ei-ai-auto-research')!=='0';
V86.profile=localStorage.getItem('ei-ai-smart-profile')||'smart:auto';

const V86_KNOWLEDGE_PACKS=[{
  id:'co-transito',title:'Código Nacional de Tránsito · Colombia',country:'Colombia',
  keywords:['transito','tránsito','codigo nacional de transito','código nacional de tránsito','vehiculo','vehículo','conductor','licencia de conduccion','licencia de conducción','comparendo','multa de transito','multa de tránsito','peaton','peatón','motociclista','velocidad','señal de transito','señal de tránsito','soat','tecnomecanica','tecnomecánica','ley 769','ley 1383'],
  sources:[
    {title:'Ley 769 de 2002 · Secretaría del Senado',url:'https://www.secretariasenado.gov.co/senado/basedoc/ley_0769_2002.html',authority:'Secretaría del Senado de la República'},
    {title:'Ley 769 de 2002 · SUIN-Juriscol',url:'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes%2F1826223',authority:'SUIN-Juriscol'},
    {title:'Ley 769 de 2002 · Gestor Normativo',url:'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=5557',authority:'Departamento Administrativo de la Función Pública'}
  ]
}];

function v86Norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function v86Terms(s){return [...new Set(v86Norm(s).match(/[a-z0-9]{3,}/g)||[])].filter(t=>!EI_AI_STOP?.has?.(t)).slice(0,36)}
function v86Bm25(query,chunks,limit=4){
  const docs=(chunks||[]).map((c,i)=>({id:c.id??i,text:String(c.text||''),meta:c.meta||{},terms:v86Terms(c.text)}));
  if(!docs.length)return[];const q=v86Terms(query);if(!q.length)return docs.slice(0,limit);
  const avg=docs.reduce((a,d)=>a+d.terms.length,0)/docs.length||1,k1=1.35,b=.72;
  return docs.map(d=>{let score=0;for(const term of q){const tf=d.terms.filter(x=>x===term).length;if(!tf)continue;const df=docs.filter(x=>x.terms.includes(term)).length,idf=Math.log(1+(docs.length-df+.5)/(df+.5));score+=idf*((tf*(k1+1))/(tf+k1*(1-b+b*d.terms.length/avg)))}return{...d,score}}).sort((a,b)=>b.score-a.score||a.id-b.id).slice(0,limit)}
function v86BlockText(b){if(!b)return'';if(b.type==='heading')return b.text||'';if(b.type==='paragraph')return b.text||'';if(b.type==='list')return b.text||(b.items||[]).join('\n');if(b.type==='table')return(b.rows||[]).map(r=>r.join(' | ')).join('\n');return typeof eiAiBlockText==='function'?eiAiBlockText(b):String(b.text||'')}
function v86ImportedSectionChunks(){
  const blocks=EI_AI.imported?.blocks||[];if(!blocks.length)return[];const out=[];let title='Inicio',level=0,buf=[];
  const push=()=>{const text=[title,...buf].filter(Boolean).join('\n');if(text.trim())out.push({id:out.length,text,meta:{title,level}});buf=[]};
  for(const b of blocks){if(b.enabled===false)continue;if(b.type==='heading'){if(buf.length||title!=='Inicio')push();title=`${b.numberLabel?b.numberLabel+' ':''}${b.text||''}`.trim();level=b.level||1}else{const t=v86BlockText(b);if(t)buf.push(t)}}push();return out
}
function v86CurrentSectionChunks(){
  if(typeof doc==='undefined'||!Array.isArray(doc.sections))return[];const out=[];
  doc.sections.forEach((s,i)=>{const n=s.n||i+1,base=[`${n} ${s.t||''}`.trim(),s.c||'',...(s.blocks||[]).map(v86BlockText)].filter(Boolean).join('\n');if(base)out.push({id:out.length,text:base,meta:{title:s.t||'',level:1}});(s.sub||[]).forEach((ss,j)=>{const text=[`${ss.n||`${n}.${j+1}`} ${ss.t||''}`.trim(),ss.c||'',...(ss.blocks||[]).map(v86BlockText)].filter(Boolean).join('\n');if(text)out.push({id:out.length,text,meta:{title:ss.t||'',level:2}})})});return out
}
const v86BaseSourceText=eiAiSourceText;
eiAiSourceText=function(query=''){
  const selected=eiAiSelectedText();if(selected)return{kind:'selection',text:selected.slice(0,6500),label:'texto seleccionado'};
  const chunks=EI_AI.imported?.blocks?.length?v86ImportedSectionChunks():v86CurrentSectionChunks();
  if(!chunks.length)return v86BaseSourceText(query);
  const mode=v86ModeForQuery(query),cfg=V86_LENGTHS[mode]||V86_LENGTHS.normal,picked=v86Bm25(query||'contenido principal',chunks,mode==='short'?2:4);
  return{kind:EI_AI.imported?'imported':'current',text:picked.map(x=>x.text).join('\n\n---\n\n').slice(0,cfg.context),label:EI_AI.imported?.name||'documento actual'}
};

function v86ModeForQuery(q=''){const n=v86Norm(q);if(/muy extenso|muy detallado|profundo|exhaustiv|completo y detallado/.test(n))return'deep';if(/extenso|amplio|desarrolla|desarrollado|detallado|mas largo|más largo|amplia|amplía/.test(n))return'long';return V86_LENGTHS[V86.responseMode]?V86.responseMode:'normal'}
function v86MaxTokens(q='',action=''){const mode=v86ModeForQuery(q),base=V86_LENGTHS[mode]?.max||700;if(action==='audit')return Math.max(base,mode==='deep'?1500:mode==='long'?1200:900);if(action==='structure')return Math.max(base,mode==='deep'?1450:mode==='long'?1100:850);if(action==='expand')return Math.max(base,mode==='deep'?1500:1250);return base}
function v86LengthInstruction(q=''){return V86_LENGTHS[v86ModeForQuery(q)]?.instruction||V86_LENGTHS.normal.instruction}

const v86SystemPromptPrevious=eiAiSystemPrompt;
eiAiSystemPrompt=function(){return `${v86SystemPromptPrevious()}\n11) Interpreta literalmente la intención del usuario antes de responder; si pide extensión, profundidad o detalle, desarrolla la respuesta en varios párrafos o secciones sustanciales. 12) No afirmes que buscaste en Internet si no recibiste FUENTES EXTERNAS en el contexto. 13) En asuntos jurídicos o normativos, no inventes artículos ni vigencias: usa únicamente las fuentes suministradas y cita [Fuente n]. 14) Distingue texto del documento, conocimiento externo recuperado y recomendaciones. 15) Prioriza español de Colombia cuando el contexto sea colombiano.`}

function v86Profile(id){return V86_PROFILES.find(p=>p.id===id)||V86_PROFILES[0]}
async function v86LoadTransformers(model){
  v84KillWorker();const device=navigator.gpu?'webgpu':'wasm';eiAiSetStatus('loading',device==='webgpu'?'Preparando Qwen alternativo con WebGPU…':'Preparando Qwen alternativo en WASM/CPU…',0);const started=performance.now();
  const result=await v84Rpc({type:'load',model,device},{onProgress:p=>{let progress=Number(p?.progress);if(!Number.isFinite(progress)&&Number(p?.loaded)>=0&&Number(p?.total)>0)progress=Number(p.loaded)/Number(p.total)*100;const ratio=Number.isFinite(progress)?Math.max(0,Math.min(1,progress>1?progress/100:progress)):EI_AI.progress;eiAiSetStatus('loading',p?.file?`Descargando ${String(p.file).split('/').pop()}…`:'Descargando modelo alternativo…',ratio)}});
  V84.provider='transformers';V84.model=result.model;EI_AI.provider='transformers';EI_AI.model=result.model;EI_AI.engine={provider:'transformers'};EI_AI.verified=true;EI_AI.metrics.loadMs=Math.round(performance.now()-started);eiAiSetStatus('ready',`IA verificada · ${navigator.gpu?'Transformers.js WebGPU':'Transformers.js WASM/CPU'} · ${model.split('/').pop()}`,1);return EI_AI.engine
}
const v86PreviousLoadModel=eiAiLoadModel;
eiAiLoadModel=async function(requested=V86.profile){
  if(EI_AI.busy)return EI_AI.engine;const profile=v86Profile(requested);V86.profile=profile.id;localStorage.setItem('ei-ai-smart-profile',profile.id);EI_AI.busy=true;EI_AI.verified=false;EI_AI.provider='';let webErrors=[];
  try{
    if(navigator.gpu&&typeof v84BaseLoadModel==='function'){
      for(const model of profile.web){try{EI_AI.busy=false;const engine=await v84BaseLoadModel(model);EI_AI.provider='webllm';V84.provider='webllm';EI_AI.model=model;eiAiSetStatus('ready',`IA verificada · ${profile.label} · ${model.replace(/-q.*$/,'')}`,1);return engine}catch(err){webErrors.push(`${model}: ${err?.message||err}`);console.warn('V86 model fallback:',model,err)}finally{EI_AI.busy=true}}
    }
    return await v86LoadTransformers(profile.hf)
  }catch(err){const detail=[...webErrors,`Transformers: ${err?.message||err}`].filter(Boolean).join(' · ');EI_AI.engine=null;EI_AI.verified=false;eiAiSetStatus('error',`No pude iniciar el perfil ${profile.label}. ${detail}`,0);throw err}finally{EI_AI.busy=false;if(typeof eiAiRefreshStatus==='function')eiAiRefreshStatus()}
};

function v86PackForQuery(query){const n=v86Norm(query);return V86_KNOWLEDGE_PACKS.find(p=>p.keywords.some(k=>n.includes(v86Norm(k))))||null}
function v86NeedsResearch(query){const n=v86Norm(query);return /(busca|buscar|investiga|investigar|consulta|consultar|verifica|verificar|vigente|actualizada|actualizado|norma|ley|decreto|resolucion|articulo|jurisprudencia|transito|comparendo|multa)/.test(n)}
function v86ReaderUrl(url){return `https://r.jina.ai/${url}`}
async function v86FetchText(url,{timeout=18000,headers={}}={}){
  const cached=V86.cache.get(url);if(cached)return cached;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{const res=await fetch(url,{headers,signal:controller.signal});if(!res.ok)throw new Error(`${res.status} ${res.statusText}`);const text=await res.text();if(!text.trim())throw new Error('Respuesta vacía');V86.cache.set(url,text);return text}finally{clearTimeout(timer)}
}
function v86ExternalChunks(query,text,source){const chunks=eiAiChunkText(text,1700,100).map((c,i)=>({...c,meta:{source,i}}));return v86Bm25(query,chunks,4)}
async function v86ResearchKnownPack(query,pack){
  eiAiSetStatus('researching',`Consultando ${pack.title} en fuentes oficiales…`,1);const attempts=pack.sources.slice(0,2).map(async(s,i)=>{const reader=v86ReaderUrl(s.url),text=await v86FetchText(reader);return{...s,index:i+1,text}});const settled=await Promise.allSettled(attempts),good=settled.filter(x=>x.status==='fulfilled').map(x=>x.value);if(!good.length)throw new Error('No pude leer las fuentes oficiales en este momento.');
  const pieces=[];good.forEach((s,i)=>v86ExternalChunks(query,s.text,s).slice(0,2).forEach(c=>pieces.push(`[Fuente ${i+1}: ${s.title}]\n${c.text}`)));return{kind:'official-pack',context:pieces.join('\n\n---\n\n').slice(0,7200),sources:good.map((s,i)=>({n:i+1,title:s.title,url:s.url,authority:s.authority}))}
}
async function v86JinaSearch(query){
  if(!V86.jinaKey)throw new Error('Para búsqueda web general agrega una clave gratuita de Jina en Herramientas. Las fuentes oficiales preconfiguradas pueden consultarse sin clave.');
  eiAiSetStatus('researching','Buscando en la web con Jina Search…',1);const url=`https://s.jina.ai/?q=${encodeURIComponent(query)}`,res=await fetch(url,{headers:{Authorization:`Bearer ${V86.jinaKey}`,Accept:'application/json'}});if(!res.ok)throw new Error(`Jina Search respondió ${res.status}. Verifica la clave o su cuota.`);const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{data=null}
  const arr=Array.isArray(data)?data:Array.isArray(data?.data)?data.data:Array.isArray(data?.results)?data.results:[];if(arr.length){const sources=arr.slice(0,5).map((x,i)=>({n:i+1,title:x.title||x.url||`Resultado ${i+1}`,url:x.url||'',authority:x.url?new URL(x.url).hostname:''}));const context=arr.slice(0,5).map((x,i)=>`[Fuente ${i+1}: ${x.title||x.url||'resultado'}]\n${String(x.content||x.description||x.text||'').slice(0,2200)}`).join('\n\n---\n\n');return{kind:'web-search',context:context.slice(0,8500),sources}}
  if(raw.trim())return{kind:'web-search',context:raw.slice(0,8000),sources:[{n:1,title:'Resultados de Jina Search',url:url,authority:'Jina Search'}]};throw new Error('La búsqueda no devolvió resultados.')
}
async function v86Research(query){
  const pack=v86PackForQuery(query);if(pack){try{return await v86ResearchKnownPack(query,pack)}catch(err){if(!V86.jinaKey)throw err}}
  if(V86.jinaKey)return v86JinaSearch(query);
  const external=(V86.external||[]).filter(x=>x?.text);if(external.length){const pieces=[],sources=[];external.forEach((s,i)=>{sources.push({n:i+1,title:s.title||s.url,url:s.url,authority:'Fuente agregada'});v86ExternalChunks(query,s.text,s).slice(0,2).forEach(c=>pieces.push(`[Fuente ${i+1}: ${s.title||s.url}]\n${c.text}`))});return{kind:'external-url',context:pieces.join('\n\n---\n\n'),sources}}
  throw new Error('No hay una fuente oficial preconfigurada para esa búsqueda. Puedes pegar una URL pública o agregar una clave gratuita de Jina para búsqueda web general.')
}
function v86SourcesHtml(sources=[]){if(!sources.length)return'';return `<div class="v86-sources"><b>Fuentes consultadas</b>${sources.map(s=>`<a href="${eiAiEscape(s.url)}" target="_blank" rel="noopener noreferrer"><span>[${s.n}]</span>${eiAiEscape(s.title)}</a>`).join('')}</div>`}
function v86AttachSources(sources=[]){const chat=document.getElementById('eiAiChat'),messages=chat?.querySelectorAll('.ei-ai-message.assistant');const last=messages?.[messages.length-1];if(last&&sources.length&&!last.querySelector('.v86-sources'))last.insertAdjacentHTML('beforeend',v86SourcesHtml(sources))}
function v86ExtractiveResearch(research,query){const intro=`Encontré información relevante para “${query}” en las fuentes consultadas. Sin un modelo generativo cargado, te muestro los fragmentos más relacionados para que no invente una interpretación.`;const body=String(research.context||'').slice(0,5000);return `${intro}\n\n${body}`}

const v86PreviousRunAction=eiAiRunAction;
eiAiRunAction=async function(action,customPrompt='',onUpdate=null){
  if(!['correct','rewrite','summary','structure','formal','audit','table','flow','concept','expand','research'].includes(action))return v86PreviousRunAction(action,customPrompt,onUpdate);
  const labels={correct:'Corrección ortográfica',rewrite:'Mejora de redacción',summary:'Resumen',structure:'Organización',formal:'Redacción formal',audit:'Auditoría documental',table:'Propuesta de tabla',flow:'Flujograma',concept:'Mapa conceptual',expand:'Ampliar contenido',research:'Investigar fuentes'};
  const source=eiAiSourceText(customPrompt||labels[action]||'documento');if(action!=='research'&&!source.text)throw new Error('No hay texto disponible. Selecciona un fragmento, importa un archivo o abre un documento con contenido.');
  if(action==='research'){const q=customPrompt||document.getElementById('eiAiPrompt')?.value?.trim()||'Investiga la normativa y fuentes relevantes para el documento actual.';const research=await v86Research(q);V86.lastSources=research.sources;if(!EI_AI.engine||!EI_AI.verified){const result=v86ExtractiveResearch(research,q);EI_AI.lastResult=result;if(onUpdate)onUpdate(result,{streaming:false});return result}return eiAiGenerate(`${q}\n\n${v86LengthInstruction(q)}\nCita las fuentes como [Fuente 1], [Fuente 2], etc.`,{context:research.context,maxTokens:v86MaxTokens(q,'research'),onUpdate,conversation:false})}
  if((!EI_AI.engine||!EI_AI.verified)&&['correct','summary','structure'].includes(action))return v86PreviousRunAction(action,customPrompt,onUpdate);
  if(!EI_AI.engine||!EI_AI.verified)throw new Error('Esta herramienta requiere la IA generativa. Carga y verifica un modelo desde “Modelo”.');
  const prompts={
    correct:'Corrige ortografía, tildes, concordancia, puntuación y gramática. Conserva íntegramente datos, nombres, cifras, requisitos y significado. Devuelve el texto corregido.',
    rewrite:'Reescribe con calidad profesional, claridad, cohesión y precisión. Mejora transiciones y estructura de las ideas. No reduzcas información útil ni inventes datos.',
    summary:'Resume conservando decisiones, cifras, responsables, restricciones, requisitos y conclusiones relevantes. Distingue lo esencial de lo accesorio.',
    structure:'Reorganiza el contenido con jerarquía lógica de títulos y subtítulos. Explica dónde ubicar cada bloque y conserva toda la información útil.',
    formal:'Reescribe con tono institucional, técnico, natural y preciso. Mantén el contenido y mejora cohesión, sintaxis y terminología.',
    audit:'Realiza una auditoría rigurosa. Incluye hallazgos, vacíos, inconsistencias, riesgos de interpretación, datos sin soporte y recomendaciones accionables, citando el fragmento o sección que origina cada hallazgo cuando sea posible.',
    table:'Identifica información que convenga estructurar como tabla. Devuelve título, columnas y filas usando | como separador. No inventes valores.',
    flow:'Convierte el proceso en flujograma lógico. Una línea por nodo: [I] inicio, [P] proceso, [D] decisión, [DOC] documento, [F] fin. Conserva el orden real y no inventes pasos.',
    concept:'Construye un mapa conceptual. Primera línea: concepto central. Siguientes: RELACIÓN | CONCEPTO. Las relaciones deben surgir del contenido real.',
    expand:'Amplía el contenido de manera sustancial sin introducir hechos nuevos. Desarrolla explicaciones, conexiones lógicas, contexto interno y transiciones a partir exclusivamente de la información disponible.'
  };
  const q=customPrompt||prompts[action];EI_AI.lastAction=action;return eiAiGenerate(`${q}\n\n${v86LengthInstruction(action==='expand'?'extenso':q)}`,{context:source.text,maxTokens:v86MaxTokens(q,action),onUpdate,conversation:false})
};

const v86PreviousSendPrompt=eiAiSendPrompt;
eiAiSendPrompt=async function(){
  const input=document.getElementById('eiAiPrompt'),q=input?.value?.trim();if(!q)return;input.value='';eiAiOpen('chat');eiAiChatMessage('user',q);eiAiClearPending();let research=null;
  try{
    if(V86.autoResearch&&v86NeedsResearch(q)){try{research=await v86Research(q);V86.lastSources=research.sources}catch(err){eiAiChatMessage('assistant',`Investigación: ${err.message||err}`)}}
    if(!EI_AI.engine||!EI_AI.verified){if(research){const result=v86ExtractiveResearch(research,q);eiAiRenderResult(result,false);v86AttachSources(research.sources);return}const fallback=eiAiFallbackDocumentAnswer(q);eiAiRenderResult(fallback,false);return}
    const source=eiAiSourceText(q),parts=[];if(source.text)parts.push(`DOCUMENTO:\n${source.text}`);if(research?.context)parts.push(`FUENTES EXTERNAS VERIFICABLES:\n${research.context}`);const context=parts.join('\n\n=====\n\n');
    const instruction=`${q}\n\n${v86LengthInstruction(q)}${research?'\nUsa las fuentes externas cuando correspondan y cita [Fuente n]. No atribuyas a una fuente algo que no aparezca en ella.':''}`;
    const result=await eiAiGenerate(instruction,{context,conversation:true,maxTokens:v86MaxTokens(q),onUpdate:(t,m)=>eiAiRenderResult(t,!!m?.streaming)});if(EI_AI.pendingMessageId)eiAiRenderResult(result,false);if(research)v86AttachSources(research.sources)
  }catch(err){eiAiClearPending();eiAiChatMessage('assistant',`No pude responder: ${err.message||err}`)}finally{eiAiSetStatus(EI_AI.verified?'ready':'idle',EI_AI.verified?'IA verificada y lista':'Modelo no cargado',EI_AI.verified?1:0);eiAiRefreshStatus()}
};

function v86EnhanceUi(){
  const drawer=document.getElementById('eiAiDrawer');if(!drawer)return;
  const select=document.getElementById('eiAiModel');if(select&&!select.dataset.v86){select.dataset.v86='1';select.innerHTML=V86_PROFILES.map(p=>`<option value="${p.id}" ${p.id===V86.profile?'selected':''}>${eiAiEscape(p.label)} · ${eiAiEscape(p.detail)}</option>`).join('');EI_AI.model=V86.profile}
  const footer=document.querySelector('.ei-ai-chat-footer');if(footer&&!footer.querySelector('#v86ResponseMode')){footer.insertAdjacentHTML('afterbegin',`<label class="v86-length">Respuesta<select id="v86ResponseMode">${Object.entries(V86_LENGTHS).map(([k,v])=>`<option value="${k}" ${k===V86.responseMode?'selected':''}>${v.label}</option>`).join('')}</select></label>`)}
  const actions=document.querySelector('[data-ei-ai-panel="tools"] .ei-ai-actions');if(actions&&!actions.querySelector('[data-ei-ai-action="expand"]')){actions.insertAdjacentHTML('beforeend','<button data-ei-ai-action="expand">↔ <b>Ampliar contenido</b><small>Desarrolla el texto sin inventar datos</small></button><button data-ei-ai-action="research">⌕ <b>Investigar fuentes</b><small>Normativa oficial y web cuando esté configurada</small></button>')}
  const tools=document.querySelector('[data-ei-ai-panel="tools"]');if(tools&&!tools.querySelector('.v86-research-card')){tools.insertAdjacentHTML('beforeend',`<div class="ei-ai-card v86-research-card"><div class="ei-ai-card-head"><div><small>Investigación fundamentada</small><strong>Fuentes web y normativa</strong></div><span class="ei-ai-badge light">RAG</span></div><p>Tránsito de Colombia usa fuentes oficiales preconfiguradas sin clave. Para buscar cualquier tema en la web puedes agregar una clave gratuita de Jina.</p><label>Clave Jina opcional<input id="v86JinaKey" type="password" autocomplete="off" placeholder="jina_…" value="${eiAiEscape(V86.jinaKey)}"></label><div class="v86-research-actions"><button type="button" data-v86-save-jina>Guardar solo en este navegador</button><a href="https://jina.ai/api-dashboard/" target="_blank" rel="noopener noreferrer">Obtener clave gratuita</a></div><label>Leer una URL pública<div class="v86-url-row"><input id="v86Url" type="url" placeholder="https://…"><button type="button" data-v86-read-url>Leer URL</button></div></label><label class="v86-check"><input id="v86AutoResearch" type="checkbox" ${V86.autoResearch?'checked':''}> Investigar automáticamente cuando la pregunta pida normas, vigencia o búsqueda</label><div id="v86ResearchStatus" class="v86-research-status">${V86.external.length?`${V86.external.length} fuente(s) web añadida(s).`:'Sin fuentes URL adicionales.'}</div></div>`)}
  const help=document.querySelector('.ei-ai-model-help');if(help&&!help.querySelector('.v86-model-note'))help.insertAdjacentHTML('beforeend','<span class="v86-model-note"><b>Calidad:</b> los perfiles 3B/8B entienden mejor instrucciones y redactan con más profundidad, pero exigen más memoria. En equipos sin WebGPU se usa Qwen 1.5B mediante Transformers.js/WASM.</span>')
}
const v86EnsureUiPrevious=eiAiEnsureUi;
eiAiEnsureUi=function(){const r=v86EnsureUiPrevious();v86EnhanceUi();return r};
const v86RefreshStatusPrevious=eiAiRefreshStatus;
eiAiRefreshStatus=function(){const r=v86RefreshStatusPrevious();v86EnhanceUi();const s=document.getElementById('eiAiStatus');if(s&&EI_AI.verified&&EI_AI.model)s.textContent=`${EI_AI.progressText} · ${String(EI_AI.model).split('/').pop()}`;return r};

document.addEventListener('change',e=>{const t=e.target;if(t?.id==='v86ResponseMode'){V86.responseMode=t.value;localStorage.setItem('ei-ai-response-mode',t.value)}if(t?.id==='v86AutoResearch'){V86.autoResearch=!!t.checked;localStorage.setItem('ei-ai-auto-research',V86.autoResearch?'1':'0')}if(t?.id==='eiAiModel'&&t.dataset.v86){V86.profile=t.value;localStorage.setItem('ei-ai-smart-profile',t.value);EI_AI.verified=false}},true);
document.addEventListener('click',async e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;if(t.closest('[data-v86-save-jina]')){V86.jinaKey=document.getElementById('v86JinaKey')?.value?.trim()||'';if(V86.jinaKey)localStorage.setItem('ei-ai-jina-key',V86.jinaKey);else localStorage.removeItem('ei-ai-jina-key');const st=document.getElementById('v86ResearchStatus');if(st)st.textContent=V86.jinaKey?'Clave guardada localmente. Búsqueda web general habilitada.':'Clave eliminada. Permanecen las fuentes oficiales preconfiguradas.';return}if(t.closest('[data-v86-read-url]')){const input=document.getElementById('v86Url'),url=input?.value?.trim();if(!/^https?:\/\//i.test(url||'')){eiAiChatMessage('assistant','Escribe una URL pública completa que empiece por http:// o https://.');return}try{eiAiSetStatus('researching','Leyendo URL pública…',1);const text=await v86FetchText(v86ReaderUrl(url));const title=(text.match(/^Title:\s*(.+)$/mi)?.[1]||new URL(url).hostname).trim();V86.external=V86.external.filter(x=>x.url!==url);V86.external.push({url,title,text,at:Date.now()});if(V86.external.length>5)V86.external=V86.external.slice(-5);const st=document.getElementById('v86ResearchStatus');if(st)st.textContent=`Fuente añadida: ${title}`;eiAiChatMessage('assistant',`Fuente web añadida al contexto: ${title}. Ya puedes preguntarme sobre ella.`)}catch(err){eiAiChatMessage('assistant',`No pude leer esa URL: ${err.message||err}`)}finally{eiAiSetStatus(EI_AI.verified?'ready':'idle',EI_AI.verified?'IA verificada y lista':'Modelo no cargado',EI_AI.verified?1:0)}return}},true);
window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{try{eiAiEnsureUi();v86EnhanceUi()}catch(err){console.warn('V86 UI:',err)}},0));
window.EI_AI_V86_READY=true;
