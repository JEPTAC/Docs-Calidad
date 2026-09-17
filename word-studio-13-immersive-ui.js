/* ===== V75 · Experiencia inmersiva y contextual ============================
   Reorganiza únicamente la experiencia de edición de Word Studio.
   No modifica plantilla SGC, render de páginas ni motores de exportación.
============================================================================= */
const V75_BLUE='#001F73';
const V75_INSERT_GROUPS=[
  {label:'Contenido',items:[['text','T','Texto premium'],['heading','H','Subtítulo']]},
  {label:'Datos y visualización',items:[['table','▦','Tabla'],['chart','▥','Gráfica'],['kpi','K','KPI']]},
  {label:'Evidencia y soporte',items:[['callout','!','Nota'],['citation','“','Cita'],['references','R','Referencias'],['image','▧','Imagen']]},
  {label:'Estructura',items:[['list','≡','Lista'],['diagram','◇','Diagrama'],['pagebreak','↵','Salto de página']]}
];
let v75ActiveTarget={i:0,j:-1};
let v75DrawerPath=null;
let v75OpenBlockKey=null;
let v75RenderLock=false;

function v75WordPanel(){return document.querySelector('[data-panel="word"]')}
function v75WordModeActive(){const p=v75WordPanel();return !!p&&!p.classList.contains('hidden')&&getComputedStyle(p).display!=='none'}
function v75TargetLabel(){const item=getWordItem(v75ActiveTarget.i,v75ActiveTarget.j);if(!item)return 'Sección activa';return String(item.t||item.title||`Sección ${v75ActiveTarget.i+1}`).slice(0,32)}
function v75SetActiveTarget(i,j=-1){
  if(!getWordItem(i,j))return;
  v75ActiveTarget={i:Number(i),j:Number(j)};
  const tag=document.getElementById('v75ActiveTarget');if(tag)tag.textContent=v75TargetLabel();
}
function v75PathTarget(path){const a=String(path||'').split(':').map(Number);if(Number.isFinite(a[0]))v75SetActiveTarget(a[0],Number.isFinite(a[1])?a[1]:-1)}

/* Inserción: en vez de 11 botones repetidos, un único acceso contextual. */
wordBlockToolbar=function(i,j){
  return `<div class="word-block-toolbar v75-compact-insert" data-v75-target="${i}:${j}"><span>Agregar contenido en esta ${Number(j)>=0?'subsección':'sección'}</span><button type="button" data-v75-open-insert="${i}:${j}">＋ Insertar bloque</button></div>`;
};

/* El bloque Diagrama se resume en el panel; el constructor completo vive flotante. */
const v75BaseWordBlockEditorHtml=wordBlockEditorHtml;
wordBlockEditorHtml=function(b,i,j,k){
  if(b?.type!=='diagram')return v75BaseWordBlockEditorHtml(b,i,j,k);
  const path=`${i}:${j}:${k}`;const count=Array.isArray(b.nodes)?b.nodes.length:0;
  const typeLabel=b.diagramType==='concept'?'Mapa conceptual':'Flujograma';
  const orientation=b.diagramType==='flow'?(b.orientation==='horizontal'?'Horizontal inteligente':'Vertical'):'Relacional';
  return `<div class="word-block-editor v75-diagram-summary" data-v75-diagram-summary="${path}">
    ${blockEditorHeader('Diagrama interactivo',i,j,k)}
    <div class="v75-diagram-summary-body">
      <div class="v75-diagram-summary-top"><label>Título<input data-v75-summary-title="${path}" value="${esc(b.title||'Diagrama')}"></label><label>Tipo<select data-v75-summary-type="${path}"><option value="flow" ${b.diagramType==='flow'?'selected':''}>Flujograma</option><option value="concept" ${b.diagramType==='concept'?'selected':''}>Mapa conceptual</option></select></label></div>
      <div class="v75-diagram-summary-meta"><span class="v75-chip blue">${typeLabel}</span><span class="v75-chip">${count} ${b.diagramType==='concept'?'conceptos':'nodos'}</span><span class="v75-chip">${orientation}</span></div>
      <button type="button" class="v75-open-diagram" data-v75-open-diagram="${path}">Abrir constructor visual</button>
    </div>
  </div>`;
};

