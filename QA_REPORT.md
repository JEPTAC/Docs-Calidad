# QA V36

Revisión QA móvil realizada sobre la estructura:

Problemas encontrados en V35:
- La plantilla seguía comportándose como hoja de escritorio.
- El sidebar podía quedar inaccesible en celular.
- El inicio era demasiado alto para pantalla móvil.
- El scroll dependía de contenedores internos y podía no llegar al fondo.
- No había navegación móvil persistente tipo app.

Correcciones:
- Drawer móvil con overlay.
- Dock inferior persistente.
- Scroll real en body y sidebar.
- CSS zoom real para que la plantilla se vea en celular.
- Home compacto.
- Intro compacta.
- Iconos y manifest conservados.

Resultado node --check: PASS
{
  "node_check_pass": true,
  "icons": true,
  "manifest": true,
  "dock_html": true,
  "drawer_html": true,
  "responsive_css": true,
  "zoom_mobile_js": true,
  "intro_mobile_css": true,
  "word_intact": true,
  "instructivo_intact": true,
  "procedure_intact": true,
  "template_quality_intact": true
}
