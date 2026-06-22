# QA V13

- node --check source.js ejecutado.
- Botones Guardar JSON y Abrir JSON removidos del HTML.
- Bind protegido por existencia de botones.
- exportPdf() agrega body.print-mode antes de imprimir.
- @media print robusto:
  - sin side/topbar;
  - sin scrollbars;
  - sin separadores;
  - sin controles;
  - páginas letter 8.5x11;
  - page-break controlado.
- Márgenes de instructivo: 2 cm.

Resultado node --check: PASS
