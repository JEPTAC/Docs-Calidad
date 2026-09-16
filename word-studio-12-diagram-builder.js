/* ===== V74 · Constructor visual interactivo de diagramas ====================
   Sustituye solo la experiencia de edición de bloques Diagrama.
   Mantiene compatibilidad con nodes[] existentes y exportación SVG/DOCX.
============================================================================= */
const V74_BLUE='#001F73';
const V74_FLOW_PREFIX={start:'I',process:'P',decision:'D',document:'DOC',end:'F'};
const V74_FLOW_LABEL={start:'Inicio',process:'Proceso',decision:'Decisión',document:'Documento',end:'Fin'};
const V74_DEFAULT_RELATION='se relaciona con';

const v74BaseNormalizeWordBlock=normalizeWordBlock;
normalizeWordBlock=function(raw){
  const b=v74BaseNormalizeWordBlock(raw);
  if(raw&&raw.type==='diagram'){
    b.nodes=(Array.isArray(raw.nodes)?raw.nodes:b.nodes||[]).slice(0,24).map(x=>String(x??''));
    b.relations=(Array.isArray(raw.relations)?raw.relations:[]).slice(0,23).map(x=>String(x??''));
    while(b.relations.length<Math.max(0,b.nodes.length-1))b.relations.push(V74_DEFAULT_RELATION);
  }
  return b;
};

