import { chromium } from 'playwright';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
function assert(ok,msg){if(!ok)throw new Error(msg)}
try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&typeof paginateWordEntries==='function'&&typeof detectEditorialNote==='function',{timeout:15000});
  const skip=page.locator('#introSkip');if(await skip.count()&&await skip.isVisible().catch(()=>false))await skip.click();
  await page.evaluate(()=>{
    setMode('word');doc.wordType='manual';doc.title='PRUEBA MOTOR DOCUMENTAL';doc.code='QA-FT-01';doc.version='1';
    const rows=[['Columna A','Columna B','Columna C']];
    for(let i=1;i<=52;i++)rows.push([`Registro ${i}`,`Descripción operativa suficientemente amplia para validar la distribución de la fila ${i} sin cortes arbitrarios.`,`Estado ${i%2?'Activo':'Pendiente'}`]);
    doc.sections=[{n:'1',t:'CONTENIDO',c:'Este contenido inicial valida que el título principal permanezca unido al primer párrafo cuando exista espacio suficiente.',sub:[],blocks:[
      {id:'h1',type:'heading',text:'Planeación y ejecución',content:'Este párrafo pertenece directamente al subtítulo y debe viajar con él.\n\nEste segundo párrafo puede continuar de forma natural si la página requiere un salto.',level:2,numbered:true,keepWithNext:true},
      {id:'n1',type:'text',text:'Nota: Esta observación fue detectada automáticamente por el motor semántico.',align:'justify',autoSemantic:true},
      {id:'t1',type:'table',title:'Matriz extensa de validación',caption:'Fuente: prueba automatizada Docs-Calidad.',header:true,repeatHeader:true,cantSplitRows:true,striped:true,rows}
    ]}];render();
  });
  await page.waitForTimeout(400);
  const result=await page.evaluate(()=>{
    const pages=[...document.querySelectorAll('#stage .sgc-page')];
    const contentPages=pages.filter(p=>p.querySelector('.word-title-group,.word-table-figure,.word-heading-group'));
    const tables=[...document.querySelectorAll('#stage .word-table-figure')];
    const headers=tables.map(t=>[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()).join('|'));
    const overflows=contentPages.map(p=>{const c=p.querySelector('.sgc-content');return c?Math.max(0,c.scrollHeight-c.clientHeight):0});
    const heading=document.querySelector('#stage .word-heading-group');
    return {pages:pages.length,contentPages:contentPages.length,tables:tables.length,headers,continuations:document.querySelectorAll('#stage .word-table-figure.is-continuation').length,autoNotes:document.querySelectorAll('#stage .word-callout.auto-note').length,headingContent:heading?.querySelector('.word-heading-content')?.textContent||'',overflows};
  });
  assert(result.pages>=4,'El documento extenso no produjo paginación real');
  assert(result.tables>=2&&result.continuations>=1,'La tabla extensa no se fragmentó entre páginas');
  assert(result.headers.every(h=>h==='Columna A|Columna B|Columna C'),'Los encabezados de columna no se repitieron correctamente en cada fragmento');
  assert(result.autoNotes===1,'La nota semántica no fue detectada automáticamente');
  assert(/pertenece directamente al subtítulo/i.test(result.headingContent),'El subtítulo perdió su contenido asociado');
  assert(result.overflows.every(x=>x<=2),`Hay páginas con contenido desbordado: ${result.overflows.join(', ')}`);
  assert(errors.length===0,`Errores JS: ${errors.join(' | ')}`);
  console.log('DOCUMENT LAYOUT PASS: paginación medida, subtítulo+contenido, nota automática, tabla multipágina y encabezados repetidos.');
}finally{await browser.close()}
