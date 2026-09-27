# Alexis Flores — Portafolio v3

Portafolio estático para GitHub Pages, con una escena original de Blender, Three.js, GSAP y Lenis. La tercera versión incorpora trayectoria profesional, CV descargable, proyectos publicados, retrato ASCII y un formulario preparado para Web3Forms.

## Desarrollo

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Node.js 22 o posterior. La compilación incluye TypeScript, Vite, metadatos, datos estructurados, sitemap y página 404. `SITE_URL` permite establecer la URL pública de GitHub Pages; el workflow la calcula desde el repositorio.

## Diseño e interacción

La paleta proporcionada por Alexis combina marfil `#F2EAE3`, gris cálido `#D0C9C3`, rojo `#FF073A`, carbón `#131211` y negro `#000000`. Los botones primarios usan la variante roja `#C90030` con texto marfil `#F2EAE3`: su contraste calculado es aproximadamente **5.01:1**. Yantramanav es la tipografía y los iconos pertenecen a Google Material Symbols.

El header permanece fijo y visible, con navegación al perfil, CV, proyectos y contacto. La interfaz utiliza modo oscuro; el menú móvil y el desplegable de proyectos dan acceso a las mismas secciones. El movimiento se adapta a `prefers-reduced-motion` del sistema.

El recorrido 3D abre la laptop, separa los objetos del escritorio y alterna el modelo y el texto a ambos lados de la pantalla. Lenis y GSAP ScrollTrigger coordinan el desplazamiento. El preloader comunica la preparación de la experiencia y permite entrar sin esperar. Perfil, trayectoria, casos, proceso y contacto continúan en HTML semántico.

### Retrato ASCII

`src/portrait.ts` y `src/portrait.css` generan una versión del retrato con caracteres en Canvas 2D. La imagen de caracteres se calcula al cargar o cambiar de tamaño y queda en caché; al mover el cursor se actualiza una máscara suave, sin reconstruir todos los caracteres en cada fotograma.

El botón **Ver retrato ASCII** permite alternar la imagen completa con teclado o pantalla táctil. La foto original permanece disponible si Canvas falla. La implementación respeta movimiento reducido, limita la resolución y detiene la animación cuando la pestaña está oculta. El retrato actual sigue siendo una fotografía de stock, identificada en la interfaz.

## Perfil y casos publicados

La información profesional confirmada está en `index.html` y en el generador del CV:

- **T-Line México, 2023–2026:** profesional de UX/UI y desarrollador front-end.
- **Grupo Victus, anteriormente:** diseñador web y diseñador UX/UI. No se asignan fechas sin confirmar.
- **Competencias:** UX/UI, diseño web, prototipado, diseño responsive, HTML, CSS, JavaScript, GitHub, WordPress, Framer, Webflow, Blender, componentes interactivos, animación web y desarrollo asistido por IA.

Las fichas muestran capturas reales y enlaces a tres sitios publicados:

| Caso | Sitio | Captura local |
| --- | --- | --- |
| Curiosity Marketplace | https://marketplace.curiositycloud.com/ | `public/images/cases/curiosity.webp` |
| Macloud Seguridad Privada | https://seguridadmacloud.com.mx/ | `public/images/cases/macloud.webp` |
| Gatical Seguridad Privada | https://gaticalseguridadprivada.framer.website/ | `public/images/cases/gatical.webp` |

**Asesoría y Gestoría Gómez** permanece pendiente de documentación: el enlace proporcionado, `https://empathic-signposts-791765.framer.app/`, devolvió HTTP 404 durante la revisión. No se ha reconstruido ni supuesto su contenido.

Los contextos y retos de las fichas son lecturas de los sitios publicados. Todavía falta documentar el papel de Alexis, sus contribuciones concretas, el equipo y los resultados de cada proyecto. No se atribuyen proyectos a una empresa de su trayectoria ni se inventan métricas o responsabilidades.

## CV descargable

El PDF de una página está en `public/documents/Alexis-Flores-CV.pdf`. Se genera con `scripts/create_cv.py` a partir de la información confirmada y la tipografía Yantramanav instalada por npm.

```sh
npm ci
python -m pip install reportlab fonttools brotli
python scripts/create_cv.py
```

El generador crea `output/pdf/Alexis-Flores-CV.pdf` y copia el mismo archivo a `public/documents/`. Usa texto real y enlaces, con una columna de lectura. Al actualizar la trayectoria o las competencias, mantener sincronizados `index.html` y `scripts/create_cv.py`, y regenerar el PDF.

## Configurar el formulario de contacto

La configuración está en `src/contact.ts`:

```ts
export const contactConfig = { accessKey: '' };
```

La clave está vacía. En este estado, el botón de envío está deshabilitado y el formulario informa que aún no recibe mensajes; GitHub queda disponible como alternativa. No se han enviado mensajes de prueba a destinatarios reales.