function v74Block(path){const {i,j,k}=parseBlockPath(path);return getWordItem(i,j)?.blocks?.[k]}
function v74FlowParts(line){const n=v71ParseFlowNode(line);return {type:n.type,text:n.text}}
function v74FlowLine(type,text){const key=V74_FLOW_PREFIX[type]||'P';return `[${key}] ${String(text||V74_FLOW_LABEL[type]||'Actividad').trim()}`}
function v74PlainNode(line){return v71ParseFlowNode(line).text||String(line||'').replace(/^\[[^\]]+\]\s*/,'').trim()}
function v74EnsureConcept(block){
  block.nodes=Array.isArray(block.nodes)?block.nodes:[];
  if(!block.nodes.length)block.nodes=['Concepto central','Concepto relacionado'];
  block.nodes=block.nodes.map(v74PlainNode);
  block.relations=Array.isArray(block.relations)?block.relations:[];
  while(block.relations.length<block.nodes.length-1)block.relations.push(V74_DEFAULT_RELATION);
  block.relations=block.relations.slice(0,Math.max(0,block.nodes.length-1));
}
function v74EnsureFlow(block){
  block.nodes=Array.isArray(block.nodes)?block.nodes:[];
  if(!block.nodes.length)block.nodes=['[I] Inicio','[P] Actividad','[F] Fin'];
  block.nodes=block.nodes.map(x=>/^\[(I|F|D|DOC|P)\]/i.test(String(x||''))?String(x):v74FlowLine('process',v74PlainNode(x)));
}
function v74SwitchDiagramType(block,type){
  block.diagramType=type==='concept'?'concept':'flow';
  if(block.diagramType==='concept')v74EnsureConcept(block);else v74EnsureFlow(block);
}
function v74FlowOptions(selected){return Object.entries(V74_FLOW_LABEL).map(([k,l])=>`<option value="${k}" ${selected===k?'selected':''}>${l}</option>`).join('')}
function v74FlowTemplate(name){
  if(name==='approval')return ['[I] Inicio','[P] Recibir solicitud','[D] ¿Cumple requisitos?','[P] Aprobar solicitud','[DOC] Generar registro','[F] Fin'];
  if(name==='document')return ['[I] Inicio','[P] Preparar información','[DOC] Elaborar documento','[D] ¿Requiere ajustes?','[P] Aprobar documento','[F] Fin'];
  return ['[I] Inicio','[P] Actividad 1','[P] Actividad 2','[F] Fin'];
}
function v74ConceptTemplate(name){
  if(name==='cause')return {nodes:['Resultado','Causa 1','Causa 2','Causa 3','Causa 4'],relations:['depende de','depende de','depende de','depende de']};
  if(name==='process')return {nodes:['Proceso','Entradas','Actividades','Salidas','Indicadores'],relations:['recibe','contiene','genera','se mide con']};
  return {nodes:['Tema central','Concepto 1','Concepto 2','Concepto 3'],relations:['incluye','incluye','incluye']};
}
function v74FlowBuilderHtml(b,path){
  v74EnsureFlow(b);
  const cards=b.nodes.map((line,n)=>{const p=v74FlowParts(line);return `<div class="word-diagram-card" draggable="true" data-v74-flow-card="${path}:${n}">
    <span class="word-diagram-drag" title="Arrastrar para reordenar">⠿</span>
    <select data-v74-flow-type="${path}:${n}" aria-label="Tipo de nodo">${v74FlowOptions(p.type)}</select>
    <input data-v74-flow-text="${path}:${n}" value="${esc(p.text)}" placeholder="Texto del nodo">
    <div class="word-diagram-card-actions"><button type="button" data-v74-move="${path}:${n}:-1" title="Subir">↑</button><button type="button" data-v74-move="${path}:${n}:1" title="Bajar">↓</button><button type="button" data-v74-duplicate="${path}:${n}" title="Duplicar">⧉</button><button type="button" class="danger" data-v74-delete="${path}:${n}" title="Eliminar">×</button></div>
  </div>`}).join('');
  return `<div class="word-diagram-builder" data-v74-builder="${path}">
    <div class="word-diagram-builder-head"><strong>Constructor visual de flujograma</strong><span class="word-diagram-count">${b.nodes.length}/24 nodos</span></div>
    <div class="word-diagram-template-bar"><span>Plantillas:</span><button type="button" data-v74-template="${path}:simple">Proceso simple</button><button type="button" data-v74-template="${path}:approval">Aprobación</button><button type="button" data-v74-template="${path}:document">Documento</button></div>
    <div class="word-diagram-quickbar"><span>Agregar:</span>${Object.entries(V74_FLOW_LABEL).map(([type,label])=>`<button type="button" data-v74-add-flow="${path}:${type}" data-type="${type}">+ ${label}</button>`).join('')}</div>
    <div class="word-diagram-cards">${cards||'<div class="word-diagram-empty">Agregue el primer nodo del proceso.</div>'}</div>
    <div class="word-diagram-hint"><b>Tip:</b> arrastre las tarjetas para cambiar el orden. La vista previa y los conectores se reorganizan automáticamente.</div>
  </div>`;
}
function v74ConceptBuilderHtml(b,path){
  v74EnsureConcept(b);
  const branches=b.nodes.slice(1).map((text,n)=>`<div class="word-diagram-card word-concept-card" draggable="true" data-v74-concept-card="${path}:${n+1}">
    <span class="word-diagram-drag" title="Arrastrar para reordenar">⠿</span>
    <div class="word-concept-relation"><input data-v74-concept-relation="${path}:${n}" value="${esc(b.relations[n]||V74_DEFAULT_RELATION)}" placeholder="incluye / genera / depende de"></div>
    <div class="word-concept-text"><input data-v74-concept-text="${path}:${n+1}" value="${esc(text)}" placeholder="Concepto relacionado"></div>
    <div class="word-diagram-card-actions"><button type="button" data-v74-concept-move="${path}:${n+1}:-1" title="Subir">↑</button><button type="button" data-v74-concept-move="${path}:${n+1}:1" title="Bajar">↓</button><button type="button" data-v74-concept-duplicate="${path}:${n+1}" title="Duplicar">⧉</button><button type="button" class="danger" data-v74-concept-delete="${path}:${n+1}" title="Eliminar">×</button></div>
  </div>`).join('');
  return `<div class="word-diagram-builder" data-v74-builder="${path}">
    <div class="word-diagram-builder-head"><strong>Constructor visual de mapa conceptual</strong><span class="word-diagram-count">${Math.max(0,b.nodes.length-1)} relaciones</span></div>
    <div class="word-diagram-template-bar"><span>Plantillas:</span><button type="button" data-v74-concept-template="${path}:basic">Mapa básico</button><button type="button" data-v74-concept-template="${path}:cause">Causa–resultado</button><button type="button" data-v74-concept-template="${path}:process">Proceso</button></div>
    <div class="word-concept-central"><label>Concepto central<input data-v74-concept-central="${path}" value="${esc(b.nodes[0]||'Concepto central')}" placeholder="Tema principal"></label></div>
    <div class="word-diagram-cards">${branches||'<div class="word-diagram-empty">Agregue conceptos relacionados al tema central.</div>'}</div>
    <div class="word-diagram-add-bottom"><button type="button" data-v74-add-concept="${path}">+ Agregar concepto relacionado</button></div>
    <div class="word-diagram-hint"><b>Relación:</b> escriba cómo se conecta cada concepto con el central, por ejemplo “incluye”, “genera”, “depende de” o “se compone de”.</div>
  </div>`;
}

