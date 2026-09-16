/* ===== V71 · Estructura visual avanzada =====================================
   Extensión aislada: viñetas configurables, flujogramas, mapas conceptuales
   y espaciado DOCX compacto. No modifica la plantilla SGC base.
============================================================================= */
const V71_BLUE='#001F73';
const V71_YELLOW='#EAC800';
const V71_BULLETS={disc:'●',circle:'○',square:'■',diamond:'◆',arrow:'➜',check:'✓',dash:'—'};

if(!WORD_BLOCK_TYPES.includes('diagram'))WORD_BLOCK_TYPES.push('diagram');

const v71BaseNormalizeWordBlock=normalizeWordBlock;
normalizeWordBlock=function(raw){
  if(raw&&raw.type==='diagram'){
    return {
      ...raw,
      id:String(raw.id||wordUid()),
      type:'diagram',
      title:String(raw.title||'Flujograma'),
      diagramType:['flow','concept'].includes(raw.diagramType)?raw.diagramType:'flow',
      orientation:['vertical','horizontal'].includes(raw.orientation)?raw.orientation:'vertical',
      nodes:(Array.isArray(raw.nodes)?raw.nodes:[]).slice(0,12).map(x=>String(x??'')),
      caption:String(raw.caption||'')
    };
  }
  const b=v71BaseNormalizeWordBlock(raw);
  if(b.type==='list')b.bulletStyle=V71_BULLETS[b.bulletStyle]?b.bulletStyle:'disc';
  if(b.type==='chart'&&['#2F80ED','#175CD3','#0563C1','#001754'].includes(String(b.color3||'').toUpperCase()))b.color3=V71_BLUE;
  return b;
};

const v71BaseNewWordBlock=newWordBlock;
newWordBlock=function(type){
  if(type==='diagram')return normalizeWordBlock({id:wordUid(),type:'diagram',title:'Flujograma',diagramType:'flow',orientation:'vertical',nodes:['[I] Inicio','[P] Actividad','[D] ¿Decisión?','[P] Acción resultante','[F] Fin'],caption:''});
  const b=v71BaseNewWordBlock(type);
  if(b?.type==='list')b.bulletStyle='disc';
  return b;
};

wordBlockToolbar=function(i,j){
  const actions=[['text','Texto premium'],['heading','Subtítulo'],['table','Tabla'],['chart','Gráfica'],['kpi','KPI'],['callout','Nota'],['citation','Cita'],['references','Referencias'],['image','Imagen'],['list','Lista'],['diagram','Diagrama'],['pagebreak','Salto']];
  return `<div class="word-block-toolbar premium-insert-toolbar"><span>Insertar:</span>${actions.map(([t,l])=>`<button type="button" onclick="addWordBlock(${i},${j},'${t}')">${l}</button>`).join('')}</div>`;
};

