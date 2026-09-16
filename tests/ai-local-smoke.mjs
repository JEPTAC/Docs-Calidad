import { chromium } from 'playwright';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
function assert(ok,msg){if(!ok)throw new Error(msg)}
try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&typeof render==='function',{timeout:10000});
  const skip=page.locator('#introSkip');if(await skip.count()&&await skip.isVisible().catch(()=>false))await skip.click();
  await page.evaluate(()=>{if(typeof doc!=='undefined')doc.wordType='manual';setMode('word');render()});
  await page.waitForFunction(()=>window.EI_AI_CORE_READY===true&&window.EI_AI_IMPORT_READY===true&&window.EI_AI_UI_READY===true,{timeout:10000});
  const btn=page.locator('#eiAiBtn');assert(await btn.isVisible(),'No aparece el botón IA local');await btn.click();
  await page.waitForSelector('#eiAiDrawer.open',{state:'visible'});assert(await page.locator('.ei-ai-privacy').isVisible(),'Falta aviso de privacidad local');
  const hw=await page.evaluate(()=>eiAiHardware());assert(typeof hw.webgpu==='boolean','No se detectaron capacidades WebGPU');
  await page.locator('#eiAiFile').setInputFiles({name:'prueba.txt',mimeType:'text/plain',buffer:Buffer.from('OBJETIVO\nEste texto qeu necesita correccion.\n\nALCANCE\nAplica al proceso de prueba.','utf8')});
  await page.waitForFunction(()=>window.EI_AI?.imported?.name==='prueba.txt',{timeout:7000});
  const stats=await page.evaluate(()=>eiAiImportedStats());assert(stats.sections>=2,'No se detectó la estructura básica del archivo');assert(stats.words>5,'No se extrajo texto del archivo');
  await page.locator('[data-ei-ai-action="correct"]').click();await page.waitForFunction(()=>window.EI_AI?.lastResult?.includes('que necesita'),{timeout:5000});
  assert((await page.locator('#eiAiResult').innerText()).includes('que necesita'),'La corrección local sin modelo no produjo resultado');
  await page.locator('[data-ei-ai-import-word="replace"]').click();await page.waitForTimeout(300);
  const imported=await page.evaluate(()=>({titles:doc.sections.map(s=>s.t),contents:doc.sections.map(s=>s.c)}));assert(imported.titles.some(x=>String(x).includes('OBJETIVO')),'No se importó OBJETIVO a Word Studio');assert(imported.contents.join(' ').includes('Este texto'),'No se incorporó el contenido importado');
  const colors=await page.evaluate(()=>{const p=getComputedStyle(document.querySelector('.ei-ai-privacy'));const h=getComputedStyle(document.querySelector('.ei-ai-head'));return{privacyBg:p.backgroundColor,privacyColor:p.color,headBg:h.backgroundColor,headColor:h.color}});assert(colors.privacyColor==='rgb(0, 31, 115)','Aviso crema debe usar texto azul');assert(colors.headBg==='rgb(0, 31, 115)'&&colors.headColor==='rgb(255, 255, 255)','Cabecera IA azul debe usar texto blanco');
  assert(errors.length===0,`Errores JS: ${errors.join(' | ')}`);console.log('AI local smoke PASS: drawer, privacidad, TXT local, análisis estructural, corrección fallback e importación a Word Studio.');
}finally{await browser.close()}
