
const $=id=>document.getElementById(id);
let mode='home';
let zoom=.72;
const today=()=>{const d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()};
let doc={
  wordType:'oficio',
  title:'POLÍTICA DE CONFIRMACIÓN DE PAGOS Y VALIDACIÓN DE SOPORTES',
  code:'X-XX-X',
  version:'Versión X',
  cityDate:'Tuluá, '+today(),
  circularNo:'',
  para:'',
  de:'',
  asunto:'',
  body:'Escriba aquí el contenido del documento. Puede aplicar saltos de línea, párrafos y estructura institucional.',
  remitente:'NOMBRE DEL REMITENTE',
  cargo:'Cargo desempeñado',
  sections:[
    {n:'1',t:'OBJETIVO',c:'Definir el objetivo del documento.'},
    {n:'2',t:'ALCANCE',c:'Establecer el alcance de aplicación.'},
    {n:'3',t:'CONTENIDO',c:'Desarrollar el contenido técnico del documento.'},
    {n:'3.1',t:'Documentos relacionados:',c:'X-X-X'},
    {n:'3.2',t:'CONTROL DE CAMBIOS',c:'Versión 1'}
  ],
  steps:[
    {title:'Paso 1', desc:'Describa la acción inicial del instructivo.', img:''},
    {title:'Paso 2', desc:'Describa la validación o actividad siguiente.', img:''}
  ],
  table:[['Campo','Responsable','Observación'],['Actividad 1','Responsable','Observación']],
  chart:[30,55,80]
};
function setMode(m){
  mode=m;
  $('home').classList.toggle('hidden',m!=='home');
  $('editor').classList.toggle('hidden',m==='home');
  document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==m));
  document.querySelectorAll('[data-toolbar]').forEach(p=>p.classList.toggle('hidden',p.dataset.toolbar!==m));
  $('topTitle').textContent=m==='word'?'Documentos Word':m==='excel'?'Instructivos y formatos':'Centro documental';
  $('topSub').textContent=m==='word'?'Oficios, circulares y documentos SGC con plantilla visual':m==='excel'?'Pasos, imágenes, tablas y gráficas editables':'Seleccione un tipo documental';
  render();
}
function openProcedure(){window.location.href='procedimiento/index.html'}
function setZoom(z){zoom=Math.max(.35,Math.min(1.2,z));$('stage').style.transform=`scale(${zoom})`; $('zoomLabel').textContent=Math.round(zoom*100)+'%'}
function bind(){
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setMode(b.dataset.open));
  $('goHome').onclick=()=>setMode('home');
  $('openProcedure').onclick=openProcedure;
  $('zoomIn').onclick=()=>setZoom(zoom+.05); $('zoomOut').onclick=()=>setZoom(zoom-.05); $('zoomFit').onclick=()=>setZoom(.72);
  $('printPdf').onclick=()=>window.print();
  $('saveJson').onclick=saveJson; $('openJson').onchange=openJson;
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','remitente','cargo'].forEach(id=>{
    const el=$(id); if(el) el.oninput=e=>{doc[fieldMap(id)]=e.target.value;render()};
  });
  $('docBody').oninput=e=>{doc.body=e.target.value;render()};
  $('addSection').onclick=()=>{doc.sections.push({n:String(doc.sections.length+1),t:'NUEVA SECCIÓN',c:'Contenido'});render()};
  $('addStep').onclick=()=>{doc.steps.push({title:'Paso '+(doc.steps.length+1),desc:'Describa la actividad.',img:''});render()};
  $('addRow').onclick=()=>{doc.table.push(['Nuevo','Responsable','Observación']);render()};
  $('addChart').onclick=()=>{doc.chart.push(40);render()};
}
function fieldMap(id){return {wordType:'wordType',docTitle:'title',docCode:'code',docVersion:'version',cityDate:'cityDate',circularNo:'circularNo',para:'para',de:'de',asunto:'asunto',remitente:'remitente',cargo:'cargo'}[id]}
function syncInputs(){
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','remitente','cargo'].forEach(id=>{const el=$(id); if(el) el.value=doc[fieldMap(id)]??''});
  if($('docBody')) $('docBody').value=doc.body;
}
function render(){
  setZoom(zoom);
  syncInputs();
  if(mode==='word') renderWord();
  if(mode==='excel') renderExcel();
}
function letterPage(){
  const isCircular=doc.wordType==='circular';
  return `<div class="page">
    <div class="word-letter-bg" style="background-image:url('${LETTERHEAD}')"></div>
    <div class="text-layer" contenteditable="true" id="letterEdit">
      <p>${esc(doc.cityDate)}</p>
      ${isCircular?`<p class="center"><b>CIRCULAR No. ${esc(doc.circularNo)}</b></p>
      <p><b>PARA:</b> ${esc(doc.para)}</p>
      <p><b>DE:</b> ${esc(doc.de)}</p>
      <p><b>ASUNTO:</b> ${esc(doc.asunto)}</p><div class="line"></div>`:''}
      <p>${esc(doc.body).replace(/\n/g,'<br>')}</p>
      <div class="sign"><div class="line" style="width:240px"></div><b>${esc(doc.remitente)}</b><span>${esc(doc.cargo)}</span></div>
    </div>
  </div>`;
}
function sgcPages(){
  const toc = `<div class="page">${sgcHeader(1)}<div class="sgc-content"><h3 class="center" style="color:#001F73">TABLA DE CONTENIDO</h3>${doc.sections.map((s,i)=>`<p><b>${esc(s.n)}.</b> ${esc(s.t)}<span style="float:right">${i+1}</span></p>`).join('')}</div>${sgcFooter(1)}</div>`;
  const content = `<div class="page">${sgcHeader(2)}<div class="sgc-content">${doc.sections.map((s,i)=>`<div><div class="sgc-section-title"><span>${esc(s.n)}</span>&nbsp;&nbsp;${esc(s.t)}</div><div class="sgc-edit" contenteditable="true" data-sec="${i}">${esc(s.c).replace(/\n/g,'<br>')}</div></div>`).join('')}</div>${sgcFooter(2)}</div>`;
  return toc+content;
}
function sgcHeader(n){return `<div class="sgc-header"><div class="sgc-logo"><img src="${LOGO}"></div><div class="sgc-title">${esc(doc.title)}</div><div class="sgc-meta"><div>${esc(doc.code)}</div><div>${esc(doc.version)}</div></div></div>`}
function sgcFooter(n){return `<div class="sgc-footer"><span>Ingeniería Eléctrica</span><span>•</span><span>Suministros Eléctricos</span><span>•</span><span>Alumbrado Público</span><span>www.ei.com.co</span></div><div class="sgc-date">${today()}</div><div class="sgc-page-num">Pág. ${n} de 2</div>`}
function renderWord(){
  const type=doc.wordType;
  const html = (type==='oficio'||type==='circular') ? letterPage() : sgcPages();
  $('stage').innerHTML=html;
  setTimeout(()=>{
    const le=$('letterEdit'); if(le) le.oninput=e=>{doc.body=e.currentTarget.innerText};
    document.querySelectorAll('[data-sec]').forEach(el=>el.oninput=e=>{doc.sections[+e.currentTarget.dataset.sec].c=e.currentTarget.innerText});
  },0);
}
function renderExcel(){
  $('stage').innerHTML=`<div class="excel-page">
    <div class="excel-header"><div class="logo"><img src="${LOGO}"></div><div class="excel-title">${esc(doc.title)}</div><div class="excel-meta"><div>${esc(doc.code)}</div><div>${esc(doc.version)}</div></div></div>
    <div class="excel-canvas">
      <div class="step-toolbar"><b style="color:#001F73">Editor visual de instructivo/formato</b><span style="color:#667085;font-size:12px">Pasos, imágenes, tabla y gráfica</span></div>
      <div class="step-list">
        ${doc.steps.map((s,i)=>stepCard(s,i)).join('')}
        <div style="grid-column:1/-1"><h3 style="color:#001F73">Tabla editable</h3>${tableHtml()}</div>
        <div style="grid-column:1/-1"><h3 style="color:#001F73">Gráfica editable</h3>${chartHtml()}</div>
      </div>
    </div>
  </div>`;
  setTimeout(()=>{
    document.querySelectorAll('[data-step-desc]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepDesc].desc=e.target.value});
    document.querySelectorAll('[data-step-title]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepTitle].title=e.target.value;render()});
    document.querySelectorAll('[data-img]').forEach(inp=>inp.onchange=e=>loadImg(e,+e.target.dataset.img));
    document.querySelectorAll('[data-cell]').forEach(el=>el.oninput=e=>{const [r,c]=e.target.dataset.cell.split('-').map(Number);doc.table[r][c]=e.target.innerText});
    document.querySelectorAll('[data-chart]').forEach(el=>el.oninput=e=>{doc.chart[+e.target.dataset.chart]=Number(e.target.value)||0;render()});
  },0);
}
function stepCard(s,i){return `<div class="step-card"><div class="step-info"><input data-step-title="${i}" value="${esc(s.title)}"><textarea data-step-desc="${i}">${esc(s.desc)}</textarea><label class="file-btn" style="margin-top:6px">Subir imagen<input type="file" accept="image/*" data-img="${i}" hidden></label></div><div class="step-img">${s.img?`<img src="${s.img}">`:'Imagen / captura del paso'}</div></div>`}
function tableHtml(){return `<table class="table-editor">${doc.table.map((r,ri)=>`<tr>${r.map((c,ci)=>ri===0?`<th contenteditable="true" data-cell="${ri}-${ci}">${esc(c)}</th>`:`<td contenteditable="true" data-cell="${ri}-${ci}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`}
function chartHtml(){const max=Math.max(...doc.chart,100);return `<div class="chart-box">${doc.chart.map((v,i)=>`<div class="bar" style="height:${Math.max(12,v/max*160)}px"><span>${v}</span></div><input type="number" data-chart="${i}" value="${v}" style="width:70px;align-self:flex-start">`).join('')}</div>`}
function loadImg(e,i){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{doc.steps[i].img=r.result;render()};r.readAsDataURL(f)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function saveJson(){const a=document.createElement('a');const b=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});a.href=URL.createObjectURL(b);a.download='documento_ei.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function openJson(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{doc={...doc,...JSON.parse(r.result)};render()}catch(err){alert('JSON inválido')}};r.readAsText(f)}
bind(); setMode('home');
