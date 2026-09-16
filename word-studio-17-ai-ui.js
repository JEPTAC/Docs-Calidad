/* ===== V81 · CENTRO IA DOCUMENTAL FLOTANTE =================================
   Bot, importación, herramientas, modelo y resultados en un único centro.
   Mantiene todo el motor V80 y no modifica la plantilla SGC base.
============================================================================= */
const EI_AI_TABS=['chat','file','tools','model','result'];
function eiAiLocationOptions(){return typeof v76LocationOptions==='function'?v76LocationOptions():'<option value="0:-1">1 · OBJETIVO</option>'}
function eiAiEnsureFab(){
  if(document.getElementById('eiAiFab'))return;
  const host=document.createElement('div');host.id='eiAiFabHost';host.className='ei-ai-fab-host';host.innerHTML=`
    <div id="eiAiFabMenu" class="ei-ai-fab-menu" aria-hidden="true">
      <button type="button" data-ei-ai-open-tab="chat"><span>✦</span><b>Bot</b><small>Preguntar y redactar</small></button>
      <button type="button" data-ei-ai-open-tab="file"><span>＋</span><b>Subir</b><small>DOCX · PDF · CSV · Excel</small></button>
      <button type="button" data-ei-ai-open-tab="tools"><span>⌁</span><b>Herramientas</b><small>Corregir, resumir, auditar</small></button>
      <button type="button" data-ei-ai-open-tab="model"><span>◉</span><b>Cargar IA</b><small>Modelo local gratuito</small></button>
    </div>
    <button type="button" id="eiAiFab" class="ei-ai-fab" aria-label="Abrir Centro IA" aria-expanded="false"><span class="ei-ai-fab-star">✦</span><span class="ei-ai-fab-label">IA</span><i id="eiAiFabState"></i></button>`;
  document.body.appendChild(host);
}
function eiAiToggleFabMenu(force=null){const menu=document.getElementById('eiAiFabMenu'),fab=document.getElementById('eiAiFab');if(!menu||!fab)return;const open=force===null?!menu.classList.contains('open'):!!force;menu.classList.toggle('open',open);menu.setAttribute('aria-hidden',String(!open));fab.setAttribute('aria-expanded',String(open))}
function eiAiEnsureUi(){
  document.getElementById('eiAiBtn')?.remove();eiAiEnsureFab();
  if(!document.getElementById('eiAiDrawer')){
    const d=document.createElement('aside');d.id='eiAiDrawer';d.className='ei-ai-drawer';d.setAttribute('aria-label','Centro IA Documental');
    d.innerHTML=`<div class="ei-ai-head"><div><small>GRATIS · LOCAL · PRIVADO</small><strong>Centro IA Documental</strong></div><div class="ei-ai-head-actions"><button type="button" data-ei-ai-min title="Minimizar">—</button><button type="button" data-ei-ai-close title="Cerrar">×</button></div></div>
      <nav class="ei-ai-tabs" aria-label="Módulos del Centro IA">
        <button type="button" data-ei-ai-tab="chat">Bot</button><button type="button" data-ei-ai-tab="file">Archivo</button><button type="button" data-ei-ai-tab="tools">Herramientas</button><button type="button" data-ei-ai-tab="model">Modelo</button><button type="button" data-ei-ai-tab="result">Resultado</button>
      </nav>
      <section class="ei-ai-privacy"><b>🔒 Procesamiento local</b><span>El documento se analiza en este navegador. El modelo generativo también corre localmente cuando lo cargas.</span></section>
      <div class="ei-ai-scroll">
        <section class="ei-ai-panel" data-ei-ai-panel="chat">
          <div class="ei-ai-card ei-ai-chat-card">
            <div class="ei-ai-card-head"><div><small>Asistente</small><strong>Pregúntale al documento</strong></div><span id="eiAiContextBadge" class="ei-ai-badge light">documento actual</span></div>
            <div id="eiAiChat" class="ei-ai-chat"><div class="ei-ai-message assistant">Puedo leer tu documento o un archivo cargado, corregir, explicar, resumir, reorganizar y ayudarte a redactar. Para preguntas abiertas y generación avanzada, carga la IA local.</div></div>
            <textarea id="eiAiPrompt" rows="4" placeholder="Ej.: revisa este documento, dime qué falta y mejora la redacción del alcance…"></textarea>
            <div class="ei-ai-chat-actions"><button type="button" id="eiAiSend" class="ei-ai-primary">Enviar al bot</button><button type="button" id="eiAiAutoDoc">Crear documento automático</button></div>
          </div>
          <div class="ei-ai-capability-strip"><button type="button" data-ei-ai-goto="file">＋ Subir documento</button><button type="button" data-ei-ai-goto="tools">⌁ Ver herramientas</button><button type="button" data-ei-ai-goto="model">◉ Cargar IA</button></div>
        </section>
        <section class="ei-ai-panel" data-ei-ai-panel="file">
          <div class="ei-ai-card">
            <div class="ei-ai-card-head"><div><small>Lectura inteligente</small><strong>Subir y comprender archivo</strong></div><span class="ei-ai-badge light">DOCX · PDF · XLSX · CSV · TXT</span></div>
            <label class="ei-ai-drop" for="eiAiFile"><b>＋ Seleccionar archivo</b><span>Word, PDF, Excel, CSV o texto · máximo 25 MB</span><input id="eiAiFile" type="file" accept=".docx,.pdf,.xlsx,.xls,.xlsb,.ods,.csv,.txt,.md,text/plain,text/csv" hidden></label>
            <div id="eiAiImported" class="ei-ai-imported"><span>Aún no hay archivo cargado.</span></div>
          </div>
          <div id="eiAiAnalysisCard" class="ei-ai-card ei-ai-analysis-card"><div class="ei-ai-empty-analysis">Cuando cargues un archivo, aquí verás qué estructura entendió la herramienta.</div></div>
        </section>
        <section class="ei-ai-panel" data-ei-ai-panel="tools">
          <div class="ei-ai-card">
            <div class="ei-ai-card-head"><div><small>Acciones rápidas</small><strong>Trabajar sobre selección, archivo o documento</strong></div><span class="ei-ai-badge light">contexto automático</span></div>
            <div class="ei-ai-actions">
              <button data-ei-ai-action="correct">✓ <b>Corregir ortografía</b><small>Tildes, concordancia y puntuación</small></button><button data-ei-ai-action="rewrite">✦ <b>Mejorar redacción</b><small>Claridad, precisión y naturalidad</small></button>
              <button data-ei-ai-action="summary">≡ <b>Resumir</b><small>Extrae lo esencial</small></button><button data-ei-ai-action="formal">A <b>Redacción formal</b><small>Tono técnico e institucional</small></button>
              <button data-ei-ai-action="structure">▤ <b>Organizar contenido</b><small>Títulos y jerarquía lógica</small></button><button data-ei-ai-action="audit">⌕ <b>Auditar documento</b><small>Vacíos, contradicciones y mejoras</small></button>
              <button data-ei-ai-action="table">▦ <b>Proponer tabla</b><small>Estructura datos del texto</small></button><button data-ei-ai-action="flow">◇ <b>Crear flujograma</b><small>Convierte procesos en pasos</small></button>
              <button data-ei-ai-action="concept">◎ <b>Mapa conceptual</b><small>Conceptos y relaciones</small></button>
            </div>
          </div>
        </section>
        <section class="ei-ai-panel" data-ei-ai-panel="model">
          <div class="ei-ai-card ei-ai-model-card">
            <div class="ei-ai-card-head"><div><small>Motor generativo</small><strong>IA local gratuita</strong></div><span id="eiAiHwBadge" class="ei-ai-badge">Comprobando…</span></div>
            <label>Modelo<select id="eiAiModel">${EI_AI_MODELS.map(x=>`<option value="${x.id}" ${x.id===EI_AI.model?'selected':''}>${eiAiEscape(x.label)} · ${eiAiEscape(x.detail)}</option>`).join('')}</select></label>
            <button type="button" id="eiAiLoadModel" class="ei-ai-primary">Descargar / cargar IA local</button>
            <div class="ei-ai-progress"><i id="eiAiProgressBar"></i></div><div id="eiAiStatus" class="ei-ai-status">${eiAiEscape(EI_AI.progressText)}</div>
            <div class="ei-ai-model-help"><b>¿Para qué sirve cargarla?</b><span>Habilita chat abierto, redacción avanzada, auditoría, tablas, diagramas y creación automática de documentos. La primera descarga puede ser grande; luego queda cacheada en el navegador.</span></div>
          </div>
        </section>
        <section class="ei-ai-panel" data-ei-ai-panel="result">
          <section id="eiAiResultCard" class="ei-ai-card ei-ai-result-card">
            <div class="ei-ai-card-head"><div><small>Resultado</small><strong>Propuesta del asistente</strong></div><button type="button" data-ei-ai-clear>Limpiar</button></div>
            <div id="eiAiResult" class="ei-ai-result">El resultado aparecerá aquí.</div>
            <label>Insertar en<select id="eiAiTarget">${eiAiLocationOptions()}</select></label>
            <div class="ei-ai-result-actions"><button type="button" data-ei-ai-apply="replace">Reemplazar selección</button><button type="button" data-ei-ai-apply="text">Insertar como texto</button><button type="button" data-ei-ai-apply="note">Insertar como nota</button></div>
          </section>
        </section>
      </div>`;
    document.body.appendChild(d);
  }
  eiAiRefreshStatus();eiAiRefreshImported();eiAiBindUi();eiAiSetTab(document.getElementById('eiAiDrawer')?.dataset.activeTab||'chat');
}
function eiAiSetTab(tab='chat'){if(!EI_AI_TABS.includes(tab))tab='chat';const d=document.getElementById('eiAiDrawer');if(!d)return;d.dataset.activeTab=tab;d.querySelectorAll('[data-ei-ai-tab]').forEach(b=>b.classList.toggle('active',b.dataset.eiAiTab===tab));d.querySelectorAll('[data-ei-ai-panel]').forEach(p=>p.classList.toggle('active',p.dataset.eiAiPanel===tab));}
function eiAiRefreshStatus(){
  const b=document.getElementById('eiAiProgressBar'),s=document.getElementById('eiAiStatus'),h=document.getElementById('eiAiHwBadge'),dot=document.getElementById('eiAiFabState');if(b)b.style.width=`${Math.round((EI_AI.progress||0)*100)}%`;if(s)s.textContent=EI_AI.progressText||'';
  if(h){const hw=eiAiHardware();h.textContent=EI_AI.status==='ready'?'IA lista':hw.webgpu?'WebGPU disponible':'Sin WebGPU';h.classList.toggle('ok',EI_AI.status==='ready'||hw.webgpu);h.classList.toggle('warn',!hw.webgpu)}if(dot)dot.className=EI_AI.status==='ready'?'ready':EI_AI.status==='loading'?'loading':'';
  const load=document.getElementById('eiAiLoadModel');if(load){load.disabled=EI_AI.busy;load.textContent=EI_AI.status==='ready'?'✓ IA local cargada':EI_AI.status==='loading'?'Cargando…':'Descargar / cargar IA local'}
}
function eiAiAnalysisMarkup(d){
  const a=d?.analysis;if(!a)return'<div class="ei-ai-empty-analysis">No hay análisis disponible.</div>';const preview=(d.structure||[]).slice(0,10);const tables=(a.tableProfiles||[]).slice(0,6);
  return `<div class="ei-ai-card-head"><div><small>Comprensión automática</small><strong>Esto entendí del archivo</strong></div><span class="ei-ai-confidence">${a.confidence}% confianza</span></div>
    <div class="ei-ai-analysis-grid"><div><small>Tipo probable</small><b>${eiAiEscape(a.documentType)}</b></div><div><small>Secciones</small><b>${a.sections}</b></div><div><small>Tablas</small><b>${a.tableProfiles.length}</b></div><div><small>Gráficas posibles</small><b>${a.chartCandidates}</b></div></div>
    ${preview.length?`<div class="ei-ai-structure-preview"><b>Estructura detectada</b>${preview.map(x=>`<div style="--level:${Math.max(1,Number(x.level)||1)}"><span>${eiAiEscape(x.title)}</span><small>Nivel ${Math.max(1,Number(x.level)||1)}</small></div>`).join('')}</div>`:''}
    ${tables.length?`<div class="ei-ai-table-preview"><b>Datos detectados</b>${tables.map(t=>`<div><span>${eiAiEscape(t.name)}</span><small>${t.rows} filas · ${t.cols} columnas${t.chartable?' · apta para gráfica':''}</small></div>`).join('')}</div>`:''}
    <div class="ei-ai-suggestions">${(a.suggestions||[]).map(x=>`<span>✓ ${eiAiEscape(x)}</span>`).join('')}</div>`;
}
function eiAiRefreshImported(){
  const box=document.getElementById('eiAiImported'),analysis=document.getElementById('eiAiAnalysisCard');if(!box)return;const d=EI_AI.imported;if(!d){box.innerHTML='<span>Aún no hay archivo cargado.</span>';if(analysis)analysis.innerHTML='<div class="ei-ai-empty-analysis">Cuando cargues un archivo, aquí verás qué estructura entendió la herramienta.</div>';return}const st=eiAiImportedStats();
  const isData=['csv','xlsx','xls','xlsb','ods'].includes(d.type);box.innerHTML=`<div class="ei-ai-file-row"><div><b>${eiAiEscape(d.name)}</b><span>${st.words.toLocaleString('es-CO')} palabras · ${st.sections} secciones · ${st.tables} tabla(s)</span></div><button type="button" data-ei-ai-forget>×</button></div><div class="ei-ai-import-actions"><button type="button" data-ei-ai-import-word="append">＋ Agregar al documento</button><button type="button" data-ei-ai-import-word="replace">Organizar y reemplazar</button>${isData&&d.analysis?.chartCandidates?'<button type="button" data-ei-ai-data-chart>Crear gráfica</button>':''}</div>`;
  if(analysis)analysis.innerHTML=eiAiAnalysisMarkup(d);const badge=document.getElementById('eiAiContextBadge');if(badge)badge.textContent=d.name;
}
function eiAiOpen(tab='chat'){eiAiEnsureUi();eiAiToggleFabMenu(false);document.getElementById('eiAiDrawer')?.classList.add('open');document.body.classList.add('ei-ai-open');eiAiSetTab(tab)}
function eiAiClose(){document.getElementById('eiAiDrawer')?.classList.remove('open','minimized');document.body.classList.remove('ei-ai-open')}
function eiAiRenderResult(text,streaming=false){EI_AI.lastResult=String(text||'');const box=document.getElementById('eiAiResult');if(box){box.textContent=EI_AI.lastResult||'El resultado aparecerá aquí.';box.classList.toggle('streaming',!!streaming)}if(!streaming&&EI_AI.lastResult){eiAiSetTab('result');}}
function eiAiChatMessage(role,text){const box=document.getElementById('eiAiChat');if(!box)return;const div=document.createElement('div');div.className=`ei-ai-message ${role}`;div.textContent=text;box.appendChild(div);box.scrollTop=box.scrollHeight}
async function eiAiDoAction(action){
  const btn=document.querySelector(`[data-ei-ai-action="${action}"]`);if(btn)btn.disabled=true;try{eiAiChatMessage('user',btn?.textContent?.trim()||action);const result=await eiAiRunAction(action);eiAiRenderResult(result);eiAiChatMessage('assistant',result)}catch(err){eiAiChatMessage('assistant',`No pude completar la acción: ${err.message||err}`);eiAiRenderResult('')}finally{if(btn)btn.disabled=false;eiAiRefreshStatus()}
}
async function eiAiSendPrompt(){
  const input=document.getElementById('eiAiPrompt'),q=input?.value?.trim();if(!q)return;if(!EI_AI.engine){eiAiChatMessage('assistant','Para preguntas abiertas necesitas cargar la IA local. Corrección, resumen, organización e importación funcionan sin modelo.');eiAiSetTab('model');return}input.value='';eiAiChatMessage('user',q);try{const source=eiAiSourceText(q);const result=await eiAiGenerate(q,{context:source.text,onUpdate:t=>eiAiRenderResult(t,true)});eiAiRenderResult(result);eiAiChatMessage('assistant',result)}catch(err){eiAiChatMessage('assistant',`Error: ${err.message||err}`)}finally{eiAiRefreshStatus()}
}
function eiAiTarget(){const v=document.getElementById('eiAiTarget')?.value||'0:-1';const [i,j]=v.split(':').map(Number);return{i:Number.isFinite(i)?i:0,j:Number.isFinite(j)?j:-1}}
function eiAiApplyResult(mode){
  const text=String(EI_AI.lastResult||'').trim();if(!text)return;
  if(mode==='replace'){const s=EI_AI.selection;if(!s?.editor||!s.range||!document.contains(s.editor)){eiAiChatMessage('assistant','No hay una selección de texto guardada. Selecciona primero un fragmento dentro del editor.');return}try{s.range.deleteContents();s.range.insertNode(document.createTextNode(text));if(typeof premiumSyncEditor==='function')premiumSyncEditor(s.editor,true);EI_AI.selection=null;eiAiChatMessage('assistant','Texto reemplazado en el editor.');return}catch(e){eiAiChatMessage('assistant','No pude restaurar la selección. Usa “Insertar como texto”.')}}
  const {i,j}=eiAiTarget();if(typeof addWordBlock!=='function')return;addWordBlock(i,j,mode==='note'?'callout':'text');const item=getWordItem(i,j),b=item?.blocks?.[item.blocks.length-1];if(b){b.text=text;if('richText'in b&&typeof premiumEscapeText==='function')b.richText=premiumEscapeText(text);if(b.type==='callout'){b.title='Nota generada con IA local';b.tone='info'}}if(typeof render==='function')render();eiAiChatMessage('assistant','Resultado insertado en el documento.')
}
function eiAiExtractJson(text){const s=String(text||'');const fenced=s.match(/```(?:json)?\s*([\s\S]*?)```/i);const raw=(fenced?.[1]||s).trim();const a=raw.indexOf('{'),b=raw.lastIndexOf('}');if(a<0||b<=a)throw new Error('La IA no devolvió una estructura JSON válida.');return JSON.parse(raw.slice(a,b+1))}
function eiAiSafeAutoBlock(raw){const t=String(raw?.type||'text').toLowerCase();if(t==='table'&&Array.isArray(raw.rows))return normalizeWordBlock({type:'table',title:raw.title||'Tabla',rows:raw.rows.slice(0,20)});if(t==='list')return normalizeWordBlock({type:'list',title:raw.title||'',items:Array.isArray(raw.items)?raw.items.map(String).slice(0,40):[],ordered:!!raw.ordered});if(t==='callout'||t==='note')return normalizeWordBlock({type:'callout',title:raw.title||'Nota',text:raw.text||'',tone:'info'});if(t==='diagram'){const nodes=Array.isArray(raw.nodes)?raw.nodes.map(String).slice(0,24):[];return normalizeWordBlock({type:'diagram',title:raw.title||'Flujograma',diagramType:raw.diagramType==='concept'?'concept':'flow',orientation:raw.orientation==='horizontal'?'horizontal':'vertical',nodes})}return normalizeWordBlock({type:'text',text:String(raw?.text||raw?.content||'')})}
function eiAiApplyStructuredDocument(obj){const sections=Array.isArray(obj?.sections)?obj.sections:[];if(!sections.length)throw new Error('La propuesta no contiene secciones.');const built=sections.slice(0,30).map((s,i)=>{const sec={n:String(i+1),t:String(s.title||`SECCIÓN ${i+1}`).toUpperCase(),c:String(s.content||''),richContent:typeof premiumEscapeText==='function'?premiumEscapeText(s.content||''):String(s.content||''),sub:[],blocks:[]};sec.blocks=(Array.isArray(s.blocks)?s.blocks:[]).slice(0,20).map(eiAiSafeAutoBlock);sec.sub=(Array.isArray(s.subsections)?s.subsections:[]).slice(0,20).map((ss,j)=>({n:`${i+1}.${j+1}`,t:String(ss.title||`Subtítulo ${j+1}`),c:String(ss.content||''),richContent:typeof premiumEscapeText==='function'?premiumEscapeText(ss.content||''):String(ss.content||''),sub:[],blocks:(Array.isArray(ss.blocks)?ss.blocks:[]).slice(0,12).map(eiAiSafeAutoBlock)}));return sec});if(!confirm('La IA preparó un documento estructurado. ¿Reemplazar las secciones actuales con esta propuesta?'))return false;doc.sections=built;if(obj.title)doc.title=String(obj.title);ensureWordSubtitles();render();return true}
async function eiAiCreateAutomaticDocument(){if(!EI_AI.engine){eiAiChatMessage('assistant','La creación completa requiere cargar el modelo local. Si ya tienes un archivo, “Organizar y reemplazar” funciona sin modelo.');eiAiSetTab('model');return}const q=document.getElementById('eiAiPrompt')?.value?.trim()||'Organiza profesionalmente el contenido disponible como documento técnico.';const source=eiAiSourceText(q);if(!source.text)throw new Error('No hay contenido para organizar.');const instruction=`Crea una estructura documental completa a partir del contexto y la instrucción del usuario: ${q}\nDevuelve EXCLUSIVAMENTE JSON válido con este esquema: {"title":"Título","sections":[{"title":"OBJETIVO","content":"texto","subsections":[{"title":"Subtítulo","content":"texto","blocks":[]}],"blocks":[{"type":"text","text":"..."},{"type":"list","title":"","items":["..."]},{"type":"table","title":"","rows":[["A","B"],["1","2"]]},{"type":"callout","title":"Nota","text":"..."},{"type":"diagram","title":"Flujograma","diagramType":"flow","orientation":"vertical","nodes":["[I] Inicio","[P] Actividad","[F] Fin"]}]}]} . No inventes fuentes, cifras ni requisitos.`;eiAiChatMessage('user','Crear documento automático');const raw=await eiAiGenerate(instruction,{context:source.text,temperature:.15,maxTokens:1800,onUpdate:t=>eiAiRenderResult(t,true)});eiAiRenderResult(raw);const obj=eiAiExtractJson(raw);eiAiApplyStructuredDocument(obj);eiAiChatMessage('assistant','Documento estructurado generado y preparado para edición.')}
function eiAiBindUi(){
  if(document.body.dataset.eiAiBound==='1')return;document.body.dataset.eiAiBound='1';
  document.addEventListener('click',async e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;
    if(t.closest('#eiAiFab')){e.preventDefault();eiAiToggleFabMenu();return}const open=t.closest('[data-ei-ai-open-tab]');if(open){e.preventDefault();eiAiOpen(open.dataset.eiAiOpenTab);return}const tab=t.closest('[data-ei-ai-tab]');if(tab){eiAiSetTab(tab.dataset.eiAiTab);return}const go=t.closest('[data-ei-ai-goto]');if(go){eiAiSetTab(go.dataset.eiAiGoto);return}
    if(t.closest('[data-ei-ai-close]')){eiAiClose();return}if(t.closest('[data-ei-ai-min]')){document.getElementById('eiAiDrawer')?.classList.toggle('minimized');return}
    const act=t.closest('[data-ei-ai-action]');if(act){e.preventDefault();await eiAiDoAction(act.dataset.eiAiAction);return}if(t.closest('#eiAiLoadModel')){try{await eiAiLoadModel(document.getElementById('eiAiModel')?.value||EI_AI.model)}catch(err){eiAiChatMessage('assistant',err.message||String(err))}finally{eiAiRefreshStatus()}return}
    if(t.closest('#eiAiSend')){await eiAiSendPrompt();return}if(t.closest('#eiAiAutoDoc')){try{await eiAiCreateAutomaticDocument()}catch(err){eiAiChatMessage('assistant',err.message||String(err))}return}
    const apply=t.closest('[data-ei-ai-apply]');if(apply){eiAiApplyResult(apply.dataset.eiAiApply);return}if(t.closest('[data-ei-ai-clear]')){EI_AI.lastResult='';eiAiRenderResult('');return}
    if(t.closest('[data-ei-ai-forget]')){EI_AI.imported=null;eiAiRefreshImported();return}const imp=t.closest('[data-ei-ai-import-word]');if(imp){try{eiAiImportIntoWordStudio({replace:imp.dataset.eiAiImportWord==='replace'})}catch(err){eiAiChatMessage('assistant',err.message||String(err))}return}
    if(t.closest('[data-ei-ai-data-chart]')){try{eiAiInsertImportedChart(eiAiTarget());eiAiChatMessage('assistant','Gráfica creada a partir de los datos importados.')}catch(err){eiAiChatMessage('assistant',err.message||String(err))}return}
    const host=document.getElementById('eiAiFabHost');if(host&&!host.contains(t))eiAiToggleFabMenu(false);
  },true);
  document.addEventListener('change',async e=>{const t=e.target;if(t?.id==='eiAiFile'){const file=t.files?.[0];if(!file)return;try{await eiAiImportFile(file);eiAiRefreshImported();eiAiChatMessage('assistant',`Leí ${file.name} completamente en tu navegador y analicé su estructura. Revisa “Esto entendí del archivo” antes de incorporarlo.`)}catch(err){eiAiChatMessage('assistant',`No pude leer el archivo: ${err.message||err}`)}finally{t.value='';eiAiRefreshStatus()}}if(t?.id==='eiAiModel')EI_AI.model=t.value},true);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='i'){e.preventDefault();eiAiOpen('chat')}if(e.key==='Escape'){if(document.getElementById('eiAiDrawer')?.classList.contains('open'))eiAiClose();else eiAiToggleFabMenu(false)}});
}
function eiAiBootstrap(){eiAiEnsureUi();const target=document.getElementById('eiAiTarget');if(target)target.innerHTML=eiAiLocationOptions();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',eiAiBootstrap,{once:true});else queueMicrotask(eiAiBootstrap);
window.EI_AI_UI_READY=true;window.EI_AI_CENTER_V81=true;
