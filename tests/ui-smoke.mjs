import { chromium } from 'playwright';

const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];
page.on('pageerror',err=>pageErrors.push(String(err)));

function assert(ok,message){if(!ok)throw new Error(message)}

try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&typeof render==='function',{timeout:10000});
  await page.evaluate(()=>{
    try{localStorage.setItem('eiIntroSeen','1')}catch{}
    if(typeof doc!=='undefined')doc.wordType='manual';
    setMode('word');
    render();
  });

  await page.waitForFunction(()=>{
    const panel=document.querySelector('[data-panel="word"]');
    return panel&&!panel.classList.contains('hidden');
  },{timeout:10000});
  await page.waitForFunction(()=>window.V76_INTERACTIONS_READY===true,{timeout:10000});
  await page.waitForSelector('[data-v75-open-insert]',{state:'attached',timeout:10000});

  const before=await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0);
  await page.locator('[data-v75-open-insert]').first().click({force:true});
  await page.waitForFunction(()=>document.getElementById('v75InsertMenu')?.classList.contains('open'),{timeout:5000});
  const menuOpen=await page.locator('#v75InsertMenu').evaluate(el=>el.classList.contains('open'));
  assert(menuOpen,'El botón “Insertar bloque” no abrió la paleta contextual');

  await page.locator('#v75InsertMenu [data-v75-insert-type="text"]').click({force:true});
  await page.waitForFunction(n=>(getWordItem(0,-1)?.blocks?.length||0)>n,before,{timeout:5000});
  const after=await page.evaluate(()=>getWordItem(0,-1)?.blocks?.length||0);
  assert(after>before,'La paleta abrió, pero no insertó el bloque seleccionado');

  await page.evaluate(()=>addWordBlock(0,-1,'diagram'));
  await page.waitForSelector('[data-v75-open-diagram]',{state:'attached',timeout:10000});
  await page.locator('[data-v75-open-diagram]').last().click({force:true});
  await page.waitForFunction(()=>document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000});
  await page.waitForSelector('#v75ContextBody .word-diagram-builder',{state:'attached',timeout:5000});
  const drawerVisible=await page.locator('#wordContextDrawer').evaluate(el=>el.classList.contains('open'));
  assert(drawerVisible,'“Abrir constructor visual” no abrió el inspector contextual');

  await page.locator('#v75ContextClose').click({force:true});
  await page.waitForFunction(()=>!document.getElementById('wordContextDrawer')?.classList.contains('open'),{timeout:5000});
  const drawerClosed=await page.locator('#wordContextDrawer').evaluate(el=>!el.classList.contains('open'));
  assert(drawerClosed,'El inspector contextual no se pudo cerrar');

  await page.locator('#v75PanelBtn').click({force:true});
  assert(await page.evaluate(()=>document.body.classList.contains('v75-panel-hidden')),'El botón Panel no ocultó el lateral');
  await page.locator('#v75PanelBtn').click({force:true});
  assert(await page.evaluate(()=>!document.body.classList.contains('v75-panel-hidden')),'El botón Panel no restauró el lateral');

  await page.locator('#v75FocusBtn').click({force:true});
  assert(await page.evaluate(()=>document.body.classList.contains('v75-focus-mode')),'El botón Enfoque no activó el modo enfoque');
  await page.locator('#v75FocusBtn').click({force:true});
  assert(await page.evaluate(()=>!document.body.classList.contains('v75-focus-mode')),'El botón Enfoque no desactivó el modo enfoque');

  assert(pageErrors.length===0,`Errores JavaScript durante la prueba: ${pageErrors.join(' | ')}`);
  console.log('UI smoke PASS: insertar bloque, constructor visual, panel y enfoque.');
} finally {
  await browser.close();
}
