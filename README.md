# Estudio Documental EI V16

Corrección crítica:

- Se restauró la función exportPdf(), que había quedado referenciada pero no definida.
- Se restauraron makeBlankStep() y createFirstStep(), que eran necesarias para crear pasos desde hoja limpia.
- Se corrigió el bloqueo que impedía que los campos renderizaran en la plantilla.
- El botón Agregar paso vuelve a funcionar correctamente.
- Los campos de encabezado, objetivo, alcance, pasos, subpasos e imágenes vuelven a actualizar la vista.
- Se permite eliminar el último paso y regresar a hoja limpia.