function v75InsertMenuHtml(){
  return `<div class="v75-insert-menu-head"><strong>Insertar bloque</strong><span id="v75InsertTargetLabel">${esc(v75TargetLabel())}</span></div>${V75_INSERT_GROUPS.map(g=>`<div class="v75-insert-section"><span>${g.label}</span><div class="v75-insert-grid">${g.items.map(([type,icon,label])=>`<button type="button" data-v75-insert-type="${type}"><b>${icon}</b>${label}</button>`).join('')}</div></div>`).join('')}`;
}
function v75EnsureShell(){
  const toolbar=document.querySelector('.topbar .toolbar');
  if(toolbar&&!document.getElementById('wordImmersiveTools')){
    const group=document.createElement('div');group.id='wordImmersiveTools';group.className='v75-toolbar-group';
    group.innerHTML=`<span id="v75ActiveTarget" class="v75-active-target">${esc(v75TargetLabel())}</span><button type="button" id="v75InsertBtn" class="v75-toolbar-btn primary-tool">＋ Insertar</button><button type="button" id="v75PanelBtn" class="v75-toolbar-btn">Panel</button><button type="button" id="v75FocusBtn" class="v75-toolbar-btn">Enfoque</button>`;
    toolbar.insertBefore(group,toolbar.firstChild);
  }
  if(!document.getElementById('v75InsertMenu')){
    const menu=document.createElement('div');menu.id='v75InsertMenu';menu.className='v75-insert-menu';menu.innerHTML=v75InsertMenuHtml();document.body.appendChild(menu);
  }
  if(!document.getElementById('wordContextDrawer')){
    const drawer=document.createElement('aside');drawer.id='wordContextDrawer';drawer.className='v75-context-drawer';
    drawer.innerHTML=`<div class="v75-context-head"><div class="v75-context-title"><small>Inspector contextual</small><strong id="v75ContextTitle">Diagrama</strong></div><div class="v75-context-actions"><button type="button" id="v75ContextMin" title="Minimizar">—</button><button type="button" id="v75ContextClose" title="Cerrar">×</button></div></div><div id="v75ContextBody" class="v75-context-body"></div>`;
    document.body.appendChild(drawer);
  }
  v75BindShellOnce();
}
function v75BindShellOnce(){
  if(document.body.dataset.v75ShellBound==='1')return;document.body.dataset.v75ShellBound='1';
  document.addEventListener('click',e=>{
    const menu=document.getElementById('v75InsertMenu'),btn=document.getElementById('v75InsertBtn');
    if(menu?.classList.contains('open')&&!menu.contains(e.target)&&e.target!==btn)menu.classList.remove('open');
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('v75InsertMenu')?.classList.remove('open');if(document.getElementById('wordContextDrawer')?.classList.contains('open'))v75CloseDrawer()}});
}
function v75PositionInsertMenu(){
  const btn=document.getElementById('v75InsertBtn'),menu=document.getElementById('v75InsertMenu');if(!btn||!menu)return;
  const r=btn.getBoundingClientRect(),w=340;menu.style.top=`${Math.min(window.innerHeight-20,r.bottom+8)}px`;menu.style.left=`${Math.max(10,Math.min(window.innerWidth-w-10,r.right-w))}px`;
}
function v75OpenInsertMenu(target=null){
  if(target){const [i,j]=String(target).split(':').map(Number);v75SetActiveTarget(i,j)}
  const menu=document.getElementById('v75InsertMenu');if(!menu)return;
  const lab=document.getElementById('v75InsertTargetLabel');if(lab)lab.textContent=v75TargetLabel();v75PositionInsertMenu();menu.classList.add('open');
}
function v75TogglePanel(){
  document.body.classList.toggle('v75-panel-hidden');document.body.classList.remove('v75-focus-mode');v75UpdateToolbarState();
}
function v75ToggleFocus(){
  document.body.classList.toggle('v75-focus-mode');document.body.classList.remove('v75-panel-hidden');v75UpdateToolbarState();
}
function v75UpdateToolbarState(){
  document.getElementById('v75PanelBtn')?.classList.toggle('active',document.body.classList.contains('v75-panel-hidden'));
  document.getElementById('v75FocusBtn')?.classList.toggle('active',document.body.classList.contains('v75-focus-mode'));
}

