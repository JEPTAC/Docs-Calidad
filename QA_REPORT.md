# QA V37

Problema reportado:
- En móvil el scroll no permitía bajar más allá de cierta posición.
- Procedimientos no estaba suficientemente visible en herramientas.

Corrección:
- body.side-open ya no bloquea overflow-y.
- work/editor/stage tienen overflow visible y padding-bottom seguro.
- sidebar usa overflow-y:scroll y overscroll-behavior.
- mobile dock pasa a seis accesos incluyendo Procedimiento.
- Se agrega panel "Procedimientos" en herramientas.

Resultado node --check: PASS
{
  "node_check_pass": true,
  "body_scroll_fixed": true,
  "work_scroll_fixed": true,
  "side_scroll_fixed": true,
  "procedure_tools_panel": true,
  "mobile_procedure_dock": true,
  "six_column_dock": true,
  "template_quality_intact": true,
  "word_intact": true,
  "instructivo_intact": true
}
