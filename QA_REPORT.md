# QA V30

- node --check source.js ejecutado.
- Tipos Word separados:
  - oficio;
  - circular;
  - manual;
  - guia;
  - politica;
  - protocolo;
  - formato.
- Validado:
  - panel condicionado por tipo;
  - render SGC limpio;
  - footer gráfico conservado;
  - inicio sin exportar/guardar;
  - instructivos intactos;
  - procedimientos intactos.

Resultado node --check: PASS
{
  "word_types_options": true,
  "type_helpers": true,
  "conditional_css": true,
  "type_tools": true,
  "sgc_clean": true,
  "footer_graphic": true,
  "home_hides_export_save": true,
  "instructivo_intacto": true,
  "procedimiento_link_intacto": true
}
