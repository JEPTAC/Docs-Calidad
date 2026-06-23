# QA V41

Problema reportado:
- No se visualizaba el tablero/plantilla para editar procedimiento en móvil.

Diagnóstico:
- El modo tipo Canva de V39/V40 usaba contenedores fixed y overflow controlado.
- En iOS eso puede dejar la hoja fuera del área visible aunque el DOM exista.
- El tablero dependía demasiado del cálculo visual del contenedor.

Corrección:
- El tablero de procedimientos móvil ahora se renderiza en flujo real.
- .workarea vuelve a ser un bloque visible con scroll nativo.
- .pages mantiene ancho real de 1056px y se escala desde top-left.
- Se fuerza visibilidad de page, flow-box, flow-canvas y marco.
- Se agregó fallback procEnsureBoard() para re-renderizar si el mount queda vacío.


Resultados automáticos:
{
  "main_node_check": true,
  "proc_node_check": true,
  "real_flow_board_css": true,
  "pages_visible_css": true,
  "board_visible_js": true,
  "fit_labeled_tablero": true,
  "canva_ui_kept": true,
  "word_intact": true,
  "instructivo_intact": true,
  "quality_template_intact": true
}

node main stderr:


node procedimiento stderr:
