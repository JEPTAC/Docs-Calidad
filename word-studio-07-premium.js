/* ===== V67 · Premium Rich Text Layer =======================================
   Capa estrictamente aditiva: no modifica la maqueta SGC original.
   Añade texto enriquecido, sanitización, formato parcial, duplicado de bloques,
   conteo de palabras y exportación DOCX con formato inline.
============================================================================= */
const PREMIUM_BODY_SIZE_PT=10.5;
const PREMIUM_RICH_TAGS=new Set(['B','STRONG','I','EM','U','S','STRIKE','SUP','SUB','MARK','BR','A','SPAN','FONT','DIV','P']);
const premiumSavedRanges=new WeakMap();

function premiumEscapeText(v){return esc(String(v??'')).replace(/\r?\n/g,'<br>')}
function premiumSafeUrl(v){
  const s=String(v||'').trim();
  return /^(https?:\/\/|mailto:)/i.test(s)?s:'';
}
function premiumSafeCssColor(v){
  const s=String(v||'').trim();
  if(/^#[0-9a-f]{3,8}$/i.test(s)||/^rgba?\([\d\s.,%]+\)$/i.test(s)||/^hsla?\([\d\s.,%deg]+\)$/i.test(s))return s;
  return '';
}
function premiumSanitizeRichHtml(html){
  const template=document.createElement('template');template.innerHTML=String(html||'');
  const cleanNode=node=>{
    if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.nodeValue||'');
    if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
    const tag=node.tagName.toUpperCase();
    if(!PREMIUM_RICH_TAGS.has(tag)){
      const frag=document.createDocumentFragment();[...node.childNodes].forEach(ch=>frag.appendChild(cleanNode(ch)));return frag;
    }
    const out=document.createElement(tag==='STRIKE'?'s':tag==='FONT'?'span':tag.toLowerCase());
    if(tag==='A'){
      const href=premiumSafeUrl(node.getAttribute('href'));if(href){out.setAttribute('href',href);out.setAttribute('target','_blank');out.setAttribute('rel','noopener noreferrer')}
    }
    if(tag==='FONT'){
      const c=premiumSafeCssColor(node.getAttribute('color'));if(c)out.style.color=c;
    }
    if(tag==='SPAN'){
      const c=premiumSafeCssColor(node.style.color);const bg=premiumSafeCssColor(node.style.backgroundColor||node.style.background);
      if(c)out.style.color=c;if(bg)out.style.backgroundColor=bg;
      const fw=String(node.style.fontWeight||'').toLowerCase(),fs=String(node.style.fontStyle||'').toLowerCase(),td=String(node.style.textDecoration||node.style.textDecorationLine||'').toLowerCase(),va=String(node.style.verticalAlign||'').toLowerCase();
      if(fw==='bold'||Number(fw)>=600)out.style.fontWeight='700';if(fs==='italic')out.style.fontStyle='italic';if(td.includes('underline'))out.style.textDecoration='underline';if(td.includes('line-through'))out.style.textDecoration=(out.style.textDecoration?out.style.textDecoration+' ':'')+'line-through';if(va==='super'||va==='sub')out.style.verticalAlign=va;
    }
    [...node.childNodes].forEach(ch=>out.appendChild(cleanNode(ch)));return out;
  };
  const holder=document.createElement('div');[...template.content.childNodes].forEach(n=>holder.appendChild(cleanNode(n)));
  return holder.innerHTML;
}
function premiumRichPlain(html){const d=document.createElement('div');d.innerHTML=premiumSanitizeRichHtml(html);return (d.innerText||d.textContent||'').replace(/\u00a0/g,' ').trim()}
function premiumEnsureRichBlock(block){
  if(!block||!['text','callout'].includes(block.type))return block;
  if(typeof block.richText!=='string'||!block.richText.trim())block.richText=premiumEscapeText(block.text||'');
  block.richText=premiumSanitizeRichHtml(block.richText);block.text=premiumRichPlain(block.richText);return block;
}
function premiumEnsureRichContent(){
  ensureWordSubtitles();
  (doc.sections||[]).forEach(s=>{
    if(typeof s.richContent!=='string'&&String(s.c||'').trim())s.richContent=premiumEscapeText(s.c);
    if(typeof s.richContent==='string')s.richContent=premiumSanitizeRichHtml(s.richContent);
    (s.blocks||[]).forEach(premiumEnsureRichBlock);
    (s.sub||[]).forEach(ss=>{
      if(typeof ss.richContent!=='string'&&String(ss.c||'').trim())ss.richContent=premiumEscapeText(ss.c);
      if(typeof ss.richContent==='string')ss.richContent=premiumSanitizeRichHtml(ss.richContent);
      (ss.blocks||[]).forEach(premiumEnsureRichBlock);
    });
  });
}

