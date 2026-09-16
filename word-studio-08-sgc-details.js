/* V70 · Ajustes visuales puntuales sin modificar la plantilla SGC base.
   - Control de cambios: mismo azul institucional #001F73.
   - Tabla de contenido: líderes punteados tipo Word entre título y página.
   - Título de tabla de contenido: azul institucional #001F73.
*/

const wordBaseControlChangesTableHtml = controlChangesTableHtml;
controlChangesTableHtml = function(item){
  return wordBaseControlChangesTableHtml(item)
    .replace('class="control-change-table"','class="control-change-table word-control-change-table"');
};

sgcTocHtml = function(rows,pageMap){
  return rows.map(r=>`<p class="sgc-toc-row sgc-toc-level-${r.level} ${r.level===2?'sgc-toc-sub':''} word-toc-leader-row word-toc-level-${r.level}"><span class="word-toc-label">${esc(r.label)}</span><span class="word-toc-dots" aria-hidden="true"></span><span class="word-toc-page">${pageMap[r.key]||''}</span></p>`).join('');
};

const wordBaseSgcPages = sgcPages;
sgcPages = function(){
  return wordBaseSgcPages().replace(/class="center sgc-toc-title"/g,'class="center sgc-toc-title word-toc-title"');
};

if(typeof renderWordOnly==='function')renderWordOnly();
