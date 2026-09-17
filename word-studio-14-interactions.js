/* ===== V88 · Interacciones robustas + construcción visual en Word =========
   - Delegación de eventos: los controles sobreviven a cualquier re-render.
   - La inserción general permite escoger ubicación exacta.
   - Conserva el Estudio de Diseño avanzado.
   - Agrega edición de formas directamente dentro de los formatos Word.
   - Mantiene compatibilidad con el inspector contextual V75/V76.
============================================================================= */
const V76_BLUE='#001F73';
const V76_INSERT_GROUPS=[
  ['Contenido',[['text','Texto premium'],['heading','Subtítulo'],['list','Lista'],['callout','Nota']]],
  ['Datos',[['design','✦ Diseño libre'],['table','Tabla'],['kpi','KPI']]],
  ['Visualización',[['diagram','Diagrama'],['chart','Gráfica']]],
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
function v76OwnEvent(e,fn){e.preventDefault();e.stopImmediatePropagation();try{fn()}catch(err){window.V76_LAST_ERROR=String(err?.stack||err);console.error('[Word Studio V88]',err)}}
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
function v76InsertGroupsHtml(){
  return V76_INSERT_GROUPS.map(([title,items])=>`<section><span>${title}</span><div>${items.map(([type,label])=>`<button type="button" data-v76-insert-type="${type}" disabled>${label}</button>`).join('')}</div></section>`).join('');
}
function v76EnsureInsertPalette(){
  let pop=document.getElementById('v76InsertPopover');
  if(!pop){
    pop=document.createElement('div');pop.id='v76InsertPopover';pop.className='v76-insert-popover';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Insertar contenido');
    pop.innerHTML=`<div class="v76-insert-head"><div><strong>Insertar contenido</strong><small>Elige primero la ubicación exacta</small></div><button type="button" data-v76-close-insert aria-label="Cerrar">×</button></div><div class="v76-insert-location"><label for="v76InsertLocation">¿Dónde quieres insertarlo?</label><select id="v76InsertLocation" data-v76-insert-location></select><small>El bloque se agregará dentro de la sección o subtítulo elegido, después del contenido que ya exista allí.</small></div><div class="v76-insert-groups"></div>`;
    document.body.appendChild(pop);
  }
  let groups=pop.querySelector('.v76-insert-groups');
  if(!groups){groups=document.createElement('div');groups.className='v76-insert-groups';pop.appendChild(groups)}
  groups.innerHTML=v76InsertGroupsHtml();
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
  const btn=document.createElement('button');btn.type='button';btn.id='v87DesignBtn';btn.className='v75-toolbar-btn';btn.innerHTML='✦ Estudio';btn.title='Abrir el editor visual avanzado';btn.setAttribute('aria-label','Abrir Estudio de Diseño');
  const panel=document.getElementById('v75PanelBtn');group.insertBefore(btn,panel||null);
}

/* ===== V88 · Constructor visual embebido en los formatos Word ============ */
const wdSelection=new Map();
let wdDrag=null;
function v88EnsureWordBuilderCss(){if(document.getElementById('v88WordBuilderCss'))return;const l=document.createElement('link');l.id='v88WordBuilderCss';l.rel='stylesheet';l.href='word-studio-word-builder.css?v=88';document.head.appendChild(l)}
function wdBlock(path){const b=v76ResolveBlock(path);return b?.type==='design'?b:null}
function wdSelected(path){return wdSelection.get(path)||''}
function wdSafeAttr(v){return v76EscHtml(v)}
function wdSelectionSvg(e){if(!e||e.hidden)return'';return `<g class="wd-inline-selection" transform="rotate(${Number(e.rotation)||0} ${e.x+e.w/2} ${e.y+e.h/2})"><rect x="${e.x-3}" y="${e.y-3}" width="${e.w+6}" height="${e.h+6}" rx="4"/></g>`}
function wdCanvasMarkup(block,path){
  const b=typeof dsNormalizeBlock==='function'?dsNormalizeBlock(block):block,selected=wdSelected(path),grid=b.grid?`<defs><pattern id="wd-grid-${wdSafeAttr(b.id)}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#E4E7EC" stroke-width=".65"/></pattern></defs>`:'';
  const elements=(b.elements||[]).map(e=>{let s=typeof dsElementSvg==='function'?dsElementSvg(e,{interactive:false}):'';if(!s)return'';s=s.replace('<g',`<g data-wd-element="${wdSafeAttr(e.id)}" data-wd-path="${wdSafeAttr(path)}" class="wd-element${selected===e.id?' is-selected':''}"`);return s}).join('');
  const sel=(b.elements||[]).find(e=>e.id===selected);return `<svg data-wd-canvas="${wdSafeAttr(path)}" viewBox="0 0 ${b.width} ${b.height}" role="img" aria-label="Editor visual dentro del Word">${grid}<rect data-wd-background="${wdSafeAttr(path)}" width="${b.width}" height="${b.height}" fill="${b.background}"/>${grid?`<rect pointer-events="none" width="${b.width}" height="${b.height}" fill="url(#wd-grid-${wdSafeAttr(b.id)})"/>`:''}${elements}${sel?wdSelectionSvg(sel):''}</svg>`}
function wdPropNumber(path,e,field,label,min=0,max=999){return `<label>${label}<input type="number" min="${min}" max="${max}" data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="${field}" value="${Math.round(Number(e[field])||0)}"></label>`}
function wdInspectorHtml(block,path){
  const id=wdSelected(path),e=(block.elements||[]).find(x=>x.id===id);
  if(!e)return `<h5>Propiedades</h5><div class="wd-inline-empty">Selecciona una forma en la hoja para modificar tamaño, posición, texto, colores y orden. Puedes arrastrarla directamente dentro del formato.</div><label>Fondo de la composición<input type="color" data-wd-board-path="${wdSafeAttr(path)}" data-wd-board="background" value="${block.background}"></label><label>Altura<input type="range" min="280" max="610" step="10" data-wd-board-path="${wdSafeAttr(path)}" data-wd-board="height" value="${block.height}"></label>`;
  let specific='';
  if(e.type==='text')specific=`<label>Texto<textarea data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="text">${v76EscHtml(e.text)}</textarea></label><div class="wd-inline-four">${wdPropNumber(path,e,'fontSize','Tamaño',8,120)}<label>Fuente<select data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="fontFamily">${(typeof DS_FONTS!=='undefined'?DS_FONTS:['Century Gothic','Arial']).map(f=>`<option ${e.fontFamily===f?'selected':''}>${f}</option>`).join('')}</select></label></div><label>Color<input type="color" data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="color" value="${e.color}"></label>`;
  else if(e.type==='rect'||e.type==='ellipse')specific=`<label>Relleno<input type="color" data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="fill" value="${e.fill}"></label><label>Borde<input type="color" data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="stroke" value="${e.stroke}"></label>${wdPropNumber(path,e,'strokeWidth','Grosor borde',0,20)}`;
  else if(e.type==='line')specific=`<label>Color de línea<input type="color" data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="stroke" value="${e.stroke}"></label>${wdPropNumber(path,e,'strokeWidth','Grosor',1,20)}`;
  else if(e.type==='image')specific=`<label>Ajuste<select data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="fit"><option value="cover" ${e.fit==='cover'?'selected':''}>Cubrir</option><option value="contain" ${e.fit==='contain'?'selected':''}>Contener</option></select></label>`;
  return `<h5>${v76EscHtml(e.name||'Elemento')}</h5><label>Nombre<input data-wd-prop-path="${wdSafeAttr(path)}" data-wd-prop="name" value="${v76EscHtml(e.name||'')}"></label><div class="wd-inline-four">${wdPropNumber(path,e,'x','X',0,900)}${wdPropNumber(path,e,'y','Y',0,610)}${wdPropNumber(path,e,'w','Ancho',20,900)}${wdPropNumber(path,e,'h','Alto',2,610)}</div>${wdPropNumber(path,e,'rotation','Rotación',-180,180)}${specific}<div class="wd-inline-actions"><button type="button" data-wd-action="duplicate" data-wd-path="${wdSafeAttr(path)}">Duplicar</button><button type="button" data-wd-action="front" data-wd-path="${wdSafeAttr(path)}">Al frente</button><button type="button" data-wd-action="back" data-wd-path="${wdSafeAttr(path)}">Al fondo</button><button type="button" class="danger" data-wd-action="delete" data-wd-path="${wdSafeAttr(path)}">Eliminar</button></div>`;
}
function wdInlineEditorHtml(b,i,j,k){
  const p=`${i}:${j}:${k}`;return `<div class="word-block-editor wd-inline-editor" data-wd-path="${p}">${blockEditorHeader('Construcción visual dentro del Word',i,j,k)}<div class="wd-inline-head"><div><strong>${v76EscHtml(b.title||'Composición visual')}</strong><small>Formas, textos e imágenes ubicadas directamente dentro del formato</small></div><span class="wd-inline-badge">EDITABLE EN EL WORD STUDIO</span></div><div class="wd-inline-tools"><button type="button" class="primary" data-wd-add="text" data-wd-path="${p}">T Texto</button><button type="button" data-wd-add="heading" data-wd-path="${p}">H Título</button><button type="button" data-wd-add="rect" data-wd-path="${p}">▭ Rectángulo</button><button type="button" data-wd-add="ellipse" data-wd-path="${p}">○ Círculo</button><button type="button" data-wd-add="line" data-wd-path="${p}">╱ Línea</button><button type="button" data-wd-add="image" data-wd-path="${p}">▧ Imagen</button><button type="button" data-wd-action="center" data-wd-path="${p}">Centrar</button><button type="button" class="accent" data-wd-action="advanced" data-wd-path="${p}">Editor ampliado</button></div><div class="wd-inline-layout"><div class="wd-inline-workspace"><div class="wd-inline-canvas-frame" data-wd-canvas-host="${p}">${wdCanvasMarkup(b,p)}</div></div><aside class="wd-inline-inspector" data-wd-inspector="${p}">${wdInspectorHtml(b,p)}</aside></div><div class="wd-inline-foot"><span>Arrastra los elementos sobre la hoja. Los cambios forman parte del documento y se conservan al exportar.</span><button type="button" data-wd-action="export" data-wd-path="${p}">Exportar composición PNG</button></div><input type="file" accept="image/png,image/jpeg,image/webp" data-wd-image-upload="${p}" hidden></div>`}
const wdBaseWordBlockEditorHtml=wordBlockEditorHtml;
wordBlockEditorHtml=function(b,i,j,k){return b?.type==='design'?wdInlineEditorHtml(b,i,j,k):wdBaseWordBlockEditorHtml(b,i,j,k)};
function wdRefreshCanvas(path){const b=wdBlock(path),host=document.querySelector(`[data-wd-canvas-host="${path}"]`);if(b&&host)host.innerHTML=wdCanvasMarkup(b,path)}
function wdRefreshCard(path){const b=wdBlock(path),card=document.querySelector(`.wd-inline-editor[data-wd-path="${path}"]`);if(!b||!card)return;const {i,j,k}=parseBlockPath(path);card.outerHTML=wdInlineEditorHtml(b,i,j,k)}
function wdSyncDocument(){if(typeof renderWordOnly==='function')renderWordOnly()}
function wdFocusBlock(path){setTimeout(()=>{const card=document.querySelector(`.wd-inline-editor[data-wd-path="${path}"]`);card?.scrollIntoView({behavior:'smooth',block:'center'});card?.classList.add('is-focused');setTimeout(()=>card?.classList.remove('is-focused'),900)},0)}
function wdNewElement(block,type){const cx=block.width/2,cy=block.height/2,id=typeof dsId==='function'?dsId():wordUid('wd');if(type==='heading')return dsNormalizeElement({id,type:'text',name:'Título',x:cx-180,y:cy-45,w:360,h:70,text:'Nuevo título',fontSize:34,fontWeight:700,color:'#001F73',textAlign:'center'});if(type==='text')return dsNormalizeElement({id,type:'text',name:'Texto',x:cx-160,y:cy-40,w:320,h:80,text:'Escriba aquí',fontSize:22,fontWeight:400,color:'#001F73',textAlign:'left'});if(type==='ellipse')return dsNormalizeElement({id,type:'ellipse',name:'Círculo',x:cx-65,y:cy-65,w:130,h:130,fill:'#EAC800',stroke:'#001F73',strokeWidth:0});if(type==='line')return dsNormalizeElement({id,type:'line',name:'Línea',x:cx-120,y:cy,w:240,h:2,stroke:'#001F73',strokeWidth:3});return dsNormalizeElement({id,type:'rect',name:'Rectángulo',x:cx-110,y:cy-60,w:220,h:120,fill:'#001F73',stroke:'#001F73',strokeWidth:0,radius:12})}
function wdAdd(path,type){const b=wdBlock(path);if(!b)return;if(type==='image'){document.querySelector(`[data-wd-image-upload="${path}"]`)?.click();return}const e=wdNewElement(b,type);b.elements.push(e);wdSelection.set(path,e.id);wdRefreshCard(path);wdSyncDocument()}
function wdAction(path,action){const b=wdBlock(path);if(!b)return;const id=wdSelected(path),idx=b.elements.findIndex(e=>e.id===id),e=idx>=0?b.elements[idx]:null;if(action==='advanced'){if(typeof dsOpen==='function')dsOpen(path);return}if(action==='export'){if(typeof dsExportPng==='function')dsExportPng(b);return}if(!e)return;if(action==='delete'){b.elements.splice(idx,1);wdSelection.delete(path)}else if(action==='duplicate'){const clone=dsNormalizeElement({...JSON.parse(JSON.stringify(e)),id:typeof dsId==='function'?dsId():wordUid('wd'),name:`${e.name} copia`,x:Math.min(b.width-e.w,e.x+18),y:Math.min(b.height-e.h,e.y+18),groupId:''});b.elements.push(clone);wdSelection.set(path,clone.id)}else if(action==='front'){b.elements.splice(idx,1);b.elements.push(e)}else if(action==='back'){b.elements.splice(idx,1);b.elements.unshift(e)}else if(action==='center'){e.x=Math.max(0,(b.width-e.w)/2);e.y=Math.max(0,(b.height-e.h)/2)}wdRefreshCard(path);wdSyncDocument()}
function wdUpdateProperty(target){const path=target.dataset.wdPropPath,b=wdBlock(path),id=wdSelected(path),e=b?.elements?.find(x=>x.id===id);if(!e)return;const f=target.dataset.wdProp;let v=target.value;if(['x','y','w','h','rotation','fontSize','strokeWidth'].includes(f))v=Number(v)||0;e[f]=v;Object.assign(e,dsNormalizeElement(e));wdRefreshCanvas(path);wdSyncDocument()}
function wdUpdateBoard(target){const path=target.dataset.wdBoardPath,b=wdBlock(path);if(!b)return;const f=target.dataset.wdBoard;b[f]=f==='height'?Number(target.value):target.value;wdRefreshCanvas(path);wdSyncDocument()}
function wdImage(path,file){if(!file||!/^image\/(png|jpeg|webp)$/i.test(file.type))return;const b=wdBlock(path);if(!b)return;const r=new FileReader();r.onload=()=>{const src=safeImageSrc(r.result);if(!src)return;const img=new Image();img.onload=()=>{const w=Math.min(300,b.width*.55),h=Math.min(260,w*(img.naturalHeight/Math.max(1,img.naturalWidth))),e=dsNormalizeElement({id:typeof dsId==='function'?dsId():wordUid('wd'),type:'image',name:'Imagen',src,x:(b.width-w)/2,y:(b.height-h)/2,w,h,fit:'contain'});b.elements.push(e);wdSelection.set(path,e.id);wdRefreshCard(path);wdSyncDocument()};img.src=src};r.readAsDataURL(file)}
function v88InsertInlineDesign(){const target=v87ActiveTarget();if(!target){alert('Agregue primero una sección al documento.');return}addWordBlock(target.i,target.j,'design');const blocks=getWordItem(target.i,target.j)?.blocks||[];let k=-1;for(let n=blocks.length-1;n>=0;n--){if(blocks[n]?.type==='design'){k=n;break}}if(k>=0){window.V76_LAST_ACTION='insert-inline-word-shapes';wdFocusBlock(`${target.i}:${target.j}:${k}`)}}
function v88EnsureWordShapesEntry(){const group=document.getElementById('wordImmersiveTools');if(!group||document.getElementById('v88WordShapesBtn'))return;const btn=document.createElement('button');btn.type='button';btn.id='v88WordShapesBtn';btn.className='v75-toolbar-btn wd-word-shapes-entry';btn.innerHTML='▱ Formas en Word';btn.title='Agregar formas, textos e imágenes editables dentro del formato Word';btn.setAttribute('aria-label','Agregar formas dentro del Word');const studio=document.getElementById('v87DesignBtn');group.insertBefore(btn,studio||document.getElementById('v75PanelBtn')||null)}
function wdHandleClick(e){const t=e.target instanceof Element?e.target:null;if(!t)return;const shapes=t.closest('#v88WordShapesBtn');if(shapes){e.preventDefault();e.stopImmediatePropagation();v88InsertInlineDesign();return}const add=t.closest('[data-wd-add]');if(add){e.preventDefault();e.stopImmediatePropagation();wdAdd(add.dataset.wdPath,add.dataset.wdAdd);return}const action=t.closest('[data-wd-action]');if(action){e.preventDefault();e.stopImmediatePropagation();wdAction(action.dataset.wdPath,action.dataset.wdAction);return}const bg=t.closest('[data-wd-background]');if(bg){const path=bg.dataset.wdBackground;wdSelection.delete(path);wdRefreshCard(path)}}
function wdHandleInput(e){const t=e.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))return;if(t.dataset.wdPropPath)wdUpdateProperty(t);else if(t.dataset.wdBoardPath)wdUpdateBoard(t)}
function wdHandleChange(e){const t=e.target;if(t instanceof HTMLInputElement&&t.dataset.wdImageUpload){const f=t.files?.[0];t.value='';if(f)wdImage(t.dataset.wdImageUpload,f);return}if(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement){if(t.dataset.wdPropPath){wdUpdateProperty(t);wdRefreshCard(t.dataset.wdPropPath)}else if(t.dataset.wdBoardPath){wdUpdateBoard(t);wdRefreshCard(t.dataset.wdBoardPath)}}}
function wdPointerDown(e){const node=e.target instanceof Element?e.target.closest('[data-wd-element]'):null;if(!node)return;const path=node.dataset.wdPath,b=wdBlock(path),obj=b?.elements?.find(x=>x.id===node.dataset.wdElement),svg=node.closest('svg');if(!b||!obj||obj.locked||!svg)return;const r=svg.getBoundingClientRect();wdSelection.set(path,obj.id);wdDrag={path,id:obj.id,startX:e.clientX,startY:e.clientY,origX:obj.x,origY:obj.y,sx:b.width/Math.max(1,r.width),sy:b.height/Math.max(1,r.height),node,base:node.getAttribute('transform')||''};node.classList.add('is-selected');e.preventDefault();e.stopPropagation()}
function wdPointerMove(e){if(!wdDrag)return;const dx=(e.clientX-wdDrag.startX)*wdDrag.sx,dy=(e.clientY-wdDrag.startY)*wdDrag.sy;if(wdDrag.node?.isConnected)wdDrag.node.setAttribute('transform',`translate(${dx} ${dy}) ${wdDrag.base}`)}
function wdPointerUp(e){if(!wdDrag)return;const d=wdDrag;wdDrag=null;const b=wdBlock(d.path),obj=b?.elements?.find(x=>x.id===d.id);if(!b||!obj)return;const dx=(e.clientX-d.startX)*d.sx,dy=(e.clientY-d.startY)*d.sy;obj.x=Math.max(0,Math.min(b.width-obj.w,d.origX+dx));obj.y=Math.max(0,Math.min(b.height-obj.h,d.origY+dy));wdRefreshCard(d.path);wdSyncDocument()}

