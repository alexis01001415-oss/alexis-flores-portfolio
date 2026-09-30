# Verificación — octava versión

29 de septiembre de 2026. Actualización del apartado CV con el documento proporcionado por Alexis.

- Revisadas las dos páginas de `CV FAFR.pdf` mediante extracción y render de Poppler. PDF publicado intacto: 52,074 bytes; SHA-256 `aa07979b8c2b65d3e83f063e62979524ef651012e77bdf412a141a106e749ff2`.
- Copia fuente, archivo público, archivo de build y descarga mediante el botón del navegador tienen el mismo hash. Los tres enlaces de descarga apuntan al archivo sustituido.
- Actividad freelance actual y aumento superior al 80 % en solicitudes de cotización; resultado sin atribuirlo a un proyecto específico. T-Line actualizado a abril de 2024–septiembre de 2026, con consola Curiosity Cloud y reducción aproximada del 50 % en tasa de rebote.
- Añadidas formación de Platzi en diseño gráfico e IA, Design Thinking, Scrum, publicidad impresa y desarrollo asistido. Formación y experiencia anteriores conservadas como información ampliada, conforme a las indicaciones previas del propietario.
- Compilación TypeScript/Vite correcta; permanece el aviso previo de tamaño del módulo Three.js. Generador antiguo aislado: solo escribe un PDF histórico en `output/pdf`, sin sobrescribir el descargable actual.
- Revisión visual en 1280×800 y 390×844: bloque freelance en dos columnas en escritorio y una en móvil, botón de descarga accesible y sin desbordamiento horizontal.

---

# Historial — séptima versión

28 de septiembre de 2026. Retrato cartoon con máscara que revela la fotografía real.

- Ilustración suministrada optimizada a WebP: 1122×1402 px, 98,572 bytes, sin recorte ni cambios visuales. Fotografía real existente conservada.
- WebGL muestra la foto real dentro de una máscara orgánica que sigue el cursor y se desvanece al salir. Ambas imágenes mantienen sus proporciones; el recorte CSS y el del shader coinciden.
- Verificado en navegador: cartoon inicial, desplazamiento de la máscara por el rostro, retorno al salir y fotografía visible al recibir foco de teclado. Sin errores en consola durante estas comprobaciones.
- Revisión responsive en 1280×800 y 390×844. No se modifica el resto de las secciones.
- Revisión de código: eventos táctiles pasivos con pan vertical y zoom permitidos; reinicio al soltar/cancelar. Movimiento reducido y fallo de WebGL usan máscara CSS. Estas condiciones no se simularon en un dispositivo táctil físico.
- TypeScript y build de producción correctos. Permanece el aviso previo de tamaño del módulo Three.js; no se añadieron dependencias.

---

# Historial — sexta versión

28 de septiembre de 2026. Perfil UX/UI, identidad, formación completa y contacto.

## Contenido y documentos

- Nombre sin acento: **Felix Alexis Flores Rojas**, también en título del PDF, metadatos y datos estructurados.
- UX/UI como especialidad principal. HTML/CSS con dominio avanzado y JavaScript básico diferenciados; Figma, Framer, WordPress, Webflow, Blender, diseño gráfico, ChatGPT, Claude y prompt engineering descritos en seis áreas desplegables.
- Los tres capítulos del recorrido hablan de curiosidad, exploración visual y aprendizaje. Las pantallas de la laptop también se actualizaron.
- Formación contrastada con el render guardado del CV original: licenciatura y bachillerato; Google/Coursera, Udemy y cuatro cursos de Platzi. El original ya no estaba disponible en su antigua ruta D:, pero su página renderizada era legible y completa.
- Cuatro experiencias descritas sin métricas inventadas. El nivel técnico indicado ahora por el propietario prevalece sobre el título de front-end usado en versiones anteriores.
- CV de dos páginas A4, 25,955 bytes, seis enlaces, texto seleccionable y fuentes incrustadas. Ambas páginas renderizadas con Poppler e inspeccionadas. Copias de output/pdf y public/documents idénticas.
- Fotografía real de 640×641, convertida a WebP de 36,268 bytes, sin retoque ni recorte. Crédito provisional retirado. Monograma y favicon con mayor separación entre letras.

## Funcionamiento y revisión visual

