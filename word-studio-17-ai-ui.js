/* ===== V80 · ASISTENTE DOCUMENTAL IA LOCAL =================================
   Interfaz y automatización. Todo el procesamiento sensible se mantiene local.
   No modifica la plantilla SGC base.
============================================================================= */
function eiAiLocationOptions(){return typeof v76LocationOptions==='function'?v76LocationOptions():'<option value="0:-1">1 · OBJETIVO</option>'}
function eiAiEnsureUi(){
  const toolbar=document.querySelector('.topbar .toolbar');
  if(toolbar&&!document.getElementById('eiAiBtn')){
    const btn=document.createElement('button');btn.type='button';btn.id='eiAiBtn';btn.className='ei-ai-top-btn';btn.innerHTML='<span>✦</span> IA local';btn.title='Asistente documental local y gratuito';toolbar.insertBefore(btn,toolbar.firstChild);
  }
  if(!document.getElementById('eiAiDrawer')){
    const d=document.createElement('aside');d.id='eiAiDrawer';d.className='ei-ai-drawer';d.setAttribute('aria-label','Asistente Documental IA Local');
    d.innerHTML=`<div class="ei-ai-head"><div><small>100% local · sin API</small><strong>Asistente Documental IA</strong></div><div class="ei-ai-head-actions"><button type="button" data-ei-ai-min>—</button><button type="button" data-ei-ai-close>×</button></div></div>
      <div class="ei-ai-scroll">
        <section class="ei-ai-privacy"><b>🔒 Privado por diseño</b><span>Los archivos se leen en este navegador. El modelo local no necesita enviar el documento a un servidor.</span></section>
        <section class="ei-ai-card ei-ai-model-card">
          <div class="ei-ai-card-head"><div><small>Motor generativo</small><strong>IA local opcional</strong></div><span id="eiAiHwBadge" class="ei-ai-badge">Comprobando…</span></div>
          <label>Modelo<select id="eiAiModel">${EI_AI_MODELS.map(x=>`<option value="${x.id}" ${x.id===EI_AI.model?'selected':''}>${eiAiEscape(x.label)} · ${eiAiEscape(x.detail)}</option>`).join('')}</select></label>
          <button type="button" id="eiAiLoadModel" class="ei-ai-primary">Descargar / cargar IA local</button>
          <div class="ei-ai-progress"><i id="eiAiProgressBar"></i></div><div id="eiAiStatus" class="ei-ai-status">${eiAiEscape(EI_AI.progressText)}</div>
          <p>La primera carga descarga el modelo; después el navegador puede reutilizar su caché. Para tareas simples también hay herramientas sin modelo.</p>
        </section>
        <section class="ei-ai-card">
          <div class="ei-ai-card-head"><div><small>Lectura local</small><strong>Importar documento</strong></div><span class="ei-ai-badge light">DOCX · PDF · XLSX · TXT</span></div>
          <label class="ei-ai-drop" for="eiAiFile"><b>＋ Cargar archivo</b><span>Word, PDF, Excel/CSV o texto · máximo 25 MB</span><input id="eiAiFile" type="file" accept=".docx,.pdf,.xlsx,.xls,.xlsb,.ods,.csv,.txt,.md,text/plain" hidden></label>
          <div id="eiAiImported" class="ei-ai-imported"><span>Aún no hay archivo cargado.</span></div>
        </section>
        <section class="ei-ai-card">
          <div class="ei-ai-card-head"><div><small>Acciones rápidas</small><strong>Mejorar con un clic</strong></div><span class="ei-ai-badge light">selección → archivo → documento</span></div>
          <div class="ei-ai-actions">
            <button data-ei-ai-action="correct">✓ Corregir ortografía</button><button data-ei-ai-action="rewrite">✦ Mejorar redacción</button>
            <button data-ei-ai-action="summary">≡ Resumir</button><button data-ei-ai-action="formal">A Redacción formal</button>
            <button data-ei-ai-action="structure">▤ Organizar contenido</button><button data-ei-ai-action="audit">⌕ Auditar documento</button>
            <button data-ei-ai-action="table">▦ Proponer tabla</button><button data-ei-ai-action="flow">◇ Crear flujograma</button>
            <button data-ei-ai-action="concept">◎ Mapa conceptual</button>
          </div>
        </section>
        <section class="ei-ai-card ei-ai-chat-card">
          <div class="ei-ai-card-head"><div><small>Asistente</small><strong>Pregúntale al documento</strong></div><span id="eiAiContextBadge" class="ei-ai-badge light">contexto automático</span></div>
          <div id="eiAiChat" class="ei-ai-chat"><div class="ei-ai-message assistant">Puedo leer el archivo importado o tu documento actual, corregir, explicar, resumir y ayudarte a redactar. Carga el modelo local para respuestas generativas avanzadas.</div></div>
          <textarea id="eiAiPrompt" rows="3" placeholder="Ej.: revisa este documento y dime qué información hace falta…"></textarea>
          <div class="ei-ai-chat-actions"><button type="button" id="eiAiSend" class="ei-ai-primary">Enviar</button><button type="button" id="eiAiAutoDoc">Crear documento automático</button></div>
        </section>
        <section id="eiAiResultCard" class="ei-ai-card ei-ai-result-card">
          <div class="ei-ai-card-head"><div><small>Resultado</small><strong>Propuesta de la IA</strong></div><button type="button" data-ei-ai-clear>Limpiar</button></div>
          <div id="eiAiResult" class="ei-ai-result">El resultado aparecerá aquí.</div>
          <label>Insertar en<select id="eiAiTarget">${eiAiLocationOptions()}</select></label>
          <div class="ei-ai-result-actions"><button type="button" data-ei-ai-apply="replace">Reemplazar selección</button><button type="button" data-ei-ai-apply="text">Insertar como texto</button><button type="button" data-ei-ai-apply="note">Insertar como nota</button></div>
        </section>
      </div>`;
    document.body.appendChild(d);
  }
  eiAiRefreshStatus();eiAiRefreshImported();eiAiBindUi();
}
function eiAiRefreshStatus(){
  const b=document.getElementById('eiAiProgressBar'),s=document.getElementById('eiAiStatus'),h=document.getElementById('eiAiHwBadge');if(b)b.style.width=`${Math.round((EI_AI.progress||0)*100)}%`;if(s)s.textContent=EI_AI.progressText||'';
  if(h){const hw=eiAiHardware();h.textContent=hw.webgpu?'WebGPU disponible':'Sin WebGPU';h.classList.toggle('ok',hw.webgpu);h.classList.toggle('warn',!hw.webgpu)}
  const load=document.getElementById('eiAiLoadModel');if(load){load.disabled=EI_AI.busy;load.textContent=EI_AI.status==='ready'?'✓ IA local cargada':EI_AI.status==='loading'?'Cargando…':'Descargar / cargar IA local'}
}
function eiAiRefreshImported(){
  const box=document.getElementById('eiAiImported');if(!box)return;const d=EI_AI.imported;if(!d){box.innerHTML='<span>Aún no hay archivo cargado.</span>';return}const st=eiAiImportedStats();
  box.innerHTML=`<div class="ei-ai-file-row"><div><b>${eiAiEscape(d.name)}</b><span>${st.words.toLocaleString('es-CO')} palabras · ${st.sections} secciones detectadas${st.pages?` · ${st.pages} páginas`:''}${st.tables?` · ${st.tables} tablas`:''}</span></div><button type="button" data-ei-ai-forget>×</button></div><div class="ei-ai-import-actions"><button type="button" data-ei-ai-import-word="append">＋ Agregar al documento</button><button type="button" data-ei-ai-import-word="replace">Organizar y reemplazar</button></div>`;
  const badge=document.getElementById('eiAiContextBadge');if(badge)badge.textContent=d.name;
}
function eiAiOpen(){eiAiEnsureUi();document.getElementById('eiAiDrawer')?.classList.add('open');document.body.classList.add('ei-ai-open')}
function eiAiClose(){document.getElementById('eiAiDrawer')?.classList.remove('open','minimized');document.body.classList.remove('ei-ai-open')}
function eiAiRenderResult(text,streaming=false){EI_AI.lastResult=String(text||'');const box=document.getElementById('eiAiResult');if(box){box.textContent=EI_AI.lastResult||'El resultado aparecerá aquí.';box.classList.toggle('streaming',!!streaming)}if(!streaming&&EI_AI.lastResult)document.getElementById('eiAiResultCard')?.scrollIntoView({behavior:'smooth',block:'nearest'})}
function eiAiChatMessage(role,text){const box=document.getElementById('eiAiChat');if(!box)return;const div=document.createElement('div');div.className=`ei-ai-message ${role}`;div.textContent=text;box.appendChild(div);box.scrollTop=box.scrollHeight}
async function eiAiDoAction(action){
  const btn=document.querySelector(`[data-ei-ai-action="${action}"]`);if(btn)btn.disabled=true;try{eiAiChatMessage('user',btn?.textContent?.trim()||action);const result=await eiAiRunAction(action);eiAiRenderResult(result);eiAiChatMessage('assistant',result)}catch(err){eiAiChatMessage('assistant',`No pude completar la acción: ${err.message||err}`);eiAiRenderResult('')}finally{if(btn)btn.disabled=false;eiAiRefreshStatus()}
}
async function eiAiSendPrompt(){
  const input=document.getElementById('eiAiPrompt'),q=input?.value?.trim();if(!q)return;if(!EI_AI.engine){eiAiChatMessage('assistant','Para preguntas abiertas necesitas cargar la IA local. Puedes usar Corrección, Resumen, Organización e importación sin modelo.');return}input.value='';eiAiChatMessage('user',q);try{const source=eiAiSourceText(q);const result=await eiAiGenerate(q,{context:source.text,onUpdate:t=>eiAiRenderResult(t,true)});eiAiRenderResult(result);eiAiChatMessage('assistant',result)}catch(err){eiAiChatMessage('assistant',`Error: ${err.message||err}`)}finally{eiAiRefreshStatus()}
}
function eiAiTarget(){const v=document.getElementById('eiAiTarget')?.value||'0:-1';const [i,j]=v.split(':').map(Number);return{i:Number.isFinite(i)?i:0,j:Number.isFinite(j)?j:-1}}
function eiAiApplyResult(mode){
  const text=String(EI_AI.lastResult||'').trim();if(!text)return;
  if(mode==='replace'){
    const s=EI_AI.selection;if(!s?.editor||!s.range||!document.contains(s.editor)){eiAiChatMessage('assistant','No hay una selección de texto guardada. Selecciona primero un fragmento dentro del editor.');return}
    try{s.range.deleteContents();s.range.insertNode(document.createTextNode(text));if(typeof premiumSyncEditor==='function')premiumSyncEditor(s.editor,true);EI_AI.selection=null;eiAiChatMessage('assistant','Texto reemplazado en el editor.');return}catch(e){eiAiChatMessage('assistant','No pude restaurar la selección. Usa “Insertar como texto”.')}
  }
  const {i,j}=eiAiTarget();if(typeof addWordBlock!=='function')return;addWordBlock(i,j,mode==='note'?'callout':'text');const item=getWordItem(i,j),b=item?.blocks?.[item.blocks.length-1];if(b){b.text=text;if('richText'in b&&typeof premiumEscapeText==='function')b.richText=premiumEscapeText(text);if(b.type==='callout'){b.title='Nota generada con IA local';b.tone='info'}}if(typeof render==='function')render();eiAiChatMessage('assistant','Resultado insertado en el documento.')
}
function eiAiExtractJson(text){const s=String(text||'');const fenced=s.match(/```(?:json)?\s*([\s\S]*?)```/i);const raw=(fenced?.[1]||s).trim();const a=raw.indexOf('{'),b=raw.lastIndexOf('}');if(a<0||b<=a)throw new Error('La IA no devolvió una estructura JSON válida.');return JSON.parse(raw.slice(a,b+1))}
function eiAiSafeAutoBlock(raw){
  const t=String(raw?.type||'text').toLowerCase();if(t==='table'&&Array.isArray(raw.rows))return normalizeWordBlock({type:'table',title:raw.title||'Tabla',rows:raw.rows.slice(0,20)});
  if(t==='list')return normalizeWordBlock({type:'list',title:raw.title||'',items:Array.isArray(raw.items)?raw.items.map(String).slice(0,40):[],ordered:!!raw.ordered});
  if(t==='callout'||t==='note')return normalizeWordBlock({type:'callout',title:raw.title||'Nota',text:raw.text||'',tone:'info'});
  if(t==='diagram'){const nodes=Array.isArray(raw.nodes)?raw.nodes.map(String).slice(0,24):[];return normalizeWordBlock({type:'diagram',title:raw.title||'Flujograma',diagramType:raw.diagramType==='concept'?'concept':'flow',orientation:raw.orientation==='horizontal'?'horizontal':'vertical',nodes})}
  return normalizeWordBlock({type:'text',text:String(raw?.text||raw?.content||'')});
}
function eiAiApplyStructuredDocument(obj){
  const sections=Array.isArray(obj?.sections)?obj.sections:[];if(!sections.length)throw new Error('La propuesta no contiene secciones.');
  const built=sections.slice(0,30).map((s,i)=>{const sec={n:String(i+1),t:String(s.title||`SECCIÓN ${i+1}`).toUpperCase(),c:String(s.content||''),richContent:typeof premiumEscapeText==='function'?premiumEscapeText(s.content||''):String(s.content||''),sub:[],blocks:[]};sec.blocks=(Array.isArray(s.blocks)?s.blocks:[]).slice(0,20).map(eiAiSafeAutoBlock);sec.sub=(Array.isArray(s.subsections)?s.subsections:[]).slice(0,20).map((ss,j)=>({n:`${i+1}.${j+1}`,t:String(ss.title||`Subtítulo ${j+1}`),c:String(ss.content||''),richContent:typeof premiumEscapeText==='function'?premiumEscapeText(ss.content||''):String(ss.content||''),sub:[],blocks:(Array.isArray(ss.blocks)?ss.blocks:[]).slice(0,12).map(eiAiSafeAutoBlock)}));return sec});
  if(!confirm('La IA preparó un documento estructurado. ¿Reemplazar las secciones actuales con esta propuesta?'))return false;doc.sections=built;if(obj.title)doc.title=String(obj.title);ensureWordSubtitles();render();return true;
}
async function eiAiCreateAutomaticDocument(){
  if(!EI_AI.engine){eiAiChatMessage('assistant','La creación completa requiere cargar el modelo local. Si ya tienes un archivo, “Organizar y reemplazar” funciona sin modelo.');return}
  const q=document.getElementById('eiAiPrompt')?.value?.trim()||'Organiza profesionalmente el contenido disponible como documento técnico.';const source=eiAiSourceText(q);if(!source.text)throw new Error('No hay contenido para organizar.');
  const instruction=`Crea una estructura documental completa a partir del contexto y la instrucción del usuario: ${q}\nDevuelve EXCLUSIVAMENTE JSON válido con este esquema: {"title":"Título","sections":[{"title":"OBJETIVO","content":"texto","subsections":[{"title":"Subtítulo","content":"texto","blocks":[]}],"blocks":[{"type":"text","text":"..."},{"type":"list","title":"","items":["..."]},{"type":"table","title":"","rows":[["A","B"],["1","2"]]},{"type":"callout","title":"Nota","text":"..."},{"type":"diagram","title":"Flujograma","diagramType":"flow","orientation":"vertical","nodes":["[I] Inicio","[P] Actividad","[F] Fin"]}]}]} . No inventes fuentes, cifras ni requisitos.`;
  eiAiChatMessage('user','Crear documento automático');const raw=await eiAiGenerate(instruction,{context:source.text,temperature:.15,maxTokens:1800,onUpdate:t=>eiAiRenderResult(t,true)});eiAiRenderResult(raw);const obj=eiAiExtractJson(raw);eiAiApplyStructuredDocument(obj);eiAiChatMessage('assistant','Documento estructurado generado y preparado para edición.')
}
function eiAiBindUi(){
  if(document.body.dataset.eiAiBound==='1')return;document.body.dataset.eiAiBound='1';
  document.addEventListener('click',async e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;
    if(t.closest('#eiAiBtn')){e.preventDefault();eiAiOpen();return}if(t.closest('[data-ei-ai-close]')){eiAiClose();return}if(t.closest('[data-ei-ai-min]')){document.getElementById('eiAiDrawer')?.classList.toggle('minimized');return}
    const act=t.closest('[data-ei-ai-action]');if(act){e.preventDefault();await eiAiDoAction(act.dataset.eiAiAction);return}if(t.closest('#eiAiLoadModel')){try{await eiAiLoadModel(document.getElementById('eiAiModel')?.value||EI_AI.model)}catch(err){eiAiChatMessage('assistant',err.message||String(err))}finally{eiAiRefreshStatus()}return}
    if(t.closest('#eiAiSend')){await eiAiSendPrompt();return}if(t.closest('#eiAiAutoDoc')){try{await eiAiCreateAutomaticDocument()}catch(err){eiAiChatMessage('assistant',err.message||String(err))}return}
    const apply=t.closest('[data-ei-ai-apply]');if(apply){eiAiApplyResult(apply.dataset.eiAiApply);return}if(t.closest('[data-ei-ai-clear]')){EI_AI.lastResult='';eiAiRenderResult('');return}
    if(t.closest('[data-ei-ai-forget]')){EI_AI.imported=null;eiAiRefreshImported();return}const imp=t.closest('[data-ei-ai-import-word]');if(imp){try{eiAiImportIntoWordStudio({replace:imp.dataset.eiAiImportWord==='replace'})}catch(err){eiAiChatMessage('assistant',err.message||String(err))}return}
  },true);
  document.addEventListener('change',async e=>{const t=e.target;if(t?.id==='eiAiFile'){const file=t.files?.[0];if(!file)return;try{await eiAiImportFile(file);eiAiChatMessage('assistant',`Leí ${file.name} completamente en tu navegador. Ya puedes organizarlo, resumirlo o preguntarme por su contenido.`)}catch(err){eiAiChatMessage('assistant',`No pude leer el archivo: ${err.message||err}`)}finally{t.value='';eiAiRefreshStatus()}}if(t?.id==='eiAiModel')EI_AI.model=t.value},true);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='i'){e.preventDefault();eiAiOpen()}if(e.key==='Escape'&&document.getElementById('eiAiDrawer')?.classList.contains('open'))eiAiClose()});
}
function eiAiBootstrap(){eiAiEnsureUi();const target=document.getElementById('eiAiTarget');if(target)target.innerHTML=eiAiLocationOptions();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',eiAiBootstrap,{once:true});else queueMicrotask(eiAiBootstrap);
window.EI_AI_UI_READY=true;
