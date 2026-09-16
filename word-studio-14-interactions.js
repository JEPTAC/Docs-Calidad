/* ===== V76 · Interacciones robustas ========================================
   Delegación de eventos: los controles sobreviven a cualquier re-render.
   Paleta de inserción propia, aislada de los listeners heredados V75.
============================================================================= */
const V76_BLUE='#001F73';
const V76_INSERT_GROUPS=[
  ['Contenido',[['text','Texto premium'],['heading','Subtítulo'],['list','Lista'],['callout','Nota']]],
  ['Datos',[['table','Tabla'],['chart','Gráfica'],['kpi','KPI'],['diagram','Diagrama']]],
  ['Soporte',[['image','Imagen'],['citation','Cita'],['references','Referencias'],['pagebreak','Salto de página']]]
];
let v76InsertTarget={i:0,j:-1};

function v76OwnEvent(e,fn){
  e.preventDefault();e.stopImmediatePropagation();
  try{fn()}catch(err){window.V76_LAST_ERROR=String(err?.stack||err);console.error('[Word Studio V76]',err)}
}
function v76TargetFromString(value){const [i,j]=String(value||'0:-1').split(':').map(Number);return {i:Number.isFinite(i)?i:0,j:Number.isFinite(j)?j:-1}}
function v76EnsureInsertPalette(){
  let pop=document.getElementById('v76InsertPopover');if(pop)return pop;
  pop=document.createElement('div');pop.id='v76InsertPopover';pop.className='v76-insert-popover';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Insertar contenido');
  pop.innerHTML=`<div class="v76-insert-head"><div><strong>Insertar contenido</strong><small id="v76InsertTargetLabel">Sección activa</small></div><button type="button" data-v76-close-insert aria-label="Cerrar">×</button></div><div class="v76-insert-groups">${V76_INSERT_GROUPS.map(([title,items])=>`<section><span>${title}</span><div>${items.map(([type,label])=>`<button type="button" data-v76-insert-type="${type}">${label}</button>`).join('')}</div></section>`).join('')}</div>`;
  document.body.appendChild(pop);return pop;
}
function v76TargetLabel(){
  const item=typeof getWordItem==='function'?getWordItem(v76InsertTarget.i,v76InsertTarget.j):null;
  return String(item?.t||item?.title||`Sección ${v76InsertTarget.i+1}`).slice(0,40);
}
function v76PositionPopover(anchor,pop){
  const r=anchor?.getBoundingClientRect?.();if(!r)return;
  const w=Math.min(360,window.innerWidth-20);pop.style.width=`${w}px`;
  const left=Math.max(10,Math.min(window.innerWidth-w-10,r.left));
  const estimated=330;let top=r.bottom+8;if(top+estimated>window.innerHeight-10)top=Math.max(10,r.top-estimated-8);
  pop.style.left=`${left}px`;pop.style.top=`${top}px`;
}
function v76OpenInsert(anchor,target=null){
  const pop=v76EnsureInsertPalette();
  if(target)v76InsertTarget=v76TargetFromString(target);
  else if(typeof v75ActiveTarget==='object'&&v75ActiveTarget)v76InsertTarget={i:Number(v75ActiveTarget.i)||0,j:Number.isFinite(Number(v75ActiveTarget.j))?Number(v75ActiveTarget.j):-1};
  const lab=document.getElementById('v76InsertTargetLabel');if(lab)lab.textContent=v76TargetLabel();
  v76PositionPopover(anchor,pop);pop.classList.add('open');window.V76_LAST_ACTION='insert-open';
}
function v76CloseInsert(){document.getElementById('v76InsertPopover')?.classList.remove('open')}
function v76EnsureReady(){
  if(typeof v75EnsureShell==='function')v75EnsureShell();
  if(typeof v75SyncMode==='function')v75SyncMode();
  if(typeof v75UpdateToolbarState==='function')v75UpdateToolbarState();
  v76EnsureInsertPalette();
  const insert=document.getElementById('v75InsertBtn');if(insert)insert.title='Insertar contenido en la sección activa';
  const panel=document.getElementById('v75PanelBtn');if(panel)panel.title='Mostrar u ocultar el panel lateral';
  const focus=document.getElementById('v75FocusBtn');if(focus)focus.title='Modo enfoque para trabajar sobre el documento';
}

