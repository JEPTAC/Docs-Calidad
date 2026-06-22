# QA V21

- node --check source.js ejecutado.
- renderCardsEditor: bloque "Sin subpasos" vuelve a mostrar imagen general del paso.
- Verificado atributo data-step-img.
- Verificadas funciones loadStepImg y removeStepImage.
- Cambio limitado al caso: paso en modo tarjetas sin subpasos.

Resultado node --check: PASS
{
  "sin_subpasos_boton_imagen": true,
  "loadStepImg": true,
  "removeStepImage": true,
  "sublistas_intactas": true
}