- Build TypeScript/Vite correcto; aviso de tamaño corresponde al módulo Three.js dinámico.
- Competencias con details/summary nativos, apertura exclusiva y actualización de ScrollTrigger al cambiar la altura.
- Footer sin laptop ni renderer 3D, línea luminosa y letras de HABLEMOS ligadas al scroll. Se midieron transformaciones 3D intermedias y alineación final.
- Reveal fijo cuando cabe completo: 697 px en viewport de 1280×720. En móvil y pantallas cortas usa flujo normal. La superficie fija se oculta hasta su entrada para evitar desplazamiento de diseño durante la carga.
- Formulario Web3Forms configurado. Doce pruebas de éxito/error/validación con red simulada pasan. Botón habilitado y validación nativa de campos vacíos comprobados en navegador. No se envió un mensaje real, por lo que la recepción en el buzón no está verificada.
- Revisión responsive de perfil, competencias, trayectoria y contacto; foto con proporciones originales y campos accesibles. El modo de movimiento reducido y limpieza de listeners/observers se revisaron en código.

## Lighthouse local — v6

| Categoría | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 76 | 96 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 1.7 s | 0.4 s |
| LCP | 2.8 s | 0.6 s |
| Bloqueo total | 680 ms | 130 ms |
| CLS | 0.001 | 0 |

Una primera medición de escritorio detectó CLS 0.701 al fijar el footer durante la carga. Se corrigió y se repitió esa auditoría. La medición móvil precede a esta corrección específica del footer fijo de escritorio. El 3D sigue siendo el principal coste móvil. Son mediciones de laboratorio, no resultados de usuarios reales ni garantía de ranking.

---

# Historial — quinta versión

28 de septiembre de 2026. Iteración de tipografía, recorrido 3D y galería.

## Cambios comprobados

- Escritorio: 1.5 px de espaciado, títulos a 120% y párrafos a 140%. Verificado en estilos calculados; escalas de tablet y móvil documentadas en README.
- La laptop se centra, gira de frente y llena el encuadre antes del perfil. La pantalla se funde con el fondo marfil sin corte de color visible.
- Iluminación neutra en Three.js y en el póster regenerado con Blender. Archivo fuente `.blend` actualizado.
- Portafolio 2026 ampliado, ruido animado limitado al hero, indicadores más gruesos y hovers de navegación, logo y CV.
- Trayectoria con bucles más amplios, sin sombra ni guía gris detrás. Fechas ajustadas para evitar superposición con tarjetas en tablet.
- Proyectos web freelancer: columna izquierda vertical, laptop fija y cambio de captura en la pantalla. Las capturas de respaldo permanecen en una posición fija durante la carga del 3D.
- Selectores y anclas de la galería comprobados. Se corrigió el desplazamiento interno causado por el foco usando `overflow: clip` en el contenedor fijado.
- Menú: apertura, foco inicial y cierre con Escape conservan el foco esperado.
- Revisión visual en 320×568, 390×844, 768×1024 y 1280×720, sin desbordamiento horizontal del documento. Cámara corregida para separar la laptop del nombre en móviles de poca altura.
- TypeScript/Vite y `git diff --check` correctos. Consola sin errores en el recorrido inspeccionado. Aviso de tamaño limitado al módulo Three.js dinámico.
- Limpieza al redimensionar, movimiento reducido, fallback y versión sin JavaScript revisados en código. No se simuló pérdida de contexto WebGL ni se evaluó con lector de pantalla real.

## Lighthouse de producción local — v5

| Categoría | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 73 | 91 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 1.7 s | 0.4 s |
| LCP | 2.8 s | 0.6 s |
| Bloqueo total | 990 ms | 220 ms |
| CLS | 0.001 | 0 |

El 3D y la preparación de animaciones siguen siendo el principal coste de carga móvil. Las cifras son mediciones locales, no datos de usuarios reales ni garantía de posicionamiento. La auditoría se ejecutó antes de los últimos ajustes de cámara en móviles de poca altura, fechas de tablet y recorte de galería; después se recompiló y revisó visualmente.

Informes `artifacts/lighthouse-mobile.html` y `artifacts/lighthouse-desktop.html`, excluidos de Git. Windows emitió el aviso conocido al liberar el perfil temporal; ambos informes son válidos. El formulario, el PDF y los datos profesionales no se modificaron en esta iteración; sus comprobaciones anteriores se conservan debajo.

---

# Historial — cuarta versión

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
