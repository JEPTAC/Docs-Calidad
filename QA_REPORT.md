# QA V20

- node --check source.js ejecutado.
- Modo lista reemplazado por sublistas.
- listGroups normalizado en ensureSubDefaults.
- renderStepEditor incluye:
  - agregar sublista,
  - título sublista,
  - imagen por sublista,
  - subpasos por sublista,
  - controles de imagen por sublista.
- Paginación estima notas más compactas.
- Paginación trabaja por grupo/sublista.
- Multi-imagen anterior oculto por compatibilidad.

Resultado node --check: PASS
{
  "listGroups": true,
  "addListGroup": true,
  "loadGroupImg": true,
  "groupImageHtml": true,
  "multi hidden": true
}
