import { chromium } from 'playwright';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
function assert(ok,msg){if(!ok)throw new Error(msg)}
try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&window.EI_AI_V84_READY===true&&window.EI_AI_V85_MESSAGE_ORDER_READY===true,{timeout:15000});
  const skip=page.locator('#introSkip');if(await skip.count()&&await skip.isVisible().catch(()=>false))await skip.click();
  await page.evaluate(()=>{if(typeof doc!=='undefined')doc.wordType='manual';setMode('word');render();eiAiEnsureUi()});

  await page.locator('#eiAiFab').click();await page.locator('[data-ei-ai-open-tab="file"]').click();
  assert(await page.locator('[data-ei-ai-csv-template]').isVisible(),'Falta descarga de plantilla CSV canónica');

  const csv='orden,tipo,nivel,texto,lista_ordenada,incluir,pagina,origen\n1,titulo,1,OBJETIVO,,true,,chatgpt\n2,parrafo,,Definir el propósito documental.,,true,,chatgpt\n3,titulo,2,RESPONSABILIDADES,,true,,chatgpt\n4,lista,,Responsable A\\nResponsable B,false,true,,chatgpt';
  await page.locator('#eiAiFile').setInputFiles({name:'estructura-docs-calidad.csv',mimeType:'text/csv',buffer:Buffer.from(csv,'utf8')});
  await page.waitForFunction(()=>window.EI_AI?.imported?.canonical===true,{timeout:12000});
  const canonical=await page.evaluate(()=>({type:EI_AI.imported.analysis.documentType,confidence:EI_AI.imported.analysis.confidence,heads:EI_AI.imported.blocks.filter(b=>b.type==='heading').map(b=>[b.level,b.text]),lists:EI_AI.imported.blocks.filter(b=>b.type==='list').length}));
  assert(canonical.type==='Estructura CSV Docs-Calidad','El CSV canónico no fue reconocido como estructura documental');
  assert(canonical.confidence===100,'El CSV canónico debe tener confianza determinista del 100%');
  assert(canonical.heads.length===2&&canonical.heads[0][0]===1&&canonical.heads[1][0]===2,'No reconstruyó la jerarquía de títulos del CSV');
  assert(canonical.lists===1,'No reconstruyó la lista del CSV');
  assert(await page.locator('[data-ei-ai-export-csv]').isVisible(),'Falta exportar la estructura detectada a CSV');

  const heuristics=await page.evaluate(()=>{
    const explicit=v84ExplicitHeading('6.1.1SUBCONTRATACIÓN');
    const makeBold=(text)=>new DOMParser().parseFromString(`<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:r><w:rPr><w:b/></w:rPr><w:t>${text}</w:t></w:r></w:p>`,'application/xml').documentElement;
    let structural=2;
    const general=v84ParagraphMeta(makeBold('OBJETIVO GENERAL'),new Map(),{nums:new Map(),abstracts:new Map()},new Map(),structural);
    if(v84AdvancesStructuralLevel(general))structural=general.heading;
    const specific=v84ParagraphMeta(makeBold('OBJETIVOS ESPECÍFICOS'),new Map(),{nums:new Map(),abstracts:new Map()},new Map(),structural);
    if(v84AdvancesStructuralLevel(specific))structural=specific.heading;
    const numXml=new DOMParser().parseFromString('<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="5"><w:lvl w:ilvl="0"><w:start w:val="3"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1"/></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2"/></w:lvl></w:abstractNum><w:num w:numId="26"><w:abstractNumId w:val="5"/></w:num></w:numbering>','application/xml');
    const numbering=v84NumberingMap(numXml),state=new Map();v84NumberLabel('26',0,numbering,state);const child=v84NumberLabel('26',1,numbering,state);
    return{explicit,siblings:[general.heading,specific.heading],visualAdvance:v84AdvancesStructuralLevel(general),structural,number:child?.label};
  });
  assert(heuristics.explicit?.level===3&&heuristics.explicit?.text==='SUBCONTRATACIÓN','No detectó encabezado numerado sin espacio');
  assert(heuristics.siblings[0]===3&&heuristics.siblings[1]===3&&!heuristics.visualAdvance&&heuristics.structural===2,'Los encabezados visuales hermanos alteraron incorrectamente el padre semántico');
  assert(heuristics.number==='3.1','No reconstruyó numeración OOXML multinivel');

  // Reproduce la ruta exacta que antes lanzaba SystemMessageOrderError.
  const messageOrder=await page.evaluate(async()=>{
    const oldHistory=[...(EI_AI.history||[])],oldProvider=EI_AI.provider,oldVerified=EI_AI.verified,oldWorker=window.V84_AI.worker,oldRpc=v84Rpc;
    let captured=null;
    try{
      EI_AI.history=[{role:'assistant',text:'Respuesta huérfana de una herramienta.'},{role:'user',text:'Pregunta anterior.'},{role:'assistant',text:'Respuesta anterior.'}];
      const preview=v84Messages('Pregunta actual','Contexto documental de prueba.',true);
      EI_AI.provider='transformers';EI_AI.verified=true;window.V84_AI.worker={};
      v84Rpc=async payload=>{captured=payload.messages;return{text:'Respuesta válida de prueba.'}};
      const answer=await eiAiGenerate('Pregunta actual',{context:'Contexto documental de prueba.',conversation:true,maxTokens:64});
      return{preview,captured,answer,valid:v85ValidateMessageOrder(preview)};
    }finally{
      EI_AI.history=oldHistory;EI_AI.provider=oldProvider;EI_AI.verified=oldVerified;window.V84_AI.worker=oldWorker;v84Rpc=oldRpc;
    }
  });
  const roles=messageOrder.preview.map(x=>x.role);
  assert(messageOrder.valid,'V85 considera inválido su propio orden de mensajes');
  assert(roles[0]==='system'&&roles.filter(x=>x==='system').length===1,'Debe existir exactamente un system y estar en la posición 0');
  assert(roles.at(-1)==='user','La instrucción actual debe ser el último mensaje user');
  assert(messageOrder.preview[0].content.includes('CONTEXTO DOCUMENTAL RELEVANTE'),'El contexto debe integrarse dentro del único system prompt');
  assert(messageOrder.captured?.filter(x=>x.role==='system').length===1,'La ruta real de generación volvió a enviar más de un system');
  assert(messageOrder.answer==='Respuesta válida de prueba.','La ruta Transformers simulada no terminó correctamente');

  await page.locator('[data-ei-ai-tab="model"]').click();
  const options=(await page.locator('#eiAiModel option').allTextContents()).join(' | ');
  assert(/Automática/i.test(options)&&/WASM/i.test(options),'Falta selector de IA automática con fallback WASM/CPU');
  const env=await page.evaluate(async()=>{
    const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm');
    return{wasm:typeof WebAssembly!=='undefined',ready:window.EI_AI_V84_READY===true,hierarchy:window.EI_AI_V84_HIERARCHY_READY===true,order:window.EI_AI_V85_MESSAGE_ORDER_READY===true,pipeline:typeof mod.pipeline==='function',streamer:typeof mod.TextStreamer==='function'};
  });
  assert(env.wasm&&env.ready&&env.hierarchy&&env.order,'El fallback compatible, la jerarquía o el corrector V85 no están disponibles en el navegador');
  assert(env.pipeline&&env.streamer,'Transformers.js no pudo importarse con pipeline/TextStreamer en el navegador');
  assert(errors.length===0,`Errores JS: ${errors.join(' | ')}`);
  console.log('AI V85 PASS: CSV, DOCX OOXML, fallback Transformers y orden system/user corregido sin SystemMessageOrderError.');
}finally{await browser.close()}
