/* V84 · jerarquía DOCX: los encabezados visuales no desplazan el padre semántico.
   Esto evita que encabezados hermanos guardados como Normal/List Paragraph se aniden
   artificialmente unos dentro de otros.
*/
function v84AdvancesStructuralLevel(meta){return !!meta?.heading && Number(meta.confidence||0)>.85}
const v84ReadDocxOoxmlPrevious=v84ReadDocxOoxml;
v84ReadDocxOoxml=async function(file){
  const JSZip=await v84EnsureJsZip(),zip=await JSZip.loadAsync(await file.arrayBuffer());
  const docText=await zip.file('word/document.xml')?.async('text');
  if(!docText)throw new Error('El DOCX no contiene word/document.xml.');
  const stylesText=await zip.file('word/styles.xml')?.async('text'),numberingText=await zip.file('word/numbering.xml')?.async('text');
  const documentXml=v84ParseXml(docText),styles=v84StylesMap(stylesText?v84ParseXml(stylesText):null),numbering=v84NumberingMap(numberingText?v84ParseXml(numberingText):null),numState=new Map(),body=v84First(documentXml,'body'),blocks=[],tables=[],headings=[];
  let structuralLevel=1,seenHeading=false,documentTitle='';
  if(!body)throw new Error('No se encontró el cuerpo del documento.');
  for(const child of [...body.children]){
    if(child.localName==='tbl'){
      const rows=v84TableRows(child);
      if(rows.length){tables.push(rows);v84PushBlock(blocks,eiAiBlock('table','',{rows,source:'docx:ooxml'}))}
      continue;
    }
    if(child.localName!=='p')continue;
    const meta=v84ParagraphMeta(child,styles,numbering,numState,structuralLevel);
    if(!meta.rawText)continue;
    if(/^TOC\s*\d*$/i.test(meta.style.name)||/^Tabla de contenido/i.test(meta.style.name))continue;
    if(!seenHeading&&meta.boldRatio>=.8&&meta.align==='center'&&v84AllCaps(meta.rawText)&&/MANUAL|PROCEDIMIENTO|INSTRUCTIVO|GU[IÍ]A|INFORME/.test(meta.rawText.toUpperCase())){documentTitle=meta.rawText;continue}
    if(meta.heading){
      seenHeading=true;
      if(v84AdvancesStructuralLevel(meta))structuralLevel=meta.heading;
      const b=eiAiBlock('heading',meta.text,{level:meta.heading,source:meta.source,confidence:meta.confidence});
      b.numberLabel=meta.num?.kind==='number'?meta.num.label:'';b.styleName=meta.style.name;
      headings.push({level:b.level,text:b.text,numberLabel:b.numberLabel});v84PushBlock(blocks,b);continue;
    }
    if(meta.num?.kind==='bullet'){v84PushBlock(blocks,eiAiBlock('list',meta.rawText,{ordered:false,source:`docx:list:${meta.style.name}`}));continue}
    if(meta.num?.kind==='number'){v84PushBlock(blocks,eiAiBlock('list',meta.rawText,{ordered:true,source:`docx:list:${meta.style.name}`}));continue}
    v84PushBlock(blocks,eiAiBlock('paragraph',meta.rawText,{source:meta.source}));
  }
  const normalized=eiAiNormalizeBlocks(blocks);
  return{text:eiAiBlocksPlainText(normalized),blocks:normalized,headings,tables,tableNames:tables.map((_,i)=>`Tabla ${i+1}`),pages:null,warnings:[],documentTitle,parser:'ooxml-v84'};
};
window.EI_AI_V84_HIERARCHY_READY=true;

/* V85 · orden de mensajes para Transformers.js/Qwen.
   Qwen exige que el system prompt exista una sola vez y siempre sea el primer mensaje.
   V84 agregaba un segundo system para el contexto documental, lo que generaba
   SystemMessageOrderError en cualquier herramienta con contexto.
*/
function v85CleanHistory(){
  const raw=typeof eiAiHistoryForModel==='function'?eiAiHistoryForModel():[];
  const filtered=(raw||[])
    .filter(m=>m&&['user','assistant'].includes(m.role)&&String(m.content||'').trim())
    .map(m=>({role:m.role,content:String(m.content).trim()}));
  while(filtered.length&&filtered[0].role==='assistant')filtered.shift();
  const normalized=[];
  for(const m of filtered){
    const last=normalized[normalized.length-1];
    if(last&&last.role===m.role)last.content=`${last.content}\n\n${m.content}`.trim();
    else normalized.push({...m});
  }
  if(normalized.length&&normalized[normalized.length-1].role==='user')normalized.pop();
  return normalized.slice(-6);
}
function v85SystemContent(context=''){
  let content=String(typeof eiAiSystemPrompt==='function'?eiAiSystemPrompt():'Eres un asistente documental profesional.').trim();
  const ctx=String(context||'').trim();
  if(ctx)content+=`\n\nCONTEXTO DOCUMENTAL RELEVANTE:\n---\n${ctx.slice(0,4800)}\n---\nResponde usando este contexto cuando la pregunta dependa del documento. Si falta un dato, indícalo expresamente y no lo inventes.`;
  return content;
}
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
const v85GeneratePrevious=eiAiGenerate;
eiAiGenerate=async function(instruction,options={}){
  if(EI_AI.provider==='transformers'){
    const preview=v84Messages(instruction,options?.context||'',!!options?.conversation);
    if(!v85ValidateMessageOrder(preview))throw new Error('La conversación interna no tiene un orden válido. Reinicia el chat y vuelve a intentarlo.');
  }
  return v85GeneratePrevious(instruction,options);
};
window.EI_AI_V85_MESSAGE_ORDER_READY=true;
