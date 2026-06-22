# Editor EI V24 · Canva Flow Stable

Esta versión reduce el riesgo de distorsión rehaciendo el editor como una sola hoja estable y un solo canvas SVG.

## Decisión técnica

La flecha ya no se calcula con puntos virtuales. Cada flecha es una polilínea de puntos reales:

- mover la línea completa traslada todos los puntos;
- mover un punto solo cambia ese punto;
- ortogonalizar crea codos reales;
- enderezar deja dos puntos reales;
- mover figuras solo actualiza extremos conectados.

El archivo `index.html` es autocontenido, con favicon inline y logo en base64 para evitar 404.