const premiumBaseNormalizeWordBlock=normalizeWordBlock;
normalizeWordBlock=function(raw){const b=premiumBaseNormalizeWordBlock(raw);return premiumEnsureRichBlock(b)};

function duplicateWordBlock(i,j,k){
  const item=getWordItem(i,j),src=item?.blocks?.[k];if(!src)return;
  const cp=normalizeWordBlock(JSON.parse(JSON.stringify(src)));cp.id=wordUid();item.blocks.splice(k+1,0,cp);render();
}
blockEditorHeader=function(label,i,j,k){
  return `<div class="word-block-editor-head"><strong>${label}</strong><div><button type="button" title="Subir" onclick="moveWordBlock(${i},${j},${k},-1)">↑</button><button type="button" title="Bajar" onclick="moveWordBlock(${i},${j},${k},1)">↓</button><button type="button" title="Duplicar bloque" onclick="duplicateWordBlock(${i},${j},${k})">⧉</button><button type="button" class="danger" onclick="removeWordBlock(${i},${j},${k})">Eliminar</button></div></div>`;
};
wordBlockToolbar=function(i,j){
  const actions=[['text','Texto premium'],['heading','Subtítulo'],['table','Tabla'],['chart','Gráfica'],['kpi','KPI'],['callout','Nota'],['citation','Cita'],['references','Referencias'],['image','Imagen'],['list','Lista'],['pagebreak','Salto']];
  return `<div class="word-block-toolbar premium-insert-toolbar"><span>Insertar:</span>${actions.map(([t,l])=>`<button type="button" onclick="addWordBlock(${i},${j},'${t}')">${l}</button>`).join('')}</div>`;
};

