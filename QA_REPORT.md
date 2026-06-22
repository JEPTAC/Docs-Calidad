# QA V16

- node --check source.js ejecutado.
- Funciones críticas presentes:
  - exportPdf
  - makeBlankStep
  - createFirstStep
- bind() ya no queda interrumpido por ReferenceError.
- addStep usa createFirstStep().
- addNote crea paso si no existe.
- removeStep permite volver a estado de hoja limpia.

Resultado node --check: PASS
Funciones requeridas faltantes: []
