/* ===== V85 · ORDEN DE MENSAJES IA ===========================================
   Corrige SystemMessageOrderError en Transformers.js/Qwen.
   Regla: un único system en posición 0; después historial user/assistant válido;
   la instrucción actual siempre termina como user.
   Capa aditiva: no modifica SGC ni el motor documental.
============================================================================= */
const V85_AI_MESSAGE_ORDER_VERSION='85.0.0';

function v85CleanHistory(){
  const raw=typeof eiAiHistoryForModel==='function'?eiAiHistoryForModel():[];
  const filtered=(raw||[])
    .filter(m=>m&&['user','assistant'].includes(m.role)&&String(m.content||'').trim())
    .map(m=>({role:m.role,content:String(m.content).trim()}));

  // Un chat válido no debe empezar con assistant después del system.
  while(filtered.length&&filtered[0].role==='assistant')filtered.shift();

  // Consolidar roles consecutivos para evitar secuencias user/user o assistant/assistant.
  const normalized=[];
  for(const m of filtered){
    const last=normalized[normalized.length-1];
    if(last&&last.role===m.role){
      last.content=`${last.content}\n\n${m.content}`.trim();
    }else normalized.push({...m});
  }

  // La nueva instrucción será user; quitamos un user huérfano final si existiera.
  if(normalized.length&&normalized[normalized.length-1].role==='user')normalized.pop();
  return normalized.slice(-6);
}

function v85SystemContent(context=''){
  let content=String(typeof eiAiSystemPrompt==='function'?eiAiSystemPrompt():'Eres un asistente documental profesional.').trim();
  const ctx=String(context||'').trim();
  if(ctx){
    content+=`\n\nCONTEXTO DOCUMENTAL RELEVANTE:\n---\n${ctx.slice(0,4800)}\n---\nResponde usando este contexto cuando la pregunta dependa del documento. Si el contexto no contiene un dato necesario, indícalo expresamente y no lo inventes.`;
  }
  return content;
}

// v84Messages era la causa directa del SystemMessageOrderError: generaba dos system.
v84Messages=function(instruction,context='',conversation=false){
  const messages=[{role:'system',content:v85SystemContent(context)}];
  if(conversation)messages.push(...v85CleanHistory());
  messages.push({role:'user',content:String(instruction||'').trim()});
  return messages;
};

function v85ValidateMessageOrder(messages){
  if(!Array.isArray(messages)||!messages.length)return false;
  if(messages[0]?.role!=='system')return false;
  if(messages.slice(1).some(m=>m?.role==='system'))return false;
  if(messages[messages.length-1]?.role!=='user')return false;
  for(let i=1;i<messages.length-1;i++){
    if(!['user','assistant'].includes(messages[i]?.role))return false;
    if(i>1&&messages[i-1]?.role===messages[i]?.role)return false;
  }
  return true;
}

// Guard de diagnóstico visible para evitar enviar secuencias inválidas al modelo.
const v85BaseGenerate=eiAiGenerate;
eiAiGenerate=async function(instruction,options={}){
  if(EI_AI.provider==='transformers'){
    const preview=v84Messages(instruction,options?.context||'',!!options?.conversation);
    if(!v85ValidateMessageOrder(preview)){
      throw new Error('La conversación interna no tiene un orden válido. Reinicia el chat y vuelve a intentarlo.');
    }
  }
  return v85BaseGenerate(instruction,options);
};

window.EI_AI_V85_MESSAGE_ORDER_READY=true;
