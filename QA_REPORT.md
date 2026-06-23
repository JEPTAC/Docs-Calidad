# QA V29

- node --check source.js ejecutado.
- Base usada: V28.
- Cambios limitados al panel Word, render SGC, footer SGC y ocultamiento de botones en modo inicio.
- Funciones críticas verificadas:
  - createFirstStep;
  - addSub;
  - addListGroup;
  - renderStepEditor;
  - loadStepImg;
  - exportPdf;
  - saveToBrowserCache.

Resultado node --check: PASS
{
  "no_table_chart_in_sgcPages": true,
  "word_section_panel": true,
  "footer_graphic": true,
  "home_hides_export_save": true,
  "create_steps_intact": true,
  "sublistas_intact": true,
  "image_intact": true,
  "pdf_intact": true,
  "cache_intact": true
}
