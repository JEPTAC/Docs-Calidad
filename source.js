
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
  wordTable:[['Versión','Vigente desde','Observación'],['Versión 1','','']],
  wordChart:[30,55,80],
  instrTitle:'INSTRUCTIVO PARA LA CREACIÓN DE COTIZACIONES EN EL CRM',
  instrCode:'S-IN-9',
  instrVersion:'Versión 3',
  objective:'Indicar los pasos que se deben seguir en el CRM para la creación de una cotización de venta.',
  scope:'Aplica a todos los asesores comerciales de la Unidad de Negocio de Suministros Eléctricos de ELECTROINGENIERÍA S.A.S.',
  steps:[
    {n:'1',title:'Ingreso al CRM',notes:[],sub:[
      {code:'1.1',text:'En el navegador, ingrese al enlace de Siesa CRM con el usuario y contraseña asignado.',image:''},
      {code:'1.2',text:'Seleccione el botón de Menú ubicado en la parte superior izquierda y elija la opción “Cotizaciones” > “Crear”.',image:''}
    ]},
    {n:'2',title:'Crear cotización',notes:['Antes de crear una cotización, asegúrese de que el cliente o cliente potencial esté creado en el sistema.'],sub:[
      {code:'2.1',text:'Complete los datos básicos requeridos para iniciar la cotización.',image:''}
    ]}
  ]
};
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function setMode(m){
  mode=m;
  $('home').classList.toggle('hidden',m!=='home');
  $('editor').classList.toggle('hidden',m==='home');
  document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==m));
  $('topTitle').textContent=m==='word'?'Documentos Word':m==='excel'?'Instructivo visual':'Centro documental';
  $('topSub').textContent=m==='word'?'Oficios, circulares y documentos SGC con tablas y gráficas':m==='excel'?'Paso general, pasos específicos, imágenes y señalización visual':'Seleccione un tipo documental';
  render();
}
function openProcedure(){window.location.href='procedimiento/index.html'}
function setZoom(z){zoom=Math.max(.35,Math.min(1.2,z));$('stage').style.transform=`scale(${zoom})`; $('zoomLabel').textContent=Math.round(zoom*100)+'%'}
function bind(){
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setMode(b.dataset.open));
  $('goHome').onclick=()=>setMode('home'); $('openProcedure').onclick=openProcedure;
  $('zoomIn').onclick=()=>setZoom(zoom+.05); $('zoomOut').onclick=()=>setZoom(zoom-.05); $('zoomFit').onclick=()=>setZoom(.72);
  $('printPdf').onclick=()=>window.print(); $('saveJson').onclick=saveJson; $('openJson').onchange=openJson;
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','remitente','cargo'].forEach(id=>{const el=$(id); if(el) el.oninput=e=>{doc[fieldMap(id)]=e.target.value;render()}});
  $('docBody').oninput=e=>{doc.body=e.target.value;render()};
  $('addSection').onclick=()=>{doc.sections.push({n:String(doc.sections.length+1),t:'NUEVA SECCIÓN',c:'Contenido'});render()};
  $('addWordTableRow').onclick=()=>{doc.wordTable.push(['','','']);render()};
  $('addWordChart').onclick=()=>{doc.wordChart.push(40);render()};
  ['instrTitle','instrCode','instrVersion','objective','scope'].forEach(id=>{const el=$(id); if(el) el.oninput=e=>{doc[id]=e.target.value;render()}});
  $('addStep').onclick=()=>{doc.steps.push({n:String(doc.steps.length+1),title:'Nuevo paso general',notes:[],sub:[{code:(doc.steps.length+1)+'.1',text:'Describa el paso específico.',image:''}]});render()};
  $('addNote').onclick=()=>{const i=Math.max(0,doc.steps.length-1);doc.steps[i].notes=doc.steps[i].notes||[];doc.steps[i].notes.push('Escriba la nota del paso.');render()};
}
function fieldMap(id){return {wordType:'wordType',docTitle:'title',docCode:'code',docVersion:'version',cityDate:'cityDate',circularNo:'circularNo',para:'para',de:'de',asunto:'asunto',remitente:'remitente',cargo:'cargo'}[id]}
function syncInputs(){
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','remitente','cargo'].forEach(id=>{const el=$(id); if(el) el.value=doc[fieldMap(id)]??''});
  if($('docBody')) $('docBody').value=doc.body;
  ['instrTitle','instrCode','instrVersion','objective','scope'].forEach(id=>{const el=$(id); if(el) el.value=doc[id]??''});
}
function render(){setZoom(zoom);syncInputs();if(mode==='word')renderWord();if(mode==='excel')renderInstructivo();}
function letterPage(){
  const isCircular=doc.wordType==='circular';
  return `<div class="page"><div class="word-letter-bg" style="background-image:url('${LETTERHEAD}')"></div><div class="text-layer" contenteditable="true" id="letterEdit"><p>${esc(doc.cityDate)}</p>${isCircular?`<p class="center"><b>CIRCULAR No. ${esc(doc.circularNo)}</b></p><p><b>PARA:</b> ${esc(doc.para)}</p><p><b>DE:</b> ${esc(doc.de)}</p><p><b>ASUNTO:</b> ${esc(doc.asunto)}</p><div class="line"></div>`:''}<p>${esc(doc.body).replace(/\n/g,'<br>')}</p><div class="sign"><div class="line" style="width:240px"></div><b>${esc(doc.remitente)}</b><span>${esc(doc.cargo)}</span></div></div></div>`;
}
function sgcPages(){
  const toc=`<div class="page">${sgcHeader(1)}<div class="sgc-content"><h3 class="center" style="color:#001F73">TABLA DE CONTENIDO</h3>${doc.sections.map((s,i)=>`<p><b>${esc(s.n)}.</b> ${esc(s.t)}<span style="float:right">${i+1}</span></p>`).join('')}</div>${sgcFooter(1)}</div>`;
  const content=`<div class="page">${sgcHeader(2)}<div class="sgc-content">${doc.sections.map((s,i)=>`<div><div class="sgc-section-title"><span>${esc(s.n)}</span>&nbsp;&nbsp;${esc(s.t)}</div><div class="sgc-edit" contenteditable="true" data-sec="${i}">${esc(s.c).replace(/\n/g,'<br>')}</div></div>`).join('')}${tableHtml()}${chartHtml()}</div>${sgcFooter(2)}</div>`;
  return toc+content;
}
function sgcHeader(n){return `<div class="sgc-header"><div class="sgc-logo"><img src="${LOGO}"></div><div class="sgc-title">${esc(doc.title)}</div><div class="sgc-meta"><div>${esc(doc.code)}</div><div>${esc(doc.version)}</div></div></div>`}
function sgcFooter(n){return `<div class="sgc-footer"><span>Ingeniería Eléctrica</span><span>•</span><span>Suministros Eléctricos</span><span>•</span><span>Alumbrado Público</span><span>www.ei.com.co</span></div><div class="sgc-date">${today()}</div><div class="sgc-page-num">Pág. ${n} de 2</div>`}
function renderWord(){
  $('stage').innerHTML=(doc.wordType==='oficio'||doc.wordType==='circular')?letterPage():sgcPages();
  setTimeout(()=>{const le=$('letterEdit'); if(le) le.oninput=e=>{doc.body=e.currentTarget.innerText};document.querySelectorAll('[data-sec]').forEach(el=>el.oninput=e=>{doc.sections[+e.currentTarget.dataset.sec].c=e.currentTarget.innerText});bindTableChart();},0);
}
function tableHtml(){return `<h3 style="color:#001F73">Tabla editable</h3><table class="word-table">${doc.wordTable.map((r,ri)=>`<tr>${r.map((c,ci)=>ri===0?`<th contenteditable="true" data-cell="${ri}-${ci}">${esc(c)}</th>`:`<td contenteditable="true" data-cell="${ri}-${ci}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`}
function chartHtml(){const max=Math.max(...doc.wordChart,100);return `<h3 style="color:#001F73">Gráfica editable</h3><div class="word-chart">${doc.wordChart.map((v,i)=>`<div class="word-bar" style="height:${Math.max(12,v/max*130)}px"><span>${v}</span></div><input type="number" data-chart="${i}" value="${v}" style="width:65px;align-self:flex-start">`).join('')}</div>`}
function bindTableChart(){document.querySelectorAll('[data-cell]').forEach(el=>el.oninput=e=>{const [r,c]=e.target.dataset.cell.split('-').map(Number);doc.wordTable[r][c]=e.target.innerText});document.querySelectorAll('[data-chart]').forEach(el=>el.oninput=e=>{doc.wordChart[+e.target.dataset.chart]=Number(e.target.value)||0;render()})}

function instrHeader(){
  return `<div class="instr-header"><div class="logo"><img src="${LOGO}"></div><div class="instr-title">${esc(doc.instrTitle)}</div><div class="instr-meta"><div>${esc(doc.instrCode)}</div><div>${esc(doc.instrVersion)}</div></div></div>`;
}
function instrFooter(i,total){
  return `<div class="instr-page-line"></div><div class="instr-footer"><div>${today()}</div><div>Pág. ${i} de ${total}</div></div>`;
}
function renderInstructivo(){
  const total = doc.steps.length + 1;
  const cover = `<div class="instr-page">${instrHeader()}<div class="instr-content">
    <div class="instr-cover-title">${esc(doc.instrTitle)}</div>
    <div class="instr-section-title">OBJETIVO</div>
    <div class="instr-text-box" contenteditable="true" id="objEdit">${esc(doc.objective)}</div>
    <div class="instr-section-title">ALCANCE</div>
    <div class="instr-text-box" contenteditable="true" id="scopeEdit">${esc(doc.scope)}</div>
    <div class="instr-section-title">PASO A PASO</div>
    <p style="color:#111">Cada página siguiente desarrolla un paso general con sus subpasos específicos e imágenes de soporte.</p>
  </div>${instrFooter(1,total)}</div>`;
  const pages = doc.steps.map((s,i)=>stepPageHtml(s,i,total)).join('<div class="instr-page-separator no-print">Separador de página</div>');
  $('stage').innerHTML=cover + '<div class="instr-page-separator no-print">Separador de página</div>' + pages;
  setTimeout(bindInstr,0);
}
function stepPageHtml(s,i,total){
  const pageNo = i + 2;
  return `<div class="instr-page">${instrHeader()}<div class="instr-content">
    <div class="step-page-title"><div class="step-page-num">${esc(s.n)}.</div><div class="step-page-name" contenteditable="true" data-step-title="${i}">${esc(s.title)}</div></div>
    ${(s.sub||[]).map((ss,j)=>subStepHtml(ss,i,j)).join('')}
    ${((s.notes||[]).length ? (s.notes||[]).map((n,j)=>noteHtml(n,i,j)).join('') : '')}
    <div class="actions no-print"><button onclick="addSub(${i})">+ Subpaso</button><button onclick="addNoteToStep(${i})">+ Nota</button></div>
  </div>${instrFooter(pageNo,total)}</div>`;
}
function subStepHtml(ss,i,j){
  const hasImg = !!ss.image;
  return `<div class="substep-card">
    <div class="substep-head"><div class="substep-code">${esc(ss.code)}</div><div class="substep-text" contenteditable="true" data-sub="${i}-${j}">${esc(ss.text)}</div></div>
    <div class="substep-body">
      <div class="substep-detail">
        <label class="file-btn no-print">Agregar imagen del subpaso<input type="file" accept="image/*" data-sub-img="${i}-${j}" hidden></label>
        <button class="danger no-print" onclick="removeSubImage(${i},${j})">Quitar imagen</button>
      </div>
      <div class="substep-img ${hasImg?'':'empty-print'}">${hasImg?`<img src="${ss.image}">`:'<span class="empty-img no-print">Imagen del subpaso</span>'}</div>
    </div>
  </div>`;
}
function noteHtml(text,i,j){
  const clean = String(text||'').trim();
  return `<div class="note-row ${clean?'':'empty-note'}">
    <div class="note-icon">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6V3Z" fill="#EAC800"/>
        <path d="M15 3v4h4" stroke="#fff" stroke-width="1.8"/>
        <path d="M8 10h8M8 14h8M8 18h5" stroke="#001F73" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="note-text" contenteditable="true" data-note="${i}-${j}">${esc(text)}</div>
  </div>`;
}
function bindInstr(){
  const obj=$('objEdit'), sc=$('scopeEdit'); 
  if(obj)obj.oninput=e=>doc.objective=e.currentTarget.innerText; 
  if(sc)sc.oninput=e=>doc.scope=e.currentTarget.innerText;
  document.querySelectorAll('[data-step-title]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepTitle].title=e.target.innerText});
  document.querySelectorAll('[data-sub]').forEach(el=>el.oninput=e=>{const [i,j]=e.target.dataset.sub.split('-').map(Number);doc.steps[i].sub[j].text=e.target.innerText});
  document.querySelectorAll('[data-note]').forEach(el=>el.oninput=e=>{const [i,j]=e.target.dataset.note.split('-').map(Number);doc.steps[i].notes[j]=e.target.innerText});
  document.querySelectorAll('[data-sub-img]').forEach(inp=>inp.onchange=e=>{const [i,j]=e.target.dataset.subImg.split('-').map(Number);loadSubImg(e,i,j)});
}
function addSub(i){
  doc.steps[i].sub=doc.steps[i].sub||[];
  doc.steps[i].sub.push({code:doc.steps[i].n+'.'+(doc.steps[i].sub.length+1),text:'Describa el paso específico.',image:''});
  render();
}
function addNoteToStep(i){
  doc.steps[i].notes=doc.steps[i].notes||[];
  doc.steps[i].notes.push('Escriba la nota del paso.');
  render();
}
function removeSubImage(i,j){
  doc.steps[i].sub[j].image='';
  render();
}
function loadSubImg(e,i,j){
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{doc.steps[i].sub[j].image=r.result;render()};
  r.readAsDataURL(f);
}
function saveJson(){const a=document.createElement('a');const b=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});a.href=URL.createObjectURL(b);a.download='documento_ei.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function openJson(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{doc={...doc,...JSON.parse(r.result)};render()}catch(err){alert('JSON inválido')}};r.readAsText(f)}
bind(); setMode('home');
