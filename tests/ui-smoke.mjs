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
  await page.waitForFunction(()=>window.V76_INTERACTIONS_READY===true&&window.V77_EXPLICIT_TARGETING===true,{timeout:10000});
  await page.waitForSelector('[data-v75-open-insert]',{state:'visible',timeout:10000});

  /* Contraste institucional y transparencia real del lateral. */
  const visual=await page.evaluate(()=>{
    const side=getComputedStyle(document.querySelector('.side'));
    const panelEl=document.querySelector('[data-panel="word"]');
    const panel=panelEl?getComputedStyle(panelEl):null;
    const studioEl=document.querySelector('.word-studio-settings');
    const studio=studioEl?getComputedStyle(studioEl):null;
    const noticeEl=document.querySelector('#wordTypeNotice');
    const notice=noticeEl?getComputedStyle(noticeEl):null;
    const premiumEl=document.querySelector('.word-premium-note');
    const premium=premiumEl?getComputedStyle(premiumEl):null;
    const primary=getComputedStyle(document.querySelector('#v75InsertBtn'));
    const exportBtn=document.querySelector('#exportDocx');
    const exp=exportBtn?getComputedStyle(exportBtn):null;
    return {
      sideBg:side.backgroundColor,sideColor:side.color,
      panelBg:panel?.backgroundColor||null,panelImage:panel?.backgroundImage||null,
      studioBg:studio?.backgroundColor||null,studioImage:studio?.backgroundImage||null,
      noticeColor:notice?.color||null,premiumColor:premium?.color||null,
      primaryBg:primary.backgroundColor,primaryColor:primary.color,
      exportBg:exp?.backgroundColor||null,exportColor:exp?.color||null
    };
  });
  assert(visual.sideBg==='rgb(0, 31, 115)',`El lateral debe ser #001F73, no ${visual.sideBg}`);
  assert(visual.panelBg==='rgba(0, 0, 0, 0)'&&visual.panelImage==='none',`El panel general debe ser transparente: ${JSON.stringify(visual)}`);
  if(visual.studioBg)assert(visual.studioBg==='rgba(0, 0, 0, 0)'&&visual.studioImage==='none',`Word Studio general debe ser transparente: ${JSON.stringify(visual)}`);
  assert(visual.noticeColor==='rgb(0, 31, 115)',`El aviso amarillo de tipo documental debe usar texto azul: ${JSON.stringify(visual)}`);
  if(visual.premiumColor)assert(visual.premiumColor==='rgb(0, 31, 115)',`Edición Premium debe usar texto azul: ${JSON.stringify(visual)}`);
  assert(visual.primaryBg==='rgb(0, 31, 115)'&&visual.primaryColor==='rgb(255, 255, 255)',`Botón azul debe llevar texto blanco: ${JSON.stringify(visual)}`);
  if(visual.exportBg)assert(visual.exportBg==='rgb(234, 200, 0)'&&visual.exportColor==='rgb(0, 31, 115)',`Botón amarillo debe llevar texto azul: ${JSON.stringify(visual)}`);

  /* Barra superior: debe exigir ubicación explícita antes de insertar. */
  const before=await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0);
  await realClick(page.locator('#v75InsertBtn'),'Insertar superior','#v75InsertBtn');
  await page.waitForFunction(()=>document.getElementById('v76InsertPopover')?.classList.contains('open'),{timeout:5000});
  const topTextBtn=page.locator('#v76InsertPopover [data-v76-insert-type="text"]');
  assert(await topTextBtn.isDisabled(),'La barra superior debe bloquear los tipos hasta elegir ubicación');
  const location=page.locator('#v76InsertLocation');
  await location.selectOption('0:-1');
  assert(!(await topTextBtn.isDisabled()),'Elegir OBJETIVO debe habilitar la inserción');
  await realClick(topTextBtn,'Texto premium','#v76InsertPopover [data-v76-insert-type="text"]');
  await page.waitForFunction(n=>(getWordItem(0,-1)?.blocks?.length||0)>n,before,{timeout:5000});
  assert((await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0))>before,'La barra superior no insertó en la ubicación elegida');

  /* El botón local conserva su destino conocido. */
  await page.waitForSelector('[data-v75-open-insert]',{state:'visible',timeout:10000});
  const localInsert=page.locator('[data-v75-open-insert]').first();
  await realClick(localInsert,'Insertar bloque local','[data-v75-open-insert]');
  await page.waitForFunction(()=>document.getElementById('v76InsertPopover')?.classList.contains('open'),{timeout:5000});
  assert(!(await page.locator('#v76InsertPopover [data-v76-insert-type="text"]').isDisabled()),'La inserción local debe abrir con su ubicación preseleccionada');
  await page.locator('[data-v76-close-insert]').click();

  await page.evaluate(()=>addWordBlock(0,-1,'diagram'));
  await page.waitForSelector('[data-v75-open-diagram]',{state:'visible',timeout:10000});
  const diagramButton=page.locator('[data-v75-open-diagram]').last();
  await realClick(diagramButton,'Abrir constructor visual','[data-v75-open-diagram]');
  try{await page.waitForFunction(()=>document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000})}catch(e){throw new Error(`Abrir constructor visual no abrió el inspector. ${JSON.stringify(await diagnostic('[data-v75-open-diagram]'))}. Consola: ${consoleErrors.join(' | ')}`)}
  await page.waitForSelector('#v75ContextBody .word-diagram-builder',{state:'visible',timeout:5000});
  assert(await page.locator('#wordContextDrawer').evaluate(el=>el.classList.contains('open')),'El inspector contextual no quedó abierto');

  await realClick(page.locator('#v75ContextClose'),'Cerrar inspector','#v75ContextClose');
  await page.waitForFunction(()=>!document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000});
  await realClick(page.locator('#v75PanelBtn'),'Panel','#v75PanelBtn');
  assert(await page.evaluate(()=>document.body.classList.contains('v75-panel-hidden')),'Panel no ocultó el lateral');
  await realClick(page.locator('#v75PanelBtn'),'Panel','#v75PanelBtn');
  assert(await page.evaluate(()=>!document.body.classList.contains('v75-panel-hidden')),'Panel no restauró el lateral');
  await realClick(page.locator('#v75FocusBtn'),'Enfoque','#v75FocusBtn');
  assert(await page.evaluate(()=>document.body.classList.contains('v75-focus-mode')),'Enfoque no se activó');
  await realClick(page.locator('#v75FocusBtn'),'Enfoque','#v75FocusBtn');
  assert(await page.evaluate(()=>!document.body.classList.contains('v75-focus-mode')),'Enfoque no se desactivó');

  assert(pageErrors.length===0,`Errores JavaScript: ${pageErrors.join(' | ')}`);
  console.log('UI smoke PASS V78: lateral azul continuo, contenedores transparentes, avisos amarillos con texto azul, ubicación explícita, constructor visual, Panel y Enfoque.');
} finally {await browser.close()}