function premiumToolbarHtml(path){
  return `<div class="word-rich-toolbar" role="toolbar" aria-label="Formato de texto">
    <button type="button" data-rich-cmd="bold" title="Negrita (Ctrl+B)"><b>B</b></button>
    <button type="button" data-rich-cmd="italic" title="Cursiva (Ctrl+I)"><i>I</i></button>
    <button type="button" data-rich-cmd="underline" title="Subrayado (Ctrl+U)"><u>U</u></button>
    <button type="button" data-rich-cmd="strikeThrough" title="Tachado"><s>S</s></button>
    <span class="word-rich-separator"></span>
    <button type="button" data-rich-cmd="superscript" title="Superíndice">x²</button>
    <button type="button" data-rich-cmd="subscript" title="Subíndice">x₂</button>
    <span class="word-rich-separator"></span>
    <label class="word-rich-color" title="Color del texto"><span>A</span><input type="color" data-rich-color="foreColor" value="#202B3C"></label>
    <label class="word-rich-color word-rich-highlight" title="Resaltado"><span>▰</span><input type="color" data-rich-color="hiliteColor" value="#FFF2A8"></label>
    <span class="word-rich-separator"></span>
    <button type="button" data-rich-link="create" title="Insertar enlace">🔗</button>
    <button type="button" data-rich-link="remove" title="Quitar enlace">⌫🔗</button>
    <button type="button" data-rich-cmd="removeFormat" title="Limpiar formato">Tx</button>
  </div>`;
}
function premiumRichEditorMarkup(path,html,placeholder='Escriba el contenido…'){
  const safe=premiumSanitizeRichHtml(html);const words=premiumRichPlain(safe).split(/\s+/).filter(Boolean).length;
  return `<div class="word-rich-editor-wrap" data-rich-wrap="${path}">${premiumToolbarHtml(path)}<div class="word-rich-editor" contenteditable="true" spellcheck="true" data-rich-editor="${path}" data-placeholder="${esc(placeholder)}">${safe}</div><div class="word-rich-status"><span>Formato enriquecido</span><span data-rich-count>${words} ${words===1?'palabra':'palabras'}</span></div></div>`;
}
function premiumSaveRange(editor){
  const sel=window.getSelection();if(!sel||!sel.rangeCount)return;const r=sel.getRangeAt(0);if(editor.contains(r.commonAncestorContainer))premiumSavedRanges.set(editor,r.cloneRange());
}
function premiumRestoreRange(editor){
  const r=premiumSavedRanges.get(editor);if(!r)return false;const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);editor.focus();return true;
}
function premiumExec(editor,cmd,value=null){
  premiumRestoreRange(editor);document.execCommand('styleWithCSS',false,false);document.execCommand(cmd,false,value);premiumSaveRange(editor);premiumSyncEditor(editor);
}
function premiumSyncEditor(editor,finalize=false){
  const path=editor.dataset.richEditor,safe=premiumSanitizeRichHtml(editor.innerHTML),plain=premiumRichPlain(safe);let target=null;
  if(path.startsWith('sec:')){const i=+path.split(':')[1];target=doc.sections?.[i];if(target){target.richContent=safe;target.c=plain}}
  else if(path.startsWith('sub:')){const [,si,sj]=path.split(':');target=doc.sections?.[+si]?.sub?.[+sj];if(target){target.richContent=safe;target.c=plain}}
  else if(path.startsWith('block:')){const [,raw]=path.split('block:');const {i,j,k}=parseBlockPath(raw);target=getWordItem(i,j)?.blocks?.[k];if(target){target.richText=safe;target.text=plain}}
  const wrap=editor.closest('[data-rich-wrap]'),count=wrap?.querySelector('[data-rich-count]'),words=plain.split(/\s+/).filter(Boolean).length;if(count)count.textContent=`${words} ${words===1?'palabra':'palabras'}`;
  if(finalize&&editor.innerHTML!==safe)editor.innerHTML=safe;
  renderWordOnly();
}
function premiumBindOneRichEditor(editor){
  if(editor.dataset.premiumBound==='1')return;editor.dataset.premiumBound='1';const wrap=editor.closest('[data-rich-wrap]');
  ['keyup','mouseup','focus'].forEach(evt=>editor.addEventListener(evt,()=>premiumSaveRange(editor)));
  editor.addEventListener('input',()=>{premiumSaveRange(editor);premiumSyncEditor(editor)});
  editor.addEventListener('blur',()=>premiumSyncEditor(editor,true));
  editor.addEventListener('drop',e=>e.preventDefault());
  editor.addEventListener('paste',e=>{e.preventDefault();const html=e.clipboardData?.getData('text/html'),text=e.clipboardData?.getData('text/plain')||'';const safe=html?premiumSanitizeRichHtml(html):premiumEscapeText(text);document.execCommand('insertHTML',false,safe);premiumSyncEditor(editor)});
  wrap?.querySelectorAll('[data-rich-cmd]').forEach(btn=>{btn.addEventListener('mousedown',e=>e.preventDefault());btn.onclick=()=>premiumExec(editor,btn.dataset.richCmd)});
  wrap?.querySelectorAll('[data-rich-color]').forEach(inp=>{inp.addEventListener('pointerdown',()=>premiumSaveRange(editor));inp.oninput=()=>premiumExec(editor,inp.dataset.richColor,inp.value)});
  wrap?.querySelector('[data-rich-link="create"]')?.addEventListener('mousedown',e=>e.preventDefault());
  const create=wrap?.querySelector('[data-rich-link="create"]');if(create)create.onclick=()=>{premiumRestoreRange(editor);const href=premiumSafeUrl(prompt('URL del enlace (https:// o mailto:):','https://')||'');if(href)premiumExec(editor,'createLink',href)};
  const remove=wrap?.querySelector('[data-rich-link="remove"]');if(remove){remove.addEventListener('mousedown',e=>e.preventDefault());remove.onclick=()=>premiumExec(editor,'unlink')}
}
function premiumReplaceTextarea(textarea,path,html,placeholder){
  const label=textarea.closest('label');if(!label||label.dataset.richEnhanced==='1')return;label.dataset.richEnhanced='1';
  const caption=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());const cap=caption?caption.textContent.trim():'Contenido';
  const host=document.createElement('div');host.className='word-rich-field';host.innerHTML=`<div class="word-rich-field-label">${esc(cap)}</div>${premiumRichEditorMarkup(path,html,placeholder)}`;label.replaceWith(host);premiumBindOneRichEditor(host.querySelector('[data-rich-editor]'));
}
function premiumEnhanceWordEditors(){
  premiumEnsureRichContent();const box=$('wordSectionEditor');if(!box)return;
  box.querySelectorAll('textarea[data-word-sec-c]').forEach(t=>{const i=+t.dataset.wordSecC,s=doc.sections?.[i];if(s)premiumReplaceTextarea(t,`sec:${i}`,s.richContent||premiumEscapeText(s.c),'Escriba el contenido de la sección…')});
  box.querySelectorAll('textarea[data-word-sub-c]').forEach(t=>{const [i,j]=t.dataset.wordSubC.split('-').map(Number),s=doc.sections?.[i]?.sub?.[j];if(s)premiumReplaceTextarea(t,`sub:${i}:${j}`,s.richContent||premiumEscapeText(s.c),'Escriba el contenido del subtítulo…')});
  box.querySelectorAll('textarea[data-wb-field="text"]').forEach(t=>{const path=t.dataset.wbPath,{i,j,k}=parseBlockPath(path),b=getWordItem(i,j)?.blocks?.[k];if(b&&['text','callout'].includes(b.type))premiumReplaceTextarea(t,`block:${path}`,b.richText||premiumEscapeText(b.text),b.type==='callout'?'Escriba la nota…':'Escriba el texto…')});
}
const premiumBaseRenderWordSectionEditor=renderWordSectionEditor;
renderWordSectionEditor=function(){premiumBaseRenderWordSectionEditor();premiumEnhanceWordEditors()};