Para habilitarlo, obtener la **access key pública** de Web3Forms vinculada al correo del propietario y colocarla en `contactConfig.accessKey`. Es el identificador que Web3Forms utiliza en formularios del navegador; no debe sustituirse por una credencial privada de otro servicio. Compilar y publicar después del cambio. La [documentación oficial de HTML y JavaScript de Web3Forms](https://docs.web3forms.com/how-to-guides/html-and-javascript) describe este mecanismo.

El controlador envía JSON mediante `fetch` a `https://api.web3forms.com/submit`; ese origen está permitido en `connect-src` de la CSP. Incluye validación nativa y de contenido vacío, límites de los campos, un honeypot, bloqueo de envíos simultáneos, estados accesibles y cancelación con `AbortController` tras 15 segundos. Solo limpia los campos cuando la API confirma éxito. Ante errores HTTP, rechazo de la API, respuesta inválida o fallo de red, conserva los datos para reintentar.

Una vez habilitado, los datos introducidos se transmiten a Web3Forms para entregar el mensaje. GitHub Pages sigue sirviendo un sitio estático, sin backend propio.

## Modelo de Blender e iluminación

Las fuentes están en `assets-source/v2/workstation-v2.blend` y `assets-source/v2/create_workstation.py`. La escena publicada es `public/models/workstation-v2.glb`; el póster es `public/images/workstation-v2.webp`. El modelo incluye laptop articulada, teclado, trackpad, rejillas, puertos, materiales de aluminio, escritorio, café, libreta, bolígrafo y un objeto acrílico rojo.

Las texturas de color y rugosidad están empaquetadas en el GLB, de aproximadamente 1.49 MB, con 47 meshes y 36,894 triángulos. El póster WebP procede de un render de Blender y muestra la composición cuando WebGL no está disponible. El GLB se carga directamente, sin un decodificador Draco adicional. Las fuentes editables, scripts y texturas se conservan en el repositorio y quedan fuera de `dist/`.

Los reflejos se precalculan desde `RoomEnvironment` de Three.js mediante PMREM de tamaño 128. El atlas mide 384 × 512 píxeles y contiene RGBA Float16 en orden little endian, comprimido con gzip: `public/models/studio-environment.pmrem` ocupa 265,087 bytes. La web lo carga con `fetch` y `DecompressionStream`, y lo aplica como `DataTexture` con `CubeUVReflectionMapping`, evitando generar PMREM al entrar.

Para regenerarlo, iniciar `npm run dev`, abrir `/scripts/bake-environment.html`, generar y descargar la iluminación, y reemplazar el archivo en `public/models/`. El generador no se publica en `dist/`. Las instrucciones de reconstrucción, materiales y coordenadas están en `assets-source/v2/README.md`.

La pantalla de la laptop cambia con los capítulos: alterna la imagen incluida en el GLB con composiciones originales de `CanvasTexture`. No requiere descargar videos.

## Verificación y accesibilidad

```sh
node scripts/test-contact.mjs
```

Las pruebas del controlador de contacto cubren **12 escenarios** y pasaron en esta revisión. Usan dobles locales de DOM y red: no envían mensajes. Verifican configuración vacía, validación, honeypot, éxito, fallos, solicitudes simultáneas y cancelación.

El contenido usa navegación con teclado, anclas, foco visible, etiquetas de campos y estados de formulario. La alternativa estática conserva el contenido y el póster; los canvas son decorativos. Los controles con desplazamiento propio usan `data-lenis-prevent`.

`QA.md` recoge las revisiones manuales y mediciones de producción. Las cifras de versiones anteriores no describen automáticamente v3: las mediciones nuevas deben corresponder a la compilación publicada. La revisión automática no equivale a una certificación WCAG.

## SEO y seguridad

HTML semántico en español, título y descripción, canonical, Open Graph, schema.org Person/ProfilePage/WebSite, sitemap y robots. Esta estructura facilita la lectura por buscadores y asistentes, sin garantizar posiciones ni menciones.

HTTPS de GitHub Pages, fuentes y medios locales, Content Security Policy, sin evaluaciones dinámicas ni HTML construido desde entradas del usuario, permisos mínimos del workflow y lockfile. La excepción de red externa es el envío configurado a Web3Forms. GitHub Pages no permite personalizar encabezados HTTP como `frame-ancestors`; una CSP de tipo meta no sustituye esos encabezados. La protección de la cuenta y el repositorio depende también de su configuración de acceso.

## Fuentes y derechos

- Yantramanav: Google Fonts / SIL Open Font License, distribuida con `@fontsource/yantramanav`.
- Material Symbols Rounded: Google / Apache 2.0. Subconjunto alojado localmente.
- Fotografía provisional: [Joseph Gonzalez / Unsplash](https://unsplash.com/es/fotos/hombre-con-camisa-blanca-con-cuello-en-v-iFgRcqHznqg), [licencia](https://unsplash.com/es/licencia).
- Escena de Blender, texturas del estudio y composiciones de la pantalla de la laptop: creadas para este portafolio.
- Capturas en `public/images/cases/`: reproducciones de los sitios enlazados en la tabla de casos. Las marcas, imágenes, contenido y diseños mostrados conservan los derechos de sus respectivos titulares; no se presentan como recursos originales de este repositorio ni se les asigna una licencia nueva.

Inspiración visual: [Vizcom](https://vizcom.com/), [SKF](https://www.skf.com/group/fighting-friction/01), [Dropbox × McLaren](https://dash.dropbox.com/mclarenf1), [Ponpon Mania](https://ponpon-mania.com/about#support), [Oryzo](https://oryzo.ai/) y [BreachBunny](https://www.breachbunny.com/). No se reutilizó su código ni sus modelos.

## Publicación

En GitHub → Settings → Pages, seleccionar **GitHub Actions**. El workflow `.github/workflows/pages.yml` publica `dist/` con cada cambio en `main`. Las rutas relativas permiten desplegar dentro del subdirectorio del repositorio.

[Portafolio público](https://alexis01001415-oss.github.io/alexis-flores-portfolio/) · [Repositorio](https://github.com/alexis01001415-oss/alexis-flores-portfolio)
