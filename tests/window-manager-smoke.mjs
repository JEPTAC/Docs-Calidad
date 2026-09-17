import { chromium } from 'playwright';

const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
function assert(ok,message){if(!ok)throw new Error(message)}

try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&typeof render==='function'&&window.EI_FLOATING_WINDOWS_READY===true,{timeout:15000});
  const skip=page.locator('#introSkip');if(await skip.count()&&await skip.isVisible().catch(()=>false))await skip.click();
  await page.evaluate(()=>{doc.wordType='manual';setMode('word');doc.sections=[{n:'1',t:'CONTENIDO',c:'',sub:[],blocks:[newWordBlock('table'),newWordBlock('chart'),newWordBlock('kpi'),newWordBlock('list')]}];render()});
  await page.waitForSelector('[data-word-heavy-open="0:-1:0"]',{state:'visible',timeout:10000});

  const sidebarLabels=await page.evaluate(()=>{
    const pick=sel=>{const input=document.querySelector(sel);const label=input?.closest('label');return label?getComputedStyle(label).color:null};
    return {numero:pick('[data-word-sec-n="0"]'),titulo:pick('[data-word-sec-t="0"]'),contenido:pick('[data-word-sec-c="0"]')};
  });
  assert(Object.values(sidebarLabels).every(c=>c==='rgb(255, 255, 255)'),`Los rótulos sobre el lateral azul deben ser blancos: ${JSON.stringify(sidebarLabels)}`);

  const cards=await page.evaluate(()=>[...document.querySelectorAll('.word-heavy-card')].map(card=>{const h=card.querySelector('.hint'),r=card.getBoundingClientRect();return{overflow:card.scrollWidth-card.clientWidth,width:r.width,hint:getComputedStyle(h).color,buttons:[...card.querySelectorAll('.word-block-editor-head button')].every(b=>{const x=b.getBoundingClientRect();return x.left>=r.left-1&&x.right<=r.right+1})}}));
  assert(cards.length===4,'Deben existir cuatro tarjetas compactas de prueba');
  assert(cards.every(x=>x.overflow<=2&&x.buttons),`Hay tarjetas desbordadas: ${JSON.stringify(cards)}`);
  assert(cards.every(x=>x.hint==='rgb(71, 84, 103)'),`Los textos de ayuda deben ser legibles: ${JSON.stringify(cards)}`);

  await page.locator('[data-word-heavy-open="0:-1:0"]').click();
  await page.waitForSelector('#wordHeavyOverlay .word-heavy-dialog.wm-managed',{state:'visible',timeout:5000});
  const initial=await page.evaluate(()=>{const o=document.getElementById('wordHeavyOverlay'),d=o.querySelector('.word-heavy-dialog'),r=d.getBoundingClientRect();return{aria:d.getAttribute('aria-modal'),overlay:getComputedStyle(o).pointerEvents,backdrop:getComputedStyle(o.querySelector('.word-heavy-backdrop')).display,resize:getComputedStyle(d).resize,width:r.width,height:r.height,left:r.left,top:r.top}});
  assert(initial.aria==='false','La ventana pesada no debe declararse modal');
  assert(initial.overlay==='none'&&initial.backdrop==='none','El editor flotante no debe bloquear el fondo');
  assert(initial.resize==='both','La ventana debe poder redimensionarse manualmente');
  assert(initial.width>=600&&initial.width<=820&&initial.height>=420&&initial.height<=600,`El tamaño inicial debe ser mediano: ${JSON.stringify(initial)}`);

  await page.evaluate(()=>{const b=document.createElement('button');b.id='wmBackgroundProbe';b.textContent='probe';b.style.cssText='position:fixed;left:12px;top:120px;z-index:20';b.onclick=()=>window.WM_BACKGROUND_CLICKS=(window.WM_BACKGROUND_CLICKS||0)+1;document.body.appendChild(b)});
  await page.locator('#wmBackgroundProbe').click();
  assert(await page.evaluate(()=>window.WM_BACKGROUND_CLICKS===1),'El fondo quedó bloqueado por la ventana flotante');

  const header=page.locator('#wordHeavyOverlay .word-heavy-dialog>header');const hb=await header.boundingBox();
  await page.mouse.move(hb.x+120,hb.y+22);await page.mouse.down();await page.mouse.move(hb.x+205,hb.y+82,{steps:6});await page.mouse.up();await page.waitForTimeout(120);
  const moved=await page.evaluate(()=>{const r=document.querySelector('#wordHeavyOverlay .word-heavy-dialog').getBoundingClientRect();return{left:r.left,top:r.top}});
  assert(Math.abs(moved.left-initial.left)>35||Math.abs(moved.top-initial.top)>35,`La ventana no se pudo mover: ${JSON.stringify({initial,moved})}`);

  const beforeResize=await page.locator('#wordHeavyOverlay .word-heavy-dialog').boundingBox();
  await page.mouse.move(beforeResize.x+beforeResize.width-3,beforeResize.y+beforeResize.height-3);await page.mouse.down();await page.mouse.move(beforeResize.x+beforeResize.width+55,beforeResize.y+beforeResize.height+35,{steps:7});await page.mouse.up();await page.waitForTimeout(150);
  const afterResize=await page.locator('#wordHeavyOverlay .word-heavy-dialog').boundingBox();
  assert(afterResize.width>beforeResize.width+20||afterResize.height>beforeResize.height+20,`El usuario no pudo redimensionar la ventana: ${JSON.stringify({beforeResize,afterResize})}`);

  await page.locator('[data-wm-minimize]').click();assert(await page.locator('#wordHeavyOverlay .word-heavy-dialog').evaluate(el=>el.classList.contains('wm-minimized')),'Minimizar no funcionó');
  await page.locator('[data-wm-minimize]').click();assert(!(await page.locator('#wordHeavyOverlay .word-heavy-dialog').evaluate(el=>el.classList.contains('wm-minimized'))),'Restaurar no funcionó');
  await page.locator('button.word-heavy-close[data-word-heavy-close]').click();

  await page.evaluate(()=>{doc.sections=[{n:'1',t:'CONTENIDO',c:'',sub:[],blocks:[newWordBlock('diagram')]}];render();v75OpenDrawer('0:-1:0')});
  await page.waitForSelector('#wordContextDrawer.open.wm-managed',{state:'visible',timeout:5000});
  const drawer=await page.evaluate(()=>{const d=document.getElementById('wordContextDrawer'),r=d.getBoundingClientRect();return{resize:getComputedStyle(d).resize,width:r.width,height:r.height,left:r.left,top:r.top}});
  assert(drawer.resize==='both'&&drawer.width>=360&&drawer.width<=620,'El constructor visual no quedó como ventana mediana redimensionable');
  const dh=await page.locator('#wordContextDrawer .v75-context-head').boundingBox();await page.mouse.move(dh.x+120,dh.y+20);await page.mouse.down();await page.mouse.move(dh.x+180,dh.y+65,{steps:5});await page.mouse.up();await page.waitForTimeout(100);
  const drawerMoved=await page.evaluate(()=>{const r=document.getElementById('wordContextDrawer').getBoundingClientRect();return{left:r.left,top:r.top}});
  assert(Math.abs(drawerMoved.left-drawer.left)>25||Math.abs(drawerMoved.top-drawer.top)>25,'El constructor visual no se puede mover');

  console.log('WINDOW MANAGER PASS: contraste del lateral, tarjetas adaptativas y ventanas no modales verificados.');
} finally {await browser.close()}