function v75DiagramDrawerHtml(b,path){
  if(!b)return '<div class="word-diagram-empty">No se encontró el diagrama.</div>';
  const config=`<div class="v75-context-toolbar"><label><span>Título</span><input data-v75-drawer-title="${path}" value="${esc(b.title||'Diagrama')}"></label><label><span>Tipo</span><select data-v75-drawer-type="${path}"><option value="flow" ${b.diagramType==='flow'?'selected':''}>Flujograma</option><option value="concept" ${b.diagramType==='concept'?'selected':''}>Mapa conceptual</option></select></label>${b.diagramType==='flow'?`<label><span>Orientación</span><select data-v75-drawer-orientation="${path}"><option value="vertical" ${b.orientation==='vertical'?'selected':''}>Vertical</option><option value="horizontal" ${b.orientation==='horizontal'?'selected':''}>Horizontal inteligente</option></select></label>`:''}</div>`;
  const builder=b.diagramType==='concept'?v74ConceptBuilderHtml(b,path):v74FlowBuilderHtml(b,path);
  return `${config}${builder}<label style="display:block;margin-top:9px">Pie / fuente<input data-v75-drawer-caption="${path}" value="${esc(b.caption||'')}"></label>`;
}
function v75OpenDrawer(path){
  const b=v75Block(path);if(!b||b.type!=='diagram')return;v75DrawerPath=path;v75PathTarget(path);
  const drawer=document.getElementById('wordContextDrawer');if(!drawer)return;drawer.classList.add('open');drawer.classList.remove('minimized');v75RefreshDrawer();
}
function v75CloseDrawer(){v75DrawerPath=null;const d=document.getElementById('wordContextDrawer');d?.classList.remove('open','minimized')}
function v75RefreshDrawer(){
  if(!v75DrawerPath)return;const b=v75Block(v75DrawerPath),body=document.getElementById('v75ContextBody'),title=document.getElementById('v75ContextTitle');if(!b||!body){v75CloseDrawer();return}
  if(title)title.textContent=b.diagramType==='concept'?'Mapa conceptual':'Flujograma';
  body.innerHTML=v75DiagramDrawerHtml(b,v75DrawerPath);
  /* Reutiliza el motor de eventos V74 dentro del inspector, no duplica lógica de negocio. */
  v75BaseBindWordBlockEditors(body);v75BindDrawerControls(body);v75SelectDrawerCards(body);
}
function v75BindDrawerControls(body){
  body.querySelectorAll('[data-v75-drawer-title]').forEach(el=>el.oninput=e=>{const b=v75Block(e.target.dataset.v75DrawerTitle);if(!b)return;b.title=e.target.value;renderWordOnly();const s=document.querySelector(`[data-v75-summary-title="${e.target.dataset.v75DrawerTitle}"]`);if(s)s.value=e.target.value});
  body.querySelectorAll('[data-v75-drawer-caption]').forEach(el=>el.oninput=e=>{const b=v75Block(e.target.dataset.v75DrawerCaption);if(!b)return;b.caption=e.target.value;renderWordOnly()});
  body.querySelectorAll('[data-v75-drawer-orientation]').forEach(el=>el.onchange=e=>{const b=v75Block(e.target.dataset.v75DrawerOrientation);if(!b)return;b.orientation=e.target.value;renderWordOnly()});
  body.querySelectorAll('[data-v75-drawer-type]').forEach(el=>el.onchange=e=>{const b=v75Block(e.target.dataset.v75DrawerType);if(!b)return;v74SwitchDiagramType(b,e.target.value);render();});
}
function v75SelectDrawerCards(body){
  body.querySelectorAll('.word-diagram-card').forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('button,input,select'))return;body.querySelectorAll('.word-diagram-card.v75-selected').forEach(x=>x.classList.remove('v75-selected'));card.classList.add('v75-selected')}));
}

/* Binding general: integra barra, resumen de diagramas y contexto activo. */
const v75BaseBindWordBlockEditors=bindWordBlockEditors;
bindWordBlockEditors=function(box){
  v75BaseBindWordBlockEditors(box);
  box.querySelectorAll('[data-v75-open-insert]').forEach(btn=>btn.onclick=()=>v75OpenInsertMenu(btn.dataset.v75OpenInsert));
  box.querySelectorAll('[data-v75-open-diagram]').forEach(btn=>btn.onclick=()=>v75OpenDrawer(btn.dataset.v75OpenDiagram));
  box.querySelectorAll('[data-v75-summary-title]').forEach(el=>el.oninput=e=>{const b=v75Block(e.target.dataset.v75SummaryTitle);if(!b)return;b.title=e.target.value;renderWordOnly()});
  box.querySelectorAll('[data-v75-summary-type]').forEach(el=>el.onchange=e=>{const b=v75Block(e.target.dataset.v75SummaryType);if(!b)return;v74SwitchDiagramType(b,e.target.value);render()});
  box.querySelectorAll('[data-v75-target]').forEach(el=>el.addEventListener('click',()=>{const [i,j]=el.dataset.v75Target.split(':').map(Number);v75SetActiveTarget(i,j)}));
  box.querySelectorAll('.word-block-editor').forEach(card=>card.addEventListener('click',()=>{const any=card.querySelector('[data-wb-path],[data-v75-open-diagram]');const path=any?.dataset.wbPath||any?.dataset.v75OpenDiagram;if(path)v75PathTarget(path)}));
};

function v75BindTopbar(){
  const insert=document.getElementById('v75InsertBtn'),panel=document.getElementById('v75PanelBtn'),focus=document.getElementById('v75FocusBtn'),menu=document.getElementById('v75InsertMenu');
  if(insert&&!insert.dataset.v75Bound){insert.dataset.v75Bound='1';insert.onclick=e=>{e.stopPropagation();if(menu?.classList.contains('open'))menu.classList.remove('open');else v75OpenInsertMenu()}}
  if(panel&&!panel.dataset.v75Bound){panel.dataset.v75Bound='1';panel.onclick=v75TogglePanel}
  if(focus&&!focus.dataset.v75Bound){focus.dataset.v75Bound='1';focus.onclick=v75ToggleFocus}
  menu?.querySelectorAll('[data-v75-insert-type]').forEach(btn=>{if(btn.dataset.v75Bound)return;btn.dataset.v75Bound='1';btn.onclick=()=>{const item=getWordItem(v75ActiveTarget.i,v75ActiveTarget.j);if(!item)return;addWordBlock(v75ActiveTarget.i,v75ActiveTarget.j,btn.dataset.v75InsertType);menu.classList.remove('open')}});
  const min=document.getElementById('v75ContextMin'),close=document.getElementById('v75ContextClose');
  if(min&&!min.dataset.v75Bound){min.dataset.v75Bound='1';min.onclick=()=>document.getElementById('wordContextDrawer')?.classList.toggle('minimized')}
  if(close&&!close.dataset.v75Bound){close.dataset.v75Bound='1';close.onclick=v75CloseDrawer}
}

function v75BlockKey(card,index){
  const el=card.querySelector('[data-wb-path],[data-wb-list-items],[data-rich-editor]');
  return el?.dataset.wbPath||el?.dataset.wbListItems||el?.dataset.richEditor||`block-${index}`;
}
function v75EnhanceAccordions(){
  const box=document.getElementById('wordSectionEditor');if(!box)return;
  [...box.querySelectorAll('.word-block-editor:not(.v75-diagram-summary):not(.word-heavy-card)')].forEach((card,index)=>{
    if(card.classList.contains('v75-collapsible'))return;const head=card.querySelector(':scope > .word-block-editor-head');if(!head)return;
    const key=v75BlockKey(card,index),content=document.createElement('div');content.className='v75-editor-content';
    [...card.childNodes].filter(n=>n!==head).forEach(n=>content.appendChild(n));card.appendChild(content);card.classList.add('v75-collapsible');if(v75OpenBlockKey===key)card.classList.add('v75-open');
    head.addEventListener('click',e=>{if(e.target.closest('button'))return;const opening=!card.classList.contains('v75-open');box.querySelectorAll('.word-block-editor.v75-open').forEach(x=>x.classList.remove('v75-open'));card.classList.toggle('v75-open',opening);v75OpenBlockKey=opening?key:null});
    head.querySelectorAll('button').forEach(b=>b.addEventListener('click',e=>e.stopPropagation()));
  });
}
function v75SyncMode(){
  const active=v75WordModeActive();document.body.classList.toggle('v75-word-active',active);const tools=document.getElementById('wordImmersiveTools');if(tools)tools.style.display=active?'flex':'none';if(!active){document.getElementById('v75InsertMenu')?.classList.remove('open');v75CloseDrawer()}
}
function v75AfterRender(){
  if(v75RenderLock)return;v75RenderLock=true;requestAnimationFrame(()=>{try{v75EnsureShell();v75BindTopbar();v75SyncMode();if(v75WordModeActive())v75EnhanceAccordions();if(v75DrawerPath)v75RefreshDrawer();v75UpdateToolbarState()}finally{v75RenderLock=false}})
}

const v75BaseRender=render;
render=function(){v75BaseRender();v75AfterRender()};

/* Primera activación sobre el DOM ya existente. */
v75EnsureShell();v75BindTopbar();v75SyncMode();render();