function v76HandleClick(e){
  const t=e.target instanceof Element?e.target:null;if(!t)return;

  const localInsert=t.closest('[data-v75-open-insert]');
  if(localInsert)return v76OwnEvent(e,()=>v76OpenInsert(localInsert,localInsert.dataset.v75OpenInsert));

  const topInsert=t.closest('#v75InsertBtn');
  if(topInsert)return v76OwnEvent(e,()=>{
    const pop=v76EnsureInsertPalette();pop.classList.contains('open')?v76CloseInsert():v76OpenInsert(topInsert);
  });

  const insertType=t.closest('[data-v76-insert-type]');
  if(insertType)return v76OwnEvent(e,()=>{
    const item=typeof getWordItem==='function'?getWordItem(v76InsertTarget.i,v76InsertTarget.j):null;if(!item)return;
    if(typeof addWordBlock==='function')addWordBlock(v76InsertTarget.i,v76InsertTarget.j,insertType.dataset.v76InsertType);
    v76CloseInsert();window.V76_LAST_ACTION=`insert-${insertType.dataset.v76InsertType}`;
  });
  if(t.closest('[data-v76-close-insert]'))return v76OwnEvent(e,v76CloseInsert);

  const openDiagram=t.closest('[data-v75-open-diagram]');
  if(openDiagram)return v76OwnEvent(e,()=>{
    v76EnsureReady();const path=openDiagram.dataset.v75OpenDiagram;
    if(typeof v75OpenDrawer==='function'){v75OpenDrawer(path);window.V76_LAST_ACTION='diagram-open'}
  });

  const panel=t.closest('#v75PanelBtn');
  if(panel)return v76OwnEvent(e,()=>{if(typeof v75TogglePanel==='function'){v75TogglePanel();window.V76_LAST_ACTION='panel-toggle'}});
  const focus=t.closest('#v75FocusBtn');
  if(focus)return v76OwnEvent(e,()=>{if(typeof v75ToggleFocus==='function'){v75ToggleFocus();window.V76_LAST_ACTION='focus-toggle'}});
  const close=t.closest('#v75ContextClose');
  if(close)return v76OwnEvent(e,()=>{if(typeof v75CloseDrawer==='function')v75CloseDrawer()});
  const min=t.closest('#v75ContextMin');
  if(min)return v76OwnEvent(e,()=>document.getElementById('wordContextDrawer')?.classList.toggle('minimized'));

  const pop=document.getElementById('v76InsertPopover');if(pop?.classList.contains('open')&&!pop.contains(t))v76CloseInsert();
}

function v76HandleInput(e){
  const t=e.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))return;
  if(t.matches('[data-v75-summary-title]')){const b=typeof v75Block==='function'?v75Block(t.dataset.v75SummaryTitle):null;if(!b)return;b.title=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}
  if(t.matches('[data-v75-drawer-title]')){const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerTitle):null;if(!b)return;b.title=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}
  if(t.matches('[data-v75-drawer-caption]')){const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerCaption):null;if(!b)return;b.caption=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}
}
function v76HandleChange(e){
  const t=e.target;if(!(t instanceof HTMLSelectElement))return;
  if(t.matches('[data-v75-summary-type]')){const b=typeof v75Block==='function'?v75Block(t.dataset.v75SummaryType):null;if(!b)return;if(typeof v74SwitchDiagramType==='function')v74SwitchDiagramType(b,t.value);if(typeof render==='function')render()}
  if(t.matches('[data-v75-drawer-type]')){const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerType):null;if(!b)return;if(typeof v74SwitchDiagramType==='function')v74SwitchDiagramType(b,t.value);if(typeof render==='function')render()}
  if(t.matches('[data-v75-drawer-orientation]')){const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerOrientation):null;if(!b)return;b.orientation=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}
}
if(document.body.dataset.v76Delegated!=='1'){
  document.body.dataset.v76Delegated='1';document.addEventListener('click',v76HandleClick,true);document.addEventListener('input',v76HandleInput,true);document.addEventListener('change',v76HandleChange,true);
}
function v76Bootstrap(){v76EnsureReady();if(typeof v75AfterRender==='function')v75AfterRender()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v76Bootstrap,{once:true});else queueMicrotask(v76Bootstrap);
window.V76_INTERACTIONS_READY=true;window.V76_LAST_ACTION='ready';window.V76_LAST_ERROR='';
