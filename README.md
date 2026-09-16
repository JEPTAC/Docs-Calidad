# Centro Documental EI

Aplicación web estática de ELECTROINGENIERÍA S.A.S. para construir y gestionar documentos del Sistema de Gestión de Calidad desde el navegador.

## Arquitectura V3

La aplicación productiva usa una estructura simple y auditable:

- `index.html`: estructura de interfaz.
- `app.css`: sistema visual, responsive e impresión.
- `src/core.js`: estado, modelos, temas y jerarquía documental.
- `src/editor.js`: formularios, bloques y edición.
- `src/preview.js`: vista previa, tablas, gráficas, citas, referencias e importación segura.
- `src/export.js`: DOCX/PDF, arranque y autopruebas.
- `assets/`: únicamente recursos gráficos utilizados.
- `procedimiento/`: editor especializado de procedimientos.

Se eliminaron runtimes históricos, archivos de comprobación, temporales, copias de `source/`, multimedia sin referencias y duplicados.

## Word Studio V3

### Jerarquía documental

- Sección principal: nivel 1.
- Subtítulo: nivel 2.
- Subtítulos anidados: niveles 3, 4, 5 y 6.
- Numeración jerárquica automática: `1.1`, `1.1.1`, `1.1.1.1`, etc.
- Índice visual multinivel.
- DOCX con `Heading 1` a `Heading 6` y tabla de contenido compatible con Microsoft Word.

### Bloques

- Texto y encabezados jerárquicos.
- Tablas institucionales, ejecutivas y minimalistas.
- Gráficas de columnas, barras horizontales, línea y dona.
- Título, subtítulo, unidad, meta y nota metodológica en gráficas.
- KPI e indicadores.
- Notas de información, nota, recomendación, advertencia, cumplimiento y riesgo.
- Citas textuales, narrativas y parentéticas.
- Bibliografía automática.
- Imágenes/figuras, listas, diagramas y saltos de página.

### Referencias

Estilos disponibles: **APA 7**, **ISO 690** y **numérico/IEEE**. Las fuentes se registran una vez y pueden reutilizarse en múltiples citas.

### Diseño y exportación

- Temas institucional, ejecutivo, técnico, seguridad y minimalista.
- Paleta personalizada.
- Papel Carta/A4.
- Márgenes de 2,5 o 3 cm.
- Century Gothic, Aptos, Arial y Times New Roman.
- Gráficas animadas en la aplicación y SVG estático de alta calidad en Word.
- `.docx` mediante `docx@9.7.1` fijado por versión.
- PDF mediante impresión del navegador.

## Seguridad

- Autoguardado en `localStorage`.
- Respaldo JSON.
- JSON máximo 5 MB.
- Eliminación de `__proto__`, `prototype` y `constructor` en importaciones.
- Límites de profundidad y bloques.
- Imágenes máximo 6 MB y tipos permitidos PNG/JPEG/WEBP/GIF.
- Migración del estilo antiguo `subtitle` a nivel 2.

Consulte `QA_REPORT.md` para el detalle de validación.
