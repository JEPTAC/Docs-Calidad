/* ===== V72 · Flujograma horizontal profesional =============================
   Extensión aislada: sustituye únicamente el layout horizontal del flujograma.
   Conserva vertical, mapas conceptuales y plantilla SGC sin modificaciones.
============================================================================= */
const V72_BLUE='#001F73';
const V72_YELLOW='#EAC800';
const V72_GRAY='#667085';
const V72_SURFACE='#F8FAFC';

const v72BaseFlowSvgData=v71FlowSvgData;

function v72NodeMetrics(node){
  if(node.type==='decision')return {w:166,h:92,edge:83,label:'DECISIÓN'};
  if(node.type==='document')return {w:154,h:62,edge:77,label:'DOCUMENTO'};
  if(node.type==='start'||node.type==='end')return {w:104,h:48,edge:52,label:''};
  return {w:146,h:58,edge:73,label:'PROCESO'};
}

function v72HorizontalNodeShape(node,x,y,m){
  const common=`stroke="${V72_BLUE}" stroke-width="2.2" vector-effect="non-scaling-stroke"`;
  const typeLabel=m.label?`<text x="${x}" y="${y-m.h/2-14}" text-anchor="middle" font-family="Century Gothic,Arial,sans-serif" font-size="8.5" font-weight="700" letter-spacing="1" fill="${V72_GRAY}">${m.label}</text>`:'';
  if(node.type==='decision'){
    return `${typeLabel}<polygon points="${x},${y-m.h/2} ${x+m.w/2},${y} ${x},${y+m.h/2} ${x-m.w/2},${y}" fill="#FFFFFF" ${common}/>${v71SvgText(node.text,x,y,{fill:V72_BLUE,max:20,size:10.5,line:13})}`;
  }
  if(node.type==='document'){
    const l=x-m.w/2,r=x+m.w/2,t=y-m.h/2,b=y+m.h/2;
    const path=`M ${l} ${t} H ${r} V ${b-12} Q ${r-m.w*.23} ${b+4} ${x} ${b-6} Q ${l+m.w*.23} ${b-16} ${l} ${b-6} Z`;
    return `${typeLabel}<path d="${path}" fill="#FFFFFF" ${common}/><rect x="${l+1}" y="${t+1}" width="4" height="${m.h-13}" rx="2" fill="${V72_YELLOW}"/>${v71SvgText(node.text,x,y-2,{fill:V72_BLUE,max:22,size:10.5,line:13})}`;
  }
  if(node.type==='start'||node.type==='end'){
    return `<rect x="${x-m.w/2}" y="${y-m.h/2}" width="${m.w}" height="${m.h}" rx="24" fill="${V72_BLUE}" ${common}/>${v71SvgText(node.text,x,y,{fill:'#FFFFFF',max:15,size:10.5,line:13})}`;
  }
  const l=x-m.w/2,t=y-m.h/2;
  return `${typeLabel}<rect x="${l}" y="${t}" width="${m.w}" height="${m.h}" rx="9" fill="${V72_SURFACE}" ${common}/><rect x="${l+1}" y="${t+1}" width="4" height="${m.h-2}" rx="2" fill="${V72_YELLOW}"/>${v71SvgText(node.text,x+2,y,{fill:V72_BLUE,max:20,size:10.5,line:13})}`;
}

function v72HorizontalFlowSvgData(b){
  const nodes=(b.nodes||[]).map(v71ParseFlowNode).slice(0,12);
  if(!nodes.length)nodes.push({type:'process',text:'Proceso'});
  const metrics=nodes.map(v72NodeMetrics);
  const gap=38,marginX=36,top=42,y=118;
  const totalNodes=metrics.reduce((sum,m)=>sum+m.w,0);
  const w=Math.max(640,marginX*2+totalNodes+gap*Math.max(0,nodes.length-1));
  const h=220;
  const marker=`v72arr-${String(b.id||'x').replace(/[^A-Za-z0-9_-]/g,'')}`;
  const xs=[];let cursor=marginX;
  metrics.forEach((m,i)=>{xs.push(cursor+m.w/2);cursor+=m.w+(i<metrics.length-1?gap:0)});

  const connectors=nodes.slice(0,-1).map((node,i)=>{
    const m1=metrics[i],m2=metrics[i+1],x1=xs[i]+m1.edge,x2=xs[i+1]-m2.edge;
    const mid=(x1+x2)/2;
    return `<g class="word-flow-connector"><path d="M ${x1} ${y} H ${x2-8}" fill="none" stroke="${V72_BLUE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" marker-end="url(#${marker})"/><circle cx="${mid}" cy="${y}" r="2.6" fill="${V72_YELLOW}"/></g>`;
  }).join('');

  const shapes=nodes.map((n,i)=>v72HorizontalNodeShape(n,xs[i],y,metrics[i])).join('');
  return {
    width:w,
    height:h,
    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><defs><marker id="${marker}" markerWidth="9" markerHeight="9" refX="7.5" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,7 L8,3.5 z" fill="${V72_BLUE}"/></marker></defs><rect width="100%" height="100%" fill="#FFFFFF"/>${connectors}${shapes}</svg>`
  };
}

v71FlowSvgData=function(b){
  if(b?.orientation==='horizontal')return v72HorizontalFlowSvgData(b);
  return v72BaseFlowSvgData(b);
};

if(typeof renderWordOnly==='function')renderWordOnly();
