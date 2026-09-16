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

  /* Primera visita real: cerrar la bienvenida con el control visible del aplicativo. */
  const introSkip=page.locator('#introSkip');
  if(await introSkip.count()){
    const visible=await introSkip.isVisible().catch(()=>false);
    if(visible)await realClick(introSkip,'Entrar directo','#introSkip');
  }
  await page.waitForFunction(()=>{const o=document.getElementById('introOverlay');if(!o)return true;const s=getComputedStyle(o);return s.display==='none'||s.visibility==='hidden'||s.pointerEvents==='none'||o.classList.contains('hidden')||o.classList.contains('is-hidden')},{timeout:10000}).catch(async()=>{throw new Error(`La bienvenida no liberó la interfaz. ${JSON.stringify(await diagnostic('#introSkip'))}`)});

  await page.evaluate(()=>{if(typeof doc!=='undefined')doc.wordType='manual';setMode('word');render()});
  await page.waitForFunction(()=>{const panel=document.querySelector('[data-panel="word"]');return panel&&!panel.classList.contains('hidden')},{timeout:10000});
  await page.waitForFunction(()=>window.V76_INTERACTIONS_READY===true,{timeout:10000});
  await page.waitForSelector('[data-v75-open-insert]',{state:'visible',timeout:10000});

  const before=await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0);
  const insertButton=page.locator('[data-v75-open-insert]').first();
  await realClick(insertButton,'Insertar bloque','[data-v75-open-insert]');
  try{await page.waitForFunction(()=>document.getElementById('v76InsertPopover')?.classList.contains('open'),{timeout:5000})}catch(e){throw new Error(`Insertar bloque no abrió V76. ${JSON.stringify(await diagnostic('[data-v75-open-insert]'))}. Consola: ${consoleErrors.join(' | ')}`)}
  await realClick(page.locator('#v76InsertPopover [data-v76-insert-type="text"]'),'Texto premium','#v76InsertPopover [data-v76-insert-type="text"]');
  await page.waitForFunction(n=>(getWordItem(0,-1)?.blocks?.length||0)>n,before,{timeout:5000});
  assert((await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0))>before,'La paleta V76 abrió, pero no insertó el bloque');

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
  console.log('UI smoke PASS: bienvenida, clic real en Insertar bloque V76, constructor visual, Panel y Enfoque.');
} finally {await browser.close()}
