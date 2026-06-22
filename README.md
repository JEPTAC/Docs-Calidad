# Editor EI V22 · Stable Arrow Core

Esta versión rehace el motor de flechas desde la base para evitar la distorsión reportada.

## Cambio de arquitectura

Antes las flechas se recalculaban con puntos virtuales y al moverlas podían desacomodarse.  
Ahora cada flecha tiene un modelo propio:

- `start`: extremo inicial, conectado o libre.
- `end`: extremo final, conectado o libre.
- `vertices`: puntos manuales independientes.
- La flecha seleccionada es la única que se modifica.
- Mover una flecha completa desconecta sus extremos y traslada solo esa flecha.
- Mover un vértice modifica solo ese vértice.
- Mover una figura solo actualiza las flechas realmente conectadas a ella.

## Funcionalidad

- Crear flechas conectadas.
- Crear flechas libres.
- Mover flecha completa.
- Mover extremos.
- Agregar vértices.
- Mover vértices.
- Desconectar flechas.
- Limpiar vértices.
- Invertir flechas.
- Cambiar modo recto/ortogonal.
- Cambiar color/grosor/estilo/etiqueta.
- Eliminar flechas.
- Selección múltiple de figuras.
- Figuras oficiales y extras.
- Carriles, páginas, narrativa, PDF, SVG, HTML y JSON.
