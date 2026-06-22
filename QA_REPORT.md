# QA V22

- node --check source.js ejecutado.
- Se verificó listener exacto para [data-step-img].
- Se reforzó loadStepImg.
- Cambio limitado a imagen general de paso sin subpasos.

Resultado node --check: PASS
{
  "listener_data_step_img": true,
  "listener_w": true,
  "listener_h": true,
  "listener_x": true,
  "listener_y": true,
  "loadStepImg": true,
  "sublistas_intactas": true
}