const v71BaseWordBlockEditorHtml=wordBlockEditorHtml;
wordBlockEditorHtml=function(b,i,j,k){
  const p=`${i}:${j}:${k}`;
  if(b.type==='list'){
    return `<div class="word-block-editor">${blockEditorHeader('Lista / viñetas',i,j,k)}
      <div class="grid2"><label>Título<input data-wb-path="${p}" data-wb-field="title" value="${esc(b.title)}"></label>
      <label>Tipo<select data-wb-list-ordered="${p}"><option value="false" ${!b.ordered?'selected':''}>Viñetas</option><option value="true" ${b.ordered?'selected':''}>Numerada</option></select></label></div>
      <label>Forma de viñeta<select data-v71-list-style="${p}" ${b.ordered?'disabled':''}>
        <option value="disc" ${b.bulletStyle==='disc'?'selected':''}>● Punto sólido</option>
        <option value="circle" ${b.bulletStyle==='circle'?'selected':''}>○ Círculo</option>
        <option value="square" ${b.bulletStyle==='square'?'selected':''}>■ Cuadrado</option>
        <option value="diamond" ${b.bulletStyle==='diamond'?'selected':''}>◆ Rombo</option>
        <option value="arrow" ${b.bulletStyle==='arrow'?'selected':''}>➜ Flecha</option>
        <option value="check" ${b.bulletStyle==='check'?'selected':''}>✓ Check</option>
        <option value="dash" ${b.bulletStyle==='dash'?'selected':''}>— Guion</option>
      </select></label>
      <label>Elementos (uno por línea)<textarea rows="4" data-wb-list-items="${p}">${esc(b.items.join('\n'))}</textarea></label>
    </div>`;
  }
  if(b.type==='diagram'){
    return `<div class="word-block-editor">${blockEditorHeader('Flujograma / mapa conceptual',i,j,k)}
      <div class="grid2"><label>Título<input data-v71-diagram-field="${p}:title" value="${esc(b.title)}"></label>
      <label>Tipo<select data-v71-diagram-field="${p}:diagramType"><option value="flow" ${b.diagramType==='flow'?'selected':''}>Flujograma</option><option value="concept" ${b.diagramType==='concept'?'selected':''}>Mapa conceptual</option></select></label></div>
      <label>Orientación<select data-v71-diagram-field="${p}:orientation"><option value="vertical" ${b.orientation==='vertical'?'selected':''}>Vertical</option><option value="horizontal" ${b.orientation==='horizontal'?'selected':''}>Horizontal</option></select></label>
      <label>Nodos / conceptos (uno por línea)<textarea rows="6" data-v71-diagram-nodes="${p}">${esc(b.nodes.join('\n'))}</textarea></label>
      <label>Pie / fuente<input data-v71-diagram-field="${p}:caption" value="${esc(b.caption)}"></label>
      <div class="word-diagram-help"><strong>Flujograma:</strong> use <code>[I]</code> Inicio, <code>[P]</code> Proceso, <code>[D]</code> Decisión, <code>[DOC]</code> Documento y <code>[F]</code> Fin. En mapa conceptual, la primera línea es el concepto central y las siguientes son conceptos relacionados.</div>
    </div>`;
  }
  return v71BaseWordBlockEditorHtml(b,i,j,k);
};

const v71BaseBindWordBlockEditors=bindWordBlockEditors;
bindWordBlockEditors=function(box){
  v71BaseBindWordBlockEditors(box);
  box.querySelectorAll('[data-v71-list-style]').forEach(el=>el.onchange=e=>{
    const {i,j,k}=parseBlockPath(e.target.dataset.v71ListStyle),b=getWordItem(i,j)?.blocks?.[k];
    if(!b||b.type!=='list')return;b.bulletStyle=V71_BULLETS[e.target.value]?e.target.value:'disc';renderWordOnly();
  });
  box.querySelectorAll('[data-v71-diagram-field]').forEach(el=>el.oninput=e=>{
    const [i,j,k,field]=String(e.target.dataset.v71DiagramField||'').split(':');const b=getWordItem(+i,+j)?.blocks?.[+k];
    if(!b||b.type!=='diagram')return;b[field]=e.target.value;renderWordOnly();
  });
  box.querySelectorAll('[data-v71-diagram-nodes]').forEach(el=>el.oninput=e=>{
    const {i,j,k}=parseBlockPath(e.target.dataset.v71DiagramNodes),b=getWordItem(i,j)?.blocks?.[k];
    if(!b||b.type!=='diagram')return;b.nodes=String(e.target.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,12);renderWordOnly();
  });
};

