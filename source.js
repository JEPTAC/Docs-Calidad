
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
  instrTitle:'',
  instrCode:'',
  instrVersion:'',
  activeStep:0,
  objectiveAlign:'center',
  scopeAlign:'center',
  objective:'',
  scope:'',
  steps:[]
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
  renderProjectHistory();
}
function openProcedure(){window.location.href='procedimiento/index.html'}
function setZoom(z){zoom=Math.max(.35,Math.min(1.2,z));$('stage').style.transform=`scale(${zoom})`; $('zoomLabel').textContent=Math.round(zoom*100)+'%'}
function bind(){
  const homeTopBtn=$('homeTopBtn'); if(homeTopBtn) homeTopBtn.onclick=()=>setMode('home');
  const clearHistoryBtn=$('clearProjectHistory'); if(clearHistoryBtn) clearHistoryBtn.onclick=()=>clearProjectHistory();
  renderProjectHistory();

  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setMode(b.dataset.open));
  $('goHome').onclick=()=>setMode('home'); $('openProcedure').onclick=openProcedure;
  $('zoomIn').onclick=()=>setZoom(zoom+.05); $('zoomOut').onclick=()=>setZoom(zoom-.05); $('zoomFit').onclick=()=>setZoom(.72);
  const printBtn=$('printPdf'); if(printBtn) printBtn.onclick=()=>exportPdf();
  const saveCacheBtn=$('saveCache'); if(saveCacheBtn) saveCacheBtn.onclick=()=>saveToBrowserCache();
  const saveBtn=$('saveJson'); if(saveBtn) saveBtn.onclick=saveJson;
  const openBtn=$('openJson'); if(openBtn) openBtn.onchange=openJson;
  ['wordType','docTitle','docCode','docVersion','cityDate','circularNo','para','de','asunto','remitente','cargo'].forEach(id=>{const el=$(id); if(el) el.oninput=e=>{doc[fieldMap(id)]=e.target.value;render()}});
  $('docBody').oninput=e=>{doc.body=e.target.value;render()};
  $('addSection').onclick=()=>{doc.sections.push({n:String(doc.sections.length+1),t:'NUEVA SECCIÓN',c:'Contenido'});render()};
  $('addWordTableRow').onclick=()=>{doc.wordTable.push(['','','']);render()};
  $('addWordChart').onclick=()=>{doc.wordChart.push(40);render()};
  ['instrTitle','instrCode','instrVersion','objective','scope'].forEach(id=>{const el=$(id); if(el) el.oninput=e=>{doc[id]=e.target.value;render()}});
  ['objectiveAlign','scopeAlign'].forEach(id=>{const el=$(id); if(el) el.onchange=e=>{doc[id]=e.target.value;render()}});
  $('addStep').onclick=()=>{createFirstStep()};
  $('addNote').onclick=()=>{if(!doc.steps.length) createFirstStep(); const i=Number(doc.activeStep||0);doc.steps[i].notes=doc.steps[i].notes||[];doc.steps[i].notes.push({text:'',align:'left'});render()};

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
  doc.steps = doc.steps || [];
  doc.steps.forEach((s,si)=>{
    s.notes = (s.notes||[]).map(n=>typeof n==='string' ? {text:n,align:'left'} : {text:n?.text||'', align:n?.align||'left'});
    s.titleAlign = s.titleAlign || 'left';
    s.notePosition = s.notePosition || 'after';
    s.viewMode = s.viewMode || 'cards';
    s.cols = Number(s.cols||2);
    s.cardH = Number(s.cardH||150);
    s.imgH = Number(s.imgH||102);
    s.listW = Number(s.listW||45);
    s.stepImage = s.stepImage || '';
    s.stepImgW = Number(s.stepImgW||100);
    s.stepImgH = Number(s.stepImgH||100);
    s.stepImgX = Number(s.stepImgX??50);
    s.stepImgY = Number(s.stepImgY??50);
    s.stepImgBoxH = Number(s.stepImgBoxH||245);

    s.sub = (s.sub||[]).map((ss,ji)=>({
      code:ss.code || ((si+1)+'.'+(ji+1)),
      text:ss.text || '',
      align:ss.align || 'left',
      image:ss.image || '',
      imgW:Number(ss.imgW||100),
      imgH:Number(ss.imgH||100),
      imgX:Number(ss.imgX??50),
      imgY:Number(ss.imgY??50)
    }));

    if(!Array.isArray(s.listGroups)) s.listGroups = [];
    if(s.viewMode==='list' && !s.listGroups.length){
      const migratedSubs = (s.sub||[]).map(ss=>({text:ss.text||'',align:ss.align||'left',code:ss.code||''}));
      const img0 = (s.stepImages && s.stepImages[0] && s.stepImages[0].src) ? s.stepImages[0] : null;
      s.listGroups.push({
        title:'',
        image: img0 ? img0.src : (s.stepImage||''),
        imgW: img0 ? Number(img0.w||100) : Number(s.stepImgW||100),
        imgH: img0 ? Number(img0.h||100) : Number(s.stepImgH||100),
        imgX: img0 ? Number(img0.x??50) : Number(s.stepImgX??50),
        imgY: img0 ? Number(img0.y??50) : Number(s.stepImgY??50),
        imgBoxH:Number(s.stepImgBoxH||245),
        sub:migratedSubs
      });
      s.sub=[];
    }
    s.listGroups = (s.listGroups||[]).map((g,gi)=>({
      title:g.title||'',
      image:g.image || g.src || '',
      imgW:Number(g.imgW || g.w || 100),
      imgH:Number(g.imgH || g.h || 100),
      imgX:Number(g.imgX ?? g.x ?? 50),
      imgY:Number(g.imgY ?? g.y ?? 50),
      imgBoxH:Number(g.imgBoxH || s.stepImgBoxH || 245),
      sub:(g.sub||[]).map(ss=>({code:ss.code||'', text:ss.text||'', align:ss.align||'left'}))
    }));
    renumberListGroups(s);
  });
}
function renumberListGroups(s){
  if((s.viewMode||'cards')==='list'){
    let n=1;
    (s.listGroups||[]).forEach(g=>{
      (g.sub||[]).forEach(ss=>{ss.code=s.n+'.'+(n++);});
    });
  }else{
    (s.sub||[]).forEach((ss,j)=>ss.code=s.n+'.'+(j+1));
  }
}
function listSubCount(s){
  return (s.listGroups||[]).reduce((a,g)=>a+(g.sub||[]).length,0);
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

  if(!doc.steps.length){
    sel.innerHTML='<option value="">Sin pasos creados</option>';
    box.innerHTML=`<div class="instr-side-step active">
      <b>Hoja en blanco</b>
      <p class="hint">Agregue el primer paso general para iniciar el instructivo.</p>
      <div class="actions"><button onclick="createFirstStep()">+ Crear primer paso</button></div>
    </div>`;
    return;
  }

  sel.innerHTML=doc.steps.map((s,i)=>`<option value="${i}" ${Number(doc.activeStep||0)===i?'selected':''}>${s.n}. ${esc(s.title||'Paso sin título')}</option>`).join('');
  sel.onchange=e=>{doc.activeStep=Number(e.target.value)||0;render()};
  const i=Math.min(Number(doc.activeStep||0), doc.steps.length-1);
  doc.activeStep=i;
  const s=doc.steps[i];
  const isList = s.viewMode === 'list';
  const previewCount = isList ? Math.max(listSubCount(s),1) : Math.max((s.sub||[]).length,1);

  box.innerHTML=`<div class="instr-side-step active">
    <div class="instr-side-step-title"><b>Paso ${esc(s.n)}</b><button class="danger" onclick="removeStep(${i})">Eliminar</button></div>
    <span class="step-mode-pill">${isList?'Sublistas + imagen':'Tarjetas por subpaso'}</span>

    <label>Título del paso<input data-step-title-panel="${i}" value="${esc(s.title)}"></label>
    <div class="text-control-row">
      <label>Alineación título<select data-step-title-align="${i}">${alignOptions(s.titleAlign||'left')}</select></label>
      <label>Ubicación notas<select data-note-position="${i}">
        <option value="before" ${s.notePosition==='before'?'selected':''}>Antes del contenido</option>
        <option value="after" ${s.notePosition!=='before'?'selected':''}>Después del contenido</option>
      </select></label>
    </div>

    <div class="step-layout-panel">
      <b>Distribución visual</b>
      <div class="mini-grid">
        <label>Modo del paso
          <select data-step-view="${i}">
            <option value="cards" ${s.viewMode==='cards'?'selected':''}>Tarjetas por subpaso</option>
            <option value="list" ${s.viewMode==='list'?'selected':''}>Sublistas + imagen</option>
          </select>
        </label>
        ${isList ? `
          <label>Ancho lista %<input type="number" min="30" max="72" data-list-w="${i}" value="${s.listW||45}"></label>
          <label>Alto imagen general px<input type="number" min="120" max="420" data-step-img-box-h="${i}" value="${s.stepImgBoxH||245}"></label>
        ` : `
          <label>Columnas
            <select data-step-cols="${i}">
              <option value="1" ${s.cols==1?'selected':''}>1 columna</option>
              <option value="2" ${s.cols==2?'selected':''}>2 columnas</option>
              <option value="3" ${s.cols==3?'selected':''}>3 columnas</option>
            </select>
          </label>
          <label>Alto tarjeta px<input type="number" min="110" max="260" data-card-h="${i}" value="${s.cardH||150}"></label>
          <label>Alto imagen px<input type="number" min="70" max="220" data-grid-img-h="${i}" value="${s.imgH||102}"></label>
        `}
      </div>
      ${isList
        ? `<div class="list-preview" style="--list-preview-w:${s.listW||45}%"><div>Lista</div><div>Imagen por sublista</div></div>`
        : `<div class="layout-preview cols-${s.cols||2}">${Array.from({length:previewCount}).map((_,k)=>`<div class="layout-cell">${k+1}</div>`).join('')}</div>`
      }
    </div>

    <div class="actions">
      ${isList?`<button onclick="addListGroup(${i})">+ Sublista</button>`:`<button onclick="addSub(${i})">+ Subpaso</button>`}
      <button onclick="addNoteToStep(${i})">+ Nota</button>
    </div>

    ${isList ? renderListGroupsEditor(i,s) : renderCardsEditor(i,s)}

    ${(s.notes||[]).map((n,j)=>`<div class="sub-editor">
      <b>Nota ${j+1}</b>
      <label>Texto de la nota<textarea rows="2" data-note-panel="${i}-${j}">${esc(n.text||'')}</textarea></label>
      <label>Alineación nota<select data-note-align="${i}-${j}">${alignOptions(n.align||'left')}</select></label>
      <button class="danger" onclick="removeNote(${i},${j})">Eliminar nota</button>
    </div>`).join('')}
  </div>`;

  bindStepEditorControls(box);
}
function renderCardsEditor(i,s){
  return `${(s.sub||[]).length ? (s.sub||[]).map((ss,j)=>`<div class="sub-editor">
    <b>${esc(ss.code)}</b>
    <label>Texto del subpaso<textarea rows="3" data-sub-text-panel="${i}-${j}">${esc(ss.text)}</textarea></label>
    <label>Alineación subpaso<select data-sub-align="${i}-${j}">${alignOptions(ss.align||'left')}</select></label>
    <label class="file-btn">Agregar imagen<input type="file" accept="image/*" data-sub-img="${i}-${j}" hidden></label>
    ${ss.image?`<button class="danger" onclick="removeSubImage(${i},${j})">Quitar imagen</button>`:''}
    <div class="mini-grid">
      <label>Ancho %<input type="number" min="40" max="220" data-img-w="${i}-${j}" value="${ss.imgW||100}"></label>
      <label>Alto %<input type="number" min="40" max="220" data-img-h="${i}-${j}" value="${ss.imgH||100}"></label>
      <label>Posición X<input type="range" min="0" max="100" data-img-x="${i}-${j}" value="${ss.imgX??50}"></label>
      <label>Posición Y<input type="range" min="0" max="100" data-img-y="${i}-${j}" value="${ss.imgY??50}"></label>
    </div>
    <button class="danger" onclick="removeSub(${i},${j})">Eliminar subpaso</button>
  </div>`).join('') : `<div class="sub-editor">
    <b>Sin subpasos</b>
    <div class="actions"><button onclick="addSub(${i})">+ Crear subpaso</button></div>
  </div>
  <div class="sub-editor">
    <b>Imagen general del paso</b>
    <label class="file-btn">Agregar imagen<input type="file" accept="image/*" data-step-img="${i}" hidden></label>
    ${s.stepImage?`<button class="danger" onclick="removeStepImage(${i})">Quitar imagen</button>`:''}
    <div class="mini-grid">
      <label>Alto recuadro px<input type="number" min="120" max="420" data-step-img-box-h="${i}" value="${s.stepImgBoxH||245}"></label>
      <label>Ancho imagen %<input type="number" min="40" max="260" data-step-img-w="${i}" value="${s.stepImgW||100}"></label>
      <label>Alto imagen %<input type="number" min="40" max="260" data-step-img-h="${i}" value="${s.stepImgH||100}"></label>
      <label>Posición X<input type="range" min="0" max="100" data-step-img-x="${i}" value="${s.stepImgX??50}"></label>
      <label>Posición Y<input type="range" min="0" max="100" data-step-img-y="${i}" value="${s.stepImgY??50}"></label>
    </div>
  </div>`}`;
}
function renderListGroupsEditor(i,s){
  if(!s.listGroups.length) s.listGroups.push({title:'',image:'',imgW:100,imgH:100,imgX:50,imgY:50,imgBoxH:s.stepImgBoxH||245,sub:[]});
  return `${s.listGroups.map((g,gi)=>`<div class="list-group-editor">
    <div class="list-group-editor-title"><span>Sublista ${gi+1}</span><button class="danger" onclick="removeListGroup(${i},${gi})">Eliminar</button></div>
    <label>Título de la sublista<input data-list-title="${i}-${gi}" value="${esc(g.title||'')}"></label>
    <div class="actions"><button onclick="addListSub(${i},${gi})">+ Subpaso en esta sublista</button></div>
    <label class="file-btn">Agregar imagen de esta sublista<input type="file" accept="image/*" data-group-img="${i}-${gi}" hidden></label>
    ${g.image?`<button class="danger" onclick="removeGroupImage(${i},${gi})">Quitar imagen</button>`:''}
    <div class="list-group-tools">
      <label>Alto recuadro px<input type="number" min="100" max="420" data-group-img-box-h="${i}-${gi}" value="${g.imgBoxH||s.stepImgBoxH||245}"></label>
      <label>Ancho imagen %<input type="number" min="40" max="260" data-group-img-w="${i}-${gi}" value="${g.imgW||100}"></label>
      <label>Alto imagen %<input type="number" min="40" max="260" data-group-img-h="${i}-${gi}" value="${g.imgH||100}"></label>
      <label>Posición X<input type="range" min="0" max="100" data-group-img-x="${i}-${gi}" value="${g.imgX??50}"></label>
      <label>Posición Y<input type="range" min="0" max="100" data-group-img-y="${i}-${gi}" value="${g.imgY??50}"></label>
    </div>
    ${(g.sub||[]).map((ss,sj)=>`<div class="sub-editor">
      <b>${esc(ss.code)}</b>
      <label>Texto del subpaso<textarea rows="3" data-list-sub-text="${i}-${gi}-${sj}">${esc(ss.text||'')}</textarea></label>
      <label>Alineación<select data-list-sub-align="${i}-${gi}-${sj}">${alignOptions(ss.align||'left')}</select></label>
      <button class="danger" onclick="removeListSub(${i},${gi},${sj})">Eliminar subpaso</button>
    </div>`).join('')}
  </div>`).join('')}`;
}
function bindStepEditorControls(box){
  box.querySelectorAll('[data-step-title-panel]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepTitlePanel].title=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-title-align]').forEach(el=>el.onchange=e=>{doc.steps[+e.target.dataset.stepTitleAlign].titleAlign=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-note-position]').forEach(el=>el.onchange=e=>{doc.steps[+e.target.dataset.notePosition].notePosition=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-view]').forEach(el=>el.onchange=e=>{const idx=+e.target.dataset.stepView;doc.steps[idx].viewMode=e.target.value;ensureSubDefaults();render()});
  box.querySelectorAll('[data-step-cols]').forEach(el=>el.onchange=e=>{doc.steps[+e.target.dataset.stepCols].cols=Number(e.target.value)||2;render()});
  box.querySelectorAll('[data-list-w]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.listW].listW=Number(e.target.value)||45;renderInstructivoOnly()});
  box.querySelectorAll('[data-card-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.cardH].cardH=Number(e.target.value)||150;renderInstructivoOnly()});
  box.querySelectorAll('[data-grid-img-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.gridImgH].imgH=Number(e.target.value)||102;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img]').forEach(inp=>inp.onchange=e=>{loadStepImg(e,Number(e.target.dataset.stepImg))});
  box.querySelectorAll('[data-step-img-w]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgW].stepImgW=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgH].stepImgH=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-x]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgX].stepImgX=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-y]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgY].stepImgY=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-step-img-box-h]').forEach(el=>el.oninput=e=>{doc.steps[+e.target.dataset.stepImgBoxH].stepImgBoxH=Number(e.target.value)||245;renderInstructivoOnly()});

  box.querySelectorAll('[data-sub-text-panel]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.subTextPanel.split('-').map(Number);doc.steps[a].sub[b].text=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-sub-align]').forEach(el=>el.onchange=e=>{const [a,b]=e.target.dataset.subAlign.split('-').map(Number);doc.steps[a].sub[b].align=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-sub-img]').forEach(inp=>inp.onchange=e=>{const [a,b]=e.target.dataset.subImg.split('-').map(Number);loadSubImg(e,a,b)});
  box.querySelectorAll('[data-img-w]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgW.split('-').map(Number);doc.steps[a].sub[b].imgW=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-img-h]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgH.split('-').map(Number);doc.steps[a].sub[b].imgH=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-img-x]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgX.split('-').map(Number);doc.steps[a].sub[b].imgX=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-img-y]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.imgY.split('-').map(Number);doc.steps[a].sub[b].imgY=Number(e.target.value);renderInstructivoOnly()});

  box.querySelectorAll('[data-note-panel]').forEach(el=>el.oninput=e=>{const [a,b]=e.target.dataset.notePanel.split('-').map(Number);doc.steps[a].notes[b].text=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-note-align]').forEach(el=>el.onchange=e=>{const [a,b]=e.target.dataset.noteAlign.split('-').map(Number);doc.steps[a].notes[b].align=e.target.value;renderInstructivoOnly()});

  box.querySelectorAll('[data-list-title]').forEach(el=>el.oninput=e=>{const [a,g]=e.target.dataset.listTitle.split('-').map(Number);doc.steps[a].listGroups[g].title=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-list-sub-text]').forEach(el=>el.oninput=e=>{const [a,g,sj]=e.target.dataset.listSubText.split('-').map(Number);doc.steps[a].listGroups[g].sub[sj].text=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-list-sub-align]').forEach(el=>el.onchange=e=>{const [a,g,sj]=e.target.dataset.listSubAlign.split('-').map(Number);doc.steps[a].listGroups[g].sub[sj].align=e.target.value;renderInstructivoOnly()});
  box.querySelectorAll('[data-group-img]').forEach(inp=>inp.onchange=e=>{const [a,g]=e.target.dataset.groupImg.split('-').map(Number);loadGroupImg(e,a,g)});
  box.querySelectorAll('[data-group-img-box-h]').forEach(el=>el.oninput=e=>{const [a,g]=e.target.dataset.groupImgBoxH.split('-').map(Number);doc.steps[a].listGroups[g].imgBoxH=Number(e.target.value)||245;renderInstructivoOnly()});
  box.querySelectorAll('[data-group-img-w]').forEach(el=>el.oninput=e=>{const [a,g]=e.target.dataset.groupImgW.split('-').map(Number);doc.steps[a].listGroups[g].imgW=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-group-img-h]').forEach(el=>el.oninput=e=>{const [a,g]=e.target.dataset.groupImgH.split('-').map(Number);doc.steps[a].listGroups[g].imgH=Number(e.target.value)||100;renderInstructivoOnly()});
  box.querySelectorAll('[data-group-img-x]').forEach(el=>el.oninput=e=>{const [a,g]=e.target.dataset.groupImgX.split('-').map(Number);doc.steps[a].listGroups[g].imgX=Number(e.target.value);renderInstructivoOnly()});
  box.querySelectorAll('[data-group-img-y]').forEach(el=>el.oninput=e=>{const [a,g]=e.target.dataset.groupImgY.split('-').map(Number);doc.steps[a].listGroups[g].imgY=Number(e.target.value);renderInstructivoOnly()});
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
function estimateTextRows(text, charsPerRow=62){
  const t=String(text||'').trim();
  if(!t)return 1;
  return Math.max(1, Math.ceil(t.length/charsPerRow));
}
function estimateNoteHeight(note){
  const clean=String(note?.text||'').trim();
  if(!clean) return 0;
  return 16 + estimateTextRows(clean, 90)*11;
}
function estimateSubHeight(ss, s){
  const textH = 32 + estimateTextRows(ss.text||'', 42)*11;
  const imgH = Number(s.imgH||102);
  return Math.max(Number(s.cardH||150), textH + imgH + 22);
}
function estimateStepImageHeight(s){
  return Number(s.stepImgBoxH||245) + 36;
}
function estimateListItemHeight(ss){
  return Math.max(28, 15 + estimateTextRows(ss.text||'', 54)*12);
}
function estimateGroupHeight(g,s,items){
  const arr=items||g.sub||[];
  const listH = arr.reduce((a,x)=>a+estimateListItemHeight(x)+4,0) + 34;
  const imgH = Number(g.imgBoxH || s.stepImgBoxH || 245) + 38;
  return Math.max(listH,imgH) + 10;
}
function pageCapacity(first){
  return first ? 660 : 755;
}
function notesHtmlFor(s,pos){
  return (s.notes||[]).filter(n=>String(n.text||'').trim()).map((n,j)=>noteHtml(n,doc.steps.indexOf(s),j)).join('');
}
function paginateSteps(){
  const pages=[];
  let current={first:true,html:[],used:0};
  const pushPage=()=>{pages.push(current); current={first:false,html:[],used:0};};
  const addHtml=(html,h)=>{
    const cap=pageCapacity(current.first);
    if(current.html.length && current.used+h>cap){pushPage();}
    current.html.push(html);
    current.used += Math.min(h,cap);
  };

  doc.steps.forEach((s,idx)=>{
    const headerH=31;
    const notesBefore = s.notePosition==='before' ? (s.notes||[]).reduce((a,n)=>a+estimateNoteHeight(n),0) : 0;
    const notesAfter = s.notePosition!=='before' ? (s.notes||[]).reduce((a,n)=>a+estimateNoteHeight(n),0) : 0;
    const noteH = notesBefore + notesAfter;

    if((s.viewMode||'cards')==='list'){
      const groups=(s.listGroups&&s.listGroups.length)?s.listGroups:[{title:'',image:'',imgW:100,imgH:100,imgX:50,imgY:50,imgBoxH:s.stepImgBoxH||245,sub:[]}];
      groups.forEach((g,gi)=>{
        const arr=g.sub||[];
        if(!arr.length){
          addHtml(stepBlockHtml(s,idx,{group:g,groupIndex:gi,items:[],continued:false},false,gi>0), headerH+noteH+estimateGroupHeight(g,s,[]));
          return;
        }
        let start=0;
        while(start<arr.length){
          const baseH=headerH + noteH + 8;
          let slice=[], h=baseH;
          for(let k=start;k<arr.length;k++){
            const candidate=[...slice,arr[k]];
            const sh=baseH+estimateGroupHeight(g,s,candidate);
            if(slice.length && sh>pageCapacity(current.first)) break;
            slice.push(arr[k]); h=sh;
          }
          if(!slice.length){slice=[arr[start]]; h=baseH+estimateGroupHeight(g,s,slice);}
          addHtml(stepBlockHtml(s,idx,{group:g,groupIndex:gi,items:slice,continued:start>0},start>0,gi>0),h);
          start+=slice.length;
        }
      });
      return;
    }

    if(!(s.sub||[]).length){
      addHtml(stepBlockHtml(s, idx, null, false, false), headerH + estimateStepImageHeight(s) + noteH + 6);
      return;
    }

    const cols=Number(s.cols||2);
    let start=0;
    while(start<s.sub.length){
      const baseH=headerH + noteH + 8;
      let slice=[], h=baseH;
      for(let k=start;k<s.sub.length;k++){
        const proposed=[...slice, s.sub[k]];
        const rows=[];
        for(let r=0;r<proposed.length;r+=cols){
          rows.push(Math.max(...proposed.slice(r,r+cols).map(ss=>estimateSubHeight(ss,s))));
        }
        const sh=baseH + rows.reduce((a,x)=>a+x+4,0);
        if(slice.length && sh>pageCapacity(current.first)) break;
        slice.push(s.sub[k]); h=sh;
      }
      if(!slice.length){slice=[s.sub[start]]; h=baseH+estimateSubHeight(s.sub[start],s)+4;}
      addHtml(stepBlockHtml(s, idx, slice, start>0, false), h);
      start += slice.length;
    }
  });

  if(current.html.length || !pages.length) pages.push(current);
  return pages;
}
function instructivoHtml(){
  ensureSubDefaults();
  const pages = paginateSteps();
  const total = pages.length;
  return pages.map((p,pi)=>`<div class="instr-page">${instrHeader()}<div class="instr-content">
    ${pi===0?`<div class="info-row"><div class="info-label">OBJETIVO:</div><div class="info-value align-${doc.objectiveAlign||'center'}">${esc(doc.objective)}</div></div>
    <div class="info-row"><div class="info-label">ALCANCE:</div><div class="info-value align-${doc.scopeAlign||'center'}">${esc(doc.scope)}</div></div>
    <div class="band">PASO A PASO</div>`:''}
    ${p.html.join('') || '<div class="blank-hint">Hoja en blanco. Agregue pasos desde el panel lateral.</div>'}
  </div>${instrFooter(pi+1,total)}</div>`).join('<div class="instr-page-separator no-print">Separador de página</div>');
}
function stepBlockHtml(s, idx, content, continued, groupContinuation){
  const notesBefore = s.notePosition==='before'?notesHtmlFor(s,'before'):'';
  const notesAfter = s.notePosition!=='before'?notesHtmlFor(s,'after'):'';
  let body='';
  if((s.viewMode||'cards')==='list'){
    body=listGroupHtml(s,content);
  }else if(!content){
    body=stepImageOnlyHtml(s);
  }else{
    body=`<div class="substep-grid cols-${s.cols||2}">${content.map((ss,j)=>subStepMini(ss,idx,(s.sub||[]).indexOf(ss))).join('')}</div>`;
  }
  return `<div class="step-compact compact-slice" style="--card-h:${s.cardH||150}px;--img-h:${s.imgH||102}px;--step-img-h:${s.stepImgBoxH||245}px;--list-w:${s.listW||45}%">
    <div class="step-compact-head ${continued?'has-cont':''}"><div class="step-compact-num">${esc(s.n)}.</div><div class="step-compact-title align-${s.titleAlign||'left'}">${esc(s.title)}</div>${continued?'<div class="step-slice-label">CONT.</div>':''}</div>
    ${notesBefore}
    ${body}
    ${notesAfter}
  </div>`;
}
function listGroupHtml(s,data){
  const g=data?.group || {title:'',image:'',imgW:100,imgH:100,imgX:50,imgY:50,imgBoxH:s.stepImgBoxH||245,sub:[]};
  const items=data?.items || g.sub || [];
  const gi=data?.groupIndex ?? 0;
  const title = `${g.title?esc(g.title):'Sublista '+(gi+1)}${data?.continued?' (continuación)':''}`;
  return `<div class="list-group-block" style="--list-w:${s.listW||45}%;--group-img-h:${g.imgBoxH||s.stepImgBoxH||245}px">
    <div class="list-group-title">${title}</div>
    <div class="list-group-body">
      <div class="list-group-left">
        ${items.length?items.map(ss=>`<div class="step-list-item"><div class="step-list-code">${esc(ss.code)}</div><div class="step-list-text align-${ss.align||'left'}">${esc(ss.text)}</div></div>`).join(''):`<div class="blank-hint no-print">Agregue subpasos a esta sublista.</div>`}
      </div>
      ${groupImageHtml(s,g,doc.steps.indexOf(s),gi)}
    </div>
  </div>`;
}
function groupImageHtml(s,g,i,gi){
  const has=!!g.image;
  return `<div class="list-group-image ${has?'':'empty-print'}" data-img-box="group" data-i="${i}" data-g="${gi}">
    ${has?`<img data-img-el="group" data-i="${i}" data-g="${gi}" src="${g.image}" style="width:${g.imgW||100}%;height:${g.imgH||100}%;left:${g.imgX??50}%;top:${g.imgY??50}%">`:`<span class="empty-img no-print">Imagen de la sublista</span>`}
    ${has?`<div class="img-direct-tools no-print"><span>Mover imagen</span><span>Agrandar ↘</span></div><div class="img-resize-handle no-print" data-img-resize="group" data-i="${i}" data-g="${gi}"></div>`:''}
  </div>`;
}
function stepImageOnlyHtml(s){
  const hasImg=!!s.stepImage;
  const w=Number(s.stepImgW||100), h=Number(s.stepImgH||100), x=Number(s.stepImgX??50), y=Number(s.stepImgY??50);
  const i=doc.steps.indexOf(s);
  return `<div class="step-image-only">
    <div class="step-main-img ${hasImg?'':'empty-print'}" data-img-box="step" data-i="${i}">
      ${hasImg?`<img data-img-el="step" data-i="${i}" src="${s.stepImage}" style="width:${w}%;height:${h}%;left:${x}%;top:${y}%">`:'<span class="empty-img no-print">Imagen del paso</span>'}
      ${hasImg?`<div class="img-direct-tools no-print"><span>Mover imagen</span><span>Agrandar ↘</span></div><div class="img-resize-handle no-print" data-img-resize="step" data-i="${i}"></div>`:''}
    </div>
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

function addListGroup(i){
  ensureSubDefaults();
  doc.steps[i].viewMode='list';
  doc.steps[i].listGroups.push({title:'',image:'',imgW:100,imgH:100,imgX:50,imgY:50,imgBoxH:doc.steps[i].stepImgBoxH||245,sub:[]});
  render();
}
function removeListGroup(i,gi){
  ensureSubDefaults();
  doc.steps[i].listGroups.splice(gi,1);
  if(!doc.steps[i].listGroups.length) doc.steps[i].listGroups.push({title:'',image:'',imgW:100,imgH:100,imgX:50,imgY:50,imgBoxH:doc.steps[i].stepImgBoxH||245,sub:[]});
  renumberListGroups(doc.steps[i]);
  render();
}
function addListSub(i,gi){
  ensureSubDefaults();
  const g=doc.steps[i].listGroups[gi];
  g.sub.push({code:'',text:'',align:'left'});
  renumberListGroups(doc.steps[i]);
  render();
}
function removeListSub(i,gi,sj){
  doc.steps[i].listGroups[gi].sub.splice(sj,1);
  renumberListGroups(doc.steps[i]);
  render();
}
function loadGroupImg(e,i,gi){
  const f=e.target.files && e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    ensureSubDefaults();
    const g=doc.steps[i].listGroups[gi];
    g.image=String(r.result||'');
    g.imgW=Number(g.imgW||100);
    g.imgH=Number(g.imgH||100);
    g.imgX=Number(g.imgX??50);
    g.imgY=Number(g.imgY??50);
    g.imgBoxH=Number(g.imgBoxH||doc.steps[i].stepImgBoxH||245);
    render();
  };
  r.readAsDataURL(f);
}
function removeGroupImage(i,gi){
  doc.steps[i].listGroups[gi].image='';
  render();
}
function addSub(i){
  ensureSubDefaults();
  if((doc.steps[i].viewMode||'cards')==='list'){
    if(!doc.steps[i].listGroups.length) addListGroup(i);
    addListSub(i, doc.steps[i].listGroups.length-1);
    return;
  }
  doc.steps[i].sub=doc.steps[i].sub||[];
  doc.steps[i].sub.push({code:doc.steps[i].n+'.'+(doc.steps[i].sub.length+1),text:'',align:'left',image:'',imgW:100,imgH:100,imgX:50,imgY:50});
  render();
}
function addNoteToStep(i){
  doc.steps[i].notes=doc.steps[i].notes||[];
  doc.steps[i].notes.push({text:'',align:'left'});
  render();
}
function removeNote(i,j){
  doc.steps[i].notes.splice(j,1);
  render();
}
function removeStep(i){
  doc.steps.splice(i,1);
  doc.steps.forEach((s,idx)=>{s.n=String(idx+1);(s.sub||[]).forEach((ss,j)=>ss.code=s.n+'.'+(j+1))});
  doc.activeStep=Math.max(0,Math.min(Number(doc.activeStep||0),Math.max(0,doc.steps.length-1)));
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
  const f=e.target.files && e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    doc.steps[i].stepImage=String(r.result||'');
    doc.steps[i].stepImgW=doc.steps[i].stepImgW||100;
    doc.steps[i].stepImgH=doc.steps[i].stepImgH||100;
    doc.steps[i].stepImgX=doc.steps[i].stepImgX??50;
    doc.steps[i].stepImgY=doc.steps[i].stepImgY??50;
    doc.steps[i].stepImgBoxH=doc.steps[i].stepImgBoxH||245;
    render();
  };
  r.readAsDataURL(f);
}
function removeStepImage(i){
  doc.steps[i].stepImage='';
  render();
}

function getImageTarget(kind,i,j,k){
  i=Number(i);
  if(kind==='step') return doc.steps[i];
  if(kind==='group') return doc.steps[i].listGroups[Number(j ?? k ?? 0)];
  if(kind==='list') return doc.steps[i].stepImages[Number(k)];
  return doc.steps[i].sub[Number(j)];
}
function bindCanvasImages(){
  document.querySelectorAll('[data-img-box]').forEach(box=>{
    const kind=box.dataset.imgBox;
    const i=box.dataset.i;
    const j=box.dataset.j ?? box.dataset.g;
    const k=box.dataset.k;
    const img=box.querySelector('img');
    if(!img) return;

    img.onpointerdown=(ev)=>{
      if(ev.target.closest('.img-resize-handle')) return;
      ev.preventDefault();
      box.classList.add('img-box-active');
      const target=getImageTarget(kind,i,j,k);
      const startX=ev.clientX, startY=ev.clientY;
      const startLeft=kind==='step'?Number(target.stepImgX??50):Number(target.imgX ?? target.x ?? 50);
      const startTop=kind==='step'?Number(target.stepImgY??50):Number(target.imgY ?? target.y ?? 50);
      const rect=box.getBoundingClientRect();
      const move=(mv)=>{
        const dx=(mv.clientX-startX)/rect.width*100;
        const dy=(mv.clientY-startY)/rect.height*100;
        const nx=Math.max(-80,Math.min(180,startLeft+dx));
        const ny=Math.max(-80,Math.min(180,startTop+dy));
        img.style.left=nx+'%';
        img.style.top=ny+'%';
        if(kind==='step') Object.assign(target,{stepImgX:nx,stepImgY:ny});
        else if(kind==='group') Object.assign(target,{imgX:nx,imgY:ny});
        else if(kind==='list') Object.assign(target,{x:nx,y:ny});
        else Object.assign(target,{imgX:nx,imgY:ny});
      };
      const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);box.classList.remove('img-box-active');renderStepEditor();};
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
      const j=handle.dataset.j ?? handle.dataset.g;
      const k=handle.dataset.k;
      const box=handle.closest('[data-img-box]');
      const img=box.querySelector('img');
      const target=getImageTarget(kind,i,j,k);
      box.classList.add('img-box-active');
      const rect=box.getBoundingClientRect();
      const startX=ev.clientX, startY=ev.clientY;
      const startW=kind==='step'?Number(target.stepImgW||100):Number(target.imgW || target.w || 100);
      const startH=kind==='step'?Number(target.stepImgH||100):Number(target.imgH || target.h || 100);
      const move=(mv)=>{
        const dx=(mv.clientX-startX)/rect.width*100;
        const dy=(mv.clientY-startY)/rect.height*100;
        const nw=Math.max(30,Math.min(320,startW+dx));
        const nh=Math.max(30,Math.min(320,startH+dy));
        img.style.width=nw+'%';
        img.style.height=nh+'%';
        if(kind==='step') Object.assign(target,{stepImgW:nw,stepImgH:nh});
        else if(kind==='group') Object.assign(target,{imgW:nw,imgH:nh});
        else if(kind==='list') Object.assign(target,{w:nw,h:nh});
        else Object.assign(target,{imgW:nw,imgH:nh});
      };
      const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);box.classList.remove('img-box-active');renderStepEditor();};
      window.addEventListener('pointermove',move);
      window.addEventListener('pointerup',up);
    };
  });
}
function loadListImg(e,i,k){
  /* Conservado por compatibilidad con documentos anteriores */
  const f=e.target.files && e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    ensureSubDefaults();
    if(!doc.steps[i].listGroups.length) addListGroup(i);
    const g=doc.steps[i].listGroups[Math.min(Number(k)||0,doc.steps[i].listGroups.length-1)];
    g.image=String(r.result||'');
    render();
  };
  r.readAsDataURL(f);
}
function loadListImgBulk(e,i){
  /* Conservado por compatibilidad */
  const files=Array.from(e.target.files||[]).slice(0,3);
  if(!files.length)return;
  ensureSubDefaults();
  doc.steps[i].viewMode='list';
  doc.steps[i].listGroups=[];
  files.forEach((f,k)=>{
    doc.steps[i].listGroups.push({title:'',image:'',imgW:100,imgH:100,imgX:50,imgY:50,imgBoxH:doc.steps[i].stepImgBoxH||245,sub:[]});
    const r=new FileReader();
    r.onload=()=>{doc.steps[i].listGroups[k].image=String(r.result||''); if(k===files.length-1) render();};
    r.readAsDataURL(f);
  });
}
function removeListImage(i,k){
  if(doc.steps[i] && doc.steps[i].listGroups && doc.steps[i].listGroups[k]) doc.steps[i].listGroups[k].image='';
  render();
}

const CACHE_KEY='ei_documental_cache_v1';

function saveToBrowserCache(){
  try{
    if(typeof ensureDocDefaults==='function') ensureDocDefaults();
    if(typeof ensureSubDefaults==='function') ensureSubDefaults();
    localStorage.setItem(CACHE_KEY, JSON.stringify({savedAt:new Date().toISOString(), doc:doc}));
    saveRecentProject();
    renderProjectHistory();
    const st=$('cacheStatus');
    if(st){st.textContent='Guardado en navegador';setTimeout(()=>{if(st.textContent==='Guardado en navegador')st.textContent='';},2500);}
  }catch(err){alert('No se pudo guardar en el navegador: '+err.message);}
}

function loadFromBrowserCache(){
  try{
    const raw=localStorage.getItem(CACHE_KEY);
    if(!raw) return false;
    const data=JSON.parse(raw);
    if(data && data.doc){
      doc=Object.assign(doc,data.doc);
      if(typeof ensureDocDefaults==='function') ensureDocDefaults();
      if(typeof ensureSubDefaults==='function') ensureSubDefaults();
      const st=$('cacheStatus');
      if(st){st.textContent='Documento cargado';setTimeout(()=>{if(st.textContent==='Documento cargado')st.textContent='';},2200);}
      return true;
    }
  }catch(err){console.warn('No se pudo cargar caché local',err);}
  return false;
}

const RECENT_KEY='ei_documental_recent_projects_v1';
function currentProjectMeta(){
  const modeLabel=mode==='word'?'Documento Word':mode==='excel'?'Instructivo':mode==='home'?'Inicio':'Documento';
  const title=(mode==='excel'?(doc.instrTitle||doc.title):(doc.title||doc.instrTitle)) || 'Proyecto sin título';
  const code=(mode==='excel'?(doc.instrCode||doc.code):(doc.code||doc.instrCode)) || '';
  return {id:Date.now(),title,code,mode,modeLabel,date:new Date().toLocaleString('es-CO'),doc:JSON.parse(JSON.stringify(doc))};
}
function saveRecentProject(){
  try{
    const item=currentProjectMeta();
    let arr=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');
    arr=[item,...arr].slice(0,5);
    try{localStorage.setItem(RECENT_KEY,JSON.stringify(arr));}
    catch(quotaErr){
      arr=arr.map(x=>({id:x.id,title:x.title,code:x.code,mode:x.mode,modeLabel:x.modeLabel,date:x.date}));
      localStorage.setItem(RECENT_KEY,JSON.stringify(arr));
    }
  }catch(err){console.warn('No se pudo actualizar historial',err);}
}
function renderProjectHistory(){
  const box=$('projectHistory');
  if(!box)return;
  let arr=[];
  try{arr=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')||[];}catch(e){arr=[];}
  if(!arr.length){box.innerHTML='<div class="project-history-empty">Aún no hay proyectos guardados en este navegador.</div>';return;}
  box.innerHTML=arr.map((p,i)=>`<div class="project-history-item"><strong>${esc(p.title||'Proyecto sin título')}</strong><span>${esc(p.modeLabel||p.mode||'Documento')} ${p.code?'· '+esc(p.code):''}</span><span>${esc(p.date||'')}</span><button data-open-recent="${i}" ${p.doc?'':'disabled'}>${p.doc?'Abrir proyecto':'Solo referencia'}</button></div>`).join('');
  box.querySelectorAll('[data-open-recent]').forEach(btn=>btn.onclick=()=>openRecentProject(Number(btn.dataset.openRecent)));
}
function openRecentProject(i){
  try{
    const arr=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')||[];
    const item=arr[i];
    if(!item||!item.doc){alert('Este registro solo conserva referencia. Guarde nuevamente para conservar apertura completa.');return;}
    doc=Object.assign(doc,item.doc);
    if(typeof ensureDocDefaults==='function') ensureDocDefaults();
    if(typeof ensureSubDefaults==='function') ensureSubDefaults();
    setMode(item.mode==='word'||item.mode==='excel'?item.mode:'home');
  }catch(err){alert('No se pudo abrir el proyecto guardado: '+err.message);}
}
function clearProjectHistory(){
  localStorage.removeItem(RECENT_KEY);
  renderProjectHistory();
}
function playElement(el){
  if(!el)return Promise.resolve();
  try{el.currentTime=0;return el.play().catch(()=>{});}catch(e){return Promise.resolve();}
}
function stopElement(el){try{if(el){el.pause();el.currentTime=0;}}catch(e){}}
function initIntroExperience(){
  const overlay=$('introOverlay');
  if(!overlay)return;
  const video=$('introVideo'), introSound=$('introSound'), welcomeSound=$('welcomeSound');
  const start=$('introStart'), skip=$('introSkip'), replay=$('replayIntro');

  const prepareVideo=()=>{
    if(!video)return;
    try{
      video.pause();
      video.currentTime=0;
      video.muted=true;
      video.removeAttribute('autoplay');
      video.setAttribute('preload','metadata');
    }catch(e){}
  };

  const closeIntro=()=>{
    overlay.classList.add('hide');
    overlay.classList.remove('experience-active','playing','show-welcome');
    document.body.classList.remove('intro-lock');
    setTimeout(()=>{
      stopElement(introSound);
      stopElement(welcomeSound);
      if(video){try{video.pause();}catch(e){}}
    },350);
  };

  const runIntro=()=>{
    overlay.classList.remove('hide','show-welcome');
    overlay.classList.add('playing','experience-active');
    document.body.classList.add('intro-lock');
    if(video){
      try{
        video.currentTime=0;
        video.muted=true;
        video.playbackRate=1;
      }catch(e){}
      playElement(video);
    }
    playElement(introSound);
    setTimeout(()=>{overlay.classList.add('show-welcome');playElement(welcomeSound);},1050);
    setTimeout(closeIntro,5000);
  };

  document.body.classList.add('intro-lock');
  prepareVideo();

  if(start)start.onclick=runIntro;
  if(skip)skip.onclick=closeIntro;
  if(replay)replay.onclick=runIntro;
}
function exportPdf(){
  const prevZoom = zoom;
  document.body.classList.add('print-mode');
  const stage=$('stage');
  if(stage) stage.style.transform='none';
  setTimeout(()=>{
    window.print();
    setTimeout(()=>{
      document.body.classList.remove('print-mode');
      setZoom(prevZoom);
      render();
    },350);
  },120);
}

function makeBlankStep(){
  const n=String(doc.steps.length+1);
  return {
    n:n,
    title:'',
    titleAlign:'left',
    notePosition:'after',
    notes:[],
    viewMode:'cards',
    cols:2,
    cardH:150,
    imgH:102,
    listW:45,
    listGroups:[],
    stepImage:'',
    stepImgW:100,
    stepImgH:100,
    stepImgX:50,
    stepImgY:50,
    stepImgBoxH:245,
    sub:[]
  };
}

function createFirstStep(){
  doc.steps.push(makeBlankStep());
  doc.activeStep=doc.steps.length-1;
  render();
}
function saveJson(){const a=document.createElement('a');const b=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});a.href=URL.createObjectURL(b);a.download='documento_ei.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function openJson(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{doc={...doc,...JSON.parse(r.result)};render()}catch(err){alert('JSON inválido')}};r.readAsText(f)}
bind(); setMode('home');

loadFromBrowserCache();
render();

initIntroExperience();
