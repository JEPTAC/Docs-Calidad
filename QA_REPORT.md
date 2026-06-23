# QA V32

- node --check source.js ejecutado.
- Footer usado: assets/footer-ei-calidad.png, copiado desde la imagen enviada.
- Header usado: assets/header-ei-calidad.png, extraído desde el PDF de referencia.
- sgcHeader reemplazado.
- sgcFooter reemplazado.
- CSS anterior del footer anulado.
- Márgenes SGC ajustadas.
- Funciones críticas conservadas:
  - tipos documentales Word;
  - instructivos;
  - procedimientos;
  - exportPdf;
  - saveToBrowserCache.

Resultado node --check: PASS
{
  "footer_asset_exists": true,
  "header_asset_exists": true,
  "footer_exact_image_used": true,
  "header_ref_used": true,
  "old_yellow_footer_hidden": true,
  "content_margin_25cm": true,
  "word_types_intact": true,
  "instructivo_intact": true,
  "procedimiento_intact": true
}
