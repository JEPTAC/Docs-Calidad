/* ===== V86.1 · HARDENING IA =================================================
   - Unifica el orden de mensajes también para WebLLM.
   - Single-flight durante la carga del motor para evitar inicializaciones paralelas.
   - Amplía el paquete oficial colombiano de tránsito con Decreto 1079/2015.
   - Resincroniza perfiles V86 después de cualquier render del Centro IA.
   Capa aditiva. No modifica la plantilla SGC.
============================================================================= */
const V861_BLUE='#001F73';

// Fuente reglamentaria complementaria, verificada en Función Pública.
try{
  const pack=V86_KNOWLEDGE_PACKS?.find?.(p=>p.id==='co-transito');
  if(pack&&!pack.sources.some(s=>/77889/.test(s.url||''))){
    pack.sources.push({
      title:'Decreto 1079 de 2015 · Decreto Único Reglamentario del Sector Transporte',
      url:'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77889',
      authority:'Departamento Administrativo de la Función Pública'
    });
  }
}catch(err){console.warn('V86.1 pack tránsito:',err)}

// Single-flight: si dos eventos intentan cargar modelo, comparten la misma promesa.
const v861LoadModelPrevious=eiAiLoadModel;
let v861LoadPromise=null;
eiAiLoadModel=async function(requested=V86?.profile||'smart:auto'){
  if(v861LoadPromise)return v861LoadPromise;
  v861LoadPromise=Promise.resolve().then(()=>v861LoadModelPrevious(requested));
  try{return await v861LoadPromise}finally{v861LoadPromise=null}
};

// WebLLM también usa el constructor de mensajes V85: un solo system en posición 0.
const v861GeneratePrevious=eiAiGenerate;
eiAiGenerate=async function(instruction,options={}){
  if(EI_AI.provider!=='webllm')return v861GeneratePrevious(instruction,options);
  if(!EI_AI.engine||!EI_AI.verified)throw new Error('La IA WebLLM todavía no está verificada. Cárgala desde “Modelo”.');
  const userText=String(instruction||'').trim();
  const messages=v84Messages(userText,options?.context||'',!!options?.conversation);
  if(typeof v85ValidateMessageOrder==='function'&&!v85ValidateMessageOrder(messages))throw new Error('La conversación interna no tiene un orden válido. Reinicia el chat y vuelve a intentarlo.');
  const maxTokens=Math.max(64,Math.min(1800,Number(options?.maxTokens)||700));
  const temperature=Number.isFinite(Number(options?.temperature))?Number(options.temperature):.15;
  const onUpdate=typeof options?.onUpdate==='function'?options.onUpdate:null;
  const generation=++EI_AI.generationId;
  const started=performance.now();let firstTokenAt=0,text='';
  EI_AI.busy=true;eiAiSetStatus('thinking','Redactando con WebLLM…',1);
  try{
    const stream=await EI_AI.engine.chat.completions.create({messages,temperature,top_p:.9,max_tokens:maxTokens,stream:true});
    for await(const chunk of stream){
      if(generation!==EI_AI.generationId)break;
      const delta=chunk?.choices?.[0]?.delta?.content||'';
      if(delta&&!firstTokenAt)firstTokenAt=performance.now();
      text+=delta;
      if(onUpdate)onUpdate(text,{streaming:true});
    }
    text=text.trim();
    if(!text)throw new Error('El modelo no produjo contenido. Prueba nuevamente o cambia de perfil.');
    EI_AI.lastResult=text;
    EI_AI.metrics.lastMs=Math.round(performance.now()-started);
    EI_AI.metrics.firstTokenMs=firstTokenAt?Math.round(firstTokenAt-started):null;
    if(options?.conversation){eiAiRemember('user',userText);eiAiRemember('assistant',text)}else eiAiRemember('assistant',text);
    eiAiSetStatus('ready','IA verificada y lista',1);
    if(onUpdate)onUpdate(text,{streaming:false});
    return text;
  }catch(err){eiAiSetStatus('error',String(err?.message||err),1);throw err}
  finally{EI_AI.busy=false}
};

function v861SyncSmartUi(){
  const select=document.getElementById('eiAiModel');
  if(select){
    const hasSmart=[...select.options].some(o=>o.value==='smart:auto');
    if(!hasSmart){
      select.innerHTML=V86_PROFILES.map(p=>`<option value="${p.id}" ${p.id===V86.profile?'selected':''}>${eiAiEscape(p.label)} · ${eiAiEscape(p.detail)}</option>`).join('');
    }
    if([...select.options].some(o=>o.value===V86.profile))select.value=V86.profile;
    select.dataset.v86='1';
    EI_AI.model=V86.profile;
  }
  if(typeof v86EnhanceUi==='function')v86EnhanceUi();
}

const v861EnsureUiPrevious=eiAiEnsureUi;
eiAiEnsureUi=function(){const r=v861EnsureUiPrevious();v861SyncSmartUi();return r};
const v861OpenPrevious=eiAiOpen;
eiAiOpen=function(tab='chat'){const r=v861OpenPrevious(tab);v861SyncSmartUi();queueMicrotask(v861SyncSmartUi);return r};
const v861SetTabPrevious=eiAiSetTab;
eiAiSetTab=function(tab='chat'){const r=v861SetTabPrevious(tab);if(tab==='model'||tab==='tools'||tab==='chat')queueMicrotask(v861SyncSmartUi);return r};
window.addEventListener('DOMContentLoaded',()=>setTimeout(v861SyncSmartUi,0));

window.EI_AI_V861_HARDENED=true;
