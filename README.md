# Félix Alexis Flores Rojas — Portafolio v5

Portafolio profesional de **Alexis Flores**, diseñador UX/UI y desarrollador front-end. Sitio estático para GitHub Pages con una escena original de Blender, Three.js, GSAP, SplitText y Lenis. Presenta competencias, trayectoria, proyectos web y un CV descargable.

[Portafolio público](https://alexis01001415-oss.github.io/alexis-flores-portfolio/) · [Repositorio](https://github.com/alexis01001415-oss/alexis-flores-portfolio)

## Desarrollo

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Node.js 22 o posterior. La compilación valida TypeScript, genera los archivos de Vite y añade metadatos, datos estructurados, sitemap, robots y página 404. `SITE_URL` permite establecer la URL de GitHub Pages; el workflow la calcula desde el repositorio.

## Diseño e interacción

La paleta combina marfil `#F2EAE3`, gris cálido `#D0C9C3`, rojo `#FF073A`, carbón `#131211` y negro. Los botones primarios usan `#C90030` con texto marfil, con contraste aproximado de **5.01:1**. La tipografía es Yantramanav; los iconos son Google Material Symbols alojados localmente.

- **Navegación lateral:** cabecera siempre visible a la izquierda en escritorio y barra superior en móvil. El menú ampliado contiene perfil, CV, desplegable de proyectos y contacto. Los enlaces del menú se rellenan de izquierda a derecha al pasar el cursor o recibir foco; logo, menú, contacto y descarga del CV tienen estados de interacción propios. Incluye cierre con Escape, devolución del foco y navegación con teclado.
- **Preloader:** entrada del monograma `af.` y salida mediante cinco franjas animadas. Espera a las fuentes y a la preparación de la escena; contempla una entrada mínima de 1.9 segundos y un límite de carga de 12 segundos. No muestra porcentajes simulados ni exige pulsar un botón.
- **Hero:** el sello «PORTAFOLIO 2026» aumenta de tamaño y recibe un acento gráfico rojo. Una textura animada de ruido y líneas analógicas aparece exclusivamente en el hero, se detiene cuando este sale de pantalla y queda estática con movimiento reducido.
- **Recorrido inicial:** la laptop de Blender se abre, los objetos del escritorio se separan y la composición cambia de lado con el scroll. Los capítulos describen UX/UI, desarrollo web y productos digitales. Después del tercer capítulo, la laptop se coloca de frente y la cámara se acerca hasta que su pantalla llena el ancho de la vista, dando paso al perfil sobre fondo marfil. Esta transición se acorta si el usuario prefiere movimiento reducido o falla la escena.
- **Texto y transiciones:** GSAP SplitText revela líneas de títulos; ScrollTrigger coordina las franjas entre secciones y el trazado de la trayectoria. Lenis suaviza el desplazamiento.
- **Trayectoria:** una cinta de mayor tamaño forma tres bucles y cruces entre las experiencias, con más espacio entre entradas. El recorrido y las tarjetas no proyectan sombras. Años y tarjetas tienen movimientos vinculados al scroll; en móvil la lectura se organiza en una columna.
- **Proyectos web freelancer:** en escritorio amplio, la información de la columna izquierda avanza verticalmente mientras la laptop permanece fija a la derecha. Cambia la captura dentro de su pantalla y se conserva la última textura disponible mientras carga la siguiente. Los botones numerados y el menú permiten seleccionar el proyecto; las barras de progreso tienen más grosor. Si la escena no está disponible, se muestra la captura correspondiente en la columna visual. En pantallas pequeñas, vistas de poca altura o con movimiento reducido se usa una lista vertical para mantener todo el contenido accesible.
- **Contacto:** correo directo, formulario preparado para Web3Forms y cierre con la laptop 3D. El modo oscuro es la presentación principal; perfil y trayectoria usan un fondo marfil.

### Tipografía responsive

`src/refinements.css` centraliza el espaciado entre caracteres y el interlineado. El cuerpo parte de 16 px; los títulos ajustan su tamaño con `clamp()` y reglas por ancho de pantalla.

| Ancho de la vista | Espaciado de títulos | Interlineado de títulos | Espaciado del cuerpo | Interlineado del cuerpo |
| --- | --- | --- | --- | --- |
| Más de 1100 px | 1.5 px | 120% | 1.5 px | 140% |
| 801–1100 px | 1 px | 120% | 1 px | 145% |
| 561–800 px | 0.8 px | 120% | 0.6 px | 145% |
| Hasta 560 px | 0.6 px | 120% | 0.35 px | 150% |

Los iconos, el monograma y las cifras decorativas conservan las métricas propias de su composición. `src/timeline.css` controla las dimensiones y el espacio del recorrido profesional.

### Máscara fotográfica WebGL

`src/portrait.ts` y `src/portrait.css` añaden una lente orgánica sobre la fotografía: revela color y aplica una refracción local suave al mover el cursor. Es un shader WebGL nativo, sin dependencia adicional. No contiene caracteres ASCII ni botones para alternar modos.

La fotografía HTML permanece debajo del canvas decorativo y conserva su texto alternativo. El efecto responde al contacto táctil sin impedir el scroll. Limita el DPR a 1.5, solo anima durante interacción y amortiguación, se detiene fuera de pantalla o con la pestaña oculta y deja la imagen estática con `prefers-reduced-motion`. Si WebGL o la textura fallan, permanece la fotografía original.

El retrato actual sigue siendo una foto de stock, identificada en la página. Para sustituirlo, cambiar `public/images/portrait.webp`, su texto alternativo y el crédito en `index.html`.

## Información profesional

El contenido se basa en el CV anterior proporcionado por Alexis y en sus indicaciones posteriores. Su nombre completo es **Félix Alexis Flores Rojas**. El documento confirma **Grupo Invictus**, corrigiendo la transcripción anterior del nombre de la empresa.

| Empresa | Periodo | Puesto |
| --- | --- | --- |
| T-Line México | 2023–2026 | Profesional de UX/UI y desarrollador front-end |
| Grupo Invictus | Marzo de 2023–abril de 2024 | Diseñador web y diseñador UX/UI |
| Fundación ADO | Junio de 2022–marzo de 2023 | Diseñador gráfico |
| Mobility ADO | Noviembre de 2019–noviembre de 2020 | Auxiliar administrativo |

La trayectoria de la web destaca los tres puestos de diseño; el PDF incluye también Mobility ADO. Las fechas de T-Line siguen la actualización expresada por Alexis. Se conservan los periodos indicados por las fuentes, aunque se superpongan.

**Formación:** Diseño Gráfico y Animación Digital en la Universidad Autónoma de Tamaulipas, 2021–2024; certificación profesional de Diseño UX de Google / Coursera, 2022–2023. El PDF incluye también cursos de Udemy y Platzi documentados en el CV.

Las funciones descritas incluyen sitios responsive en WordPress, HTML/CSS/JavaScript, prototipos y flujos en Figma, pruebas de usabilidad, interfaces para Odoo, dashboards, SEO, accesibilidad y comunicación visual. Las competencias reúnen lo documentado y las herramientas confirmadas por Alexis: Figma, FigJam, Miro, Maze, GitHub, WordPress, Elementor, Framer, Webflow, Shopify, Odoo, Blender, Adobe, Rive, Lottie y desarrollo asistido por IA.

## Proyectos web freelancer

La selección muestra capturas reales y enlaces a los sitios:

| Proyecto | Sitio | Captura |
| --- | --- | --- |
| Curiosity Marketplace | [marketplace.curiositycloud.com](https://marketplace.curiositycloud.com/) | `public/images/cases/curiosity.webp` |
| Macloud Seguridad Privada | [seguridadmacloud.com.mx](https://seguridadmacloud.com.mx/) | `public/images/cases/macloud.webp` |
| Gatical Seguridad Privada | [gaticalseguridadprivada.framer.website](https://gaticalseguridadprivada.framer.website/) | `public/images/cases/gatical.webp` |

Las descripciones explican el contenido visible de los sitios y su reto de diseño. La contribución individual, el equipo y los resultados de cada proyecto necesitan documentación adicional; no se atribuyen métricas ni responsabilidades concretas sin confirmar.

**Asesoría y Gestoría Gómez** figura como caso en preparación. El enlace recibido devolvió HTTP 404 durante la revisión anterior; no se ha supuesto su contenido.

## CV descargable

El PDF A4 de una página está en `public/documents/Alexis-Flores-CV.pdf`. Incluye nombre completo, contacto, experiencia, formación, competencias y enlaces profesionales. Usa texto seleccionable y una columna de lectura.

```sh
npm ci
python -m pip install reportlab fonttools brotli
python scripts/create_cv.py
```

El generador `scripts/create_cv.py` utiliza Yantramanav desde la dependencia de npm. Crea `output/pdf/Alexis-Flores-CV.pdf` y una copia idéntica en `public/documents/`. Al modificar la trayectoria, mantener sincronizados el generador y `index.html`, regenerar el PDF y revisar su render antes de publicar. El CV fuente permanece fuera del repositorio.

## Contacto y Web3Forms

El correo directo es **alexisfr.14@outlook.com**. El formulario tiene nombre, correo, empresa opcional, motivo y mensaje. Su configuración está en `src/contact.ts`:

```ts
export const contactConfig = { accessKey: '' };
```

**Pendiente: la access key de Web3Forms.** Mientras esté vacía, el envío permanece deshabilitado y el usuario puede escribir por correo. No se han enviado mensajes de prueba a destinatarios reales.

Para activarlo, colocar la clave pública de Web3Forms vinculada al correo del propietario, compilar y publicar. La clave identifica el formulario del navegador; no debe sustituirse por una credencial privada de otro servicio. Véase la [documentación oficial de Web3Forms](https://docs.web3forms.com/how-to-guides/html-and-javascript).

El controlador usa `fetch` con JSON a `https://api.web3forms.com/submit`, permitido en la CSP. Incluye validación nativa, control de campos vacíos, límites de longitud, honeypot, bloqueo de envíos simultáneos, mensajes accesibles y timeout de 15 segundos. Conserva los campos ante fallos y los limpia solo después de una confirmación de éxito de la API. Una vez configurado, los datos se transmiten a Web3Forms para entregar el mensaje; GitHub Pages continúa sirviendo un sitio estático.

## Blender, Three.js e iluminación

Fuentes: `assets-source/v2/workstation-v2.blend` y `assets-source/v2/create_workstation.py`. Modelo publicado: `public/models/workstation-v2.glb`. Póster: `public/images/workstation-v2.webp`. El estudio contiene laptop articulada, teclado, trackpad, rejillas, puertos, escritorio, café, libreta, bolígrafo y objeto acrílico rojo.

El GLB pesa aproximadamente 1.49 MB y contiene 47 meshes y 36,894 triángulos, con texturas de color y rugosidad empaquetadas. Se carga directamente, sin decodificador Draco. El póster procede de un render de Blender y queda disponible si la escena no carga. Las fuentes editables permanecen fuera de `dist/`.

La iluminación utiliza tonos neutros: se retiró la luz roja tanto de Three.js como de la fuente Blender y su póster. Los materiales rojos del escritorio siguen siendo parte de la paleta del objeto.

Un único renderer de Three.js se desplaza entre el recorrido inicial, la galería y el footer. La cámara añade un acercamiento frontal al final del recorrido inicial. En la galería, la pose de la laptop permanece fija; las capturas se cargan como texturas de pantalla y la última disponible se mantiene visible durante los cambios. Los capítulos iniciales utilizan composiciones originales en `CanvasTexture`; no descargan videos.

Los reflejos proceden de un entorno PMREM precalculado de Three.js: `public/models/studio-environment.pmrem`, 265,087 bytes comprimidos con gzip. El atlas mide 384 × 512 píxeles, RGBA Float16 little endian. La web lo carga mediante `DecompressionStream` y `DataTexture`, evitando generar PMREM al entrar.

Para regenerar el entorno, iniciar Vite, abrir `/scripts/bake-environment.html` y descargar el atlas generado. Más detalles de materiales y reconstrucción en `assets-source/v2/README.md`.

## Verificación

```sh
npm run build
node scripts/test-contact.mjs
npm audit --omit=dev
```

Las pruebas de contacto usan DOM y red simulados; no envían mensajes. `QA.md` registra la revisión visual y las mediciones de la compilación correspondiente. Los resultados de versiones previas no describen automáticamente esta versión.

Revisar especialmente menú y foco, navegación a cada proyecto, galerías en tamaños pequeños, contraste, preferencia de movimiento reducido, fallos del modelo, PDF y estados del formulario. Los canvas son decorativos y el contenido profesional permanece en HTML. Las auditorías automáticas no equivalen a una certificación WCAG.

## SEO y seguridad

HTML semántico en español, título y descripción profesionales, canonical, Open Graph, schema.org Person/ProfilePage/WebSite, sitemap y robots. Facilitan la interpretación por buscadores y asistentes; no garantizan posiciones ni menciones.

GitHub Pages sirve HTTPS. Las fuentes y medios se alojan localmente, se utiliza Content Security Policy y no se construye HTML desde entradas del usuario. El workflow tiene permisos acotados y las dependencias cuentan con lockfile. El formulario configurado utiliza Web3Forms como servicio externo. Una CSP en meta no puede sustituir encabezados HTTP como `frame-ancestors`; la seguridad de la cuenta y el repositorio depende también de sus controles de acceso.

## Referencias y derechos

Referencias consultadas para composición, navegación y movimiento:

- [MindMarket](https://mindmarket.com/) y su [ficha en Awwwards](https://www.awwwards.com/sites/mindmarket): ritmo de la trayectoria y curvas vinculadas al scroll.
- [Ivor J](https://www.ivorjian.com/) y su [ficha en CSS Design Awards](https://www.cssdesignawards.com/sites/ivor-j-designer-developer/47762/): presentación de un perfil de diseño y desarrollo.
- [Dennis Snellenberg](https://dennissnellenberg.com/) y su [ficha en Awwwards](https://www.awwwards.com/sites/dennis-snellenberg): tipografía, navegación y exposición de proyectos.
- Repositorios consultados con licencia MIT: [kbtale/portfolio](https://github.com/kbtale/portfolio/blob/main/LICENSE), [Codrops OnScrollLayoutFormations](https://github.com/codrops/OnScrollLayoutFormations/blob/main/LICENSE) y [Codrops ScrollBasedLayoutAnimations](https://github.com/codrops/ScrollBasedLayoutAnimations/blob/main/LICENSE).

Estas referencias orientan decisiones visuales. **No se ha copiado su código, contenido ni modelos.** Su publicación pública no concede por sí sola permiso para reutilizar cualquier recurso incluido.

Referencias iniciales: [Vizcom](https://vizcom.com/), [SKF](https://www.skf.com/group/fighting-friction/01), [Dropbox × McLaren](https://dash.dropbox.com/mclarenf1), [Ponpon Mania](https://ponpon-mania.com/about#support), [Oryzo](https://oryzo.ai/) y [BreachBunny](https://www.breachbunny.com/).

- Yantramanav: Google Fonts / SIL Open Font License, distribuida con `@fontsource/yantramanav`.
- Material Symbols Rounded: Google / Apache 2.0; subconjunto local.
- Fotografía provisional: [Joseph Gonzalez / Unsplash](https://unsplash.com/es/fotos/hombre-con-camisa-blanca-con-cuello-en-v-iFgRcqHznqg), [licencia](https://unsplash.com/es/licencia).
- Escena Blender, texturas del estudio, shader del retrato y composiciones de pantalla: creados para este portafolio.
- Las capturas de los proyectos reproducen los sitios enlazados. Sus marcas, imágenes, diseños y contenido conservan los derechos de sus titulares; no se les asigna una licencia nueva.

## Publicación

En GitHub → Settings → Pages, seleccionar **GitHub Actions**. `.github/workflows/pages.yml` publica `dist/` al recibir cambios en `main`. Las rutas relativas permiten alojar la web dentro del subdirectorio del repositorio.
