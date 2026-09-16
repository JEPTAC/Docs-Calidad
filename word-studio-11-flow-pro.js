/* ===== V73 · Motor profesional de flujogramas horizontales ==================
   Layout serpenteante/multifila para procesos largos. Capa aditiva: no toca
   la plantilla SGC, el flujo vertical ni los mapas conceptuales.
============================================================================= */
const V73_BLUE='#001F73';
const V73_YELLOW='#EAC800';
const V73_GRAY='#667085';
const V73_SURFACE='#F8FAFC';
const V73_MAX_NODES=24;

const v73BaseNormalizeWordBlock=normalizeWordBlock;
normalizeWordBlock=function(raw){
  const b=v73BaseNormalizeWordBlock(raw);
  if(raw&&raw.type==='diagram'&&b?.type==='diagram')b.nodes=(Array.isArray(raw.nodes)?raw.nodes:[]).slice(0,V73_MAX_NODES).map(x=>String(x??''));
  return b;
};

const v73BaseBindWordBlockEditors=bindWordBlockEditors;
bindWordBlockEditors=function(box){
  v73BaseBindWordBlockEditors(box);
  box.querySelectorAll('[data-v71-diagram-nodes]').forEach(el=>{
    el.oninput=e=>{
      const {i,j,k}=parseBlockPath(e.target.dataset.v71DiagramNodes),b=getWordItem(i,j)?.blocks?.[k];
      if(!b||b.type!=='diagram')return;
      b.nodes=String(e.target.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,V73_MAX_NODES);
      renderWordOnly();
    };
  });
};

function v73Metrics(node){
  if(node.type==='decision')return {w:174,h:96,edgeX:87,edgeY:48,label:'DECISIÓN'};
  if(node.type==='document')return {w:158,h:64,edgeX:79,edgeY:32,label:'DOCUMENTO'};
  if(node.type==='start'||node.type==='end')return {w:108,h:50,edgeX:54,edgeY:25,label:''};
  return {w:150,h:60,edgeX:75,edgeY:30,label:'PROCESO'};
}

function v73Shape(node,x,y,m){
  const stroke=`stroke="${V73_BLUE}" stroke-width="2.2" vector-effect="non-scaling-stroke"`;
  const type=m.label?`<text x="${x}" y="${y-m.h/2-13}" text-anchor="middle" font-family="Century Gothic,Arial,sans-serif" font-size="8.2" font-weight="700" letter-spacing="1" fill="${V73_GRAY}">${m.label}</text>`:'';
  if(node.type==='decision'){
    return `${type}<polygon points="${x},${y-m.h/2} ${x+m.w/2},${y} ${x},${y+m.h/2} ${x-m.w/2},${y}" fill="#FFFFFF" ${stroke}/>${v71SvgText(node.text,x,y,{fill:V73_BLUE,max:21,size:10.5,line:13})}`;
  }
  if(node.type==='document'){
    const l=x-m.w/2,r=x+m.w/2,t=y-m.h/2,b=y+m.h/2;
    const d=`M ${l} ${t} H ${r} V ${b-12} Q ${r-m.w*.23} ${b+4} ${x} ${b-6} Q ${l+m.w*.23} ${b-16} ${l} ${b-6} Z`;
    return `${type}<path d="${d}" fill="#FFFFFF" ${stroke}/><rect x="${l+1}" y="${t+1}" width="4" height="${m.h-13}" rx="2" fill="${V73_YELLOW}"/>${v71SvgText(node.text,x,y-2,{fill:V73_BLUE,max:22,size:10.5,line:13})}`;
  }
  if(node.type==='start'||node.type==='end'){
    return `<rect x="${x-m.w/2}" y="${y-m.h/2}" width="${m.w}" height="${m.h}" rx="25" fill="${V73_BLUE}" ${stroke}/>${v71SvgText(node.text,x,y,{fill:'#FFFFFF',max:15,size:10.5,line:13})}`;
  }
  const l=x-m.w/2,t=y-m.h/2;
  return `${type}<rect x="${l}" y="${t}" width="${m.w}" height="${m.h}" rx="10" fill="${V73_SURFACE}" ${stroke}/><rect x="${l+1}" y="${t+1}" width="4" height="${m.h-2}" rx="2" fill="${V73_YELLOW}"/>${v71SvgText(node.text,x+2,y,{fill:V73_BLUE,max:21,size:10.5,line:13})}`;
}