const v74BaseWordBlockEditorHtml=wordBlockEditorHtml;
wordBlockEditorHtml=function(b,i,j,k){
  if(b?.type!=='diagram')return v74BaseWordBlockEditorHtml(b,i,j,k);
  const path=`${i}:${j}:${k}`;
  if(!Array.isArray(b.relations))b.relations=[];
  return `<div class="word-block-editor">${blockEditorHeader('Diagrama interactivo',i,j,k)}
    <div class="grid2"><label>Título<input data-v74-diagram-field="${path}:title" value="${esc(b.title)}"></label><label>Tipo<select data-v74-diagram-type="${path}"><option value="flow" ${b.diagramType==='flow'?'selected':''}>Flujograma</option><option value="concept" ${b.diagramType==='concept'?'selected':''}>Mapa conceptual</option></select></label></div>
    ${b.diagramType==='flow'?`<label>Orientación<select data-v74-diagram-field="${path}:orientation"><option value="vertical" ${b.orientation==='vertical'?'selected':''}>Vertical</option><option value="horizontal" ${b.orientation==='horizontal'?'selected':''}>Horizontal inteligente</option></select></label>`:''}
    ${b.diagramType==='concept'?v74ConceptBuilderHtml(b,path):v74FlowBuilderHtml(b,path)}
    <label>Pie / fuente<input data-v74-diagram-field="${path}:caption" value="${esc(b.caption||'')}"></label>
  </div>`;
};

function v74MoveArray(arr,from,to){if(to<0||to>=arr.length||from===to)return false;const [x]=arr.splice(from,1);arr.splice(to,0,x);return true}
function v74ReorderConcept(block,fromNode,toNode){
  if(fromNode<1||toNode<1||fromNode>=block.nodes.length||toNode>=block.nodes.length)return;
  const rels=block.relations||[];const text=block.nodes.splice(fromNode,1)[0],rel=rels.splice(fromNode-1,1)[0]||V74_DEFAULT_RELATION;
  block.nodes.splice(toNode,0,text);rels.splice(toNode-1,0,rel);block.relations=rels;
}
function v74BindDrag(box){
  box.querySelectorAll('[data-v74-flow-card]').forEach(card=>{
    card.addEventListener('dragstart',e=>{card.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',`flow|${card.dataset.v74FlowCard}`)});
    card.addEventListener('dragend',()=>{card.classList.remove('dragging');box.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))});
    card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('drag-over')});card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));
    card.addEventListener('drop',e=>{e.preventDefault();const raw=e.dataTransfer.getData('text/plain');if(!raw.startsWith('flow|'))return;const src=raw.slice(5).split(':').map(Number),dst=card.dataset.v74FlowCard.split(':').map(Number);const b=getWordItem(dst[0],dst[1])?.blocks?.[dst[2]];if(!b||src.slice(0,3).join(':')!==dst.slice(0,3).join(':'))return;if(v74MoveArray(b.nodes,src[3],dst[3]))render()});
  });
  box.querySelectorAll('[data-v74-concept-card]').forEach(card=>{
    card.addEventListener('dragstart',e=>{card.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',`concept|${card.dataset.v74ConceptCard}`)});
    card.addEventListener('dragend',()=>{card.classList.remove('dragging');box.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))});
    card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('drag-over')});card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));
    card.addEventListener('drop',e=>{e.preventDefault();const raw=e.dataTransfer.getData('text/plain');if(!raw.startsWith('concept|'))return;const src=raw.slice(8).split(':').map(Number),dst=card.dataset.v74ConceptCard.split(':').map(Number);const b=getWordItem(dst[0],dst[1])?.blocks?.[dst[2]];if(!b||src.slice(0,3).join(':')!==dst.slice(0,3).join(':'))return;v74ReorderConcept(b,src[3],dst[3]);render()});
  });
}

