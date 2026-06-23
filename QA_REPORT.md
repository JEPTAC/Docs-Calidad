# QA V40

Problema detectado:
- En V39 el tablero podía quedar fuera de la zona visible en celular.
- Causa: el contenedor .pages se estaba reduciendo al ancho escalado, pero la página interna seguía midiendo 1056px. En flex/center esto podía desplazar la hoja fuera de pantalla en iOS.

Corrección aplicada:
- .pages mantiene ancho real de 1056px.
- El escalado se aplica con transform: scale().
- transform-origin se fija en top left.
- .workarea inicia en scrollLeft 0 / scrollTop 0.
- Se fuerza visibilidad de .page, .flow-box, .flow-canvas y estructuras de plantilla.


Resultados automáticos:
{
  "main_node_check": true,
  "proc_node_check": true,
  "board_visible_css": true,
  "board_visible_js": true,
  "setzoom_fixed": true,
  "canva_mobile_kept": true,
  "word_intact": true,
  "instructivo_intact": true,
  "quality_template_intact": true
}

node main stderr:


node procedimiento stderr:
