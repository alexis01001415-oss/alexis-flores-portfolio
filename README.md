# Alexis Flores — Portafolio

Portafolio estático para GitHub Pages. La segunda versión usa una escena original de Blender, Three.js, GSAP y Lenis para recorrer un escritorio y una laptop mediante el scroll. No requiere backend, servicios 3D embebidos ni claves privadas.

## Desarrollo

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Node.js 22 o posterior. La compilación incluye TypeScript, Vite, metadatos, datos estructurados, sitemap y página 404. `SITE_URL` permite establecer la URL pública de GitHub Pages; el workflow la calcula desde el repositorio.

## Dirección visual de la segunda versión

La paleta proporcionada por Alexis combina marfil `#F2EAE3`, gris cálido `#D0C9C3`, rojo `#FF073A`, carbón `#131211` y negro `#000000`. El rojo es el acento. Los controles primarios usan texto negro sobre rojo para mantener el contraste. La tipografía es Yantramanav y los iconos pertenecen a Google Material Symbols.

El recorrido abre la laptop, separa los objetos del escritorio y alterna el modelo y el texto a ambos lados de la pantalla. La escena del hero ocupa el fondo del viewport. El nuevo modelo elimina el gato, la silla y la plataforma circular de la primera versión. El preloader comunica la preparación de la experiencia y permite entrar sin esperar.

Lenis y GSAP ScrollTrigger coordinan el desplazamiento y las animaciones. El contenido continúa en HTML semántico: perfil, conceptos de proyectos, proceso y contacto. La revisión de esta versión y sus mediciones están documentadas en `QA.md`; las métricas anteriores no describen este rediseño.

## Personalizar

- **Paleta y tipografía:** variables y reglas de `src/style.css`.
- **Contacto y proyectos:** `src/content.ts`. El correo permanece vacío hasta disponer de uno confirmado; el contacto ofrece el perfil público de GitHub.
- **Texto y trayectoria:** `index.html`. La especialidad y el texto personal son propuestas para revisión. No se han inventado años, empresas, estudios, clientes ni resultados. Forma, Pulso y Órbita son conceptos de demostración, identificados como tales.
- **Retrato:** reemplazar `public/images/portrait.webp`, actualizar el texto alternativo y quitar el crédito de fotografía temporal.
- **Escena 3D:** `assets-source/v2/workstation-v2.blend` y `assets-source/v2/create_workstation.py`. La escena publicada es `public/models/workstation-v2.glb`; el póster es `public/images/workstation-v2.webp`.
- **Texturas originales:** `assets-source/v2/make_textures.py` y las imágenes que genera. Las instrucciones de reconstrucción, materiales, pivotes y coordenadas están en `assets-source/v2/README.md`.
- **Iluminación web:** `public/models/studio-environment.pmrem`, generada con `scripts/bake-environment.html`. El procedimiento de regeneración está en `assets-source/v2/README.md`.

## Modelo de Blender

La laptop tiene bisagra articulada, teclado, trackpad, rejillas, puertos y materiales de aluminio. El escritorio incluye café, libreta, bolígrafo y un objeto acrílico rojo. Las texturas de color y rugosidad están empaquetadas en el GLB, que pesa aproximadamente 1.49 MB. Son 47 meshes y 36,894 triángulos. El póster WebP procede de un render de Blender y permite mostrar la composición sin WebGL.

El GLB se carga directamente, sin un decodificador Draco adicional. El archivo editable, los scripts y las texturas se conservan en el repositorio, pero no se incluyen en `dist/`. Los renders intermedios y registros de pruebas están excluidos del control de versiones.

Los reflejos del estudio se precalculan desde `RoomEnvironment` de Three.js mediante PMREM de tamaño 128. El atlas resultante mide 384 × 512 píxeles y contiene RGBA Float16 en orden little endian, comprimido con gzip: `studio-environment.pmrem` ocupa 265,087 bytes. La web lo carga con `fetch` y `DecompressionStream`, y lo aplica como `DataTexture` con `CubeUVReflectionMapping`. Esto evita generar el entorno PMREM al entrar al sitio.

La pantalla de la laptop cambia con los capítulos. Parte de la imagen incluida en el GLB y alterna composiciones originales generadas con `CanvasTexture`; no descarga videos ni imágenes de terceros.

## Accesibilidad y rendimiento

La interfaz incluye navegación con teclado, enlaces internos, menú móvil, tema claro/oscuro, diálogo nativo, pausa de movimiento y `prefers-reduced-motion`. La alternativa estática conserva el contenido y el póster. El canvas es decorativo y los textos importantes son HTML. Los diálogos usan `data-lenis-prevent` para conservar su desplazamiento nativo.

Los criterios de revisión incluyen contraste, foco visible, ausencia de desbordamiento en móvil, comportamiento al omitir la carga y reducción del recorrido cuando se solicita menos movimiento. `QA.md` recoge el estado de las verificaciones y las mediciones de la compilación publicada.

## SEO y seguridad

HTML semántico en español, título y descripción, canonical, Open Graph, schema.org Person/ProfilePage/WebSite, sitemap y robots. La estructura facilita la lectura por buscadores y asistentes; no garantiza posiciones en Google ni menciones en respuestas de IA. Los conceptos no se presentan como clientes reales en datos estructurados.

HTTPS de GitHub Pages, recursos desde el mismo origen, Content Security Policy, sin formularios que recojan datos, sin evaluaciones dinámicas ni HTML construido desde entradas del usuario, permisos mínimos del workflow y lockfile. GitHub Pages no permite personalizar encabezados HTTP como `frame-ancestors`; una CSP de tipo meta no sustituye esos encabezados. La protección de la cuenta y el repositorio depende también de su configuración de acceso.

## Fuentes y licencias

- Yantramanav: Google Fonts / SIL Open Font License, distribuida con `@fontsource/yantramanav`.
- Material Symbols Rounded: Google / Apache 2.0. Subconjunto alojado localmente.
- Fotografía provisional: [Joseph Gonzalez / Unsplash](https://unsplash.com/es/fotos/hombre-con-camisa-blanca-con-cuello-en-v-iFgRcqHznqg), [licencia](https://unsplash.com/es/licencia).
- Escena, modelos, texturas y composiciones de proyectos: originales de este portafolio.

Inspiración visual: [Vizcom](https://vizcom.com/), [SKF](https://www.skf.com/group/fighting-friction/01), [Dropbox × McLaren](https://dash.dropbox.com/mclarenf1), [Ponpon Mania](https://ponpon-mania.com/about#support), [Oryzo](https://oryzo.ai/) y [BreachBunny](https://www.breachbunny.com/). No se reutilizó su código ni sus modelos.

## Publicación

En GitHub → Settings → Pages, seleccionar **GitHub Actions**. El workflow `.github/workflows/pages.yml` publica `dist/` con cada cambio en `main`. Las rutas relativas permiten desplegar dentro del subdirectorio del repositorio.

[Portafolio público](https://alexis01001415-oss.github.io/alexis-flores-portfolio/) · [Repositorio](https://github.com/alexis01001415-oss/alexis-flores-portfolio)
