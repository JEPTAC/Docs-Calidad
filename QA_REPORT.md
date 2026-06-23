# QA V27

- node --check source.js ejecutado.
- Solo se tocó intro:
  - CSS de intro-overlay;
  - capa intro-energy;
  - clase experience-active en runIntro/closeIntro.
- Funciones críticas verificadas:
  - createFirstStep;
  - addSub;
  - addListGroup;
  - renderStepEditor;
  - loadStepImg;
  - exportPdf;
  - saveToBrowserCache.

Resultado node --check: PASS
{
  "intro_energy_html": true,
  "experience_active_css": true,
  "experience_active_js": true,
  "create_steps_intact": true,
  "sublistas_intact": true,
  "image_intact": true,
  "pdf_intact": true,
  "cache_intact": true
}