const v74BaseBindWordBlockEditors=bindWordBlockEditors;
bindWordBlockEditors=function(box){
  v74BaseBindWordBlockEditors(box);
  box.querySelectorAll('[data-v74-diagram-field]').forEach(el=>el.oninput=e=>{const parts=e.target.dataset.v74DiagramField.split(':');const field=parts.pop(),b=v74Block(parts.join(':'));if(!b)return;b[field]=e.target.value;renderWordOnly()});
  box.querySelectorAll('[data-v74-diagram-type]').forEach(el=>el.onchange=e=>{const b=v74Block(e.target.dataset.v74DiagramType);if(!b)return;v74SwitchDiagramType(b,e.target.value);render()});
  box.querySelectorAll('[data-v74-flow-type]').forEach(el=>el.onchange=e=>{const p=e.target.dataset.v74FlowType.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b)return;const old=v74FlowParts(b.nodes[idx]);b.nodes[idx]=v74FlowLine(e.target.value,old.text);renderWordOnly()});
  box.querySelectorAll('[data-v74-flow-text]').forEach(el=>el.oninput=e=>{const p=e.target.dataset.v74FlowText.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b)return;const old=v74FlowParts(b.nodes[idx]);b.nodes[idx]=v74FlowLine(old.type,e.target.value);renderWordOnly()});
  box.querySelectorAll('[data-v74-add-flow]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74AddFlow.split(':'),type=p.pop(),b=v74Block(p.join(':'));if(!b||b.nodes.length>=24)return;b.nodes.push(v74FlowLine(type,V74_FLOW_LABEL[type]||'Actividad'));render()});
  box.querySelectorAll('[data-v74-template]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74Template.split(':'),name=p.pop(),b=v74Block(p.join(':'));if(!b)return;b.nodes=v74FlowTemplate(name);render()});
  box.querySelectorAll('[data-v74-delete]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74Delete.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b)return;b.nodes.splice(idx,1);render()});
  box.querySelectorAll('[data-v74-duplicate]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74Duplicate.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b||b.nodes.length>=24)return;b.nodes.splice(idx+1,0,b.nodes[idx]);render()});
  box.querySelectorAll('[data-v74-move]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74Move.split(':'),dir=+p.pop(),idx=+p.pop(),b=v74Block(p.join(':'));if(!b)return;if(v74MoveArray(b.nodes,idx,idx+dir))render()});

  box.querySelectorAll('[data-v74-concept-central]').forEach(el=>el.oninput=e=>{const b=v74Block(e.target.dataset.v74ConceptCentral);if(!b)return;v74EnsureConcept(b);b.nodes[0]=e.target.value;renderWordOnly()});
  box.querySelectorAll('[data-v74-concept-text]').forEach(el=>el.oninput=e=>{const p=e.target.dataset.v74ConceptText.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b)return;b.nodes[idx]=e.target.value;renderWordOnly()});
  box.querySelectorAll('[data-v74-concept-relation]').forEach(el=>el.oninput=e=>{const p=e.target.dataset.v74ConceptRelation.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b)return;b.relations[idx]=e.target.value;renderWordOnly()});
  box.querySelectorAll('[data-v74-add-concept]').forEach(btn=>btn.onclick=()=>{const b=v74Block(btn.dataset.v74AddConcept);if(!b||b.nodes.length>=13)return;v74EnsureConcept(b);b.nodes.push(`Concepto ${b.nodes.length}`);b.relations.push(V74_DEFAULT_RELATION);render()});
  box.querySelectorAll('[data-v74-concept-template]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74ConceptTemplate.split(':'),name=p.pop(),b=v74Block(p.join(':'));if(!b)return;const t=v74ConceptTemplate(name);b.nodes=t.nodes;b.relations=t.relations;render()});
  box.querySelectorAll('[data-v74-concept-delete]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74ConceptDelete.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b||idx<1)return;b.nodes.splice(idx,1);b.relations.splice(idx-1,1);render()});
  box.querySelectorAll('[data-v74-concept-duplicate]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74ConceptDuplicate.split(':'),idx=+p.pop(),b=v74Block(p.join(':'));if(!b||idx<1||b.nodes.length>=13)return;b.nodes.splice(idx+1,0,b.nodes[idx]);b.relations.splice(idx,0,b.relations[idx-1]||V74_DEFAULT_RELATION);render()});
  box.querySelectorAll('[data-v74-concept-move]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.v74ConceptMove.split(':'),dir=+p.pop(),idx=+p.pop(),b=v74Block(p.join(':'));if(!b)return;const to=idx+dir;if(to<1||to>=b.nodes.length)return;v74ReorderConcept(b,idx,to);render()});
  v74BindDrag(box);
};

function v74RelationLabel(text,x,y){
  const t=String(text||V74_DEFAULT_RELATION).trim().slice(0,28),w=Math.max(54,Math.min(138,t.length*6.1+16));
  return `<g><rect x="${x-w/2}" y="${y-10}" width="${w}" height="20" rx="10" fill="#FFFFFF" stroke="#D0D5DD"/><text x="${x}" y="${y+1}" text-anchor="middle" dominant-baseline="middle" font-family="Century Gothic,Arial,sans-serif" font-size="8.5" font-weight="700" fill="${V74_BLUE}">${esc(t)}</text></g>`;
}
function v74ConceptSvgData(b){
  v74EnsureConcept(b);const nodes=b.nodes.slice(0,13),center=nodes[0],branches=nodes.slice(1),rels=(b.relations||[]).slice(0,branches.length);const w=640,h=430,cx=320,cy=215;
  const count=branches.length||1,positions=branches.map((_,i)=>{const ring=i<8?1:2,idx=ring===1?i:i-8,n=ring===1?Math.min(count,8):Math.max(1,count-8),rx=ring===1?235:155,ry=ring===1?145:96,a=-Math.PI/2+(idx*(Math.PI*2/n));return{x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry}});
  const lines=positions.map((p,i)=>{const mx=cx+(p.x-cx)*.52,my=cy+(p.y-cy)*.52;return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${V74_BLUE}" stroke-width="2" vector-effect="non-scaling-stroke"/>${v74RelationLabel(rels[i],mx,my)}`}).join('');
  const branchShapes=positions.map((p,i)=>`<rect x="${p.x-78}" y="${p.y-27}" width="156" height="54" rx="12" fill="#FFFFFF" stroke="${V74_BLUE}" stroke-width="2" vector-effect="non-scaling-stroke"/>${v71SvgText(branches[i],p.x,p.y,{fill:V74_BLUE,max:18,size:11})}`).join('');
  const centerShape=`<rect x="${cx-96}" y="${cy-32}" width="192" height="64" rx="16" fill="${V74_BLUE}" stroke="${V74_BLUE}" stroke-width="2"/>${v71SvgText(center,cx,cy,{fill:'#FFFFFF',max:22,size:12})}`;
  return {width:w,height:h,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" fill="#FFFFFF"/>${lines}${branchShapes}${centerShape}</svg>`};
}
v71ConceptSvgData=v74ConceptSvgData;

if(typeof render==='function')render();
