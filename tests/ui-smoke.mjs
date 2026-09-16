import { chromium } from 'playwright';

const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];
const consoleErrors=[];
page.on('pageerror',err=>pageErrors.push(String(err)));
page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
function assert(ok,message){if(!ok)throw new Error(message)}
async function diagnostic(){return page.evaluate(()=>({lastAction:window.V76_LAST_ACTION,lastError:window.V76_LAST_ERROR,modeWord:document.body.classList.contains('mode-word'),palette:document.getElementById('v76InsertPopover')?.className,drawer:document.getElementById('wordContextDrawer')?.className}))}

try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&typeof render==='function',{timeout:10000});
  await page.evaluate(()=>{try{localStorage.setItem('eiIntroSeen','1')}catch{};if(typeof doc!=='undefined')doc.wordType='manual';setMode('word');render()});
  await page.waitForFunction(()=>{const panel=document.querySelector('[data-panel="word"]');return panel&&!panel.classList.contains('hidden')},{timeout:10000});
  await page.waitForFunction(()=>window.V76_INTERACTIONS_READY===true,{timeout:10000});
  await page.waitForSelector('[data-v75-open-insert]',{state:'attached',timeout:10000});

  const before=await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0);
  await page.locator('[data-v75-open-insert]').first().click({force:true});
  try{await page.waitForFunction(()=>document.getElementById('v76InsertPopover')?.classList.contains('open'),{timeout:5000})}catch(e){throw new Error(`Insertar bloque no abrió V76. ${JSON.stringify(await diagnostic())}. Consola: ${consoleErrors.join(' | ')}`)}
  await page.locator('#v76InsertPopover [data-v76-insert-type="text"]').click({force:true});
  await page.waitForFunction(n=>(getWordItem(0,-1)?.blocks?.length||0)>n,before,{timeout:5000});
  assert((await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0))>before,'La paleta V76 abrió, pero no insertó el bloque');

  await page.evaluate(()=>addWordBlock(0,-1,'diagram'));
  await page.waitForSelector('[data-v75-open-diagram]',{state:'attached',timeout:10000});
  await page.locator('[data-v75-open-diagram]').last().click({force:true});
  try{await page.waitForFunction(()=>document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000})}catch(e){throw new Error(`Abrir constructor visual no abrió el inspector. ${JSON.stringify(await diagnostic())}. Consola: ${consoleErrors.join(' | ')}`)}
  await page.waitForSelector('#v75ContextBody .word-diagram-builder',{state:'attached',timeout:5000});
  assert(await page.locator('#wordContextDrawer').evaluate(el=>el.classList.contains('open')),'El inspector contextual no quedó abierto');

  await page.locator('#v75ContextClose').click({force:true});
  await page.waitForFunction(()=>!document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000});
  await page.locator('#v75PanelBtn').click({force:true});
  assert(await page.evaluate(()=>document.body.classList.contains('v75-panel-hidden')),'Panel no ocultó el lateral');
  await page.locator('#v75PanelBtn').click({force:true});
  assert(await page.evaluate(()=>!document.body.classList.contains('v75-panel-hidden')),'Panel no restauró el lateral');
  await page.locator('#v75FocusBtn').click({force:true});
  assert(await page.evaluate(()=>document.body.classList.contains('v75-focus-mode')),'Enfoque no se activó');
  await page.locator('#v75FocusBtn').click({force:true});
  assert(await page.evaluate(()=>!document.body.classList.contains('v75-focus-mode')),'Enfoque no se desactivó');

  assert(pageErrors.length===0,`Errores JavaScript: ${pageErrors.join(' | ')}`);
  console.log('UI smoke PASS: Insertar bloque V76, constructor visual, Panel y Enfoque.');
} finally {await browser.close()}