function v76EnsureReady(){v88EnsureWordBuilderCss();if(typeof v75EnsureShell==='function')v75EnsureShell();if(typeof v75SyncMode==='function')v75SyncMode();if(typeof v75UpdateToolbarState==='function')v75UpdateToolbarState();v87EnsureDesignEntry();v88EnsureWordShapesEntry();v76EnsureInsertPalette();const insert=document.getElementById('v75InsertBtn');if(insert)insert.title='Insertar contenido eligiendo sección o subtítulo';const panel=document.getElementById('v75PanelBtn');if(panel)panel.title='Mostrar u ocultar el panel lateral';const focus=document.getElementById('v75FocusBtn');if(focus)focus.title='Modo enfoque para trabajar sobre el documento'}
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
if(document.body.dataset.wdInlineDelegated!=='1'){document.body.dataset.wdInlineDelegated='1';document.addEventListener('click',wdHandleClick,true);document.addEventListener('input',wdHandleInput,true);document.addEventListener('change',wdHandleChange,true);document.addEventListener('pointerdown',wdPointerDown,true);document.addEventListener('pointermove',wdPointerMove,true);document.addEventListener('pointerup',wdPointerUp,true);document.addEventListener('pointercancel',()=>{wdDrag=null},true)}
function v76Bootstrap(){v76EnsureReady();if(typeof v75AfterRender==='function')v75AfterRender()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v76Bootstrap,{once:true});else queueMicrotask(v76Bootstrap);
window.V76_INTERACTIONS_READY=true;window.V76_LAST_ACTION='ready';window.V76_LAST_ERROR='';window.V77_EXPLICIT_TARGETING=true;window.V87_VISIBLE_DESIGN_ENTRY=true;window.EI_INLINE_WORD_BUILDER_READY=true;