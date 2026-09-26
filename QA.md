# Verificación — segunda versión

26 de septiembre de 2026. Pruebas sobre la compilación Vite de esta iteración, servida localmente en Chromium.

## Comprobado

- `npm run build`: TypeScript, Vite y metadatos correctos.
- `npm audit`: cero vulnerabilidades, incluyendo dependencias de desarrollo.
- Modelo Blender: texturas cargadas, apertura de bisagra, separación de objetos, laptop izquierda/derecha y cambios de pantalla.
- Cámara y materiales revisados visualmente en escritorio, móvil y tablet. La iluminación PMREM se precalcula y se descarga como un recurso de 265 KB.
- Menú móvil, tema claro/oscuro, navegación por anclas, pausa y reactivación del recorrido.
- Diálogos de proyectos por teclado, Escape y devolución del foco. Acceso a una ficha fuera del encuadre del carrusel.
- Canvas reutilizado en el footer; regreso al hero mediante scroll.
- Vistas revisadas: 320 × 740, 390 × 844, 768 × 1024 y 1280 × 720. Sin desbordamiento horizontal del documento en las medidas móviles inspeccionadas.
- Prueba de fallo real del GLB: un servidor de QA devuelve HTTP 503 para el modelo. El preloader se retira, el canvas se libera y se conserva una página continua con proyectos y diálogos utilizables.
- Revisión de código de `prefers-reduced-motion`, entrada anticipada y contenido sin JavaScript. No se simuló una tecnología de asistencia real.

## Lighthouse local

| Categoría | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 72 | 94 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 1.8 s | 0.4 s |
| LCP | 2.9 s | 0.6 s |
| Bloqueo total | 930 ms | 180 ms |
| CLS | 0 | 0.028 |

La medición móvil final incluye la corrección de espacio reservado para iconos. La de escritorio precede ese ajuste de presentación y la ocultación del indicador de escena en pantallas pequeñas. Son pruebas locales con perfiles de Lighthouse, no datos reales de visitantes ni una medición de FPS durante todo el recorrido.

El arranque de WebGL sigue siendo el principal coste móvil. Precalcular la iluminación redujo el bloqueo inicial desde aproximadamente 4,050 ms en la primera prueba v2. Se mantiene la carga automática del 3D solicitada; no se oculta tras una interacción para mejorar artificialmente la puntuación.

Los informes detallados están en `artifacts/lighthouse-mobile.html` y `artifacts/lighthouse-desktop.html`, excluidos del repositorio. La revisión automática no equivale a una certificación WCAG ni garantiza posicionamiento en buscadores.

## Repetir las mediciones

```sh
npm ci
npm run build
npm run preview
```

En otra terminal, ejecutar por separado:

```sh
node scripts/audit.mjs http://127.0.0.1:4173/
node scripts/audit.mjs http://127.0.0.1:4173/ --desktop
```

## Contenido pendiente de Alexis

Fotografía, especialidad y texto personal confirmados, trayectoria, empresas, años, formación, proyectos reales y correo. La interfaz identifica los conceptos y la fotografía provisionales. El contacto ofrece GitHub hasta incorporar un correo real. La paleta proporcionada ya está aplicada.
