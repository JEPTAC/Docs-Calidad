# QA V26

- node --check source.js ejecutado.
- Base usada: V25 estable.
- No se reemplazó renderStepEditor.
- No se reemplazó createFirstStep, addSub, addListGroup, loadStepImg ni loadGroupImg.
- Se agregaron assets en carpeta assets/.
- Se agregó introOverlay.
- Se agregó historial localStorage RECENT_KEY.
- Se agregó botón de regreso al inicio en procedimiento.

Resultado node --check: PASS
{
  "introOverlay": true,
  "assets_all": true,
  "history_panel": true,
  "save_recent": true,
  "home_buttons": true,
  "stable_funcs": true,
  "proc_home": true,
  "proc_sticky": true
}