function premiumRichChunks(html,maxChars=760){
  const safe=premiumSanitizeRichHtml(html);if(!safe.trim())return[];const root=document.createElement('div');root.innerHTML=safe;const nodes=[...root.childNodes],out=[];let htmlBuf='',chars=0;
  const flush=()=>{if(htmlBuf.trim())out.push(htmlBuf);htmlBuf='';chars=0};
  nodes.forEach(node=>{const wrap=document.createElement('div');wrap.appendChild(node.cloneNode(true));const h=wrap.innerHTML,len=(node.textContent||'').length;if(chars&&chars+len>maxChars)flush();htmlBuf+=h;chars+=len;if(node.nodeName==='BR'||node.nodeName==='P'||node.nodeName==='DIV')flush()});flush();return out.length?out:[safe];
}
const premiumBaseWordBlockHtml=wordBlockHtml;
wordBlockHtml=function(b,ctx={}){
  if(b?.type==='text'){premiumEnsureRichBlock(b);return `<div class="word-rich-text" style="text-align:${b.align}">${premiumSanitizeRichHtml(b.richText)}</div>`}
  if(b?.type==='callout'){premiumEnsureRichBlock(b);return `<aside class="word-callout tone-${b.tone}"><strong>${esc(b.title)}</strong><div class="word-callout-rich">${premiumSanitizeRichHtml(b.richText)}</div></aside>`}
  return premiumBaseWordBlockHtml(b,ctx);
};
const premiumBaseWordBlockHeight=wordBlockHeight;
wordBlockHeight=function(b){if(b?.type==='text'||b?.type==='callout'){const txt=premiumRichPlain(b.richText||premiumEscapeText(b.text||''));return (b.type==='callout'?92:45)+Math.ceil(txt.length/82)*18}return premiumBaseWordBlockHeight(b)};
contentPartsForItem=function(item,isSub=false,itemKey='item'){
  const parts=[];
  if(isControlChangesTitle(item?.t))parts.push({html:controlChangesTableHtml(item),height:120+Math.ceil(String(item?.c||'').length/75)*18});
  else{
    const cls=isSub?'sgc-subsection-content':'sgc-section-content',rich=String(item?.richContent||'').trim();
    if(rich){premiumRichChunks(rich).forEach(h=>{const txt=premiumRichPlain(h);parts.push({html:`<div class="${cls} premium-rich-output">${premiumSanitizeRichHtml(h)}</div>`,height:textChunkHeight(txt,isSub)})})}
    else splitWordTextChunks(item?.c||'').forEach(txt=>parts.push({html:`<div class="${cls}">${esc(txt)}</div>`,height:textChunkHeight(txt,isSub)}));
  }
  let forceNext=false;(item?.blocks||[]).forEach((b,k)=>{if(b.type==='pagebreak'){forceNext=true;return}if(b.type==='heading'){const info=wordHeadingInfo(item,isSub,b,k);parts.push({html:wordBlockHtml(b,{item,isSub,blockIndex:k}),height:wordBlockHeight(b),force:forceNext,toc:true,key:`h-${itemKey}-${k}`,level:info.level,label:info.label});forceNext=false;return}parts.push({html:wordBlockHtml(b,{item,isSub,blockIndex:k}),height:wordBlockHeight(b),force:forceNext});forceNext=false});return parts;
};

