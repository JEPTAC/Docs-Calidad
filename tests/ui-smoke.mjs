import { chromium } from 'playwright';

const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];
const consoleErrors=[];
page.on('pageerror',err=>pageErrors.push(String(err)));
page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
function assert(ok,message){if(!ok)throw new Error(message)}
async function diagnostic(selector){return page.evaluate(sel=>{const el=sel?document.querySelector(sel):null,r=el?.getBoundingClientRect?.();const top=r?document.elementFromPoint(r.left+r.width/2,r.top+r.height/2):null;return{lastAction:window.V76_LAST_ACTION,lastError:window.V76_LAST_ERROR,modeWord:document.body.classList.contains('mode-word'),palette:document.getElementById('v76InsertPopover')?.className,drawer:document.getElementById('wordContextDrawer')?.className,intro:document.getElementById('introOverlay')?.className,target:el?.outerHTML?.slice(0,220),elementAtCenter:top?.outerHTML?.slice(0,220)}} ,selector)}
async function realClick(locator,label,selector){try{await locator.scrollIntoViewIfNeeded();await locator.click({timeout:5000})}catch(e){throw new Error(`${label} no pudo recibir un clic real. ${JSON.stringify(await diagnostic(selector))}. ${e.message}`)}}

try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&typeof render==='function',{timeout:10000});

  const introSkip=page.locator('#introSkip');
  if(await introSkip.count()){
    const visible=await introSkip.isVisible().catch(()=>false);
    if(visible)await realClick(introSkip,'Entrar directo','#introSkip');
  }
  await page.waitForFunction(()=>{const o=document.getElementById('introOverlay');if(!o)return true;const s=getComputedStyle(o);return s.display==='none'||s.visibility==='hidden'||s.pointerEvents==='none'||o.classList.contains('hidden')||o.classList.contains('is-hidden')},{timeout:10000}).catch(async()=>{throw new Error(`La bienvenida no liberó la interfaz. ${JSON.stringify(await diagnostic('#introSkip'))}`)});

  await page.evaluate(()=>{if(typeof doc!=='undefined')doc.wordType='manual';setMode('word');render()});
  await page.waitForFunction(()=>{const panel=document.querySelector('[data-panel="word"]');return panel&&!panel.classList.contains('hidden')},{timeout:10000});
  await page.waitForFunction(()=>window.V76_INTERACTIONS_READY===true&&window.V77_EXPLICIT_TARGETING===true&&window.EI_DESIGN_STUDIO_READY===true,{timeout:10000});
  await page.waitForSelector('[data-v75-open-insert]',{state:'visible',timeout:10000});

  const visual=await page.evaluate(()=>{
    const side=getComputedStyle(document.querySelector('.side'));const panelEl=document.querySelector('[data-panel="word"]');const panel=panelEl?getComputedStyle(panelEl):null;const studioEl=document.querySelector('.word-studio-settings');const studio=studioEl?getComputedStyle(studioEl):null;const noticeEl=document.querySelector('#wordTypeNotice');const notice=noticeEl?getComputedStyle(noticeEl):null;const premiumEl=document.querySelector('.word-premium-note');const premium=premiumEl?getComputedStyle(premiumEl):null;const primary=getComputedStyle(document.querySelector('#v75InsertBtn'));const exportBtn=document.querySelector('#exportDocx');const exp=exportBtn?getComputedStyle(exportBtn):null;
    return {sideBg:side.backgroundColor,sideColor:side.color,panelBg:panel?.backgroundColor||null,panelImage:panel?.backgroundImage||null,studioBg:studio?.backgroundColor||null,studioImage:studio?.backgroundImage||null,noticeBg:notice?.backgroundColor||null,noticeColor:notice?.color||null,premiumBg:premium?.backgroundColor||null,premiumColor:premium?.color||null,primaryBg:primary.backgroundColor,primaryColor:primary.color,exportBg:exp?.backgroundColor||null,exportColor:exp?.color||null};
  });
  assert(visual.sideBg==='rgb(0, 31, 115)',`El lateral debe ser #001F73, no ${visual.sideBg}`);
  assert(visual.panelBg==='rgba(0, 0, 0, 0)'&&visual.panelImage==='none',`El panel general debe ser transparente: ${JSON.stringify(visual)}`);
  if(visual.studioBg)assert(visual.studioBg==='rgba(0, 0, 0, 0)'&&visual.studioImage==='none',`Word Studio general debe ser transparente: ${JSON.stringify(visual)}`);
  assert(visual.noticeBg==='rgb(255, 248, 215)'&&visual.noticeColor==='rgb(0, 31, 115)',`El aviso de tipo documental debe ser crema #FFF8D7 con texto azul: ${JSON.stringify(visual)}`);
  if(visual.premiumBg)assert(visual.premiumBg==='rgb(255, 248, 215)'&&visual.premiumColor==='rgb(0, 31, 115)',`Edición Premium debe ser crema #FFF8D7 con texto azul: ${JSON.stringify(visual)}`);
  assert(visual.primaryBg==='rgb(0, 31, 115)'&&visual.primaryColor==='rgb(255, 255, 255)',`Botón azul debe llevar texto blanco: ${JSON.stringify(visual)}`);
  if(visual.exportBg)assert(visual.exportBg==='rgb(234, 200, 0)'&&visual.exportColor==='rgb(0, 31, 115)',`Botón amarillo debe llevar texto azul: ${JSON.stringify(visual)}`);

  const before=await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0);
  await realClick(page.locator('#v75InsertBtn'),'Insertar superior','#v75InsertBtn');
  await page.waitForFunction(()=>document.getElementById('v76InsertPopover')?.classList.contains('open'),{timeout:5000});
  const topTextBtn=page.locator('#v76InsertPopover [data-v76-insert-type="text"]');
  assert(await topTextBtn.isDisabled(),'La barra superior debe bloquear los tipos hasta elegir ubicación');
  assert(await page.locator('#v76InsertPopover [data-v76-insert-type="design"]').count()===1,'El Estudio de Diseño no quedó integrado al menú de inserción');
  const location=page.locator('#v76InsertLocation');await location.selectOption('0:-1');
  assert(!(await topTextBtn.isDisabled()),'Elegir OBJETIVO debe habilitar la inserción');
  await realClick(topTextBtn,'Texto premium','#v76InsertPopover [data-v76-insert-type="text"]');
  await page.waitForFunction(n=>(getWordItem(0,-1)?.blocks?.length||0)>n,before,{timeout:5000});
  assert((await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0))>before,'La barra superior no insertó en la ubicación elegida');

  await page.waitForSelector('[data-v75-open-insert]',{state:'visible',timeout:10000});
  const localInsert=page.locator('[data-v75-open-insert]').first();await realClick(localInsert,'Insertar bloque local','[data-v75-open-insert]');
  await page.waitForFunction(()=>document.getElementById('v76InsertPopover')?.classList.contains('open'),{timeout:5000});
  assert(!(await page.locator('#v76InsertPopover [data-v76-insert-type="text"]').isDisabled()),'La inserción local debe abrir con su ubicación preseleccionada');
  await page.locator('[data-v76-close-insert]').click();

  await page.evaluate(()=>addWordBlock(0,-1,'diagram'));
  await page.waitForSelector('[data-v75-open-diagram]',{state:'visible',timeout:10000});
  const diagramButton=page.locator('[data-v75-open-diagram]').last();await realClick(diagramButton,'Abrir constructor visual','[data-v75-open-diagram]');
  try{await page.waitForFunction(()=>document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000})}catch(e){throw new Error(`Abrir constructor visual no abrió el inspector. ${JSON.stringify(await diagnostic('[data-v75-open-diagram]'))}. Consola: ${consoleErrors.join(' | ')}`)}
  await page.waitForSelector('#v75ContextBody .word-diagram-builder',{state:'visible',timeout:5000});
  assert(await page.locator('#wordContextDrawer').evaluate(el=>el.classList.contains('open')),'El inspector contextual no quedó abierto');

  await realClick(page.locator('#v75ContextClose'),'Cerrar inspector','#v75ContextClose');await page.waitForFunction(()=>!document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000});
  await realClick(page.locator('#v75PanelBtn'),'Panel','#v75PanelBtn');assert(await page.evaluate(()=>document.body.classList.contains('v75-panel-hidden')),'Panel no ocultó el lateral');
  await realClick(page.locator('#v75PanelBtn'),'Panel','#v75PanelBtn');assert(await page.evaluate(()=>!document.body.classList.contains('v75-panel-hidden')),'Panel no restauró el lateral');
  await realClick(page.locator('#v75FocusBtn'),'Enfoque','#v75FocusBtn');assert(await page.evaluate(()=>document.body.classList.contains('v75-focus-mode')),'Enfoque no se activó');
  await realClick(page.locator('#v75FocusBtn'),'Enfoque','#v75FocusBtn');assert(await page.evaluate(()=>!document.body.classList.contains('v75-focus-mode')),'Enfoque no se desactivó');

  /* Motor documental: layout medido, semántica y tabla multipágina. */
  const layout=await page.evaluate(()=>{
    const rows=[['Columna A','Columna B','Columna C']];for(let i=1;i<=52;i++)rows.push([`Registro ${i}`,`Descripción operativa suficientemente amplia para validar la distribución de la fila ${i} sin cortes arbitrarios.`,`Estado ${i%2?'Activo':'Pendiente'}`]);
    doc.sections=[{n:'1',t:'CONTENIDO',c:'Este contenido inicial valida que el título principal permanezca unido al primer párrafo cuando exista espacio suficiente.',sub:[],blocks:[{id:'h-layout',type:'heading',text:'Planeación y ejecución',content:'Este párrafo pertenece directamente al subtítulo y debe viajar con él.\n\nEste segundo párrafo puede continuar de forma natural si la página requiere un salto.',level:2,numbered:true,keepWithNext:true},{id:'n-layout',type:'text',text:'Nota: Esta observación fue detectada automáticamente por el motor semántico.',align:'justify',autoSemantic:true},{id:'t-layout',type:'table',title:'Matriz extensa de validación',caption:'Fuente: prueba automatizada Docs-Calidad.',header:true,repeatHeader:true,cantSplitRows:true,striped:true,rows}]}];render();
    const pages=[...document.querySelectorAll('#stage .sgc-page')],contentPages=pages.filter(p=>p.querySelector('.word-title-group,.word-table-figure,.word-heading-group')),tables=[...document.querySelectorAll('#stage .word-table-figure')],headers=tables.map(t=>[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()).join('|')),overflows=contentPages.map(p=>{const c=p.querySelector('.sgc-content');return c?Math.max(0,c.scrollHeight-c.clientHeight):0}),heading=document.querySelector('#stage .word-heading-group');
    return {pages:pages.length,tables:tables.length,headers,continuations:document.querySelectorAll('#stage .word-table-figure.is-continuation').length,autoNotes:document.querySelectorAll('#stage .word-callout.auto-note').length,headingContent:heading?.querySelector('.word-heading-content')?.textContent||'',overflows};
  });
  assert(layout.pages>=4,'El motor nuevo no produjo paginación real para contenido extenso');
  assert(layout.tables>=2&&layout.continuations>=1,'La tabla extensa no se fragmentó automáticamente entre páginas');
  assert(layout.headers.every(h=>h==='Columna A|Columna B|Columna C'),'Los encabezados de tabla no se repitieron en cada fragmento');
  assert(layout.autoNotes===1,'La detección automática de notas no funcionó');
  assert(/pertenece directamente al subtítulo/i.test(layout.headingContent),'El subtítulo no conservó su contenido asociado');
  assert(layout.overflows.every(x=>x<=2),`Hay contenido desbordado en páginas: ${layout.overflows.join(', ')}`);

  /* Estudio de Diseño: objetos libres, transformación, agrupación e historial. */
  await page.evaluate(()=>{doc.sections=[{n:'1',t:'CONTENIDO',c:'',sub:[],blocks:[]}];addWordBlock(0,-1,'design')});
  await page.waitForSelector('[data-ds-open]',{state:'visible',timeout:10000});
  await realClick(page.locator('[data-ds-open]').last(),'Abrir Estudio de Diseño','[data-ds-open]');
  await page.waitForSelector('#designStudioOverlay:not([hidden]) #dsCanvas',{state:'visible',timeout:10000});
  const initialDesign=await page.evaluate(()=>({count:dsBlock().elements.length,type:getWordItem(0,-1).blocks[0].type,svg:!!document.querySelector('#dsCanvas'),history:dsHistory(dsBlock()).undo.length}));
  assert(initialDesign.type==='design'&&initialDesign.svg,'El bloque de diseño no se normalizó o no abrió el lienzo');
  await realClick(page.locator('[data-ds-add="rect"]'),'Agregar rectángulo','[data-ds-add="rect"]');
  await realClick(page.locator('[data-ds-add="text"]'),'Agregar texto','[data-ds-add="text"]');
  const afterAdd=await page.evaluate(()=>({count:dsBlock().elements.length,undo:dsHistory(dsBlock()).undo.length}));
  assert(afterAdd.count===initialDesign.count+2&&afterAdd.undo>=2,'La inserción visual o el historial no registraron las operaciones');

  const firstLayer=page.locator('#dsLayers [data-ds-layer-select]').last();await realClick(firstLayer,'Seleccionar capa','#dsLayers [data-ds-layer-select]');
  const xBefore=await page.evaluate(()=>dsById(dsBlock(),dsSelected[0]).x);await page.keyboard.press('ArrowRight');
  const xAfter=await page.evaluate(()=>dsById(dsBlock(),dsSelected[0]).x);assert(xAfter===xBefore+1,'El movimiento fino por teclado no funcionó');

  const element=page.locator('#dsCanvas [data-ds-element]').first();const bb=await element.boundingBox();assert(!!bb,'No existe elemento transformable en el lienzo');
  const dragBefore=await page.evaluate(()=>{const e=dsBlock().elements[0];return{x:e.x,y:e.y}});await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.down();await page.mouse.move(bb.x+bb.width/2+36,bb.y+bb.height/2+24,{steps:5});await page.mouse.up();
  const dragAfter=await page.evaluate(()=>{const e=dsBlock().elements[0];return{x:e.x,y:e.y}});assert(dragAfter.x!==dragBefore.x||dragAfter.y!==dragBefore.y,'Arrastrar directamente sobre el lienzo no modificó la posición');

  await page.keyboard.press('Control+A');await page.keyboard.press('Control+G');
  const grouped=await page.evaluate(()=>{const ids=dsSelected.map(id=>dsById(dsBlock(),id)?.groupId).filter(Boolean);return{selected:dsSelected.length,groups:new Set(ids).size,grouped:ids.length}});assert(grouped.selected>=2&&grouped.groups===1&&grouped.grouped===grouped.selected,'La agrupación múltiple estilo Canva no funcionó');
  await page.keyboard.press('Control+Z');const undone=await page.evaluate(()=>dsSelected.every(id=>!dsById(dsBlock(),id)?.groupId));assert(undone,'Deshacer no restauró el estado anterior del grupo');
  await page.keyboard.press('Control+Y');const redone=await page.evaluate(()=>dsSelected.every(id=>!!dsById(dsBlock(),id)?.groupId));assert(redone,'Rehacer no restauró la agrupación');

  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.getElementById('designStudioOverlay')?.hidden===true,{timeout:5000});
  assert(await page.locator('#stage .word-design-figure svg').count()>=1,'El diseño no quedó integrado en la vista documental');

  assert(pageErrors.length===0,`Errores JavaScript: ${pageErrors.join(' | ')}`);
  console.log('UI smoke PASS: contrato institucional, motor documental y Estudio de Diseño interactivo verificados.');
} finally {await browser.close()}