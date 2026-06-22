# QA V22

## QA técnico

- Motor de flechas reescrito.
- Sin uso de puntos undefined.
- Colores normalizados.
- `node --check source/app.js` debe pasar.
- `index.html` autocontenido.

## QA funcional sugerido

1. Mover una flecha completa: no debe mover otras.
2. Mover un vértice: solo cambia esa flecha.
3. Mover una figura: solo se actualizan flechas conectadas.
4. Desconectar flecha y moverla libremente.
5. Crear flecha libre.
6. Crear flecha conectada.
7. Cambiar modo recto/ortogonal.
8. Exportar PDF.


Resultado node --check: PASS