function v71BulletSymbol(style){return V71_BULLETS[style]||V71_BULLETS.disc}
function v71Wrap(text,max=24){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[];let cur='';
  words.forEach(w=>{const next=cur?`${cur} ${w}`:w;if(next.length>max&&cur){lines.push(cur);cur=w}else cur=next});if(cur)lines.push(cur);
  return lines.slice(0,3);
}
function v71SvgText(text,x,y,{fill='#111111',size=13,weight=700,max=24,line=15}={}){
  const lines=v71Wrap(text,max),start=y-((lines.length-1)*line)/2;
  return `<text x="${x}" y="${start}" text-anchor="middle" dominant-baseline="middle" font-family="Century Gothic,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines.map((t,i)=>`<tspan x="${x}" dy="${i?line:0}">${esc(t)}</tspan>`).join('')}</text>`;
}
function v71ParseFlowNode(line){
  const raw=String(line||'').trim();const m=raw.match(/^\[(I|F|D|DOC|P)\]\s*(.*)$/i);let type='process',text=raw;
  if(m){text=m[2]||'';type={I:'start',F:'end',D:'decision',DOC:'document',P:'process'}[m[1].toUpperCase()]||'process'}else if(/\?$/.test(raw))type='decision';
  return {type,text:text||'Nodo'};
}
function v71NodeShape(node,x,y,w=230,h=54){
  if(node.type==='decision')return `<polygon points="${x},${y-42} ${x+125},${y} ${x},${y+42} ${x-125},${y}" fill="#FFFFFF" stroke="${V71_BLUE}" stroke-width="2"/>${v71SvgText(node.text,x,y,{fill:V71_BLUE,max:22,size:12})}`;
  if(node.type==='document')return `<path d="M ${x-w/2} ${y-h/2} H ${x+w/2} V ${y+h/2-10} Q ${x+w/4} ${y+h/2+6} ${x} ${y+h/2-7} Q ${x-w/4} ${y+h/2-20} ${x-w/2} ${y+h/2-8} Z" fill="#FFFFFF" stroke="${V71_BLUE}" stroke-width="2"/>${v71SvgText(node.text,x,y-2,{fill:V71_BLUE,max:24,size:12})}`;
  const fill=(node.type==='start'||node.type==='end')?V71_BLUE:'#FFFFFF',txt=(node.type==='start'||node.type==='end')?'#FFFFFF':V71_BLUE,rx=(node.type==='start'||node.type==='end')?28:10;
  return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${V71_BLUE}" stroke-width="2"/>${v71SvgText(node.text,x,y,{fill:txt,max:25,size:12})}`;
}
function v71FlowSvgData(b){
  const nodes=(b.nodes||[]).map(v71ParseFlowNode).slice(0,12);if(!nodes.length)nodes.push({type:'process',text:'Proceso'});
  const marker=`v71arr-${String(b.id||'x').replace(/[^A-Za-z0-9_-]/g,'')}`;
  if(b.orientation==='horizontal'){
    const step=165,w=Math.max(640,90+nodes.length*step),h=250,y=128;
    const arrows=nodes.slice(0,-1).map((_,i)=>{const x1=90+i*step+67,x2=90+(i+1)*step-67;return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${V71_BLUE}" stroke-width="2" marker-end="url(#${marker})"/>`}).join('');
    const shapes=nodes.map((n,i)=>v71NodeShape(n,90+i*step,y,124,54)).join('');
    return {width:w,height:h,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><defs><marker id="${marker}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${V71_BLUE}"/></marker></defs><rect width="100%" height="100%" fill="#FFFFFF"/>${arrows}${shapes}</svg>`};
  }
  const step=92,w=640,h=Math.max(250,80+nodes.length*step),x=320;
  const arrows=nodes.slice(0,-1).map((n,i)=>{const y1=58+i*step+(n.type==='decision'?42:28),y2=58+(i+1)*step-(nodes[i+1].type==='decision'?42:28);return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${V71_BLUE}" stroke-width="2" marker-end="url(#${marker})"/>`}).join('');
  const shapes=nodes.map((n,i)=>v71NodeShape(n,x,58+i*step)).join('');
  return {width:w,height:h,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><defs><marker id="${marker}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${V71_BLUE}"/></marker></defs><rect width="100%" height="100%" fill="#FFFFFF"/>${arrows}${shapes}</svg>`};
}
function v71ConceptSvgData(b){
  const nodes=(b.nodes||[]).map(x=>String(x).trim()).filter(Boolean).slice(0,10);if(!nodes.length)nodes.push('Concepto central','Concepto relacionado');
  const center=nodes[0],branches=nodes.slice(1),w=640,h=420,cx=320,cy=210,rx=225,ry=135;
  const positions=branches.map((_,i)=>{const a=-Math.PI/2+(i*(Math.PI*2/Math.max(1,branches.length)));return {x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry}});
  const lines=positions.map(p=>`<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${V71_BLUE}" stroke-width="2"/><circle cx="${(cx+p.x)/2}" cy="${(cy+p.y)/2}" r="4" fill="${V71_YELLOW}"/>`).join('');
  const branchShapes=positions.map((p,i)=>`<rect x="${p.x-78}" y="${p.y-26}" width="156" height="52" rx="12" fill="#FFFFFF" stroke="${V71_BLUE}" stroke-width="2"/>${v71SvgText(branches[i],p.x,p.y,{fill:V71_BLUE,max:18,size:11})}`).join('');
  const centerShape=`<rect x="${cx-92}" y="${cy-31}" width="184" height="62" rx="16" fill="${V71_BLUE}" stroke="${V71_BLUE}" stroke-width="2"/>${v71SvgText(center,cx,cy,{fill:'#FFFFFF',max:22,size:12})}`;
  return {width:w,height:h,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" fill="#FFFFFF"/>${lines}${branchShapes}${centerShape}</svg>`};
}
function v71DiagramSvgData(b){return b.diagramType==='concept'?v71ConceptSvgData(b):v71FlowSvgData(b)}

const v71BaseWordBlockHtml=wordBlockHtml;
wordBlockHtml=function(b,ctx={}){
  if(b?.type==='list'){
    const title=b.title?`<strong class="word-list-title">${esc(b.title)}</strong>`:'';
    if(b.ordered)return `<div class="word-list-block word-list-premium">${title}<ol class="word-number-list">${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`;
    const symbol=v71BulletSymbol(b.bulletStyle);return `<div class="word-list-block word-list-premium">${title}<ul class="word-bullet-list">${b.items.map(x=>`<li><span class="word-bullet-symbol">${symbol}</span><span>${esc(x)}</span></li>`).join('')}</ul></div>`;
  }
  if(b?.type==='diagram'){
    const d=v71DiagramSvgData(b);return `<figure class="word-diagram-figure"><figcaption>${esc(b.title)}</figcaption><div class="word-diagram-shell">${d.svg}</div>${b.caption?`<small class="word-diagram-caption">${esc(b.caption)}</small>`:''}</figure>`;
  }
  return v71BaseWordBlockHtml(b,ctx);
};

const v71BaseWordBlockHeight=wordBlockHeight;
wordBlockHeight=function(b){
  if(b?.type==='diagram'){const d=v71DiagramSvgData(b);return Math.min(520,90+d.height*.62)}
  if(b?.type==='list')return 38+(b.items?.length||0)*20;
  return v71BaseWordBlockHeight(b);
};

/* DOCX: espacio entre párrafos reducido a 2 pt aprox. */
premiumDocxRichParagraphs=function(html,d,opts={}){
  const {Paragraph,TextRun,AlignmentType}=d,safe=premiumSanitizeRichHtml(html),root=document.createElement('div');root.innerHTML=safe;const groups=[[]];
  const pushRun=(text,style={})=>{if(!text)return;const runOpts={text,font:'Century Gothic',size:21,bold:!!style.bold,italics:!!style.italics,strike:!!style.strike,superScript:!!style.sup,subScript:!!style.sub};if(style.underline)runOpts.underline={type:d.UnderlineType?.SINGLE||'single'};if(style.color)runOpts.color=style.color;if(style.highlight)runOpts.highlight='yellow';groups[groups.length-1].push(new TextRun(runOpts))};
  const walk=(node,style={})=>{
    if(node.nodeType===Node.TEXT_NODE){pushRun(node.nodeValue||'',style);return}if(node.nodeType!==Node.ELEMENT_NODE)return;const tag=node.tagName.toUpperCase(),next={...style};
    if(['B','STRONG'].includes(tag))next.bold=true;if(['I','EM'].includes(tag))next.italics=true;if(tag==='U')next.underline=true;if(['S','STRIKE'].includes(tag))next.strike=true;if(tag==='SUP')next.sup=true;if(tag==='SUB')next.sub=true;if(tag==='MARK')next.highlight=true;
    if(tag==='SPAN'||tag==='FONT'){const color=premiumCssToHex(node.style?.color||node.getAttribute?.('color'));if(color)next.color=color;if(node.style?.backgroundColor)next.highlight=true;const fw=String(node.style?.fontWeight||'').toLowerCase(),fs=String(node.style?.fontStyle||'').toLowerCase(),td=String(node.style?.textDecoration||node.style?.textDecorationLine||'').toLowerCase(),va=String(node.style?.verticalAlign||'').toLowerCase();if(fw==='bold'||Number(fw)>=600)next.bold=true;if(fs==='italic')next.italics=true;if(td.includes('underline'))next.underline=true;if(td.includes('line-through'))next.strike=true;if(va==='super')next.sup=true;if(va==='sub')next.sub=true}
    if(tag==='BR'){groups.push([]);return}
    if(tag==='A'&&d.ExternalHyperlink){const before=groups[groups.length-1],tmp=[],old=groups[groups.length-1];groups[groups.length-1]=tmp;[...node.childNodes].forEach(ch=>walk(ch,{...next,color:next.color||'001F73',underline:true}));groups[groups.length-1]=old;const href=premiumSafeUrl(node.getAttribute('href'));if(href&&tmp.length)before.push(new d.ExternalHyperlink({children:tmp,link:href}));else before.push(...tmp);return}
    const block=['P','DIV'].includes(tag);if(block&&groups[groups.length-1].length)groups.push([]);[...node.childNodes].forEach(ch=>walk(ch,next));if(block&&groups[groups.length-1].length)groups.push([]);
  };
  [...root.childNodes].forEach(n=>walk(n,{}));while(groups.length&&groups[groups.length-1].length===0)groups.pop();const alignment=opts.alignment||AlignmentType?.JUSTIFIED;
  return (groups.length?groups:[[]]).map(runs=>new Paragraph({alignment,spacing:{after:40,line:276},children:runs.length?runs:[new TextRun({text:'',font:'Century Gothic',size:21})]}));
};

docxParaLines=function(text,Paragraph,TextRun,opts={}){
  if(typeof premiumDocxRichQueue!=='undefined'&&premiumDocxRichQueue){const key=String(text||''),q=premiumDocxRichQueue.get(key);if(q?.length)return premiumDocxRichParagraphs(q.shift(),window.docx,opts)}
  const lines=String(text||'').split(/\r?\n/);return lines.filter((x,i)=>x.trim()||i===0).map(x=>new Paragraph({alignment:opts.alignment,spacing:{after:40,line:276},children:[new TextRun({text:x,font:'Century Gothic',size:21,color:opts.color||'111111',bold:!!opts.bold,italics:!!opts.italics})]}));
};

const v71BaseDocxBlockNodes=docxBlockNodes;
docxBlockNodes=async function(block,d,ctx={}){
  if(block?.type==='list'){
    const out=[];if(block.title)out.push(new d.Paragraph({spacing:{after:40},children:[new d.TextRun({text:block.title,bold:true,font:'Century Gothic',size:21,color:'001F73'})]}));
    block.items.forEach((x,i)=>{const prefix=block.ordered?`${i+1}.`:v71BulletSymbol(block.bulletStyle);out.push(new d.Paragraph({indent:{left:360,hanging:180},spacing:{after:20,line:276},children:[new d.TextRun({text:`${prefix} `,bold:!block.ordered,font:'Century Gothic',size:21,color:block.ordered?'111111':'001F73'}),new d.TextRun({text:String(x),font:'Century Gothic',size:21,color:'111111'})]}))});return out;
  }
  if(block?.type==='diagram'){
    const data=v71DiagramSvgData(block),height=Math.min(460,Math.round(560*data.height/data.width)),out=[new d.Paragraph({spacing:{before:100,after:60},children:[new d.TextRun({text:block.title||'Diagrama',bold:true,font:'Century Gothic',size:21,color:'001F73'})]}),new d.Paragraph({alignment:d.AlignmentType.CENTER,children:[new d.ImageRun({type:'svg',data:new TextEncoder().encode(data.svg),transformation:{width:560,height},altText:{title:block.title||'Diagrama',description:block.diagramType==='concept'?'Mapa conceptual':'Flujograma',name:block.title||'Diagrama'}})]})];
    if(block.caption)out.push(new d.Paragraph({alignment:d.AlignmentType.CENTER,spacing:{after:40},children:[new d.TextRun({text:block.caption,font:'Century Gothic',size:21,italics:true,color:'667085'})]}));return out;
  }
  return v71BaseDocxBlockNodes(block,d,ctx);
};

function v71NormalizeExistingBlocks(){
  ensureWordSubtitles();(doc.sections||[]).forEach(s=>{s.blocks=(s.blocks||[]).map(normalizeWordBlock);(s.sub||[]).forEach(ss=>ss.blocks=(ss.blocks||[]).map(normalizeWordBlock))});
}
v71NormalizeExistingBlocks();
if(typeof render==='function')render();
