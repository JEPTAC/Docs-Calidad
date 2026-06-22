# QA V23

- node --check source.js ejecutado.
- stepImageOnlyHtml restaurado con render estable.
- loadStepImg restaurado a comportamiento anterior estable.
- CSS de .step-main-img corregido:
  - height;
  - min-height;
  - position relative;
  - overflow hidden;
  - img visible.
- Cambio limitado a imagen general sin subpasos.

Resultado node --check: PASS
{
  "step_main_img_height": true,
  "stepImageOnlyHtml": true,
  "loadStepImg": true,
  "listener_data_step_img": true,
  "sublistas_intactas": true
}
