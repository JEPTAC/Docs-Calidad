/* ===== Word Studio V89 · Gestor de ventanas ================================
   Ventanas no modales, movibles y redimensionables para edición compleja.
   Mantiene el fondo interactivo y corrige tarjetas compactas saturadas.
============================================================================= */
(()=>{
  const WM_STORAGE='ei.wordStudio.windows.v89';
  const wmObservers=new WeakMap();
  let wmZ=3200;

  function wmClamp(n,min,max){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min}
  function wmLoad(){try{return JSON.parse(localStorage.getItem(WM_STORAGE)||'{}')||{}}catch{return {}}}
  function wmSaveState(key,patch){try{const all=wmLoad();all[key]={...(all[key]||{}),...patch};localStorage.setItem(WM_STORAGE,JSON.stringify(all))}catch{}}
  function wmState(key){return wmLoad()[key]||null}
  function wmViewportRect(){return {w:Math.max(320,window.innerWidth),h:Math.max(320,window.innerHeight)}}
  function wmDefaultRect(kind){
    const v=wmViewportRect();let w=720,h=520;
    if(kind==='heavy:table'){w=760;h=540}
    else if(kind==='heavy:list'){w=650;h=480}
    else if(kind==='heavy:kpi'){w=680;h=500}
    else if(kind==='context:diagram'){w=520;h=560}
    w=Math.min(w,v.w-20);h=Math.min(h,v.h-20);
    return {left:Math.max(10,Math.round((v.w-w)/2)),top:Math.max(72,Math.round((v.h-h)/2)),width:w,height:h};
  }
  function wmNormalizedRect(raw,kind){
    const v=wmViewportRect(),d=wmDefaultRect(kind),minW=v.w<=700?280:(kind==='context:diagram'?360:420),minH=240;
    const width=wmClamp(raw?.width??d.width,minW,Math.max(minW,v.w-20));
    const height=wmClamp(raw?.height??d.height,minH,Math.max(minH,v.h-20));
    const left=wmClamp(raw?.left??d.left,8,Math.max(8,v.w-Math.min(width,180)));
    const top=wmClamp(raw?.top??d.top,54,Math.max(54,v.h-64));
    return {left,top,width,height};
  }
  function wmApplyRect(win,key){const r=wmNormalizedRect(wmState(key),key);Object.assign(win.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`,right:'auto',bottom:'auto'})}
  function wmReadRect(win){const r=win.getBoundingClientRect();return {left:Math.round(r.left),top:Math.round(r.top),width:Math.round(r.width),height:Math.round(r.height)}}
  function wmPersist(win,key){if(!win?.isConnected||win.classList.contains('wm-minimized'))return;wmSaveState(key,wmReadRect(win))}
  function wmBringFront(win){wmZ+=2;const overlay=win.closest?.('.word-heavy-overlay');if(overlay)overlay.style.zIndex=String(wmZ);else win.style.zIndex=String(wmZ)}
  function wmSchedulePersist(win,key){clearTimeout(win._wmSaveTimer);win._wmSaveTimer=setTimeout(()=>wmPersist(win,key),120)}

  function wmBindDrag(win,handle,key){
    if(!win||!handle||handle.dataset.wmDragBound==='1')return;handle.dataset.wmDragBound='1';
    handle.title='Arrastre para mover la ventana';
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0||e.target.closest('button,input,select,textarea,a,label'))return;
      e.preventDefault();wmBringFront(win);
      const start=wmReadRect(win),sx=e.clientX,sy=e.clientY;win.classList.add('wm-dragging');
      const move=ev=>{
        const v=wmViewportRect();const left=wmClamp(start.left+(ev.clientX-sx),8,Math.max(8,v.w-150));const top=wmClamp(start.top+(ev.clientY-sy),54,Math.max(54,v.h-52));
        win.style.left=`${left}px`;win.style.top=`${top}px`;win.style.right='auto';win.style.bottom='auto';
      };
      const up=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);win.classList.remove('wm-dragging');wmPersist(win,key)};
      window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);
    });
    win.addEventListener('pointerdown',()=>wmBringFront(win),true);
  }
  function wmObserveResize(win,key){
    if(wmObservers.has(win)||typeof ResizeObserver==='undefined')return;
    const ro=new ResizeObserver(()=>wmSchedulePersist(win,key));ro.observe(win);wmObservers.set(win,ro);
  }
  function wmDisconnect(win){const ro=win&&wmObservers.get(win);if(ro){ro.disconnect();wmObservers.delete(win)}if(win?._wmSaveTimer)clearTimeout(win._wmSaveTimer)}
  function wmToggleMinimize(win,key,btn){
    if(!win)return;const minimized=!win.classList.contains('wm-minimized');
    if(minimized){const r=wmReadRect(win);win.dataset.wmRestoreHeight=String(r.height);wmPersist(win,key);win.classList.add('wm-minimized');if(btn)btn.textContent='□'}
    else{win.classList.remove('wm-minimized');const h=Number(win.dataset.wmRestoreHeight)||wmDefaultRect(key).height;win.style.height=`${wmClamp(h,240,window.innerHeight-20)}px`;if(btn)btn.textContent='−';wmPersist(win,key)}
  }

  function wmHeavyKey(path){
    try{const {i,j,k}=parseBlockPath(path),b=getWordItem(i,j)?.blocks?.[k];return `heavy:${b?.type||'editor'}`}catch{return 'heavy:editor'}
  }
  function wmPrepareHeavy(path){
    const overlay=document.getElementById('wordHeavyOverlay'),win=overlay?.querySelector('.word-heavy-dialog');if(!overlay||!win)return;
    const key=wmHeavyKey(path);win.classList.add('wm-managed');win.setAttribute('aria-modal','false');win.setAttribute('data-wm-key',key);overlay.setAttribute('data-wm-nonmodal','true');
    wmApplyRect(win,key);wmBringFront(win);
    const head=win.querySelector(':scope > header');if(!head)return;
    const close=head.querySelector('[data-word-heavy-close]');
    if(!head.querySelector('[data-wm-minimize]')){
      const help=document.createElement('span');help.className='wm-window-help';help.textContent='Mover · redimensionar desde la esquina';head.querySelector('div')?.appendChild(help);
      const min=document.createElement('button');min.type='button';min.className='wm-minimize';min.dataset.wmMinimize='1';min.textContent='−';min.title='Minimizar';min.setAttribute('aria-label','Minimizar ventana');min.onclick=e=>{e.preventDefault();e.stopPropagation();wmToggleMinimize(win,key,min)};head.insertBefore(min,close||null);
    }
    wmBindDrag(win,head,key);wmObserveResize(win,key);
  }

  function wmPrepareContext(){
    const win=document.getElementById('wordContextDrawer');if(!win||!win.classList.contains('open'))return;
    const key='context:diagram';win.classList.add('wm-managed');win.setAttribute('data-wm-key',key);wmApplyRect(win,key);wmBringFront(win);
    const head=win.querySelector('.v75-context-head');wmBindDrag(win,head,key);wmObserveResize(win,key);
  }

  /* Tarjeta pesada unificada: evita la repetición visual del título. */
  if(typeof wordHeavyCardHtml==='function'){
    wordHeavyCardHtml=function(b,i,j,k){
      const p=`${i}:${j}:${k}`,label=wordHeavyLabel(b.type),summary=wordHeavySummary(b);
      return `<div class="word-block-editor word-heavy-card" data-word-heavy-card="${p}">${blockEditorHeader(label,i,j,k)}<div class="word-heavy-card-main"><div class="word-heavy-card-copy"><span class="word-heavy-summary">${esc(summary)}</span></div><button type="button" class="primary" data-word-heavy-open="${p}" onclick="openWordHeavyEditor('${p}')">Editar</button></div><p class="hint">Edición en ventana flotante: puede moverla y ajustar su tamaño sin bloquear el documento.</p></div>`;
    };
  }

  if(typeof openWordHeavyEditor==='function'){
    const baseOpen=openWordHeavyEditor;
    openWordHeavyEditor=function(path){baseOpen(path);requestAnimationFrame(()=>wmPrepareHeavy(path))};
  }
  if(typeof closeWordHeavyEditor==='function'){
    const baseClose=closeWordHeavyEditor;
    closeWordHeavyEditor=function(){const win=document.querySelector('#wordHeavyOverlay .word-heavy-dialog');if(win){wmPersist(win,win.dataset.wmKey||'heavy:editor');wmDisconnect(win)}baseClose()};
  }
  if(typeof v75OpenDrawer==='function'){
    const baseDrawer=v75OpenDrawer;
    v75OpenDrawer=function(path){baseDrawer(path);requestAnimationFrame(wmPrepareContext)};
  }
  if(typeof v75CloseDrawer==='function'){
    const baseCloseDrawer=v75CloseDrawer;
    v75CloseDrawer=function(){const win=document.getElementById('wordContextDrawer');if(win?.classList.contains('wm-managed'))wmPersist(win,'context:diagram');baseCloseDrawer()};
  }

  window.addEventListener('resize',()=>{
    document.querySelectorAll('.wm-managed').forEach(win=>{
      const key=win.dataset.wmKey||'heavy:editor',r=wmNormalizedRect(wmReadRect(win),key);Object.assign(win.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:win.classList.contains('wm-minimized')?win.style.height:`${r.height}px`})
    });
  });
  document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(wmPrepareContext),{once:true});
  requestAnimationFrame(wmPrepareContext);
  window.EI_FLOATING_WINDOWS_READY=true;
})();
