# QA V19

- node --check source.js ejecutado.
- stepListHtml renderiza imagenes con o sin subpasos.
- listImageSlotHtml robusto con medidas numéricas.
- loadListImg robusto.
- loadListImgBulk agregado.
- paginateSteps ajustado para reducir espacios grandes.
- CSS compacta step-compact, list layout, notes y grids.

Resultado node --check: PASS
{
  "loadListImgBulk": true,
  "bulk input listener": true,
  "stepList no-sub blank": true,
  "compact css": true
}
