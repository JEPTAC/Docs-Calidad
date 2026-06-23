# QA V33

- node --check source.js ejecutado.
- sgcHeader reemplazado por estructura lineal.
- CSS del encabezado reescrita con un solo azul uniforme.
- Bloques principales:
  - base azul;
  - cápsula blanca del logo;
  - área central de título;
  - bloque derecho de código/versión.
- Se conserva pie exacto enviado por el usuario.
- Se conservan:
  - tipos documentales Word;
  - instructivos;
  - procedimientos;
  - exportPdf;
  - saveToBrowserCache.

Resultado node --check: PASS
{
  "header_linear_structure": true,
  "uniform_blue_css": true,
  "content_margins_25cm": true,
  "footer_asset_still_used": true,
  "word_types_intact": true,
  "instructivo_intact": true,
  "procedimiento_intact": true
}