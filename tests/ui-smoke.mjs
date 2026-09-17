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
  await page.waitForFunction(()=>window.V76_INTERACTIONS_READY===true&&window.V77_EXPLICIT_TARGETING===true&&window.EI_DESIGN_STUDIO_READY===true&&window.V87_VISIBLE_DESIGN_ENTRY===true,{timeout:10000});
  await page.waitForSelector('[data-v75-open-insert]',{state:'visible',timeout:10000});
  await page.waitForSelector('#v87DesignBtn',{state:'visible',timeout:10000});

  const visual=await page.evaluate(()=>{
    const side=getComputedStyle(document.querySelector('.side'));const panelEl=document.querySelector('[data-panel="word"]');const panel=panelEl?getComputedStyle(panelEl):null;const studioEl=document.querySelector('.word-studio-settings');const studio=studioEl?getComputedStyle(studioEl):null;const noticeEl=document.querySelector('#wordTypeNotice');const notice=noticeEl?getComputedStyle(noticeEl):null;const premiumEl=document.querySelector('.word-premium-note');const premium=premiumEl?getComputedStyle(premiumEl):null;const primary=getComputedStyle(document.querySelector('#v75InsertBtn'));const design=getComputedStyle(document.querySelector('#v87DesignBtn'));const exportBtn=document.querySelector('#exportDocx');const exp=exportBtn?getComputedStyle(exportBtn):null;
    return {sideBg:side.backgroundColor,panelBg:panel?.backgroundColor||null,panelImage:panel?.backgroundImage||null,studioBg:studio?.backgroundColor||null,studioImage:studio?.backgroundImage||null,noticeBg:notice?.backgroundColor||null,noticeColor:notice?.color||null,premiumBg:premium?.backgroundColor||null,premiumColor:premium?.color||null,primaryBg:primary.backgroundColor,primaryColor:primary.color,designBg:design.backgroundColor,designColor:design.color,exportBg:exp?.backgroundColor||null,exportColor:exp?.color||null};
  });
  assert(visual.sideBg==='rgb(0, 31, 115)',`El lateral debe ser #001F73, no ${visual.sideBg}`);
  assert(visual.panelBg==='rgba(0, 0, 0, 0)'&&visual.panelImage==='none',`El panel general debe ser transparente: ${JSON.stringify(visual)}`);
  if(visual.studioBg)assert(visual.studioBg==='rgba(0, 0, 0, 0)'&&visual.studioImage==='none',`Word Studio general debe ser transparente: ${JSON.stringify(visual)}`);
  assert(visual.noticeBg==='rgb(255, 248, 215)'&&visual.noticeColor==='rgb(0, 31, 115)',`El aviso de tipo documental debe ser crema #FFF8D7 con texto azul: ${JSON.stringify(visual)}`);
  if(visual.premiumBg)assert(visual.premiumBg==='rgb(255, 248, 215)'&&visual.premiumColor==='rgb(0, 31, 115)',`Edición Premium debe ser crema #FFF8D7 con texto azul: ${JSON.stringify(visual)}`);
  assert(visual.primaryBg==='rgb(0, 31, 115)'&&visual.primaryColor==='rgb(255, 255, 255)',`Botón azul debe llevar texto blanco: ${JSON.stringify(visual)}`);
  assert(visual.designBg==='rgb(234, 200, 0)'&&visual.designColor==='rgb(0, 31, 115)',`El acceso Diseño debe ser amarillo institucional visible: ${JSON.stringify(visual)}`);
  if(visual.exportBg)assert(visual.exportBg==='rgb(234, 200, 0)'&&visual.exportColor==='rgb(0, 31, 115)',`Botón amarillo debe llevar texto azul: ${JSON.stringify(visual)}`);

  /* Inserción general: Diseño libre debe ser visible en la UI, no solo existir en código. */
  await realClick(page.locator('#v75InsertBtn'),'Insertar superior','#v75InsertBtn');
  await page.waitForFunction(()=>document.getElementById('v76InsertPopover')?.classList.contains('open'),{timeout:5000});
  const topTextBtn=page.locator('#v76InsertPopover [data-v76-insert-type="text"]');
  const topDesignBtn=page.locator('#v76InsertPopover [data-v76-insert-type="design"]');
  assert(await topTextBtn.isDisabled(),'La barra superior debe bloquear los tipos hasta elegir ubicación');
  assert(await topDesignBtn.count()===1,'El Estudio de Diseño no quedó integrado al menú Insertar');
  assert(/Diseño libre/i.test(await topDesignBtn.textContent()),'El acceso del menú no es reconocible como Diseño libre');
  const location=page.locator('#v76InsertLocation');await location.selectOption('0:-1');
  assert(!(await topDesignBtn.isDisabled()),'Elegir ubicación debe habilitar Diseño libre');
  await page.locator('[data-v76-close-insert]').click();

  /* Acceso directo visible: un clic debe insertar y abrir el Estudio de Diseño. */
  await page.evaluate(()=>{doc.sections=[{n:'1',t:'CONTENIDO',c:'',sub:[],blocks:[]}];render()});
  await page.waitForSelector('#v87DesignBtn',{state:'visible',timeout:5000});
  await realClick(page.locator('#v87DesignBtn'),'Diseño directo','#v87DesignBtn');
  await page.waitForSelector('#designStudioOverlay:not([hidden]) #dsCanvas',{state:'visible',timeout:10000});
  const initialDesign=await page.evaluate(()=>({blocks:getWordItem(0,-1)?.blocks?.length||0,type:getWordItem(0,-1)?.blocks?.[0]?.type,count:dsBlock()?.elements?.length||0,svg:!!document.querySelector('#dsCanvas'),history:dsHistory(dsBlock()).undo.length}));
  assert(initialDesign.blocks===1&&initialDesign.type==='design'&&initialDesign.svg,'El botón visible Diseño no insertó y abrió un bloque de diseño real');

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

  /* Constructor de diagramas existente sigue operativo. */
  await page.evaluate(()=>addWordBlock(0,-1,'diagram'));
  await page.waitForSelector('[data-v75-open-diagram]',{state:'visible',timeout:10000});
  const diagramButton=page.locator('[data-v75-open-diagram]').last();await realClick(diagramButton,'Abrir constructor visual','[data-v75-open-diagram]');
  try{await page.waitForFunction(()=>document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000})}catch(e){throw new Error(`Abrir constructor visual no abrió el inspector. ${JSON.stringify(await diagnostic('[data-v75-open-diagram]'))}. Consola: ${consoleErrors.join(' | ')}`)}
  await page.waitForSelector('#v75ContextBody .word-diagram-builder',{state:'visible',timeout:5000});
  await realClick(page.locator('#v75ContextClose'),'Cerrar inspector','#v75ContextClose');
  await realClick(page.locator('#v75PanelBtn'),'Panel','#v75PanelBtn');assert(await page.evaluate(()=>document.body.classList.contains('v75-panel-hidden')),'Panel no ocultó el lateral');
  await realClick(page.locator('#v75PanelBtn'),'Panel','#v75PanelBtn');assert(await page.evaluate(()=>!document.body.classList.contains('v75-panel-hidden')),'Panel no restauró el lateral');
  await realClick(page.locator('#v75FocusBtn'),'Enfoque','#v75FocusBtn');assert(await page.evaluate(()=>document.body.classList.contains('v75-focus-mode')),'Enfoque no se activó');
  await realClick(page.locator('#v75FocusBtn'),'Enfoque','#v75FocusBtn');assert(await page.evaluate(()=>!document.body.classList.contains('v75-focus-mode')),'Enfoque no se desactivó');

  /* Editores complejos: cantidades directas + modal flotante fuera del lateral. */
  await page.evaluate(()=>{doc.sections=[{n:'1',t:'CONTENIDO',c:'',sub:[],blocks:[newWordBlock('table'),newWordBlock('chart'),newWordBlock('kpi'),newWordBlock('list')]}];render()});
  await page.waitForSelector('[data-word-heavy-open="0:-1:0"]',{state:'visible',timeout:5000});
  assert(await page.locator('#wordSectionEditor .word-table-editor-grid').count()===0,'La cuadrícula de tabla no debe saturar la barra lateral');
  await realClick(page.locator('[data-word-heavy-open="0:-1:0"]'),'Abrir tabla flotante','[data-word-heavy-open="0:-1:0"]');
  await page.waitForSelector('#wordHeavyOverlay [data-wb-table-rows="0:-1:0"]',{state:'visible',timeout:5000});
  const tableModalGeometry=await page.evaluate(()=>{const side=document.querySelector('.side')?.getBoundingClientRect(),dialog=document.querySelector('.word-heavy-dialog')?.getBoundingClientRect();return{side:side?.width||0,dialog:dialog?.width||0}});assert(tableModalGeometry.dialog>tableModalGeometry.side*1.5,'El editor de tabla no es suficientemente amplio respecto al lateral');
  let rowsInput=page.locator('[data-wb-table-rows="0:-1:0"]');await rowsInput.fill('9');await rowsInput.press('Tab');await page.waitForFunction(()=>getWordItem(0,-1)?.blocks?.[0]?.rows?.length===9,{timeout:5000});
  let colsInput=page.locator('[data-wb-table-cols="0:-1:0"]');await colsInput.fill('6');await colsInput.press('Tab');await page.waitForFunction(()=>getWordItem(0,-1)?.blocks?.[0]?.rows?.[0]?.length===6,{timeout:5000});
  assert(await page.locator('#wordHeavyOverlay [data-wb-table-cell]').count()===54,'Escribir 9 filas × 6 columnas no creó exactamente 54 celdas');
  await realClick(page.locator('#wordHeavyOverlay [data-word-heavy-close]').last(),'Cerrar tabla flotante','#wordHeavyOverlay [data-word-heavy-close]');

  await realClick(page.locator('[data-word-heavy-open="0:-1:1"]'),'Abrir gráfica flotante','[data-word-heavy-open="0:-1:1"]');
  const chartCount=page.locator('[data-wb-chart-count="0:-1:1"]');await chartCount.fill('8');await chartCount.press('Tab');await page.waitForFunction(()=>getWordItem(0,-1)?.blocks?.[1]?.labels?.length===8&&getWordItem(0,-1)?.blocks?.[1]?.values?.length===8,{timeout:5000});assert(await page.locator('#wordHeavyOverlay [data-wb-chart-point]').count()===16,'La cantidad directa de gráfica no creó 8 pares etiqueta/valor');await page.keyboard.press('Escape');

  await realClick(page.locator('[data-word-heavy-open="0:-1:2"]'),'Abrir KPI flotante','[data-word-heavy-open="0:-1:2"]');
  const kpiCount=page.locator('[data-wb-kpi-count="0:-1:2"]');await kpiCount.fill('5');await kpiCount.press('Tab');await page.waitForFunction(()=>getWordItem(0,-1)?.blocks?.[2]?.items?.length===5,{timeout:5000});assert(await page.locator('#wordHeavyOverlay .word-heavy-repeat-card').count()===5,'La cantidad directa de KPI no creó 5 indicadores');await page.keyboard.press('Escape');

  await realClick(page.locator('[data-word-heavy-open="0:-1:3"]'),'Abrir lista flotante','[data-word-heavy-open="0:-1:3"]');
  const listCount=page.locator('[data-wb-list-count="0:-1:3"]');await listCount.fill('12');await listCount.press('Tab');await page.waitForFunction(()=>getWordItem(0,-1)?.blocks?.[3]?.items?.length===12,{timeout:5000});assert(await page.locator('#wordHeavyOverlay [data-wb-list-item]').count()===12,'La cantidad directa de lista no creó 12 elementos');await page.keyboard.press('Escape');

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

  assert(pageErrors.length===0,`Errores JavaScript: ${pageErrors.join(' | ')}`);
  console.log('UI smoke PASS: acceso visible, editores flotantes, cantidades directas, Diseño y motor documental verificados.');
} finally {await browser.close()}
