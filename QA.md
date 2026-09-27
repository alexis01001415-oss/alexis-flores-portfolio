# Verificación — cuarta versión

26 de septiembre de 2026. Vite + TypeScript, GSAP, Lenis y escena original de Blender.

## Contenido y archivos

- Copy basado en el CV anterior aportado por Alexis, sin métricas inventadas.
- Nombre completo: Félix Alexis Flores Rojas. Grupo Invictus confirmado expresamente por Alexis.
- T-Line México 2023–2026 conserva la fecha indicada por Alexis, que sustituye el intervalo del documento anterior. Grupo Invictus y Fundación ADO usan las fechas del PDF.
- CV A4 de una página: texto seleccionable, Yantramanav incrustada, seis enlaces activos y render revisado. `output/pdf/Alexis-Flores-CV.pdf` y `public/documents/Alexis-Flores-CV.pdf` son idénticos. El original permanece intacto.
- Laboratorio, conceptos ficticios, proceso genérico, texto filosófico, controles ASCII y preloader numérico retirados.
- La foto sigue identificada como stock provisional; el CV de origen no contenía retrato.

## Funcionalidad revisada

- Compilación TypeScript/Vite y generación de metadatos correctas. El aviso de tamaño corresponde al módulo Three.js que se carga dinámicamente.
- Doce pruebas funcionales del formulario con red simulada: validación, éxito, errores, concurrencia, honeypot y timeout. No se envió ningún mensaje externo.
- `npm audit --omit=dev`: cero vulnerabilidades. `git diff --check`: correcto.
- Navegación fija lateral en escritorio y superior en móvil, apertura/cierre, desplegable, anclas a trayectoria y proyectos, selección numerada de casos.
- La galería de escritorio usa un único renderer Three.js y la laptop original de Blender, con capturas distintas en su pantalla. En móvil y tablet conserva las capturas y lectura vertical.
- Trayectoria: curva gruesa progresiva y fechas con movimiento vinculado al scroll. Tarjetas alternadas en escritorio y apiladas en móvil.
- Máscara WebGL comprobada visualmente con cursor: revela color y refracción sobre la foto, sin botones. Canvas decorativo y fotografía accesible debajo.
- Preloader de identidad con letras y salida escalonada, sin porcentajes ni controles para saltarlo. Timeout conserva el contenido si la carga 3D falla.
- Textos GSAP divididos por líneas al entrar en pantalla. Nombres accesibles completos, sin concatenar palabras separadas por saltos.
- Contacto con campos etiquetados, envío deshabilitado hasta configurar Web3Forms y alternativa real por email.
- Inspección en 320×568, 390×844, 768×1024 y 1280×720: sin desbordamiento horizontal del documento en las medidas comprobadas. Se ajustó la cámara móvil para separar modelo y texto.
- Consola sin errores en las interacciones inspeccionadas.

Movimiento reducido, versión sin JavaScript y recuperación ante pérdida de contexto WebGL revisados en código. No se simuló pérdida de contexto en el navegador ni se hizo una evaluación con lector de pantalla real.

## Lighthouse de producción local

| Categoría | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 79 | 95 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 1.3 s | 0.4 s |
| LCP | 2.0 s | 0.6 s |
| Bloqueo total | 760 ms | 160 ms |
| CLS | 0.001 | 0 |

La primera medición móvil fue 70, con 1,030 ms de bloqueo. Diferir SplitText mediante IntersectionObserver redujo el trabajo inicial. WebGL y las animaciones siguen siendo el principal coste móvil; las cifras no son datos de usuarios reales ni garantizan posicionamiento o una certificación WCAG.

Informes en `artifacts/lighthouse-mobile.html` y `artifacts/lighthouse-desktop.html`, excluidos de Git. Se midió tras los cambios de texto, cámara y SplitText; después se añadió recuperación de contexto WebGL sin cambiar la ruta normal de carga. Windows emitió el aviso conocido al liberar el perfil temporal; ambas auditorías terminaron con informes válidos.

## Pendiente de datos del propietario

- Retrato definitivo.
- Clave pública Web3Forms para habilitar y comprobar la entrega real de mensajes.
- Aportaciones individuales y resultados verificables por proyecto para ampliar los casos.
- Enlace vigente de Asesoría y Gestoría Gómez; la dirección anterior devolvía 404 y no se enlaza.

## Repetir

```sh
npm ci
npm run build
node scripts/test-contact.mjs
npm run preview
```

En otra terminal, ejecutar las auditorías de forma secuencial:

```sh
node scripts/audit.mjs http://127.0.0.1:4173/
node scripts/audit.mjs http://127.0.0.1:4173/ --desktop
```
