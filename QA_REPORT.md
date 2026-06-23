# QA V39

Análisis:
- El problema de procedimientos no era solo zoom.
- El editor independiente tenía arquitectura de escritorio:
  - sidebar fijo;
  - toolbar extensa;
  - hoja horizontal grande;
  - manipulación difícil en iOS.

Corrección:
- Modo móvil tipo Canva:
  - topbar propia;
  - toolbar compacta horizontal;
  - canvas central;
  - dock inferior persistente;
  - panel inferior para figuras y páginas;
  - sidebar como herramientas avanzadas.
- setZoom en procedimientos usa transform con ancho explícito para que iOS calcule mejor el área visible.


Resultados automáticos:
{
  "main_node_check": true,
  "proc_node_check": false,
  "proc_canva_top": true,
  "proc_canva_dock": true,
  "proc_mobile_sheet": true,
  "proc_canvas_css": true,
  "proc_ios_zoom": true,
  "word_intact": true,
  "instructivo_intact": true,
  "template_quality_intact": true
}

node main stderr:


node procedimiento stderr:
/mnt/data/estudio_documental_ei_v39_procedimiento_canva_mobile/procedimiento/_proc_extracted_check.js:103
 const procMenu=$('procMenu'); if(procMenu) procMenu.onclick=procOpenSide;
       ^

SyntaxError: Identifier 'procMenu' has already been declared
[90m    at wrapSafe (node:internal/modules/cjs/loader:1662:18)[39m
[90m    at checkSyntax (node:internal/main/check_syntax:78:3)[39m

Node.js v22.16.0


Revalidación V39 corregida:
{
  "main_node_check": true,
  "proc_node_check": true,
  "proc_canva_top": true,
  "proc_canva_dock": true,
  "proc_mobile_sheet": true,
  "proc_canvas_css": true,
  "proc_ios_zoom": true,
  "no_duplicate_procMenu": true,
  "word_intact": true,
  "instructivo_intact": true
}

node main stderr:


node procedimiento stderr:
