function effectiveWordHeadingLevel(block,isSub=false){
  const base=isSub?2:1;
  return Math.max(base+1,Math.min(6,Number(block?.level)||base+1));
}
function wordHeadingInfo(item,isSub,block,blockIndex){
  const level=effectiveWordHeadingLevel(block,isSub),baseNo=String(item?.n||'1').trim()||'1',baseLevel=isSub?2:1,counters={2:0,3:0,4:0,5:0,6:0};
  (item?.blocks||[]).slice(0,blockIndex+1).forEach(x=>{
    if(x?.type!=='heading')return;
    const l=effectiveWordHeadingLevel(x,isSub);
    for(let p=baseLevel+1;p<l;p++)if(counters[p]===0)counters[p]=1;
    counters[l]++;for(let d=l+1;d<=6;d++)counters[d]=0;
  });
  const suffix=[];for(let l=baseLevel+1;l<=level;l++)suffix.push(counters[l]||1);
  const number=[baseNo,...suffix].join('.');
  return {level,number,label:`${block?.numbered===false?'':number+'  '}${String(block?.text||'')}`.trim()};
}
function wordBlocksHtml(blocks){return (blocks||[]).map(wordBlockHtml).join('')}
function wordBlockHtml(b,ctx={}){
  const t=doc.wordTheme||WORD_THEME_PRESETS.institucional;
  if(b.type==='heading'){const info=ctx.item?wordHeadingInfo(ctx.item,!!ctx.isSub,b,Number(ctx.blockIndex)||0):{level:Math.max(2,Math.min(6,Number(b.level)||2)),label:String(b.text||'')};return `<div class="word-heading-block level-${info.level}">${esc(info.label)}</div>`;}
  if(b.type==='text')return `<div class="word-rich-text" style="text-align:${b.align}">${esc(b.text).replace(/\n/g,'<br>')}</div>`;
  if(b.type==='table')return `<figure class="word-figure word-table-figure"><figcaption>${esc(b.title)}</figcaption><table class="word-pro-table ${b.striped?'is-striped':''}">${b.rows.map((r,ri)=>`<tr>${r.map(c=>ri===0&&b.header?`<th>${esc(c)}</th>`:`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>${b.caption?`<small>${esc(b.caption)}</small>`:''}</figure>`;
  if(b.type==='chart')return `<figure class="word-figure word-chart-figure"><figcaption>${esc(b.title)}</figcaption>${wordChartSvg(b)}</figure>`;
  if(b.type==='kpi')return `<figure class="word-figure"><figcaption>${esc(b.title)}</figcaption><div class="word-kpi-grid">${b.items.map(x=>`<div class="word-kpi-card"><span>${esc(x.label)}</span><strong>${esc(x.value)}</strong><small>${esc(x.detail)}</small></div>`).join('')}</div></figure>`;
  if(b.type==='callout')return `<aside class="word-callout tone-${b.tone}"><strong>${esc(b.title)}</strong><div>${esc(b.text).replace(/\n/g,'<br>')}</div></aside>`;
  if(b.type==='citation'){const ref=refById(b.refId);return `<div class="word-citation">${b.prefix?esc(b.prefix)+' ':''}<em>${esc(formatInlineCitation(ref,b.page))}</em>${b.suffix?' '+esc(b.suffix):''}</div>`}
  if(b.type==='references')return `<section class="word-references"><h4>${esc(b.title)}</h4>${doc.references.length?doc.references.map((r,i)=>`<p>${esc(formatReference(r,b.style,i))}</p>`).join(''):'<p>Sin fuentes registradas.</p>'}</section>`;
  if(b.type==='image'){const src=safeImageSrc(b.src);return `<figure class="word-figure word-image-figure align-${b.align}">${src?`<img src="${src}" alt="${esc(b.alt)}" style="width:${b.width}%">`:'<div class="word-image-placeholder">Imagen pendiente</div>'}${b.caption?`<figcaption>${esc(b.caption)}</figcaption>`:''}</figure>`}
  if(b.type==='list'){const tag=b.ordered?'ol':'ul';return `<div class="word-list-block">${b.title?`<strong>${esc(b.title)}</strong>`:''}<${tag}>${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</${tag}></div>`}
  return `<div class="word-page-break-marker">SALTO DE PÁGINA</div>`;
}
function chartData(b){
  const n=Math.max(1,Math.min(12,Math.max(b.labels?.length||0,b.values?.length||0)));
  const labels=Array.from({length:n},(_,i)=>String(b.labels?.[i]??`Dato ${i+1}`));
  const values=Array.from({length:n},(_,i)=>Number(b.values?.[i])||0);
  return {labels,values};
}
function chartPalette(b){return [cleanHex(b.color1,doc.wordTheme.primary),cleanHex(b.color2,doc.wordTheme.accent),cleanHex(b.color3,'#2F80ED'),cleanHex(doc.wordTheme.secondary,'#A4A8AB'),'#27AE60','#EB5757','#9B51E0','#56CCF2']}
function chartSvgMarkup(b,forExport=false){
  const {labels,values}=chartData(b), colors=chartPalette(b), w=640,h=280,pad=44,max=Math.max(1,...values.map(v=>Math.abs(v))); const animate=!forExport&&doc.wordTheme.animateCharts&&b.animate;
  if(b.chartType==='donut'){
    const total=Math.max(1,values.reduce((a,v)=>a+Math.max(0,v),0));const r=78,cx=190,cy=135,circ=2*Math.PI*r;let off=0;
    const arcs=values.map((v,i)=>{const part=Math.max(0,v)/total*circ;const el=`<circle class="${animate?'chart-arc-anim':''}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="34" stroke-dasharray="${part} ${circ-part}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;off+=part;return el}).join('');
    const legend=labels.map((l,i)=>`<g transform="translate(340 ${68+i*27})"><rect width="13" height="13" rx="3" fill="${colors[i%colors.length]}"/><text x="20" y="11" font-size="12" fill="#344054">${esc(l)}${b.showValues?` · ${values[i]}`:''}</text></g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/><g>${arcs}</g><text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="20" font-weight="700" fill="${doc.wordTheme.primary}">${values.reduce((a,v)=>a+v,0)}</text>${b.showLegend?legend:''}</svg>`;
  }
  if(b.chartType==='horizontal'){
    const row=(h-pad*2)/labels.length;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/>${labels.map((l,i)=>{const bw=(w-210)*(Math.max(0,values[i])/max);const y=pad+i*row+4;return `<text x="18" y="${y+14}" font-size="11" fill="#475467">${esc(l)}</text><rect x="150" y="${y}" width="${Math.max(2,bw)}" height="${Math.max(12,row-12)}" rx="5" fill="${colors[i%colors.length]}" class="${animate?'chart-hbar-anim':''}"/>${b.showValues?`<text x="${155+bw}" y="${y+14}" font-size="11" fill="#344054">${values[i]}</text>`:''}`}).join('')}</svg>`;
  }
  if(b.chartType==='line'){
    const innerW=w-pad*2,innerH=h-pad*2;const pts=values.map((v,i)=>`${pad+(labels.length===1?innerW/2:i*innerW/(labels.length-1))},${h-pad-(Math.max(0,v)/max)*innerH}`).join(' ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/><line x1="${pad}" x2="${pad}" y1="${pad}" y2="${h-pad}" stroke="#D0D5DD"/><line x1="${pad}" x2="${w-pad}" y1="${h-pad}" y2="${h-pad}" stroke="#D0D5DD"/><polyline points="${pts}" fill="none" stroke="${colors[0]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="${animate?'chart-line-anim':''}"/>${values.map((v,i)=>{const x=pad+(labels.length===1?innerW/2:i*innerW/(labels.length-1)),y=h-pad-(Math.max(0,v)/max)*innerH;return `<circle cx="${x}" cy="${y}" r="5" fill="${colors[1]}"/>${b.showValues?`<text x="${x}" y="${y-10}" text-anchor="middle" font-size="11" fill="#344054">${v}</text>`:''}<text x="${x}" y="${h-pad+18}" text-anchor="middle" font-size="10" fill="#667085">${esc(labels[i])}</text>`}).join('')}</svg>`;
  }
  const innerW=w-pad*2,gap=10,bw=Math.max(14,(innerW-gap*(labels.length-1))/labels.length);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/><line x1="${pad}" x2="${w-pad}" y1="${h-pad}" y2="${h-pad}" stroke="#D0D5DD"/>${values.map((v,i)=>{const bh=(h-pad*2)*(Math.max(0,v)/max),x=pad+i*(bw+gap),y=h-pad-bh;return `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(2,bh)}" rx="5" fill="${colors[i%colors.length]}" class="${animate?'chart-bar-anim':''}" style="transform-origin:${x+bw/2}px ${h-pad}px"/>${b.showValues?`<text x="${x+bw/2}" y="${y-8}" text-anchor="middle" font-size="11" fill="#344054">${v}</text>`:''}<text x="${x+bw/2}" y="${h-pad+18}" text-anchor="middle" font-size="10" fill="#667085">${esc(labels[i])}</text>`}).join('')}</svg>`;
}
function wordChartSvg(b){return `<div class="word-chart-shell">${chartSvgMarkup(b,false)}</div>`}

function sectionContentHtml(item,isSub=false){
  const blockHtml=wordBlocksHtml(item?.blocks||[]);
  if(isControlChangesTitle(item?.t))return controlChangesTableHtml(item)+blockHtml;
  const cls=isSub?'sgc-subsection-content':'sgc-section-content';
  const txt=String(item?.c||'').trim()?`<div class="${cls}">${esc(item.c).replace(/\n/g,'<br>')}</div>`:'';
  return txt+blockHtml;
}
function splitWordTextChunks(text,maxChars=760){
  const raw=String(text||'').replace(/\r/g,'').trim();if(!raw)return [];
  const paras=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean),out=[];
  paras.forEach(par=>{
    if(par.length<=maxChars){out.push(par);return}
    const words=par.split(/\s+/);let cur='';
    words.forEach(w=>{const next=cur?cur+' '+w:w;if(next.length>maxChars&&cur){out.push(cur);cur=w}else cur=next});if(cur)out.push(cur)
  });return out;
}
function textChunkHeight(text,isSub=false){return (isSub?22:28)+Math.max(1,Math.ceil(String(text||'').length/82))*18}
function wordBlockHeight(b){
  if(!b)return 20;
  if(b.type==='table')return 70+(b.rows?.length||2)*31;
  if(b.type==='chart')return 320;
  if(b.type==='kpi')return 150;
  if(b.type==='image')return 290;
  if(b.type==='references')return 58+(doc.references.length*43);
  if(b.type==='callout')return 92+Math.ceil(String(b.text||'').length/120)*18;
  if(b.type==='list')return 48+(b.items?.length||0)*22;
  if(b.type==='citation')return 52;
  if(b.type==='heading')return 54;
  if(b.type==='text')return 45+Math.ceil(String(b.text||'').length/82)*18;
  return 8;
}
function contentPartsForItem(item,isSub=false,itemKey='item'){
  const parts=[];
  if(isControlChangesTitle(item?.t)){
    parts.push({html:controlChangesTableHtml(item),height:120+Math.ceil(String(item?.c||'').length/75)*18});
  }else{
    const cls=isSub?'sgc-subsection-content':'sgc-section-content';
    splitWordTextChunks(item?.c||'').forEach(txt=>parts.push({html:`<div class="${cls}">${esc(txt)}</div>`,height:textChunkHeight(txt,isSub)}));
  }
  let forceNext=false;
  (item?.blocks||[]).forEach((b,k)=>{
    if(b.type==='pagebreak'){forceNext=true;return}
    if(b.type==='heading'){
      const info=wordHeadingInfo(item,isSub,b,k);
      parts.push({html:wordBlockHtml(b,{item,isSub,blockIndex:k}),height:wordBlockHeight(b),force:forceNext,toc:true,key:`h-${itemKey}-${k}`,level:info.level,label:info.label});
      forceNext=false;return;
    }
    parts.push({html:wordBlockHtml(b,{item,isSub,blockIndex:k}),height:wordBlockHeight(b),force:forceNext});forceNext=false;
  });
  return parts;
}

function buildWordEntries(){
  ensureWordSubtitles();const arr=[];
  const addItem=(item,i,j,isSub=false,fallbackNo='')=>{
    const no=cleanSectionNumber(item?.n,fallbackNo),label=`${no}  ${item?.t||''}`,itemKey=j>=0?`${i}-${j}`:`${i}`,parts=contentPartsForItem(item,isSub,itemKey),titleClass=isSub?'sgc-subsection-title':'sgc-section-title',wrapClass=isSub?'sgc-subsection-block':'sgc-section-block',titleH=isSub?46:62;
    const titleHtml=`<div class="${titleClass}">${isSub?'':`<span>${esc(no)}</span>&nbsp;&nbsp;`}${isSub?esc(no)+'&nbsp;&nbsp;':''}${esc(item?.t||'')}</div>`;
    const first=parts[0]&& !parts[0].force && !parts[0].toc && titleH+parts[0].height<=700?parts.shift():null;
    arr.push({key:j>=0?`ss-${i}-${j}`:`s-${i}`,toc:true,level:isSub?2:1,i,j,label,height:titleH+(first?.height||0),force:false,html:`<div class="${wrapClass}">${titleHtml}${first?.html||''}</div>`});
    parts.forEach(part=>arr.push({key:part.key||'',toc:!!part.toc,level:part.level||(isSub?2:1),i,j,label:part.label||'',height:Math.min(700,part.height),force:!!part.force,html:`<div class="${wrapClass} word-continuation">${part.html}</div>`}));
  };
  doc.sections.forEach((s,i)=>{const secNo=cleanSectionNumber(s.n,i+1);addItem(s,i,-1,false,String(i+1));(s.sub||[]).forEach((ss,j)=>addItem(ss,i,j,true,`${secNo}.${j+1}`))});
  return arr;
}
function paginateWordEntries(entries){
  const cap=760,pages=[];let page={entries:[],used:0};
  const push=()=>{if(page.entries.length)pages.push(page);page={entries:[],used:0}};
  entries.forEach(e=>{if((e.force&&page.entries.length)||(page.entries.length&&page.used+e.height>cap))push();page.entries.push(e);page.used+=Math.min(e.height,cap)});push();
  return pages.length?pages:[{entries:[],used:0}];
}
function sgcTocHtml(rows,pageMap){return rows.map(r=>`<p class="sgc-toc-row sgc-toc-level-${r.level} ${r.level===2?'sgc-toc-sub':''}"><span>${esc(r.label)}</span><span>${pageMap[r.key]||''}</span></p>`).join('')}
function sgcSectionsHtml(){return buildWordEntries().map(e=>e.html).join('')}
function sgcFooter(n,total=2){return `<div class="sgc-footer-ref"><img class="sgc-footer-img" src="assets/footer-ei-calidad.png" alt="Pie de página Electroingeniería"></div><div class="sgc-date">${today()}</div><div class="sgc-page-num">Pág. ${n} de ${total}</div>`}
function sgcPages(){
  const entries=buildWordEntries(),contentPages=paginateWordEntries(entries),tocRows=entries.filter(e=>e.toc).map(e=>({key:e.key,level:e.level,label:e.label})),perToc=27,tocCount=Math.max(1,Math.ceil(tocRows.length/perToc)),total=tocCount+contentPages.length,pageMap={};
  contentPages.forEach((p,pi)=>p.entries.forEach(e=>pageMap[e.key]=tocCount+pi+1));
  let html='';
  for(let ti=0;ti<tocCount;ti++)html+=`<div class="page sgc-page" style="${wordThemeStyle()}">${sgcHeader(ti+1)}<div class="sgc-content"><h3 class="center sgc-toc-title">TABLA DE CONTENIDO${tocCount>1?` · ${ti+1}/${tocCount}`:''}</h3>${sgcTocHtml(tocRows.slice(ti*perToc,(ti+1)*perToc),pageMap)}</div>${sgcFooter(ti+1,total)}</div>`;
  contentPages.forEach((p,pi)=>{const n=tocCount+pi+1;html+=`<div class="page sgc-page" style="${wordThemeStyle()}">${sgcHeader(n)}<div class="sgc-content">${p.entries.length?p.entries.map(e=>e.html).join(''):'<p class="word-empty-page">Agregue secciones y contenido para construir el documento.</p>'}</div>${sgcFooter(n,total)}</div>`});
  return html;
}
function renderWord(){normalizeWordType();applyWordTypeBodyClass();ensureWordSubtitles();$('stage').innerHTML=isLetterWordType(doc.wordType)?letterPage():sgcPages();setTimeout(()=>{const le=$('letterEdit');if(le)le.oninput=e=>{doc.body=e.currentTarget.innerText};renderWordTypeTools();renderWordSectionEditor();renderReferenceManager();renderWordStudioControls()},0)}
function renderWordOnly(){if(mode==='word'){normalizeWordType();applyWordTypeBodyClass();ensureWordSubtitles();$('stage').innerHTML=isLetterWordType(doc.wordType)?letterPage():sgcPages();setTimeout(()=>{const le=$('letterEdit');if(le)le.oninput=e=>{doc.body=e.currentTarget.innerText}},0)}}
function syncInputs(){
  normalizeWordType();applyWordTypeBodyClass();ensureWordStudioDefaults();
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','asuntoCircular','remitente','cargo'].forEach(id=>{const el=$(id);if(el)el.value=doc[fieldMap(id)]??''});
  if($('docBody'))$('docBody').value=doc.body;
  ['instrTitle','instrCode','instrVersion','objective','scope'].forEach(id=>{const el=$(id);if(el)el.value=doc[id]??''});
  ['objectiveAlign','scopeAlign'].forEach(id=>{const el=$(id);if(el)el.value=doc[id]??'center'});
  renderWordTypeTools();renderWordSectionEditor();renderReferenceManager();renderWordStudioControls();renderStepEditor();
}
function render(){ensureDocDefaults();ensureSubDefaults();ensureWordStudioDefaults();setZoom(zoom);syncInputs();if(mode==='word')renderWord();if(mode==='excel')renderInstructivo()}
