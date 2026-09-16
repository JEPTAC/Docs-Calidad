import { chromium } from 'playwright';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
function assert(ok,msg){if(!ok)throw new Error(msg)}
try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof setMode==='function'&&window.EI_AI_V86_READY===true&&window.EI_AI_V861_HARDENED===true,{timeout:15000});
  const skip=page.locator('#introSkip');if(await skip.count()&&await skip.isVisible().catch(()=>false))await skip.click();
  await page.evaluate(()=>{if(typeof doc!=='undefined')doc.wordType='manual';setMode('word');render();eiAiEnsureUi()});

  await page.locator('#eiAiFab').click();await page.locator('[data-ei-ai-open-tab="model"]').click();
  const modelOptions=(await page.locator('#eiAiModel option').allTextContents()).join(' | ');
  assert(/Automática inteligente/i.test(modelOptions),'Falta perfil automático inteligente');
  assert(/Calidad/i.test(modelOptions)&&/3B/i.test(modelOptions),'Falta perfil Calidad 3B');
  assert(/Experta/i.test(modelOptions)&&/8B/i.test(modelOptions),'Falta perfil Experta 8B');

  await page.locator('[data-ei-ai-tab="chat"]').click();
  const lengths=await page.locator('#v86ResponseMode option').allTextContents();
  assert(lengths.includes('Extensa')&&lengths.includes('Profunda'),'Faltan modos de respuesta Extensa/Profunda');
  const deep=await page.evaluate(()=>({mode:v86ModeForQuery('Necesito un texto muy extenso y completo'),tokens:v86MaxTokens('Necesito un texto muy extenso y completo')}));
  assert(deep.mode==='deep'&&deep.tokens>=1500,'Una solicitud muy extensa no activa respuesta profunda de al menos 1500 tokens');

  const rag=await page.evaluate(()=>v86Bm25('licencia conductor tránsito',[{id:0,text:'Indicadores de calidad y producción.'},{id:1,text:'La licencia de conducción habilita al conductor conforme a las normas de tránsito.'},{id:2,text:'Mantenimiento preventivo de equipos.'}],2).map(x=>x.id));
  assert(rag[0]===1,'BM25 no priorizó la sección documental relevante');

  const legal=await page.evaluate(async()=>{
    const pack=v86PackForQuery('Busca norma vigente de tránsito para conductores y licencia');
    if(!pack)return null;
    const fake=[
      'LEY 769 DE 2002. Código Nacional de Tránsito Terrestre. ARTÍCULO 1. Las normas del presente Código rigen en todo el territorio nacional y regulan la circulación y actuación de las autoridades de tránsito.',
      'DECRETO 1079 DE 2015. Decreto Único Reglamentario del Sector Transporte. Compila la reglamentación del sector transporte.'
    ];
    pack.sources.slice(0,2).forEach((s,i)=>V86.cache.set(v86ReaderUrl(s.url),fake[i]||fake[0]));
    const result=await v86ResearchKnownPack('norma de tránsito conductor',pack);
    return{id:pack.id,count:pack.sources.length,hasDecreto:pack.sources.some(s=>/77889/.test(s.url||'')),context:result.context,sources:result.sources};
  });
  assert(legal?.id==='co-transito','No detectó el paquete colombiano de tránsito');
  assert(legal.count>=4&&legal.hasDecreto,'El paquete de tránsito no incluye Ley 769 y Decreto 1079 como fuentes oficiales');
  assert(/LEY 769|Código Nacional de Tránsito/i.test(legal.context),'La investigación oficial no recuperó contenido legal');
  assert(legal.sources.length>=2,'La investigación legal no devolvió fuentes citables');

  await page.locator('[data-ei-ai-tab="tools"]').click();
  assert(await page.locator('[data-ei-ai-action="expand"]').isVisible(),'Falta herramienta Ampliar contenido');
  assert(await page.locator('[data-ei-ai-action="research"]').isVisible(),'Falta herramienta Investigar fuentes');
  assert(await page.locator('.v86-research-card').isVisible(),'Falta panel de investigación fundamentada');

  // Prueba la ruta WebLLM real de composición de mensajes sin descargar un modelo.
  const webllm=await page.evaluate(async()=>{
    const old={provider:EI_AI.provider,engine:EI_AI.engine,verified:EI_AI.verified,history:[...(EI_AI.history||[])]};
    let captured=null;
    try{
      EI_AI.provider='webllm';EI_AI.verified=true;
      EI_AI.history=[{role:'assistant',text:'Huérfana'},{role:'user',text:'Pregunta previa'},{role:'assistant',text:'Respuesta previa'}];
      EI_AI.engine={chat:{completions:{create:async req=>{captured=req;return{async *[Symbol.asyncIterator](){yield{choices:[{delta:{content:'Respuesta '}}]};yield{choices:[{delta:{content:'WebLLM válida.'}}]}}}}}}};
      const answer=await eiAiGenerate('Desarrolla una respuesta extensa',{context:'Contexto documental de prueba.',conversation:true,maxTokens:1200});
      return{answer,roles:captured.messages.map(m=>m.role),systems:captured.messages.filter(m=>m.role==='system').length,max:captured.max_tokens,system:captured.messages[0]?.content||''};
    }finally{EI_AI.provider=old.provider;EI_AI.engine=old.engine;EI_AI.verified=old.verified;EI_AI.history=old.history}
  });
  assert(webllm.answer==='Respuesta WebLLM válida.','La ruta WebLLM unificada no devolvió streaming correctamente');
  assert(webllm.roles[0]==='system'&&webllm.systems===1&&webllm.roles.at(-1)==='user','WebLLM volvió a construir un orden inválido de mensajes');
  assert(webllm.system.includes('CONTEXTO DOCUMENTAL RELEVANTE'),'WebLLM no integró el contexto en el único system');
  assert(webllm.max===1200,'WebLLM no respetó una salida extensa de 1200 tokens');

  assert(errors.length===0,`Errores JS: ${errors.join(' | ')}`);
  console.log('AI V86 PASS: modelos 3B/8B, respuestas profundas, BM25, tránsito oficial y WebLLM unificado.');
}finally{await browser.close()}
