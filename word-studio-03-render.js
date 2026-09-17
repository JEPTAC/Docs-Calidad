/* ===== Word Studio · motor documental semántico ============================
   Paginación medida, fragmentación semántica y tablas multipágina.
   Mantiene intacta la plantilla SGC, sus márgenes, cabecera, colores y fuentes.
============================================================================= */
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
function detectEditorialNote(text){
  const raw=String(text||'').trim();
  const m=raw.match(/^(nota(?:\s+t[eé]cnica)?|importante|advertencia|precauci[oó]n|observaci[oó]n|recomendaci[oó]n|fuente)\s*[:.\-–]\s*([\s\S]*)$/i);
  if(!m)return null;
  const key=m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const tone=/advertencia|precaucion/.test(key)?'warning':/importante/.test(key)?'info':/recomendacion/.test(key)?'success':/fuente/.test(key)?'neutral':'info';
  return {title:m[1].replace(/\b\w/g,c=>c.toUpperCase()),text:m[2],tone};
}
function wordBlocksHtml(blocks,ctx={}){return (blocks||[]).map((b,k)=>wordBlockHtml(b,{...ctx,blockIndex:k})).join('')}
function tableRowsHtml(rows,header=false){
  return (rows||[]).map((r,ri)=>`<tr>${r.map(c=>header&&ri===0?`<th>${esc(c)}</th>`:`<td>${esc(c)}</td>`).join('')}</tr>`).join('');
}
function tableFragmentHtml(block,bodyRows,{continued=false,showCaption=false}={}){
  const all=block.rows||[],header=block.header!==false&&all.length?all[0]:null;
  const head=header?`<thead><tr>${header.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>`:'';
  const body=`<tbody>${(bodyRows||[]).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<figure class="word-figure word-table-figure ${continued?'is-continuation':''}"><figcaption>${esc(block.title||'Tabla')}${continued?' <span class="word-cont-label">(continuación)</span>':''}</figcaption><table class="word-pro-table ${block.striped?'is-striped':''}">${head}${body}</table>${showCaption&&block.caption?`<small>${esc(block.caption)}</small>`:''}</figure>`;
}
function wordBlockHtml(b,ctx={}){
  if(!b)return'';
  if(b.type==='heading'){
    const info=ctx.item?wordHeadingInfo(ctx.item,!!ctx.isSub,b,Number(ctx.blockIndex)||0):{level:Math.max(2,Math.min(6,Number(b.level)||2)),label:String(b.text||'')};
    const content=String(b.content||'').trim();
    return `<div class="word-heading-group"><div class="word-heading-block level-${info.level}">${esc(info.label)}</div>${content?`<div class="word-heading-content">${esc(content).replace(/\n/g,'<br>')}</div>`:''}</div>`;
  }
  if(b.type==='text'){
    const note=b.autoSemantic===false?null:detectEditorialNote(b.text);
    if(note)return `<aside class="word-callout tone-${note.tone} auto-note"><strong>${esc(note.title)}</strong><div>${esc(note.text).replace(/\n/g,'<br>')}</div></aside>`;
    return `<div class="word-rich-text" style="text-align:${b.align||'left'}">${esc(b.text||'').replace(/\n/g,'<br>')}</div>`;
  }
  if(b.type==='table'){
    const body=b.header!==false?(b.rows||[]).slice(1):(b.rows||[]);
    return tableFragmentHtml(b,body,{showCaption:true});
  }
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
  return {labels:Array.from({length:n},(_,i)=>String(b.labels?.[i]??`Dato ${i+1}`)),values:Array.from({length:n},(_,i)=>Number(b.values?.[i])||0)};
}
function chartPalette(b){return [cleanHex(b.color1,doc.wordTheme.primary),cleanHex(b.color2,doc.wordTheme.accent),cleanHex(b.color3,'#2F80ED'),cleanHex(doc.wordTheme.secondary,'#A4A8AB'),'#27AE60','#EB5757','#9B51E0','#56CCF2']}
function chartSvgMarkup(b,forExport=false){
  const {labels,values}=chartData(b),colors=chartPalette(b),w=640,h=280,pad=44,max=Math.max(1,...values.map(v=>Math.abs(v))),animate=!forExport&&doc.wordTheme.animateCharts&&b.animate;
  if(b.chartType==='donut'){
    const total=Math.max(1,values.reduce((a,v)=>a+Math.max(0,v),0)),r=78,cx=190,cy=135,circ=2*Math.PI*r;let off=0;
    const arcs=values.map((v,i)=>{const part=Math.max(0,v)/total*circ,el=`<circle class="${animate?'chart-arc-anim':''}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="34" stroke-dasharray="${part} ${circ-part}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;off+=part;return el}).join('');
    const legend=labels.map((l,i)=>`<g transform="translate(340 ${68+i*27})"><rect width="13" height="13" rx="3" fill="${colors[i%colors.length]}"/><text x="20" y="11" font-size="12" fill="#344054">${esc(l)}${b.showValues?` · ${values[i]}`:''}</text></g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/><g>${arcs}</g><text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="20" font-weight="700" fill="${doc.wordTheme.primary}">${values.reduce((a,v)=>a+v,0)}</text>${b.showLegend?legend:''}</svg>`;
  }
  if(b.chartType==='horizontal'){
    const row=(h-pad*2)/labels.length;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/>${labels.map((l,i)=>{const bw=(w-210)*(Math.max(0,values[i])/max),y=pad+i*row+4;return `<text x="18" y="${y+14}" font-size="11" fill="#475467">${esc(l)}</text><rect x="150" y="${y}" width="${Math.max(2,bw)}" height="${Math.max(12,row-12)}" rx="5" fill="${colors[i%colors.length]}" class="${animate?'chart-hbar-anim':''}"/>${b.showValues?`<text x="${155+bw}" y="${y+14}" font-size="11" fill="#344054">${values[i]}</text>`:''}`}).join('')}</svg>`;
  }
  if(b.chartType==='line'){
    const innerW=w-pad*2,innerH=h-pad*2,pts=values.map((v,i)=>`${pad+(labels.length===1?innerW/2:i*innerW/(labels.length-1))},${h-pad-(Math.max(0,v)/max)*innerH}`).join(' ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/><line x1="${pad}" x2="${pad}" y1="${pad}" y2="${h-pad}" stroke="#D0D5DD"/><line x1="${pad}" x2="${w-pad}" y1="${h-pad}" y2="${h-pad}" stroke="#D0D5DD"/><polyline points="${pts}" fill="none" stroke="${colors[0]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="${animate?'chart-line-anim':''}"/>${values.map((v,i)=>{const x=pad+(labels.length===1?innerW/2:i*innerW/(labels.length-1)),y=h-pad-(Math.max(0,v)/max)*innerH;return `<circle cx="${x}" cy="${y}" r="5" fill="${colors[1]}"/>${b.showValues?`<text x="${x}" y="${y-10}" text-anchor="middle" font-size="11" fill="#344054">${v}</text>`:''}<text x="${x}" y="${h-pad+18}" text-anchor="middle" font-size="10" fill="#667085">${esc(labels[i])}</text>`}).join('')}</svg>`;
  }
  const innerW=w-pad*2,gap=10,bw=Math.max(14,(innerW-gap*(labels.length-1))/labels.length);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.title)}"><rect width="100%" height="100%" rx="14" fill="#fff"/><line x1="${pad}" x2="${w-pad}" y1="${h-pad}" y2="${h-pad}" stroke="#D0D5DD"/>${values.map((v,i)=>{const bh=(h-pad*2)*(Math.max(0,v)/max),x=pad+i*(bw+gap),y=h-pad-bh;return `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(2,bh)}" rx="5" fill="${colors[i%colors.length]}" class="${animate?'chart-bar-anim':''}" style="transform-origin:${x+bw/2}px ${h-pad}px"/>${b.showValues?`<text x="${x+bw/2}" y="${y-8}" text-anchor="middle" font-size="11" fill="#344054">${v}</text>`:''}<text x="${x+bw/2}" y="${h-pad+18}" text-anchor="middle" font-size="10" fill="#667085">${esc(labels[i])}</text>`}).join('')}</svg>`;
}
function wordChartSvg(b){return `<div class="word-chart-shell">${chartSvgMarkup(b,false)}</div>`}
function splitSemanticText(text,maxChars=1100){
  const raw=String(text||'').replace(/\r/g,'').trim();if(!raw)return[];
  const paragraphs=raw.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean),out=[];
  paragraphs.forEach(p=>{
    if(p.length<=maxChars){out.push(p);return}
    const sentences=p.match(/[^.!?;:]+(?:[.!?;:]+|$)/g)||[p];let cur='';
    sentences.forEach(s=>{const next=(cur+' '+s.trim()).trim();if(cur&&next.length>maxChars){out.push(cur);cur=s.trim()}else cur=next});if(cur)out.push(cur);
  });
  return out;
}
function paragraphHtml(text,isSub=false,extra=''){
  const cls=isSub?'sgc-subsection-content':'sgc-section-content';
  return `<div class="${cls} ${extra}">${esc(text).replace(/\n/g,'<br>')}</div>`;
}
function sectionTitleHtml(item,isSub=false,fallbackNo=''){
  const no=cleanSectionNumber(item?.n,fallbackNo),cls=isSub?'sgc-subsection-title':'sgc-section-title';
  return `<div class="${cls}">${isSub?'':`<span>${esc(no)}</span>&nbsp;&nbsp;`}${isSub?esc(no)+'&nbsp;&nbsp;':''}${esc(item?.t||'')}</div>`;
}
function buildWordEntries(){
  ensureWordSubtitles();const entries=[];
  const addItem=(item,i,j,isSub=false,fallbackNo='')=>{
    const no=cleanSectionNumber(item?.n,fallbackNo),key=j>=0?`ss-${i}-${j}`:`s-${i}`,wrap=isSub?'sgc-subsection-block':'sgc-section-block',title=sectionTitleHtml(item,isSub,fallbackNo),texts=isControlChangesTitle(item?.t)?[]:splitSemanticText(item?.c||''),control=isControlChangesTitle(item?.t)?controlChangesTableHtml(item):'';
    let first='';if(control)first=control;else if(texts.length)first=paragraphHtml(texts.shift(),isSub,'word-first-paragraph');
    entries.push({kind:'atomic',key,toc:true,level:isSub?2:1,label:`${no}  ${item?.t||''}`,keepWithNext:true,html:`<div class="${wrap} word-title-group">${title}${first}</div>`});
    texts.forEach(txt=>entries.push({kind:'text',html:`<div class="${wrap} word-continuation">${paragraphHtml(txt,isSub)}</div>`}));
    (item?.blocks||[]).forEach((b,k)=>{
      if(b.type==='pagebreak'){entries.push({kind:'break'});return}
      if(b.type==='heading'){
        const info=wordHeadingInfo(item,isSub,b,k),parts=splitSemanticText(b.content||''),firstContent=parts.shift()||'',html=`<div class="${wrap} word-continuation"><div class="word-heading-group"><div class="word-heading-block level-${info.level}">${esc(info.label)}</div>${firstContent?`<div class="word-heading-content">${esc(firstContent).replace(/\n/g,'<br>')}</div>`:''}</div></div>`;
        entries.push({kind:'atomic',key:`h-${i}-${j}-${k}`,toc:true,level:info.level,label:info.label,keepWithNext:true,force:!!b.pageBreakBefore,html});
        parts.forEach(txt=>entries.push({kind:'text',html:`<div class="${wrap} word-continuation"><div class="word-heading-content is-continuation">${esc(txt).replace(/\n/g,'<br>')}</div></div>`}));
      }else if(b.type==='table')entries.push({kind:'table',block:b,wrap});
      else entries.push({kind:'atomic',html:`<div class="${wrap} word-continuation">${wordBlockHtml(b,{item,isSub,blockIndex:k})}</div>`});
    });
  };
  doc.sections.forEach((s,i)=>{const secNo=cleanSectionNumber(s.n,i+1);addItem(s,i,-1,false,String(i+1));(s.sub||[]).forEach((ss,j)=>addItem(ss,i,j,true,`${secNo}.${j+1}`))});
  return entries;
}
function createWordMeasure(){
  const host=document.createElement('div');host.className='word-measure-host';host.setAttribute('aria-hidden','true');
  host.innerHTML=`<div class="page sgc-page" style="${wordThemeStyle()}">${sgcHeader(1)}<div class="sgc-content word-measure-content"></div>${sgcFooter(1,1)}</div>`;
  document.body.appendChild(host);const content=host.querySelector('.word-measure-content');
  const style=getComputedStyle(content),rect=content.getBoundingClientRect();
  let capacity=rect.height;
  if(!capacity||capacity<100){capacity=parseFloat(style.height)||760}
  return {host,content,capacity,fit(html){content.innerHTML=html;return content.scrollHeight<=capacity+1},height(html){content.innerHTML=html;return content.scrollHeight}};
}
function paginateWordEntries(entries){
  const m=createWordMeasure(),pages=[];let current=[];
  const htmlOf=arr=>arr.join('');
  const pushPage=()=>{if(current.length)pages.push(current);current=[]};
  const fits=html=>m.fit(htmlOf(current)+html);
  const addAtomic=e=>{
    if(e.force&&current.length)pushPage();
    if(current.length&&!fits(e.html))pushPage();
    current.push(e.html);
  };
  const addTable=e=>{
    const b=e.block,all=b.rows||[],body=b.header!==false?all.slice(1):all.slice(),wrap=e.wrap||'sgc-section-block';
    if(!body.length){addAtomic({html:`<div class="${wrap} word-continuation">${tableFragmentHtml(b,[],{showCaption:true})}</div>`});return}
    let pos=0,continued=false;
    while(pos<body.length){
      let chunk=[],accepted=0;
      for(let idx=pos;idx<body.length;idx++){
        const test=[...chunk,body[idx]],fragment=`<div class="${wrap} word-continuation">${tableFragmentHtml(b,test,{continued,showCaption:idx===body.length-1})}</div>`;
        if(fits(fragment)){chunk=test;accepted++}else break;
      }
      if(!accepted&&current.length){pushPage();continue}
      if(!accepted){chunk=[body[pos]];accepted=1}
      const last=pos+accepted>=body.length,fragment=`<div class="${wrap} word-continuation">${tableFragmentHtml(b,chunk,{continued,showCaption:last})}</div>`;
      current.push(fragment);pos+=accepted;
      if(pos<body.length){pushPage();continued=true}
    }
  };
  try{
    for(const e of entries){if(e.kind==='break'){pushPage();continue}if(e.kind==='table'){addTable(e);continue}addAtomic(e)}
    pushPage();
  }finally{m.host.remove()}
  return pages.length?pages:[[]];
}
function buildPageMap(entries,pages,tocCount){
  const map={};let cursor=0;
  entries.filter(e=>e.toc).forEach(e=>{
    for(let p=cursor;p<pages.length;p++){
      if(pages[p].some(html=>html.includes(`>${esc(e.label).split('&').join('&amp;')}<`)||html.includes(esc(e.label)))){map[e.key]=tocCount+p+1;cursor=p;break}
    }
  });
  return map;
}
function sgcTocHtml(rows,pageMap){return rows.map(r=>`<p class="sgc-toc-row sgc-toc-level-${r.level} ${r.level===2?'sgc-toc-sub':''}"><span>${esc(r.label)}</span><span>${pageMap[r.key]||''}</span></p>`).join('')}
function sgcSectionsHtml(){return buildWordEntries().filter(e=>e.html).map(e=>e.html).join('')}
function sgcFooter(n,total=2){return `<div class="sgc-footer-ref"><img class="sgc-footer-img" src="assets/footer-ei-calidad.png" alt="Pie de página Electroingeniería"></div><div class="sgc-date">${today()}</div><div class="sgc-page-num">Pág. ${n} de ${total}</div>`}
function sgcPages(){
  const entries=buildWordEntries(),contentPages=paginateWordEntries(entries),tocRows=entries.filter(e=>e.toc).map(e=>({key:e.key,level:e.level,label:e.label})),perToc=27,tocCount=Math.max(1,Math.ceil(tocRows.length/perToc)),total=tocCount+contentPages.length;
  const pageMap={};entries.filter(e=>e.toc).forEach(e=>{for(let pi=0;pi<contentPages.length;pi++){const needle=esc(e.label);if(contentPages[pi].some(h=>h.includes(needle))){pageMap[e.key]=tocCount+pi+1;break}}});
  let html='';
  for(let ti=0;ti<tocCount;ti++)html+=`<div class="page sgc-page" style="${wordThemeStyle()}">${sgcHeader(ti+1)}<div class="sgc-content"><h3 class="center sgc-toc-title">TABLA DE CONTENIDO${tocCount>1?` · ${ti+1}/${tocCount}`:''}</h3>${sgcTocHtml(tocRows.slice(ti*perToc,(ti+1)*perToc),pageMap)}</div>${sgcFooter(ti+1,total)}</div>`;
  contentPages.forEach((parts,pi)=>{const n=tocCount+pi+1;html+=`<div class="page sgc-page" style="${wordThemeStyle()}">${sgcHeader(n)}<div class="sgc-content">${parts.length?parts.join(''):'<p class="word-empty-page">Agregue secciones y contenido para construir el documento.</p>'}</div>${sgcFooter(n,total)}</div>`});
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
