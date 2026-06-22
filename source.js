
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
  activeStep:0,
  objectiveAlign:'center',
  scopeAlign:'center',
  objective:'Indicar los pasos que se deben seguir en el CRM para la creación de una cotización de venta.',
  scope:'Aplica a todos los asesores comerciales de la Unidad de Negocio de Suministros Eléctricos de ELECTROINGENIERÍA S.A.S.',
  steps:[
    {n:'1',title:'Ingreso al CRM',notes:[],viewMode:'cards',cols:2,cardH:150,imgH:102,listW:45,sub:[
      {code:'1.1',text:'En el navegador, ingrese al enlace de Siesa CRM con el usuario y contraseña asignado.',image:''},
      {code:'1.2',text:'Seleccione el botón de Menú ubicado en la parte superior izquierda y elija la opción “Cotizaciones” > “Crear”.',image:''}
    ]},
    {n:'2',title:'Crear cotización',viewMode:'list',cols:2,cardH:150,imgH:102,listW:45,notes:['Antes de crear una cotización, asegúrese de que el cliente o cliente potencial esté creado en el sistema.'],sub:[
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
  const printBtn=$('printPdf'); if(printBtn) printBtn.onclick=exportPdf;
  const saveBtn=$('saveJson'); if(saveBtn) saveBtn.onclick=saveJson;
  const openBtn=$('openJson'); if(openBtn) openBtn.onchange=openJson;
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','remitente','cargo'].forEach(id=>{const el=$(id); if(el) el.oninput=e=>{doc[fieldMap(id)]=e.target.value;render()}});
  $('docBody').oninput=e=>{doc.body=e.target.value;render()};
  $('addSection').onclick=()=>{doc.sections.push({n:String(doc.sections.length+1),t:'NUEVA SECCIÓN',c:'Contenido'});render()};
  $('addWordTableRow').onclick=()=>{doc.wordTable.push(['','','']);render()};
  $('addWordChart').onclick=()=>{doc.wordChart.push(40);render()};
  ['instrTitle','instrCode','instrVersion','objective','scope'].forEach(id=>{const el=$(id); if(el) el.oninput=e=>{doc[id]=e.target.value;render()}});
  ['objectiveAlign','scopeAlign'].forEach(id=>{const el=$(id); if(el) el.onchange=e=>{doc[id]=e.target.value;render()}});
  $('addStep').onclick=()=>{doc.steps.push({n:String(doc.steps.length+1),title:'Nuevo paso general',titleAlign:'left',notePosition:'after',notes:[],viewMode:'cards',cols:2,cardH:150,imgH:102,listW:45,stepImage:'',stepImgW:100,stepImgH:100,stepImgX:50,stepImgY:50,stepImgBoxH:315,sub:[{code:(doc.steps.length+1)+'.1',text:'Describa el paso específico.',align:'left',image:'',imgW:100,imgH:100,imgX:50,imgY:50}]});doc.activeStep=doc.steps.length-1;render()};
  $('addNote').onclick=()=>{const i=Number(doc.activeStep||0);doc.steps[i].notes=doc.steps[i].notes||[];doc.steps[i].notes.push({text:'Escriba la nota del paso.',align:'left'});render()};

  $('activeStep').onchange=e=>{doc.activeStep=Number(e.target.value)||0;render()};
}
function fieldMap(id){return {wordType:'wordType',docTitle:'title',docCode:'code',docVersion:'version',cityDate:'cityDate',circularNo:'circularNo',para:'para',de:'de',asunto:'asunto',remitente:'remitente',cargo:'cargo'}[id]}
function syncInputs(){
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','remitente','cargo'].forEach(id=>{const el=$(id); if(el) el.value=doc[fieldMap(id)]??''});
  if($('docBody')) $('docBody').value=doc.body;
  ['instrTitle','instrCode','instrVersion','objective','scope'].forEach(id=>{const el=$(id); if(el) el.value=doc[id]??''});
  ['objectiveAlign','scopeAlign'].forEach(id=>{const el=$(id); if(el) el.value=doc[id]??'center'});
  renderStepEditor();
}
function render(){ensureDocDefaults();ensureSubDefaults();setZoom(zoom);syncInputs();if(mode==='word')renderWord();if(mode==='excel')renderInstructivo();}
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


function ensureDocDefaults(){
  doc.objectiveAlign = doc.objectiveAlign || 'center';
  doc.scopeAlign = doc.scopeAlign || 'center';
}

function ensureSubDefaults(){
  doc.steps.forEach((s,si)=>{
    s.notes=(s.notes||[]).map(n=>typeof n==='string'?{text:n,align:'left'}:{text:n.text||'',align:n.align||'left'});
    s.titleAlign=s.titleAlign||'left';
    s.notePosition=s.notePosition||'after';
    s.viewMode=s.viewMode||'cards';
    s.cols=s.cols||2;
    s.cardH=s.cardH||150;
    s.imgH=s.imgH||102;
    s.listW=s.listW||45;
    s.stepImage=s.stepImage||'';
    s.stepImgW=s.stepImgW||100;
    s.stepImgH=s.stepImgH||100;
    s.stepImgX=s.stepImgX??50;
    s.stepImgY=s.stepImgY??50;
    s.stepImgBoxH=s.stepImgBoxH||315;
    s.sub=(s.sub||[]).map((ss,ji)=>({
      code:ss.code||((si+1)+'.'+(ji+1)),
      text:ss.text||'',
      align:ss.align||'left',
      image:ss.image||'',
      imgW:ss.imgW||100,
      imgH:ss.imgH||100,
      imgX:ss.imgX??50,
      imgY:ss.imgY??50
    }));
  });
}

function alignOptions(value){
  return `<option value="left" ${value==='left'?'selected':''}>Izquierda</option>
  <option value="center" ${value==='center'?'selected':''}>Centrado</option>
  <option value="right" ${value==='right'?'selected':''}>Derecha</option>
  <option value="justify" ${value==='justify'?'selected':''}>Justificado</option>`;
}
function renderStepEditor(){
  const sel=$('activeStep'), box=$('stepEditor');
  if(!sel||!box||mode!=='excel')return;
  ensureSubDefaults();
  sel.innerHTML=doc.steps.map((s,i)=>`<option value="${i}" ${Number(doc.activeStep||0)===i?'selected':''}>${s.n}. ${esc(s.title)}</option>`).join('');
  sel.onchange=e=>{doc.activeStep=Number(e.target.value)||0;render()};
  const i=Math.min(Number(doc.activeStep||0), doc.steps.length-1);
  doc.activeStep=i;
  const s=doc.steps[i];
  const previewCount=Math.max((s.sub||[]).length,1);
  const isList = s.viewMode === 'list';
  const isCards = s.viewMode !== 'list';
  box.innerHTML=`<div class="instr-side-step active">
    <div class="instr-side-step-title"><b>Paso ${esc(s.n)}</b><button class="danger" onclick="removeStep(${i})">Eliminar</button></div>
    <span class="step-mode-pill">${isList?'Lista + imagen':'Tarjetas por subpaso'}</span>
    <label>Título del paso<input data-step-title-panel="${i}" value="${esc(s.title)}"></label>
    <div class="text-control-row">
      <label>Alineación título<select data-step-title-align="${i}">${alignOptions(s.titleAlign||'left')}</select></label>
      <label>Ubicación notas<select data-note-position="${i}">
        <option value="before" ${s.notePosition==='before'?'selected':''}>Antes de imagen/lista</option>
        <option value="after" ${s.notePosition!=='before'?'selected':''}>Después de imagen/lista</option>
      </select></label>
    </div>
    <div class="step-layout-panel">
      <b>Distribución visual</b>
      <div class="mini-grid">
        <label>Modo del paso
          <select data-step-view="${i}">
            <option value="cards" ${s.viewMode==='cards'?'selected':''}>Tarjetas por subpaso</option>
            <option value="list" ${s.viewMode==='list'?'selected':''}>Lista + imagen única</option>
          </select>
        </label>
        ${isCards?`<label>Columnas
          <select data-step-cols="${i}">
            <option value="1" ${s.cols==1?'selected':''}>1 columna</option>
            <option value="2" ${s.cols==2?'selected':''}>2 columnas</option>
            <option value="3" ${s.cols==3?'selected':''}>3 columnas</option>
          </select>
        </label>
        <label>Alto tarjeta px<input type="number" min="110" max="260" data-card-h="${i}" value="${s.cardH||150}"></label>
        <label>Alto imagen px<input type="number" min="70" max="220" data-grid-img-h="${i}" value="${s.imgH||102}"></label>`:
        `<label>Ancho lista %<input type="number" min="30" max="70" data-list-w="${i}" value="${s.listW||45}"></label>
        <label>Alto imagen px<input type="number" min="160" max="420" data-step-img-box-h="${i}" value="${s.stepImgBoxH||315}"></label>`}
      </div>
      ${isCards?`<div class="layout-preview cols-${s.cols||2}">${Array.from({length:previewCount}).map((_,k)=>`<div class="layout-cell">${k+1}</div>`).join('')}</div>`:
      `<div class="list-preview" style="--list-preview-w:${s.listW||45}%"><div>Lista</div><div>Imagen única</div></div>`}
    </div>
    <div class="actions"><button onclick="addSub(${i})">+ Subpaso</button><button onclick="clearSubsteps(${i})">Sin subpasos</button><button onclick="addNoteToStep(${i})">+ Nota</button></div>
    ${(s.sub||[]).length? (s.sub||[]).map((ss,j)=>`<div class="sub-editor">
      <b>${esc(ss.code)}</b>
      <label>Texto del subpaso<textarea rows="3" data-sub-text-panel="${i}-${j}">${esc(ss.text)}</textarea></label>
      <label>Alineación subpaso<select data-sub-align="${i}-${j}">${alignOptions(ss.align||'left')}</select></label>
      ${isCards?`<label class="file-btn">Agregar imagen<input type="file" accept="image/*" data-sub-img="${i}-${j}" hidden></label>
      ${ss.image?'<button class="danger" onclick="removeSubImage('+i+','+j+')">Quitar imagen</button>':''}
      <div class="mini-grid">
        <label>Ancho %<input type="number" min="40" max="220" data-img-w="${i}-${j}" value="${ss.imgW||100}"></label>
        <label>Alto %<input type="number" min="40" max="220" data-img-h="${i}-${j}" value="${ss.imgH||100}"></label>
        <label>Posición X<input type="range" min="0" max="100" data-img-x="${i}-${j}" value="${ss.imgX??50}"></label>
        <label>Posición Y<input type="range" min="0" max="100" data-img-y="${i}-${j}" value="${ss.imgY??50}"></label>
      </div>`:''}
      <button class="danger" onclick="removeSub(${i},${j})">Eliminar subpaso</button>
    </div>`).join('') : ''}
    ${isList || !(s.sub||[]).length ? `<div class="sub-editor">
      <b>${isList?'Imagen única para la lista':'Imagen general del paso'}</b>
      <label class="file-btn">Agregar imagen<input type="file" accept="image/*" data-step-img="${i}" hidden></label>
      ${s.stepImage?'<button class="danger" onclick="removeStepImage('+i+')">Quitar imagen</button>':''}
      <div class="mini-grid">
        <label>Ancho %<input type="number" min="40" max="240" data-step-img-w="${i}" value="${s.stepImgW||100}"></label>
        <label>Alto %<input type="number" min="40" max="240" data-step-img-h="${i}" value="${s.stepImgH||100}"></label>
        <label>Posición X<input type="range" min="0" max="100" data-step-img-x="${i}" value="${s.stepImgX??50}"></label>
        <label>Posición Y<input type="range" min="0" max="100" data-step-img-y="${i}" value="${s.stepImgY??50}"></label>
        <label>Alto recuadro px<input type="number" min="160" max="420" data-step-img-box-h="${i}" value="${s.stepImgBoxH||315}"></label>
      </div>
    </div>`:''}
    ${(s.notes||[]).map((n,j)=>`<div class="sub-editor"><b>Nota ${j+1}</b><label>Texto de la nota<textarea rows="2" data-note-panel="${i}-${j}">${esc(n.text||'')}</textarea></label><label>Alineación nota<select data-note-align="${i}-${j}">${alignOptions(n.align||'left')}</select></label><button class="danger" onclick="removeNote(${i},${j})">Eliminar nota</button></div>`).join('')}
  </div>`;
  box.querySelectorAll('[data-step-title-panel]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepTitlePanel].title=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-title-align]').forEach(el=>el.onchange=e=>{doc.steps[+e.target.dataset.stepTitleAlign].titleAlign=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-note-position]').forEach(el=>el.onchange=e=>{doc.steps[+e.target.dataset.notePosition].notePosition=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-view]').forEach(el=>el.onchange=e=>{doc.steps[+e.target.dataset.stepView].viewMode=e.target.value;render()});
  box.querySelectorAll('[data-step-cols]').forEach(el=>el.onchange=e=>{doc.steps[+e.target.dataset.stepCols].cols=Number(e.target.value)||2;render()});
  box.querySelectorAll('[data-list-w]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.listW].listW=Number(e.target.value)||45;renderInstructivoOnly()});
  box.querySelectorAll('[data-card-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.cardH].cardH=Number(e.target.value)||150;renderInstructivoOnly()});
  box.querySelectorAll('[data-grid-img-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.gridImgH].imgH=Number(e.target.value)||102;renderInstructivoOnly()});
  box.querySelectorAll('[data-sub-text-panel]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.subTextPanel.split('-').map(Number);doc.steps[a].sub[b].text=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-sub-align]').forEach(el=>el.onchange=e=>{const [a,b]=e.target.dataset.subAlign.split('-').map(Number);doc.steps[a].sub[b].align=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-note-panel]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.notePanel.split('-').map(Number);doc.steps[a].notes[b].text=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-note-align]').forEach(el=>el.onchange=e=>{const [a,b]=e.target.dataset.noteAlign.split('-').map(Number);doc.steps[a].notes[b].align=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-img-w]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgW.split('-').map(Number);doc.steps[a].sub[b].imgW=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-img-h]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgH.split('-').map(Number);doc.steps[a].sub[b].imgH=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-img-x]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgX.split('-').map(Number);doc.steps[a].sub[b].imgX=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-img-y]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgY.split('-').map(Number);doc.steps[a].sub[b].imgY=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-sub-img]').forEach(inp=>inp.onchange=e=>{const [a,b]=e.target.dataset.subImg.split('-').map(Number);loadSubImg(e,a,b)});
  box.querySelectorAll('[data-step-img]').forEach(inp=>inp.onchange=e=>{loadStepImg(e,Number(e.target.dataset.stepImg))});
  box.querySelectorAll('[data-step-img-w]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgW].stepImgW=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgH].stepImgH=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-x]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgX].stepImgX=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-y]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgY].stepImgY=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-box-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgBoxH].stepImgBoxH=Number(e.target.value)||315;renderInstructivoOnly()});
}
function renderInstructivoOnly(){
  const st=$('stage');
  if(st){
    st.innerHTML=instructivoHtml();
    setTimeout(bindCanvasImages,0);
  }
}
function renderInstructivo(){
  $('stage').innerHTML=instructivoHtml();
  renderStepEditor();
  setTimeout(bindCanvasImages,0);
}
function instructivoHtml(){
  const total = 1;
  return `<div class="instr-page">${instrHeader()}<div class="instr-content">
    <div class="info-row"><div class="info-label">OBJETIVO:</div><div class="info-value align-${doc.objectiveAlign||'center'}">${esc(doc.objective)}</div></div>
    <div class="info-row"><div class="info-label">ALCANCE:</div><div class="info-value align-${doc.scopeAlign||'center'}">${esc(doc.scope)}</div></div>
    <div class="band">PASO A PASO</div>
    ${doc.steps.map((s,i)=>stepsPreviewHtml(i, true)).join('')}
  </div>${instrFooter(1,total)}</div>`;
}
function stepsPreviewHtml(i, compactFirst){
  const s=doc.steps[i];
  if(!s)return '';
  const cols=s.cols||2;
  const mode=s.viewMode||'cards';
  const notes=(s.notes||[]).filter(n=>String(n.text||'').trim()).map((n,j)=>noteHtml(n,i,j)).join('');
  const body=(s.sub||[]).length ? (mode==='list'? stepListHtml(s) : `<div class="substep-grid cols-${cols}">${(s.sub||[]).map((ss,j)=>subStepMini(ss,i,j)).join('')}</div>`) : stepImageOnlyHtml(s);
  return `<div class="step-compact" style="--card-h:${s.cardH||150}px;--img-h:${s.imgH||102}px;--step-img-h:${s.stepImgBoxH||315}px;--list-w:${s.listW||45}%"><div class="step-compact-head"><div class="step-compact-num">${esc(s.n)}.</div><div class="step-compact-title align-${s.titleAlign||'left'}">${esc(s.title)}</div></div>
    ${s.notePosition==='before'?notes:''}
    ${body}
    ${s.notePosition!=='before'?notes:''}
  </div>`;
}
function stepPageHtml(s,i,total){
  const pageNo=i+2;
  return `<div class="instr-page">${instrHeader()}<div class="instr-content">${stepsPreviewHtml(i,false)}</div>${instrFooter(pageNo,total)}</div>`;
}
function stepListHtml(s){
  const hasImg=!!s.stepImage,w=s.stepImgW||100,h=s.stepImgH||100,x=s.stepImgX??50,y=s.stepImgY??50;
  const i=doc.steps.indexOf(s);
  return `<div class="step-list-layout">
    <div class="step-list-left">
      ${(s.sub||[]).map(ss=>`<div class="step-list-item"><div class="step-list-code">${esc(ss.code)}</div><div class="step-list-text align-${ss.align||'left'}">${esc(ss.text)}</div></div>`).join('')}
    </div>
    <div class="step-shared-img ${hasImg?'':'empty-print'}" data-img-box="step" data-i="${i}">${hasImg?`<img data-img-el="step" data-i="${i}" src="${s.stepImage}" style="width:${w}%;height:${h}%;left:${x}%;top:${y}%">`:'<span class="empty-img no-print">Imagen única del paso</span>'}${hasImg?`<div class="img-direct-tools no-print"><span>Mover imagen</span><span>Agrandar ↘</span></div><div class="img-resize-handle no-print" data-img-resize="step" data-i="${i}"></div>`:''}</div>
  </div>`;
}
function stepImageOnlyHtml(s){
  const hasImg=!!s.stepImage,w=s.stepImgW||100,h=s.stepImgH||100,x=s.stepImgX??50,y=s.stepImgY??50;
  const i=doc.steps.indexOf(s);
  return `<div class="step-image-only">
    <div class="step-image-title">Imagen general del paso</div>
    <div class="step-main-img ${hasImg?'':'empty-print'}" data-img-box="step" data-i="${i}">${hasImg?`<img data-img-el="step" data-i="${i}" src="${s.stepImage}" style="width:${w}%;height:${h}%;left:${x}%;top:${y}%">`:'<span class="empty-img no-print">Imagen del paso</span>'}${hasImg?`<div class="img-direct-tools no-print"><span>Mover imagen</span><span>Agrandar ↘</span></div><div class="img-resize-handle no-print" data-img-resize="step" data-i="${i}"></div>`:''}</div>
  </div>`;
}
function subStepMini(ss,i,j){
  const hasImg=!!ss.image;
  const w=ss.imgW||100,h=ss.imgH||100,x=ss.imgX??50,y=ss.imgY??50;
  return `<div class="substep-mini">
    <div class="substep-mini-head"><div class="substep-mini-code">${esc(ss.code)}</div><div class="substep-mini-text align-${ss.align||'left'}">${esc(ss.text)}</div></div>
    <div class="substep-mini-body">
      <div class="substep-mini-img ${hasImg?'':'empty-print'}" data-img-box="sub" data-i="${i}" data-j="${j}">${hasImg?`<img data-img-el="sub" data-i="${i}" data-j="${j}" src="${ss.image}" style="width:${w}%;height:${h}%;left:${x}%;top:${y}%">`:'<span class="empty-img no-print">Imagen del subpaso</span>'}${hasImg?`<div class="img-direct-tools no-print"><span>Mover imagen</span><span>Agrandar ↘</span></div><div class="img-resize-handle no-print" data-img-resize="sub" data-i="${i}" data-j="${j}"></div>`:''}</div>
    </div>
  </div>`;
}
function noteHtml(note,i,j){
  const text=typeof note==='string'?note:(note.text||'');
  const align=typeof note==='string'?'left':(note.align||'left');
  const clean=String(text||'').trim();
  return `<div class="note-row ${clean?'':'empty-note'}">
    <div class="note-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Z" fill="#EAC800"/><path d="M15 3v4h4" stroke="#fff" stroke-width="1.8"/><path d="M8 10h8M8 14h8M8 18h5" stroke="#001F73" stroke-width="1.6" stroke-linecap="round"/></svg></div>
    <div class="note-text align-${align}">${esc(clean)}</div>
  </div>`;
}
function addSub(i){
  doc.steps[i].sub=doc.steps[i].sub||[];
  doc.steps[i].sub.push({code:doc.steps[i].n+'.'+(doc.steps[i].sub.length+1),text:'Describa el paso específico.',align:'left',image:'',imgW:100,imgH:100,imgX:50,imgY:50});
  render();
}
function addNoteToStep(i){
  doc.steps[i].notes=doc.steps[i].notes||[];
  doc.steps[i].notes.push({text:'Escriba la nota del paso.',align:'left'});
  render();
}
function removeNote(i,j){
  doc.steps[i].notes.splice(j,1);
  render();
}
function removeStep(i){
  if(doc.steps.length<=1)return alert('Debe existir al menos un paso.');
  doc.steps.splice(i,1);
  doc.steps.forEach((s,idx)=>{s.n=String(idx+1);(s.sub||[]).forEach((ss,j)=>ss.code=s.n+'.'+(j+1))});
  doc.activeStep=Math.max(0,Math.min(doc.activeStep,doc.steps.length-1));
  render();
}
function removeSubImage(i,j){
  doc.steps[i].sub[j].image='';
  render();
}
function loadSubImg(e,i,j){
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{doc.steps[i].sub[j].image=r.result;doc.steps[i].sub[j].imgW=doc.steps[i].sub[j].imgW||100;doc.steps[i].sub[j].imgH=doc.steps[i].sub[j].imgH||100;doc.steps[i].sub[j].imgX=doc.steps[i].sub[j].imgX??50;doc.steps[i].sub[j].imgY=doc.steps[i].sub[j].imgY??50;render()};
  r.readAsDataURL(f);
}

function removeSub(i,j){
  doc.steps[i].sub.splice(j,1);
  doc.steps[i].sub.forEach((ss,k)=>ss.code=doc.steps[i].n+'.'+(k+1));
  render();
}
function clearSubsteps(i){
  doc.steps[i].sub=[];
  render();
}
function loadStepImg(e,i){
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{doc.steps[i].stepImage=r.result;doc.steps[i].stepImgW=doc.steps[i].stepImgW||100;doc.steps[i].stepImgH=doc.steps[i].stepImgH||100;doc.steps[i].stepImgX=doc.steps[i].stepImgX??50;doc.steps[i].stepImgY=doc.steps[i].stepImgY??50;render()};
  r.readAsDataURL(f);
}
function removeStepImage(i){
  doc.steps[i].stepImage='';
  render();
}

function getImageTarget(kind,i,j){
  i=Number(i);
  if(kind==='step') return doc.steps[i];
  return doc.steps[i].sub[Number(j)];
}
function setImageTarget(kind,i,j,vals){
  const t=getImageTarget(kind,i,j);
  Object.assign(t, vals);
}
function bindCanvasImages(){
  document.querySelectorAll('[data-img-box]').forEach(box=>{
    const kind=box.dataset.imgBox;
    const i=box.dataset.i;
    const j=box.dataset.j;
    const img=box.querySelector('img');
    if(!img) return;

    img.onpointerdown=(ev)=>{
      if(ev.target.closest('.img-resize-handle')) return;
      ev.preventDefault();
      box.classList.add('img-box-active');
      const target=getImageTarget(kind,i,j);
      const startX=ev.clientX, startY=ev.clientY;
      const startLeft=Number(target.imgX ?? target.stepImgX ?? 50);
      const startTop=Number(target.imgY ?? target.stepImgY ?? 50);
      const rect=box.getBoundingClientRect();

      const move=(mv)=>{
        const dx=(mv.clientX-startX)/rect.width*100;
        const dy=(mv.clientY-startY)/rect.height*100;
        const nx=Math.max(-80,Math.min(180,startLeft+dx));
        const ny=Math.max(-80,Math.min(180,startTop+dy));
        img.style.left=nx+'%';
        img.style.top=ny+'%';
        if(kind==='step') setImageTarget(kind,i,j,{stepImgX:nx,stepImgY:ny});
        else setImageTarget(kind,i,j,{imgX:nx,imgY:ny});
      };
      const up=()=>{
        window.removeEventListener('pointermove',move);
        window.removeEventListener('pointerup',up);
        box.classList.remove('img-box-active');
        renderStepEditor();
      };
      window.addEventListener('pointermove',move);
      window.addEventListener('pointerup',up);
    };
  });

  document.querySelectorAll('[data-img-resize]').forEach(handle=>{
    handle.onpointerdown=(ev)=>{
      ev.preventDefault();
      ev.stopPropagation();
      const kind=handle.dataset.imgResize;
      const i=handle.dataset.i;
      const j=handle.dataset.j;
      const box=handle.closest('[data-img-box]');
      const img=box.querySelector('img');
      const target=getImageTarget(kind,i,j);
      box.classList.add('img-box-active');
      const rect=box.getBoundingClientRect();
      const startX=ev.clientX, startY=ev.clientY;
      const startW=kind==='step'?Number(target.stepImgW||100):Number(target.imgW||100);
      const startH=kind==='step'?Number(target.stepImgH||100):Number(target.imgH||100);

      const move=(mv)=>{
        const dx=(mv.clientX-startX)/rect.width*100;
        const dy=(mv.clientY-startY)/rect.height*100;
        const nw=Math.max(30,Math.min(320,startW+dx));
        const nh=Math.max(30,Math.min(320,startH+dy));
        img.style.width=nw+'%';
        img.style.height=nh+'%';
        if(kind==='step') setImageTarget(kind,i,j,{stepImgW:nw,stepImgH:nh});
        else setImageTarget(kind,i,j,{imgW:nw,imgH:nh});
      };
      const up=()=>{
        window.removeEventListener('pointermove',move);
        window.removeEventListener('pointerup',up);
        box.classList.remove('img-box-active');
        renderStepEditor();
      };
      window.addEventListener('pointermove',move);
      window.addEventListener('pointerup',up);
    };
  });
}

function exportPdf(){
  const prevZoom = zoom;
  document.body.classList.add('print-mode');
  const stage=$('stage');
  if(stage){
    stage.style.transform='none';
  }
  setTimeout(()=>{
    window.print();
    setTimeout(()=>{
      document.body.classList.remove('print-mode');
      setZoom(prevZoom);
      render();
    },350);
  },120);
}
function saveJson(){const a=document.createElement('a');const b=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});a.href=URL.createObjectURL(b);a.download='documento_ei.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function openJson(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{doc={...doc,...JSON.parse(r.result)};render()}catch(err){alert('JSON inválido')}};r.readAsText(f)}
bind(); setMode('home');
