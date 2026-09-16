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
  await page.waitForFunction(()=>window.EI_AI_CORE_READY===true&&window.EI_AI_IMPORT_READY===true&&window.EI_AI_UI_READY===true&&window.EI_AI_CENTER_V81===true,{timeout:10000});

  const fab=page.locator('#eiAiFab');assert(await fab.isVisible(),'No aparece el botón flotante del Centro IA');await fab.click();
  await page.waitForSelector('#eiAiFabMenu.open',{state:'visible'});assert(await page.locator('[data-ei-ai-open-tab="chat"]').isVisible(),'Falta acceso Bot');assert(await page.locator('[data-ei-ai-open-tab="file"]').isVisible(),'Falta acceso Subir');assert(await page.locator('[data-ei-ai-open-tab="model"]').isVisible(),'Falta acceso Cargar IA');

  await page.locator('[data-ei-ai-open-tab="file"]').click();await page.waitForSelector('#eiAiDrawer.open',{state:'visible'});assert(await page.locator('[data-ei-ai-panel="file"].active').isVisible(),'No abrió la ventana de archivo');assert(await page.locator('.ei-ai-privacy').isVisible(),'Falta aviso de privacidad local');
  const hw=await page.evaluate(()=>eiAiHardware());assert(typeof hw.webgpu==='boolean','No se detectaron capacidades WebGPU');

  const csv='Categoria,Valor,Fecha\nA,10,2026-01-01\nB,22,2026-02-01\nC,16,2026-03-01\nD,31,2026-04-01';
  await page.locator('#eiAiFile').setInputFiles({name:'indicadores.csv',mimeType:'text/csv',buffer:Buffer.from(csv,'utf8')});
  await page.waitForFunction(()=>window.EI_AI?.imported?.name==='indicadores.csv',{timeout:10000});
  const stats=await page.evaluate(()=>eiAiImportedStats());assert(stats.tables>=1,'CSV no produjo tabla');assert(stats.documentType==='Datos tabulares','CSV no fue reconocido como datos tabulares');
  const analysis=await page.evaluate(()=>window.EI_AI.imported.analysis);assert(analysis.tableProfiles?.[0]?.hasHeader===true,'No detectó encabezados del CSV');assert(analysis.tableProfiles?.[0]?.chartable===true,'No detectó columnas aptas para gráfica');assert(analysis.chartCandidates>=1,'No propuso gráfica para el CSV');
  assert((await page.locator('#eiAiAnalysisCard').innerText()).includes('Esto entendí del archivo'),'No se mostró el análisis inteligente');assert((await page.locator('#eiAiAnalysisCard').innerText()).includes('apta para gráfica'),'No se mostró la recomendación de gráfica');

  const beforeCharts=await page.evaluate(()=>doc.sections.reduce((n,s)=>n+(s.blocks||[]).filter(b=>b.type==='chart').length+(s.sub||[]).reduce((m,ss)=>m+(ss.blocks||[]).filter(b=>b.type==='chart').length,0),0));
  await page.locator('[data-ei-ai-data-chart]').click();await page.waitForTimeout(350);
  const afterCharts=await page.evaluate(()=>doc.sections.reduce((n,s)=>n+(s.blocks||[]).filter(b=>b.type==='chart').length+(s.sub||[]).reduce((m,ss)=>m+(ss.blocks||[]).filter(b=>b.type==='chart').length,0),0));assert(afterCharts===beforeCharts+1,'No creó la gráfica desde el CSV');

  await page.locator('[data-ei-ai-tab="tools"]').click();assert(await page.locator('[data-ei-ai-panel="tools"].active').isVisible(),'No abrió Herramientas');await page.locator('[data-ei-ai-action="summary"]').click();await page.waitForFunction(()=>window.EI_AI?.lastResult?.length>5,{timeout:5000});assert(await page.locator('[data-ei-ai-panel="result"].active').isVisible(),'El resultado no abrió su pestaña');

  await page.locator('[data-ei-ai-tab="file"]').click();await page.locator('[data-ei-ai-import-word="append"]').click();await page.waitForTimeout(300);const importedTables=await page.evaluate(()=>doc.sections.reduce((n,s)=>n+(s.blocks||[]).filter(b=>b.type==='table').length,0));assert(importedTables>=1,'El CSV no se incorporó como tabla de Word Studio');

  await page.locator('[data-ei-ai-tab="chat"]').click();assert(await page.locator('#eiAiPrompt').isVisible(),'El Bot no está disponible');await page.locator('[data-ei-ai-tab="model"]').click();assert(await page.locator('#eiAiLoadModel').isVisible(),'No está disponible Cargar IA');
  const colors=await page.evaluate(()=>{const p=getComputedStyle(document.querySelector('.ei-ai-privacy'));const h=getComputedStyle(document.querySelector('.ei-ai-head'));const f=getComputedStyle(document.querySelector('#eiAiFab'));return{privacyBg:p.backgroundColor,privacyColor:p.color,headBg:h.backgroundColor,headColor:h.color,fabBg:f.backgroundColor,fabColor:f.color}});assert(colors.privacyColor==='rgb(0, 31, 115)','Aviso crema debe usar texto azul');assert(colors.headBg==='rgb(0, 31, 115)'&&colors.headColor==='rgb(255, 255, 255)','Cabecera IA azul debe usar texto blanco');assert(colors.fabBg==='rgb(0, 31, 115)'&&colors.fabColor==='rgb(255, 255, 255)','Botón flotante IA debe ser azul con texto blanco');
  assert(errors.length===0,`Errores JS: ${errors.join(' | ')}`);console.log('AI Center V81 PASS: FAB, Bot, Subir, Modelo, CSV inteligente, gráfica automática, resumen e importación tabular.');
}finally{await browser.close()}
