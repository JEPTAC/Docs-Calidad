function ensureWordStudioUi(){
  const panel=document.querySelector('[data-panel="word"]');
  if(panel && !$('wordStudioProPanel')){
    const host=document.createElement('div');
    host.id='wordStudioProPanel';
    host.className='word-studio-settings';
    host.innerHTML=`<h3>Word Studio Pro · diseño documental</h3>
      <div class="word-theme-grid">
        <label>Tema visual<select id="wordThemePreset">${Object.entries(WORD_THEME_PRESETS).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select></label>
        <label class="word-check-label"><input id="wordChartAnimation" type="checkbox" checked> Animar gráficas en vista</label>
      </div>
      <div class="word-color-row">
        <label>Primario<input id="wordPrimaryColor" type="color" value="#001F73"></label>
        <label>Acento<input id="wordAccentColor" type="color" value="#EAC800"></label>
        <label>Secundario<input id="wordSecondaryColor" type="color" value="#A4A8AB"></label>
      </div>
      <div id="wordReferenceManager" class="word-reference-manager"></div>`;
    const sgc=panel.querySelector('[data-word-sgc]');
    panel.insertBefore(host,sgc||panel.lastElementChild);
  }
  const toolbar=document.querySelector('.topbar .toolbar');
  if(toolbar && !$('exportDocx')){
    const b=document.createElement('button');
    b.id='exportDocx';b.type='button';b.className='primary';b.textContent='Exportar Word .DOCX';
    const pdf=$('printPdf');toolbar.insertBefore(b,pdf||null);
  }
}

ensureWordStudioUi();
bind();
ensureWordSubtitles();
render();
