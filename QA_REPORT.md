# QA V34

- node --check source.js ejecutado.
- sgcHeader reemplazado.
- CSS del encabezado reescrito:
  - left/right 1cm;
  - azul uniforme #0A3AA3;
  - sin parche oscuro en el título;
  - grid lineal.
- Título inicial limpiado.
- Funciones críticas conservadas:
  - tipos documentales Word;
  - instructivos;
  - procedimientos;
  - exportPdf;
  - saveToBrowserCache.

Resultado node --check: PASS
{
  "header_1cm": true,
  "uniform_blue": true,
  "no_dark_title_patch": true,
  "default_title_blank": true,
  "placeholder_title": true,
  "content_margins_25": true,
  "footer_asset_still": true,
  "word_types_intact": true,
  "instructivo_intact": true,
  "procedimiento_intact": true
}
