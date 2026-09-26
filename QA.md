# Verificación — 26 de septiembre de 2026

## Compilación y publicación

- `npm run build`: correcto (TypeScript y Vite).
- `npm install` / auditoría de dependencias: 0 vulnerabilidades reportadas.
- Despliegue mediante GitHub Actions y GitHub Pages con HTTPS.
- URL pública comprobada: respuesta HTTP 200, título, canonical y datos estructurados presentes.

## Lighthouse local

Prueba sobre la compilación de producción con Lighthouse 13.5.0 y sus configuraciones estándar de móvil y escritorio.

| Categoría | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 98 | 100 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO | 100 | 100 |

Móvil: FCP 1.5 s; LCP 2.1 s; bloqueo total 30 ms; CLS 0.049.

Las cifras corresponden a la carga inicial local, con render de Blender como imagen. Three.js se activa por interacción o al acercarse al footer. No miden la tasa de fotogramas de una sesión 3D, no son datos reales de visitantes y pueden variar por dispositivo y red. La comprobación automática de accesibilidad no equivale a una certificación WCAG. SEO 100 no garantiza posiciones en Google ni aparición en respuestas de asistentes.

Informes completos disponibles localmente en `artifacts/lighthouse-mobile.html` y `artifacts/lighthouse-desktop.html`, excluidos del repositorio.

Para repetir, iniciar `npm run preview` y ejecutar:

```sh
npm run audit:accessibility
node scripts/audit.mjs http://127.0.0.1:4173/ --desktop
```

## Revisión manual en Chromium

- Vistas de 320, 390, 768 y 1440 px; sin scroll horizontal del documento tras las correcciones.
- Tema claro/oscuro y menú móvil.
- Apertura de fichas, cierre con Escape y devolución de foco al botón original.
- Pestañas del proceso mediante clic y flechas del teclado.
- Escena WebGL original y activación del gato.
- Footer, contacto y enlaces al perfil público de GitHub.
- Sin errores de consola en las vistas probadas.

También se revisaron código de movimiento reducido, pausa, carga alternativa, liberación de recursos ante fallos, contenido HTML sin JavaScript y contraste de los colores principales en ambos temas.

## Datos pendientes del propietario

Paleta definitiva, fotografía de Alexis, especialidad confirmada, trayectoria, empresas, años, formación, proyectos reales y correo de contacto. La interfaz identifica los conceptos y fotografía temporales. El contacto ofrece GitHub hasta incorporar un correo real. No hay logros o clientes ficticios presentados como reales.
