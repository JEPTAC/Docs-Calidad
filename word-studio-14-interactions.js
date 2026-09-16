/* ===== V76 · Interacciones robustas ========================================
   Delegación de eventos: los controles sobreviven a cualquier re-render.
   No modifica la plantilla SGC ni el modelo documental.
============================================================================= */
const V76_BLUE='#001F73';

function v76OwnEvent(e,fn){
  e.preventDefault();
  e.stopImmediatePropagation();
  try{fn()}catch(err){console.error('[Word Studio V76]',err)}
}
function v76EnsureReady(){
  if(typeof v75EnsureShell==='function')v75EnsureShell();
  if(typeof v75BindTopbar==='function')v75BindTopbar();
  if(typeof v75SyncMode==='function')v75SyncMode();
  if(typeof v75UpdateToolbarState==='function')v75UpdateToolbarState();
  const insert=document.getElementById('v75InsertBtn');if(insert)insert.title='Insertar contenido en la sección activa';
  const panel=document.getElementById('v75PanelBtn');if(panel)panel.title='Mostrar u ocultar el panel lateral';
  const focus=document.getElementById('v75FocusBtn');if(focus)focus.title='Modo enfoque para trabajar sobre el documento';
}
function v76OpenInsertStable(target=null){
  v76EnsureReady();
  if(target&&typeof v75PathTarget==='function')v75PathTarget(target);
  const open=()=>{
    const menu=document.getElementById('v75InsertMenu');if(!menu)return;
    const lab=document.getElementById('v75InsertTargetLabel');
    if(lab&&typeof v75TargetLabel==='function')lab.textContent=v75TargetLabel();
    if(typeof v75PositionInsertMenu==='function')v75PositionInsertMenu();
    menu.classList.add('open');
  };
  /* Se abre al finalizar el clic actual para no competir con el listener heredado
     que cierra la paleta cuando detecta un clic fuera de ella. */
  setTimeout(open,0);
}

function v76HandleClick(e){
  const t=e.target instanceof Element?e.target:null;if(!t)return;

  const localInsert=t.closest('[data-v75-open-insert]');
  if(localInsert)return v76OwnEvent(e,()=>v76OpenInsertStable(localInsert.dataset.v75OpenInsert));

  const openDiagram=t.closest('[data-v75-open-diagram]');
  if(openDiagram)return v76OwnEvent(e,()=>{
    v76EnsureReady();
    const path=openDiagram.dataset.v75OpenDiagram;
    if(typeof v75OpenDrawer==='function')v75OpenDrawer(path);
  });

  const insertTop=t.closest('#v75InsertBtn');
  if(insertTop)return v76OwnEvent(e,()=>{
    v76EnsureReady();
    const menu=document.getElementById('v75InsertMenu');
    if(menu?.classList.contains('open'))menu.classList.remove('open');
    else v76OpenInsertStable();
  });

  const insertType=t.closest('[data-v75-insert-type]');
  if(insertType)return v76OwnEvent(e,()=>{
    const type=insertType.dataset.v75InsertType;
    const target=(typeof v75ActiveTarget==='object'&&v75ActiveTarget)?v75ActiveTarget:{i:0,j:-1};
    const item=typeof getWordItem==='function'?getWordItem(target.i,target.j):null;
    if(!item)return;
    if(typeof addWordBlock==='function')addWordBlock(target.i,target.j,type);
    document.getElementById('v75InsertMenu')?.classList.remove('open');
  });

  const panel=t.closest('#v75PanelBtn');
  if(panel)return v76OwnEvent(e,()=>{if(typeof v75TogglePanel==='function')v75TogglePanel()});
  const focus=t.closest('#v75FocusBtn');
  if(focus)return v76OwnEvent(e,()=>{if(typeof v75ToggleFocus==='function')v75ToggleFocus()});
  const close=t.closest('#v75ContextClose');
  if(close)return v76OwnEvent(e,()=>{if(typeof v75CloseDrawer==='function')v75CloseDrawer()});
  const min=t.closest('#v75ContextMin');
  if(min)return v76OwnEvent(e,()=>document.getElementById('wordContextDrawer')?.classList.toggle('minimized'));
}

function v76HandleInput(e){
  const t=e.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))return;
  if(t.matches('[data-v75-summary-title]')){
    const b=typeof v75Block==='function'?v75Block(t.dataset.v75SummaryTitle):null;if(!b)return;b.title=t.value;if(typeof renderWordOnly==='function')renderWordOnly();
  }
  if(t.matches('[data-v75-drawer-title]')){
    const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerTitle):null;if(!b)return;b.title=t.value;if(typeof renderWordOnly==='function')renderWordOnly();
  }
  if(t.matches('[data-v75-drawer-caption]')){
    const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerCaption):null;if(!b)return;b.caption=t.value;if(typeof renderWordOnly==='function')renderWordOnly();
  }
}

function v76HandleChange(e){
  const t=e.target;if(!(t instanceof HTMLSelectElement))return;
  if(t.matches('[data-v75-summary-type]')){
    const b=typeof v75Block==='function'?v75Block(t.dataset.v75SummaryType):null;if(!b)return;if(typeof v74SwitchDiagramType==='function')v74SwitchDiagramType(b,t.value);if(typeof render==='function')render();
  }
  if(t.matches('[data-v75-drawer-type]')){
    const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerType):null;if(!b)return;if(typeof v74SwitchDiagramType==='function')v74SwitchDiagramType(b,t.value);if(typeof render==='function')render();
  }
  if(t.matches('[data-v75-drawer-orientation]')){
    const b=typeof v75Block==='function'?v75Block(t.dataset.v75DrawerOrientation):null;if(!b)return;b.orientation=t.value;if(typeof renderWordOnly==='function')renderWordOnly();
  }
}

if(document.body.dataset.v76Delegated!=='1'){
  document.body.dataset.v76Delegated='1';
  document.addEventListener('click',v76HandleClick,true);
  document.addEventListener('input',v76HandleInput,true);
  document.addEventListener('change',v76HandleChange,true);
}

function v76Bootstrap(){
  v76EnsureReady();
  if(typeof v75AfterRender==='function')v75AfterRender();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v76Bootstrap,{once:true});else queueMicrotask(v76Bootstrap);
window.V76_INTERACTIONS_READY=true;
