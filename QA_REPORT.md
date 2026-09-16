# Informe QA — Centro Documental EI V3

Fecha de revisión: 2026-09-16

## Resultado

**Estado técnico:** candidato de publicación estática validado estructuralmente antes de actualizar `main`.

## Correcciones estructurales

- Arquitectura principal: `index.html` + `app.css` + `src/core.js` + `src/editor.js` + `src/preview.js` + `src/export.js`.
- Eliminados `_check*`, `_runtime*`, `_tmp*`, `_dbg*`, copias de `source/` y multimedia no utilizada.
- Eliminada la dependencia de una vista fija de dos páginas para Word Studio.
- Importación segura y migración de proyectos antiguos.

## Word Studio V3

- [x] Tipos documentales SGC y comunicaciones.
- [x] Jerarquía Heading 1–6.
- [x] Numeración automática de subtítulos y sub-subtítulos.
- [x] Índice visual multinivel.
- [x] TOC Word para niveles 1–6.
- [x] Tablas con estilos y alineación.
- [x] Gráficas de columnas, barras horizontales, línea y dona.
- [x] Unidad, meta y fuente metodológica.
- [x] KPI.
- [x] Notas de información, recomendación, advertencia, cumplimiento y riesgo.
- [x] Citas textuales, narrativas y parentéticas.
- [x] APA 7, ISO 690 y numérico/IEEE.
- [x] Bibliografía automática.
- [x] Imágenes, listas, diagramas y saltos de página.
- [x] Temas y paleta personalizada.
- [x] Carta/A4 y márgenes 2,5/3 cm.
- [x] PDF y DOCX.

## Seguridad

- [x] JSON máximo 5 MB.
- [x] Imágenes máximo 6 MB.
- [x] Lista blanca de imágenes.
- [x] Bloqueo de claves de contaminación de prototipo.
- [x] Límites de profundidad y cantidad de bloques.
- [x] Escape de texto antes de incorporarlo al DOM.

## Pruebas ejecutadas

- Sintaxis de módulos JavaScript con `node --check`: **PASS**.
- Referencias locales HTML/CSS/JS: **PASS**.
- Assets requeridos: **PASS**.
- Archivos históricos en el paquete limpio: **0**.
- Niveles `heading2` a `heading6`: **PASS**.
- TOC DOCX `headingStyleRange: 1-6`: **PASS**.

## Verificación visual

El Chromium disponible durante la auditoría bloqueó navegación local a `file://`/`localhost`. La validación visual integral debe ejecutarse sobre la URL HTTPS publicada; no se registra un PASS visual sin observación real.
