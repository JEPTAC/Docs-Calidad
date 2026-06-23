# QA V38

Análisis QA:
1. Procedimiento en iOS:
   - Causa detectada: el editor de procedimientos era una página independiente y conservaba layout desktop.
   - La hoja de procedimiento mide 11in x 8.5in y no se ajustaba al viewport móvil.
   - setZoom usaba transform: scale(), lo cual en iOS no garantiza altura real de scroll.

2. Corrección:
   - Se agregó procPreferredZoom().
   - setZoom ahora usa CSS zoom en móvil.
   - workarea/pages/body quedan con overflow visible.
   - Se agrega dock móvil específico.
   - Se agrega drawer de herramientas para procedimientos.

3. Scroll:
   - Se redujeron paddings inferiores en la app principal.
   - Se conserva margen seguro para el dock.

4. Estado:
   - Word intacto.
   - Instructivo intacto.
   - Plantilla Calidad V34 intacta.


Resultados automáticos:
{
  "main_node_check": true,
  "proc_node_check": true,
  "proc_mobile_zoom": true,
  "proc_dock": true,
  "proc_drawer": true,
  "main_scroll_tuned": true,
  "template_quality_intact": true,
  "word_intact": true,
  "instructivo_intact": true
}

node main stderr:


node procedimiento stderr:
