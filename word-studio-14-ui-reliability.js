/* V76 · Fiabilidad de interacción y UX estable.
   Capa aislada: corrige eventos dinámicos sin modificar la plantilla SGC. */
const V76_BLUE='#001F73';

/* V75 usa este nombre en varias rutas; la fuente real del bloque vive en V74. */
function v75Block(path){ return v74Block(path); }

function v76OpenInsertFrom(event,target){
  if(event){event.preventDefault();event.stopPropagation();}
  v75EnsureShell();
  v75OpenInsertMenu(target);
  return false;
}
function v76OpenDiagramFrom(event,path){
  if(event){event.preventDefault();event.stopPropagation();}
  v75EnsureShell();
  const block=v74Block(path);
  if(!block||block.type!=='diagram')return false;
  v75OpenDrawer(path);
  return false;
}

/* Las dos acciones críticas llevan ejecución directa en el HTML generado. */
wordBlockToolbar=function(i,j){
  const target=`${i}:${j}`;
  return `<div class="word-block-toolbar v75-compact-insert" data-v75-target="${target}"><span>Agregar contenido en esta ${Number(j)>=0?'subsección':'sección'}</span><button type="button" data-v75-open-insert="${target}" onclick="return v76OpenInsertFrom(event,'${target}')">＋ Insertar bloque</button></div>`;
};

const v76BaseWordBlockEditorHtml=wordBlockEditorHtml;
wordBlockEditorHtml=function(b,i,j,k){
  const html=v76BaseWordBlockEditorHtml(b,i,j,k);
  if(b?.type!=='diagram')return html;
  const path=`${i}:${j}:${k}`;
  return html.replace(`data-v75-open-diagram="${path}"`,`data-v75-open-diagram="${path}" onclick="return v76OpenDiagramFrom(event,'${path}')"`);
};

/* Delegación en captura: sobrevive a cualquier innerHTML/render posterior. */
function v76DelegatedClick(e){
  const insert=e.target.closest?.('[data-v75-open-insert]');
  if(insert){
    e.preventDefault();e.stopPropagation();
    v75EnsureShell();v75OpenInsertMenu(insert.dataset.v75OpenInsert);
    return;
  }
  const diagram=e.target.closest?.('[data-v75-open-diagram]');
  if(diagram){
    e.preventDefault();e.stopPropagation();
    v75EnsureShell();v75OpenDrawer(diagram.dataset.v75OpenDiagram);
    return;
  }
}
if(document.body.dataset.v76Delegated!=='1'){
  document.body.dataset.v76Delegated='1';
  document.addEventListener('click',v76DelegatedClick,true);
}

/* Estado visual más sobrio y consistente. */
document.body.classList.add('v76-ui');

/* Regenera el panel una vez para que los botones ya incluyan la ruta directa. */
render();