function v73BuildRows(nodes,metrics){
  const maxContent=760,gap=42,rows=[];let row=[],used=0;
  nodes.forEach((node,i)=>{
    const m=metrics[i],need=(row.length?gap:0)+m.w;
    if(row.length&&used+need>maxContent){rows.push(row);row=[];used=0}
    row.push(i);used+=(row.length>1?gap:0)+m.w;
  });
  if(row.length)rows.push(row);
  return {rows,gap,maxContent};
}

function v73LayoutRows(nodes,metrics){
  const {rows,gap,maxContent}=v73BuildRows(nodes,metrics),marginX=48,rowGap=116,firstY=92;
  const positions=Array(nodes.length),rowMeta=[];
  rows.forEach((indices,rowIndex)=>{
    const direction=rowIndex%2===0?1:-1;
    const natural=indices.reduce((s,idx)=>s+metrics[idx].w,0)+gap*Math.max(0,indices.length-1);
    const start=marginX+(maxContent-natural)/2;
    let cursor=start;
    const temp=[];
    indices.forEach(idx=>{const m=metrics[idx];temp.push({idx,x:cursor+m.w/2});cursor+=m.w+gap});
    if(direction<0)temp.reverse();
    temp.forEach(p=>positions[p.idx]={x:p.x,y:firstY+rowIndex*rowGap,row:rowIndex,direction});
    rowMeta.push({indices:[...indices],direction,y:firstY+rowIndex*rowGap,left:marginX,right:marginX+maxContent});
  });
  return {positions,rowMeta,width:maxContent+marginX*2,height:firstY+(rows.length-1)*rowGap+94};
}

function v73ConnectorPath(a,b,ma,mb,rowMeta,marker){
  if(a.row===b.row){
    const dir=a.direction;
    const sx=a.x+dir*ma.edgeX,ex=b.x-dir*mb.edgeX;
    const mid=(sx+ex)/2;
    return `<g><path d="M ${sx} ${a.y} H ${ex-dir*8}" fill="none" stroke="${V73_BLUE}" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke" marker-end="url(#${marker})"/><circle cx="${mid}" cy="${a.y}" r="2.7" fill="${V73_YELLOW}"/></g>`;
  }
  const from=rowMeta[a.row],side=from.direction>0?from.right+22:from.left-22;
  const sx=a.x+from.direction*ma.edgeX,sy=a.y;
  const ey=b.y,ex=b.x-b.direction*mb.edgeX;
  const turnY=sy+(ey-sy)/2;
  const labelX=side+(from.direction>0?-7:7),anchor=from.direction>0?'end':'start';
  return `<g><path d="M ${sx} ${sy} H ${side} Q ${side} ${turnY} ${side} ${turnY+8} V ${ey} H ${ex+b.direction*8}" fill="none" stroke="${V73_BLUE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" marker-end="url(#${marker})"/><circle cx="${side}" cy="${turnY}" r="4" fill="${V73_YELLOW}" stroke="#FFFFFF" stroke-width="1.5"/><text x="${labelX}" y="${turnY-9}" text-anchor="${anchor}" font-family="Century Gothic,Arial,sans-serif" font-size="7.5" font-weight="700" letter-spacing=".8" fill="${V73_GRAY}">CONTINÚA</text></g>`;
}

function v73HorizontalFlowSvgData(b){
  const nodes=(b.nodes||[]).map(v71ParseFlowNode).slice(0,V73_MAX_NODES);
  if(!nodes.length)nodes.push({type:'process',text:'Proceso'});
  const metrics=nodes.map(v73Metrics),layout=v73LayoutRows(nodes,metrics);
  const marker=`v73arr-${String(b.id||'x').replace(/[^A-Za-z0-9_-]/g,'')}`;
  const connectors=nodes.slice(0,-1).map((_,i)=>v73ConnectorPath(layout.positions[i],layout.positions[i+1],metrics[i],metrics[i+1],layout.rowMeta,marker)).join('');
  const shapes=nodes.map((n,i)=>v73Shape(n,layout.positions[i].x,layout.positions[i].y,metrics[i])).join('');
  return {width:layout.width,height:layout.height,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${esc(b.title)}"><defs><marker id="${marker}" markerWidth="9" markerHeight="9" refX="7.5" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,7 L8,3.5 z" fill="${V73_BLUE}"/></marker></defs><rect width="100%" height="100%" fill="#FFFFFF"/>${connectors}${shapes}</svg>`};
}

const v73BaseFlowSvgData=v71FlowSvgData;
v71FlowSvgData=function(b){
  if(b?.orientation==='horizontal')return v73HorizontalFlowSvgData(b);
  return v73BaseFlowSvgData(b);
};

if(typeof renderWordOnly==='function')renderWordOnly();
