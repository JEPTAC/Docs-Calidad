/* ===== V87 · Interacciones robustas + accesos de edición ===================
   - Delegación de eventos: los controles sobreviven a cualquier re-render.
   - La inserción general permite escoger ubicación exacta.
   - El Estudio de Diseño tiene acceso directo visible y apertura inmediata.
   - Mantiene compatibilidad con el inspector contextual V75/V76.
============================================================================= */
const V76_BLUE='#001F73';
const V76_INSERT_GROUPS=[
  ['Contenido',[['text','Texto premium'],['heading','Subtítulo'],['list','Lista'],['callout','Nota']]],
  ['Diseño visual',[['design','✦ Diseño libre'],['diagram','Diagrama'],['chart','Gráfica']]],
  ['Datos',[['table','Tabla'],['kpi','KPI']]],
  ['Soporte',[['image','Imagen'],['citation','Cita'],['references','Referencias'],['pagebreak','Salto de página']]]
];
let v76InsertTarget=null;
function v76ResolveBlock(path){
  const a=String(path||'').split(':').map(Number);
  const i=Number.isFinite(a[0])?a[0]:0,j=Number.isFinite(a[1])?a[1]:-1,k=Number.isFinite(a[2])?a[2]:-1;
  if(k<0||typeof getWordItem!=='function')return null;
  return getWordItem(i,j)?.blocks?.[k]||null;
}
if(typeof globalThis.v75Block!=='function')globalThis.v75Block=v76ResolveBlock;
function v76OwnEvent(e,fn){e.preventDefault();e.stopImmediatePropagation();try{fn()}catch(err){window.V76_LAST_ERROR=String(err?.stack||err);console.error('[Word Studio V87]',err)}}
function v76EscHtml(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function v76TargetFromString(value){if(!value)return null;const [i,j]=String(value).split(':').map(Number);if(!Number.isFinite(i))return null;return {i,j:Number.isFinite(j)?j:-1}}
function v76TargetValue(){return v76InsertTarget?`${v76InsertTarget.i}:${v76InsertTarget.j}`:''}
function v87ActiveTarget(){
  try{if(typeof v75ActiveTarget!=='undefined'&&Number.isFinite(Number(v75ActiveTarget?.i))){const t={i:Number(v75ActiveTarget.i),j:Number.isFinite(Number(v75ActiveTarget.j))?Number(v75ActiveTarget.j):-1};if(typeof getWordItem==='function'&&getWordItem(t.i,t.j))return t}}catch{}
  if(typeof doc!=='undefined'&&Array.isArray(doc?.sections)&&doc.sections.length)return{i:0,j:-1};
  return null;
}
function v76LocationOptions(){
  const sections=(typeof doc!=='undefined'&&Array.isArray(doc?.sections))?doc.sections:[];
  let out='<option value="">Elige dónde insertar…</option>';
  sections.forEach((s,i)=>{
    const secNo=String(s?.n??(i+1));
    const secTitle=String(s?.t||s?.title||`Sección ${i+1}`);
    out+=`<option value="${i}:-1">${v76EscHtml(secNo)} · ${v76EscHtml(secTitle)}</option>`;
    (Array.isArray(s?.sub)?s.sub:[]).forEach((ss,j)=>{
      const subNo=String(ss?.n||`${secNo}.${j+1}`);
      const subTitle=String(ss?.t||ss?.title||`Subtítulo ${j+1}`);
      out+=`<option value="${i}:${j}">↳ ${v76EscHtml(subNo)} · ${v76EscHtml(subTitle)}</option>`;
    });
  });
  return out;
}
function v76EnsureInsertPalette(){
  let pop=document.getElementById('v76InsertPopover');
  if(!pop){
    pop=document.createElement('div');pop.id='v76InsertPopover';pop.className='v76-insert-popover';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Insertar contenido');
    pop.innerHTML=`<div class="v76-insert-head"><div><strong>Insertar contenido</strong><small>Elige primero la ubicación exacta</small></div><button type="button" data-v76-close-insert aria-label="Cerrar">×</button></div><div class="v76-insert-location"><label for="v76InsertLocation">¿Dónde quieres insertarlo?</label><select id="v76InsertLocation" data-v76-insert-location></select><small>El bloque se agregará dentro de la sección o subtítulo elegido, después del contenido que ya exista allí.</small></div><div class="v76-insert-groups">${V76_INSERT_GROUPS.map(([title,items])=>`<section><span>${title}</span><div>${items.map(([type,label])=>`<button type="button" data-v76-insert-type="${type}" ${type==='design'?'style="background:#EAC800;color:#001F73;font-weight:800;border-color:#EAC800"':''} disabled>${label}</button>`).join('')}</div></section>`).join('')}</div>`;
    document.body.appendChild(pop);
  }
  const select=pop.querySelector('[data-v76-insert-location]');if(select){select.innerHTML=v76LocationOptions();select.value=v76TargetValue()}
  v76SyncInsertState(pop);return pop;
}
function v76TargetLabel(){if(!v76InsertTarget)return 'Ubicación pendiente';const item=typeof getWordItem==='function'?getWordItem(v76InsertTarget.i,v76InsertTarget.j):null;return String(item?.t||item?.title||`Sección ${v76InsertTarget.i+1}`).slice(0,52)}
function v76SyncInsertState(pop=document.getElementById('v76InsertPopover')){if(!pop)return;const valid=!!(v76InsertTarget&&typeof getWordItem==='function'&&getWordItem(v76InsertTarget.i,v76InsertTarget.j));pop.querySelectorAll('[data-v76-insert-type]').forEach(btn=>{btn.disabled=!valid;btn.setAttribute('aria-disabled',String(!valid))});pop.classList.toggle('has-target',valid)}
function v76PositionPopover(anchor,pop){const r=anchor?.getBoundingClientRect?.();if(!r)return;const w=Math.min(410,window.innerWidth-20);pop.style.width=`${w}px`;const left=Math.max(10,Math.min(window.innerWidth-w-10,r.left));const estimated=510;let top=r.bottom+8;if(top+estimated>window.innerHeight-10)top=Math.max(10,r.top-estimated-8);pop.style.left=`${left}px`;pop.style.top=`${top}px`}
function v76OpenInsert(anchor,target=null){v76InsertTarget=target?v76TargetFromString(target):null;const pop=v76EnsureInsertPalette();const select=pop.querySelector('[data-v76-insert-location]');if(select)select.value=v76TargetValue();v76SyncInsertState(pop);v76PositionPopover(anchor,pop);pop.classList.add('open');window.V76_LAST_ACTION=target?'insert-open-local':'insert-open-target-required'}
function v76CloseInsert(){document.getElementById('v76InsertPopover')?.classList.remove('open')}
function v87InsertBlock(type,target=v76InsertTarget){
  if(!target||typeof getWordItem!=='function'||!getWordItem(target.i,target.j)||typeof addWordBlock!=='function')return false;
  addWordBlock(target.i,target.j,type);
  window.V76_LAST_ACTION=`insert-${type}`;
  if(type==='design'){
    const blocks=getWordItem(target.i,target.j)?.blocks||[];let k=-1;for(let n=blocks.length-1;n>=0;n--){if(blocks[n]?.type==='design'){k=n;break}}
    if(k>=0)setTimeout(()=>{if(typeof dsOpen==='function')dsOpen(`${target.i}:${target.j}:${k}`)},0);
  }
  return true;
}
function v87EnsureDesignEntry(){
  const group=document.getElementById('wordImmersiveTools');if(!group||document.getElementById('v87DesignBtn'))return;
  const btn=document.createElement('button');btn.type='button';btn.id='v87DesignBtn';btn.className='v75-toolbar-btn';btn.innerHTML='✦ Diseño';btn.title='Abrir el Estudio de Diseño en la sección activa';btn.setAttribute('aria-label','Abrir Estudio de Diseño');btn.style.background='#EAC800';btn.style.color='#001F73';btn.style.fontWeight='800';btn.style.borderColor='#EAC800';
  const panel=document.getElementById('v75PanelBtn');group.insertBefore(btn,panel||null);
}
function v76EnsureReady(){if(typeof v75EnsureShell==='function')v75EnsureShell();if(typeof v75SyncMode==='function')v75SyncMode();if(typeof v75UpdateToolbarState==='function')v75UpdateToolbarState();v87EnsureDesignEntry();v76EnsureInsertPalette();const insert=document.getElementById('v75InsertBtn');if(insert)insert.title='Insertar contenido eligiendo sección o subtítulo';const panel=document.getElementById('v75PanelBtn');if(panel)panel.title='Mostrar u ocultar el panel lateral';const focus=document.getElementById('v75FocusBtn');if(focus)focus.title='Modo enfoque para trabajar sobre el documento'}
function v76HandleClick(e){
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const localInsert=t.closest('[data-v75-open-insert]');if(localInsert)return v76OwnEvent(e,()=>v76OpenInsert(localInsert,localInsert.dataset.v75OpenInsert));
  const designEntry=t.closest('#v87DesignBtn');if(designEntry)return v76OwnEvent(e,()=>{const target=v87ActiveTarget();if(!target){alert('Agregue primero una sección al documento.');return}v76InsertTarget=target;v87InsertBlock('design',target)});
  const topInsert=t.closest('#v75InsertBtn');if(topInsert)return v76OwnEvent(e,()=>{const pop=v76EnsureInsertPalette();pop.classList.contains('open')?v76CloseInsert():v76OpenInsert(topInsert,null)});
  const insertType=t.closest('[data-v76-insert-type]');if(insertType)return v76OwnEvent(e,()=>{if(!v76InsertTarget)return;const type=insertType.dataset.v76InsertType;const target={...v76InsertTarget};if(v87InsertBlock(type,target))v76CloseInsert()});
  if(t.closest('[data-v76-close-insert]'))return v76OwnEvent(e,v76CloseInsert);
  const openDiagram=t.closest('[data-v75-open-diagram]');if(openDiagram)return v76OwnEvent(e,()=>{v76EnsureReady();const path=openDiagram.dataset.v75OpenDiagram;if(typeof v75OpenDrawer==='function'){v75OpenDrawer(path);window.V76_LAST_ACTION='diagram-open'}});
  const panel=t.closest('#v75PanelBtn');if(panel)return v76OwnEvent(e,()=>{if(typeof v75TogglePanel==='function'){v75TogglePanel();window.V76_LAST_ACTION='panel-toggle'}});
  const focus=t.closest('#v75FocusBtn');if(focus)return v76OwnEvent(e,()=>{if(typeof v75ToggleFocus==='function'){v75ToggleFocus();window.V76_LAST_ACTION='focus-toggle'}});
  const close=t.closest('#v75ContextClose');if(close)return v76OwnEvent(e,()=>{if(typeof v75CloseDrawer==='function')v75CloseDrawer()});
  const min=t.closest('#v75ContextMin');if(min)return v76OwnEvent(e,()=>document.getElementById('wordContextDrawer')?.classList.toggle('minimized'));
  const pop=document.getElementById('v76InsertPopover');if(pop?.classList.contains('open')&&!pop.contains(t))v76CloseInsert();
}
function v76HandleInput(e){const t=e.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))return;if(t.matches('[data-v75-summary-title]')){const b=v76ResolveBlock(t.dataset.v75SummaryTitle);if(!b)return;b.title=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}if(t.matches('[data-v75-drawer-title]')){const b=v76ResolveBlock(t.dataset.v75DrawerTitle);if(!b)return;b.title=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}if(t.matches('[data-v75-drawer-caption]')){const b=v76ResolveBlock(t.dataset.v75DrawerCaption);if(!b)return;b.caption=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}}
function v76HandleChange(e){const t=e.target;if(!(t instanceof HTMLSelectElement))return;if(t.matches('[data-v76-insert-location]')){v76InsertTarget=v76TargetFromString(t.value);v76SyncInsertState();window.V76_LAST_ACTION=v76InsertTarget?'insert-target-selected':'insert-target-cleared';return}if(t.matches('[data-v75-summary-type]')){const b=v76ResolveBlock(t.dataset.v75SummaryType);if(!b)return;if(typeof v74SwitchDiagramType==='function')v74SwitchDiagramType(b,t.value);if(typeof render==='function')render()}if(t.matches('[data-v75-drawer-type]')){const b=v76ResolveBlock(t.dataset.v75DrawerType);if(!b)return;if(typeof v74SwitchDiagramType==='function')v74SwitchDiagramType(b,t.value);if(typeof render==='function')render()}if(t.matches('[data-v75-drawer-orientation]')){const b=v76ResolveBlock(t.dataset.v75DrawerOrientation);if(!b)return;b.orientation=t.value;if(typeof renderWordOnly==='function')renderWordOnly()}}
if(document.body.dataset.v76Delegated!=='1'){document.body.dataset.v76Delegated='1';document.addEventListener('click',v76HandleClick,true);document.addEventListener('input',v76HandleInput,true);document.addEventListener('change',v76HandleChange,true)}
function v76Bootstrap(){v76EnsureReady();if(typeof v75AfterRender==='function')v75AfterRender()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v76Bootstrap,{once:true});else queueMicrotask(v76Bootstrap);
window.V76_INTERACTIONS_READY=true;window.V76_LAST_ACTION='ready';window.V76_LAST_ERROR='';window.V77_EXPLICIT_TARGETING=true;window.V87_VISIBLE_DESIGN_ENTRY=true;