function premiumCssToHex(color){
  const c=String(color||'').trim();if(/^#[0-9a-f]{6}$/i.test(c))return c.slice(1).toUpperCase();if(/^#[0-9a-f]{3}$/i.test(c))return c.slice(1).split('').map(x=>x+x).join('').toUpperCase();
  const m=c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);if(m)return [m[1],m[2],m[3]].map(x=>Math.max(0,Math.min(255,+x)).toString(16).padStart(2,'0')).join('').toUpperCase();return undefined;
}
function premiumDocxRichParagraphs(html,d,opts={}){
  const {Paragraph,TextRun,AlignmentType}=d,safe=premiumSanitizeRichHtml(html),root=document.createElement('div');root.innerHTML=safe;const groups=[[]];
  const pushRun=(text,style={})=>{if(!text)return;const runOpts={text,font:'Century Gothic',size:21,bold:!!style.bold,italics:!!style.italics,strike:!!style.strike,superScript:!!style.sup,subScript:!!style.sub};if(style.underline)runOpts.underline={type:d.UnderlineType?.SINGLE||'single'};if(style.color)runOpts.color=style.color;if(style.highlight)runOpts.highlight='yellow';groups[groups.length-1].push(new TextRun(runOpts))};
  const walk=(node,style={})=>{
    if(node.nodeType===Node.TEXT_NODE){pushRun(node.nodeValue||'',style);return}
    if(node.nodeType!==Node.ELEMENT_NODE)return;const tag=node.tagName.toUpperCase(),next={...style};
    if(['B','STRONG'].includes(tag))next.bold=true;if(['I','EM'].includes(tag))next.italics=true;if(tag==='U')next.underline=true;if(['S','STRIKE'].includes(tag))next.strike=true;if(tag==='SUP')next.sup=true;if(tag==='SUB')next.sub=true;if(tag==='MARK')next.highlight=true;
    if(tag==='SPAN'||tag==='FONT'){const color=premiumCssToHex(node.style?.color||node.getAttribute?.('color'));if(color)next.color=color;if(node.style?.backgroundColor)next.highlight=true;const fw=String(node.style?.fontWeight||'').toLowerCase(),fs=String(node.style?.fontStyle||'').toLowerCase(),td=String(node.style?.textDecoration||node.style?.textDecorationLine||'').toLowerCase(),va=String(node.style?.verticalAlign||'').toLowerCase();if(fw==='bold'||Number(fw)>=600)next.bold=true;if(fs==='italic')next.italics=true;if(td.includes('underline'))next.underline=true;if(td.includes('line-through'))next.strike=true;if(va==='super')next.sup=true;if(va==='sub')next.sub=true}
    if(tag==='BR'){groups.push([]);return}
    if(tag==='A'&&d.ExternalHyperlink){const before=groups[groups.length-1],tmp=[];const old=groups[groups.length-1];groups[groups.length-1]=tmp;[...node.childNodes].forEach(ch=>walk(ch,{...next,color:next.color||'0563C1',underline:true}));groups[groups.length-1]=old;const href=premiumSafeUrl(node.getAttribute('href'));if(href&&tmp.length)before.push(new d.ExternalHyperlink({children:tmp,link:href}));else before.push(...tmp);return}
    const block=['P','DIV'].includes(tag);if(block&&groups[groups.length-1].length)groups.push([]);[...node.childNodes].forEach(ch=>walk(ch,next));if(block&&groups[groups.length-1].length)groups.push([]);
  };
  [...root.childNodes].forEach(n=>walk(n,{}));while(groups.length&&groups[groups.length-1].length===0)groups.pop();const alignment=opts.alignment||AlignmentType?.JUSTIFIED;return (groups.length?groups:[[]]).map(runs=>new Paragraph({alignment,spacing:{after:100,line:276},children:runs.length?runs:[new TextRun({text:'',font:'Century Gothic',size:21})]}));
}
let premiumDocxRichQueue=null;
const premiumBaseDocxParaLines=docxParaLines;
docxParaLines=function(text,Paragraph,TextRun,opts={}){
  if(premiumDocxRichQueue){const key=String(text||''),q=premiumDocxRichQueue.get(key);if(q?.length)return premiumDocxRichParagraphs(q.shift(),window.docx,opts)}
  return premiumBaseDocxParaLines(text,Paragraph,TextRun,opts);
};
const premiumBaseDocxBlockNodes=docxBlockNodes;
docxBlockNodes=async function(block,d,ctx={}){
  if(block?.type==='text'){premiumEnsureRichBlock(block);const align={left:d.AlignmentType.LEFT,center:d.AlignmentType.CENTER,right:d.AlignmentType.RIGHT,justify:d.AlignmentType.JUSTIFIED}[block.align]||d.AlignmentType.LEFT;return premiumDocxRichParagraphs(block.richText,d,{alignment:align})}
  if(block?.type==='callout'){premiumEnsureRichBlock(block);const primary=hexNoHash(doc.wordTheme.primary),fill={info:'EAF2FF',success:'ECFDF3',warning:'FFFAEB',risk:'FEF3F2',neutral:'F2F4F7'}[block.tone]||'EAF2FF';return [new d.Table({width:{size:100,type:d.WidthType.PERCENTAGE},rows:[new d.TableRow({children:[new d.TableCell({shading:{type:d.ShadingType.CLEAR,fill},children:[new d.Paragraph({children:[new d.TextRun({text:block.title||'Nota',bold:true,font:'Century Gothic',size:21,color:primary})]}),...premiumDocxRichParagraphs(block.richText,d,{alignment:d.AlignmentType.LEFT})]})]})]})]}
  return premiumBaseDocxBlockNodes(block,d,ctx);
};
const premiumBaseExportWordDocx=exportWordDocx;
exportWordDocx=async function(){
  premiumEnsureRichContent();premiumDocxRichQueue=new Map();
  (doc.sections||[]).forEach(s=>{if(s.richContent&&!isControlChangesTitle(s.t)){const k=String(s.c||'');if(!premiumDocxRichQueue.has(k))premiumDocxRichQueue.set(k,[]);premiumDocxRichQueue.get(k).push(s.richContent)}(s.sub||[]).forEach(ss=>{if(ss.richContent&&!isControlChangesTitle(ss.t)){const k=String(ss.c||'');if(!premiumDocxRichQueue.has(k))premiumDocxRichQueue.set(k,[]);premiumDocxRichQueue.get(k).push(ss.richContent)}})});
  try{return await premiumBaseExportWordDocx()}finally{premiumDocxRichQueue=null}
};

function premiumEnhanceSettings(){
  const panel=$('wordStudioProPanel');if(!panel||panel.querySelector('.word-premium-note'))return;const note=document.createElement('div');note.className='word-premium-note';note.innerHTML='<strong>Edición Premium</strong><span>Seleccione una parte del texto para aplicar negrita, cursiva, subrayado, color, resaltado, super/subíndice o enlace. El formato se conserva en Word.</span>';panel.insertBefore(note,panel.querySelector('.word-reference-manager'));
}
function premiumInit(){premiumEnsureRichContent();premiumEnhanceSettings();render()}
premiumInit();
