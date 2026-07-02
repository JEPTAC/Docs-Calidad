# QA V62

Solicitud:
- En Word poder colocar subtítulos 3.1, 3.2, etc.
- Poder agregar subtítulos.
- Subtítulos en azul, Century Gothic, sin diseño adicional.
- Que se agreguen solos a la tabla de contenido con su página.

Correcciones:
1. Modelo:
   - Cada sección SGC ahora soporta `sub`.
   - Los subtítulos tienen número, título y contenido.
2. Panel:
   - Cada sección tiene botón `+ Subtítulo`.
   - Se puede editar número, subtítulo y contenido.
   - Se puede eliminar subtítulo.
3. Numeración:
   - El subtítulo se genera con base en la sección: 3.1, 3.2, etc.
   - Si cambia el número de la sección, los subtítulos se renumeran.
4. Render Word:
   - La tabla de contenido incluye secciones y subtítulos.
   - Cada fila muestra página.
   - El contenido muestra el subtítulo sin caja ni diseño adicional.
5. Estilo:
   - Subtítulo azul #001F73.
   - Fuente Century Gothic.
   - Sin fondo, sin borde, sin bloque adicional.

Resultados:
{
  "source_node_check": true,
  "inline_script_check": true,
  "runtime_subtitle_check": true,
  "runtime_stdout": "RUNTIME_OK_V62 3.1 \u001b[33mtrue\u001b[39m",
  "add_subtitle_function": true,
  "remove_subtitle_function": true,
  "toc_includes_subtitles": true,
  "content_renders_subtitles": true,
  "blue_century_subtitle_style": true,
  "word_panel_subtitle_editor": true,
  "word_intact": true,
  "instructivo_intact": true,
  "procedure_intact": true
}

node source.js stderr:


node inline script stderr:


runtime stdout:
RUNTIME_OK_V62 3.1 [33mtrue[39m


runtime stderr:

