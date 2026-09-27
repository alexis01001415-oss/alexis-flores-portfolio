# Verificación — tercera versión

26 de septiembre de 2026. Compilación Vite local en Chromium, con la escena de Blender conservada.

## Verificaciones realizadas

- `npm run build`: TypeScript, Vite y metadatos correctos. Vite avisa del tamaño del módulo Three.js cargado dinámicamente; no es un error de compilación.
- `node scripts/test-contact.mjs`: 12 escenarios funcionales, con peticiones simuladas. Sin clave no se envía nada. Cubre validación, espacios vacíos, honeypot, éxito, errores HTTP/API/JSON/red, doble envío y timeout. Los errores conservan el texto y permiten reintentar.
- `npm audit --omit=dev`: cero vulnerabilidades en dependencias de producción.
- `git diff --check`: correcto.
- Header fijo y visible al avanzar y retroceder. Controles de pausa y cambio de tema retirados.
- Dropdown de proyectos, navegación a casos, menú móvil expandible y panel desplazable en una pantalla de 320 × 568.
- Diálogo abierto desde el dropdown: Escape cierra y devuelve el foco al botón Proyectos.
- Trayectoria en papel marfil, columna sticky en escritorio y curva animada. Lectura vertical en móvil.
- Retrato: máscara ASCII visible bajo el cursor, con la imagen original detrás. Botón para teclado/pantalla táctil. El Canvas 2D reutiliza los caracteres calculados.
- Casos: capturas de sitios reales, acordeón con contexto y reto; apertura actualiza ScrollTrigger. La contribución personal todavía requiere documentación.
- Footer con laptop 3D, campos etiquetados y aviso claro de formulario aún no habilitado. Ningún mensaje de prueba enviado a terceros.
- CV: botón probado mediante descarga real del navegador. PDF A4 de una página, texto seleccionable, fuentes incrustadas y cinco enlaces. Render inspeccionado, sin cortes ni caracteres fuera de página.
- Inspección visual en 320 × 568, 390 × 844, 768 × 1024 y 1280 × 720. Sin desbordamiento horizontal del documento en las medidas inspeccionadas.
- Consola del navegador sin errores en las interacciones revisadas.

La preferencia de movimiento reducido y el fallback de WebGL se conservan. Su lógica fue revisada; la prueba de fallo HTTP 503 del modelo corresponde a la iteración v2. No se ha simulado una tecnología de asistencia real.

## Lighthouse local

| Categoría | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 83 | 97 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 1.8 s | 0.4 s |
| LCP | 3.0 s | 0.6 s |
| Bloqueo total | 440 ms | 140 ms |
| CLS | 0 | 0.005 |

Las mediciones pertenecen a v3. Después de la medición de escritorio se alinearon las etiquetas accesibles con el texto visible; la auditoría móvil confirmó esa corrección. Después de ambas se corrigieron algunos acentos en mensajes de JavaScript y se desactivó el redondeo de GSAP para que el trazado normalizado del CV avance de forma gradual. Se comprobó visualmente y con valores intermedios de `stroke-dashoffset`. No son datos de visitantes ni una medición continua de FPS. WebGL sigue siendo el principal coste inicial móvil.

Los botones rojos con texto marfil tienen un contraste calculado de 5.01:1. La puntuación automática no equivale a una certificación WCAG ni garantiza posiciones en buscadores.

Informes completos: `artifacts/lighthouse-mobile.html` y `artifacts/lighthouse-desktop.html`, excluidos de Git. El auditor finalizó correctamente; Windows retuvo temporalmente el perfil de Chrome al liberar archivos.

## Repetir

```sh
npm ci
npm run build
node scripts/test-contact.mjs
npm run preview
```

En otra terminal, ejecutar por separado:

```sh
node scripts/audit.mjs http://127.0.0.1:4173/
node scripts/audit.mjs http://127.0.0.1:4173/ --desktop
```

## Información pendiente

- Clave pública de Web3Forms vinculada al correo de Alexis. El envío real no puede verificarse hasta configurarla.
- Fechas de Grupo Victus y contribuciones, contexto laboral y resultados de cada proyecto.
- URL vigente de Asesoría y Gestoría Gómez: el enlace anterior devolvió 404.
- Retrato definitivo. La fotografía actual continúa identificada como provisional.

T-Line México 2023–2026, ambos puestos, herramientas y nombres de los proyectos provienen de información confirmada por Alexis. No se inventaron empleadores, métricas, estudios ni responsabilidades específicas.
