/* ===== V64 · Word Studio Pro =================================================
   Editor modular para documentos SGC: temas, tablas, gráficas SVG animadas,
   indicadores, listas, imágenes, citas, referencias, saltos y exportación DOCX.
   Mantiene compatibilidad con los JSON y módulos existentes.
============================================================================= */
const WORD_THEME_PRESETS={
  institucional:{label:'Institucional EI',primary:'#001F73',accent:'#EAC800',secondary:'#A4A8AB',surface:'#F7F9FC'},
  ejecutivo:{label:'Ejecutivo azul',primary:'#123A63',accent:'#4EA5D9',secondary:'#8DA9C4',surface:'#F4F8FB'},
  tecnico:{label:'Técnico',primary:'#243447',accent:'#00A6A6',secondary:'#7B8794',surface:'#F5F7F8'},
  riesgo:{label:'Riesgos y control',primary:'#7A271A',accent:'#F79009',secondary:'#667085',surface:'#FFF9F5'},
  neutral:{label:'Neutral',primary:'#344054',accent:'#98A2B3',secondary:'#667085',surface:'#F9FAFB'}
};
const WORD_BLOCK_TYPES=['text','heading','table','chart','kpi','callout','citation','references','image','list','pagebreak'];

function wordUid(prefix='wb'){
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}
function cleanHex(v,fallback='#001F73'){
  const s=String(v||'').trim();
  return /^#[0-9a-fA-F]{6}$/.test(s)?s.toUpperCase():fallback;
}
function hexNoHash(v,fallback='001F73'){return cleanHex(v,'#'+fallback).slice(1)}
function safeImageSrc(src){
  const s=String(src||'').trim();
  if(!s)return '';
  if(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(s))return s;
  if(/^assets\/[A-Za-z0-9_./-]+$/i.test(s))return s;
  return '';
}
function normalizeWordBlock(raw){
  const b=raw&&typeof raw==='object'?{...raw}:{};
  b.id=String(b.id||wordUid());
  b.type=WORD_BLOCK_TYPES.includes(b.type)?b.type:'text';
  if(b.type==='text')return {...b,text:String(b.text||''),align:['left','center','right','justify'].includes(b.align)?b.align:'left'};
  if(b.type==='heading')return {...b,text:String(b.text||'Subtítulo'),level:Math.max(2,Math.min(6,Number(b.level)||2)),numbered:b.numbered!==false};
  if(b.type==='table'){
    let rows=Array.isArray(b.rows)?b.rows.map(r=>Array.isArray(r)?r.map(c=>String(c??'')):[]):[];
    if(!rows.length)rows=[['Encabezado 1','Encabezado 2','Encabezado 3'],['Dato 1','Dato 2','Dato 3']];
    const cols=Math.max(2,Math.min(8,Math.max(...rows.map(r=>r.length),3)));
    rows=rows.slice(0,20).map(r=>Array.from({length:cols},(_,i)=>String(r[i]??'')));
    return {...b,title:String(b.title||'Tabla'),caption:String(b.caption||''),header:b.header!==false,striped:b.striped!==false,rows};
  }
  if(b.type==='chart')return {...b,title:String(b.title||'Gráfica'),chartType:['bar','horizontal','line','donut'].includes(b.chartType)?b.chartType:'bar',labels:Array.isArray(b.labels)?b.labels.map(String).slice(0,12):['A','B','C'],values:Array.isArray(b.values)?b.values.map(v=>Number(v)||0).slice(0,12):[30,55,80],showLegend:b.showLegend!==false,showValues:b.showValues!==false,animate:b.animate!==false,color1:cleanHex(b.color1||'#001F73'),color2:cleanHex(b.color2||'#EAC800'),color3:cleanHex(b.color3||'#2F80ED')};
  if(b.type==='kpi')return {...b,title:String(b.title||'Indicadores'),items:(Array.isArray(b.items)?b.items:[]).slice(0,6).map(x=>({label:String(x?.label||''),value:String(x?.value||''),detail:String(x?.detail||'')}))};
  if(b.type==='callout')return {...b,tone:['info','success','warning','risk','neutral'].includes(b.tone)?b.tone:'info',title:String(b.title||'Nota'),text:String(b.text||'')};
  if(b.type==='citation')return {...b,refId:String(b.refId||''),page:String(b.page||''),prefix:String(b.prefix||''),suffix:String(b.suffix||'')};
  if(b.type==='references')return {...b,title:String(b.title||'REFERENCIAS'),style:['apa7','iso690','numeric'].includes(b.style)?b.style:'apa7'};
  if(b.type==='image')return {...b,src:safeImageSrc(b.src),caption:String(b.caption||''),alt:String(b.alt||''),width:Math.max(20,Math.min(100,Number(b.width)||80)),align:['left','center','right'].includes(b.align)?b.align:'center'};
  if(b.type==='list')return {...b,title:String(b.title||''),ordered:!!b.ordered,items:(Array.isArray(b.items)?b.items:[]).slice(0,40).map(String)};
  return {...b,type:'pagebreak'};
}
function ensureWordStudioDefaults(){
  const p=WORD_THEME_PRESETS[doc.wordTheme?.preset]||WORD_THEME_PRESETS.institucional;
  doc.wordTheme={
    preset:doc.wordTheme?.preset||'institucional',
    primary:cleanHex(doc.wordTheme?.primary||p.primary,p.primary),
    accent:cleanHex(doc.wordTheme?.accent||p.accent,p.accent),
    secondary:cleanHex(doc.wordTheme?.secondary||p.secondary,p.secondary),
    surface:cleanHex(doc.wordTheme?.surface||p.surface,p.surface),
    animateCharts:doc.wordTheme?.animateCharts!==false
  };
  doc.references=Array.isArray(doc.references)?doc.references.map(r=>({
    id:String(r?.id||wordUid('ref')),
    author:String(r?.author||''),year:String(r?.year||''),title:String(r?.title||''),source:String(r?.source||''),url:String(r?.url||''),doi:String(r?.doi||'')
  })):[];
  doc.sections=Array.isArray(doc.sections)?doc.sections:[];
  doc.sections.forEach(s=>{
    s.blocks=(Array.isArray(s.blocks)?s.blocks:[]).map(normalizeWordBlock);
    (s.sub||[]).forEach(ss=>{ss.blocks=(Array.isArray(ss.blocks)?ss.blocks:[]).map(normalizeWordBlock)});
  });
}
function ensureWordSubtitles(){
  doc.sections=Array.isArray(doc.sections)?doc.sections:[];
  doc.sections=doc.sections.map((s,i)=>{
    const sec={...s,n:String(s?.n??(i+1)),t:String(s?.t||''),c:String(s?.c||''),changeVersion:String(s?.changeVersion||doc.version||'Versión 1'),sub:Array.isArray(s?.sub)?s.sub:[],blocks:Array.isArray(s?.blocks)?s.blocks:[]};
    sec.sub=sec.sub.map((ss,j)=>({...ss,n:cleanSectionNumber(ss?.n,`${cleanSectionNumber(sec.n,i+1)}.${j+1}`),t:String(ss?.t||''),c:String(ss?.c||''),changeVersion:String(ss?.changeVersion||doc.version||'Versión 1'),blocks:Array.isArray(ss?.blocks)?ss.blocks:[]}));
    return sec;
  });
  ensureWordStudioDefaults();
}
function wordThemeStyle(){
  ensureWordStudioDefaults();
  const t=doc.wordTheme;
  return `--doc-primary:${cleanHex(t.primary)};--doc-accent:${cleanHex(t.accent)};--doc-secondary:${cleanHex(t.secondary)};--doc-surface:${cleanHex(t.surface)}`;
}
function applyWordThemePreset(name){
  const p=WORD_THEME_PRESETS[name]||WORD_THEME_PRESETS.institucional;
  doc.wordTheme={preset:name,primary:p.primary,accent:p.accent,secondary:p.secondary,surface:p.surface,animateCharts:doc.wordTheme?.animateCharts!==false};
  render();
}
function renderWordStudioControls(){
  ensureWordStudioDefaults();
  const preset=$('wordThemePreset'), primary=$('wordPrimaryColor'), accent=$('wordAccentColor'), secondary=$('wordSecondaryColor'), anim=$('wordChartAnimation');
  if(preset){preset.value=doc.wordTheme.preset;preset.onchange=e=>applyWordThemePreset(e.target.value)}
  if(primary){primary.value=doc.wordTheme.primary;primary.oninput=e=>{doc.wordTheme.primary=cleanHex(e.target.value,doc.wordTheme.primary);renderWordOnly()}}
  if(accent){accent.value=doc.wordTheme.accent;accent.oninput=e=>{doc.wordTheme.accent=cleanHex(e.target.value,doc.wordTheme.accent);renderWordOnly()}}
  if(secondary){secondary.value=doc.wordTheme.secondary;secondary.oninput=e=>{doc.wordTheme.secondary=cleanHex(e.target.value,doc.wordTheme.secondary);renderWordOnly()}}
  if(anim){anim.checked=doc.wordTheme.animateCharts;anim.onchange=e=>{doc.wordTheme.animateCharts=!!e.target.checked;renderWordOnly()}}
}
function addReference(){doc.references.push({id:wordUid('ref'),author:'',year:'',title:'',source:'',url:'',doi:''});render()}
function removeReference(i){doc.references.splice(i,1);render()}
function renderReferenceManager(){
  const box=$('wordReferenceManager'); if(!box)return; ensureWordStudioDefaults();
  box.innerHTML=`<div class="word-ref-head"><strong>Fuentes y citaciones</strong><button type="button" onclick="addReference()">+ Fuente</button></div>${doc.references.map((r,i)=>`<div class="word-ref-card">
    <div class="word-ref-title"><span>Fuente ${i+1}</span><button class="danger" type="button" onclick="removeReference(${i})">Eliminar</button></div>
    <div class="grid2"><label>Autor / entidad<input data-ref-field="author" data-ref-i="${i}" value="${esc(r.author)}"></label><label>Año<input data-ref-field="year" data-ref-i="${i}" value="${esc(r.year)}"></label></div>
    <label>Título<input data-ref-field="title" data-ref-i="${i}" value="${esc(r.title)}"></label>
    <label>Publicación / editorial<input data-ref-field="source" data-ref-i="${i}" value="${esc(r.source)}"></label>
    <div class="grid2"><label>URL<input data-ref-field="url" data-ref-i="${i}" value="${esc(r.url)}"></label><label>DOI<input data-ref-field="doi" data-ref-i="${i}" value="${esc(r.doi)}"></label></div>
  </div>`).join('') || '<p class="word-ref-empty">Agregue fuentes para insertar citaciones y bibliografía automática.</p>'}`;
  box.querySelectorAll('[data-ref-field]').forEach(el=>el.oninput=e=>{const i=+e.target.dataset.refI;const f=e.target.dataset.refField;if(doc.references[i])doc.references[i][f]=e.target.value;renderWordOnly()});
}
function refById(id){return doc.references.find(r=>r.id===id)}
function authorShort(author){
  const a=String(author||'').trim(); if(!a)return 'Autor';
  if(a.includes(','))return a.split(',')[0].trim();
  const parts=a.split(/\s+/); return parts.length>1?parts[parts.length-1]:a;
}
function formatInlineCitation(ref,page=''){
  if(!ref)return '(Fuente pendiente)';
  const p=String(page||'').trim();
  return `(${authorShort(ref.author)}, ${ref.year||'s. f.'}${p?`, p. ${p}`:''})`;
}
function formatReferenceAPA(ref){
  const author=ref.author||'Autor o entidad'; const year=ref.year||'s. f.'; const title=ref.title||'Título pendiente';
  const source=ref.source?` ${ref.source}.`:''; const link=ref.doi||ref.url;
  return `${author}. (${year}). ${title}.${source}${link?` ${link}`:''}`.replace(/\.\./g,'.');
}
function formatReferenceISO(ref){
  const author=(ref.author||'AUTOR O ENTIDAD').toUpperCase();
  return `${author}. ${ref.title||'Título pendiente'}. ${ref.source||''}${ref.year?`, ${ref.year}`:''}.${ref.doi||ref.url?` ${ref.doi||ref.url}`:''}`.replace(/\s+\./g,'.');
}
function formatReferenceNumeric(ref,i){return `[${i+1}] ${formatReferenceAPA(ref)}`}
function formatReference(ref,style='apa7',i=0){return style==='iso690'?formatReferenceISO(ref):style==='numeric'?formatReferenceNumeric(ref,i):formatReferenceAPA(ref)}
