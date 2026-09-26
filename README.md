# Alexis Flores — Portafolio

Portafolio estático con escena original de Blender, Three.js y GSAP. Preparado para GitHub Pages. No requiere backend, servicios 3D embebidos ni claves privadas.

## Desarrollo

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Node.js 22 o posterior. La compilación incluye TypeScript, empaquetado Vite, metadatos, datos estructurados, sitemap y página 404. `SITE_URL` permite establecer la URL pública de GitHub Pages; el workflow la calcula desde el repositorio.

## Personalizar

- **Paleta:** variables al inicio de `src/style.css`; carbón, marfil y lima son provisionales porque la imagen de referencia no llegó.
- **Contacto y proyectos:** `src/content.ts`. El correo está vacío intencionalmente; el contacto ofrece el perfil público de GitHub mientras se confirma.
- **Texto y trayectoria:** `index.html`. No se han inventado años, empresas, estudios, clientes ni resultados. Forma, Pulso y Órbita son conceptos de demostración.
- **Retrato:** reemplazar `public/images/portrait.webp`, actualizar el texto alternativo y quitar el crédito de fotografía temporal cuando corresponda.
- **3D:** `assets-source/studio.blend` y `assets-source/create_studio.py`. La escena web es `public/models/studio.glb`; el póster es `public/images/studio-poster.webp`.

## Interacción y accesibilidad

Header que responde a dirección de scroll, navegación móvil, tema persistente, enlaces internos, diálogo nativo con retorno del foco, tabs con flechas/Home/End, control para pausar animaciones y respeto de `prefers-reduced-motion`. El texto principal existe en HTML y se puede leer sin JavaScript. La escena 3D tiene póster alternativo, límite de resolución y 30 fps; se suspende fuera de pantalla. En ahorro de datos y movimiento reducido se activa solo por petición.

La animación del gato se realiza mediante pivotes originales de Blender y GSAP: abre los ojos, se estira, salta al escritorio, camina y vuelve a su silla. El escritorio y el gato del footer comparten el archivo fuente. El modelo compacto evita añadir un decodificador Draco: GLB de aproximadamente 1.29 MB, 46 meshes y sin texturas externas. El render de Blender aparece inmediatamente; WebGL se activa al explorar el estudio con el cursor o su botón, y al acercarse al footer. Esto mantiene ligera la primera visita, especialmente en móvil.

## SEO y seguridad

HTML semántico en español, título y descripción, canonical, Open Graph, schema.org Person/ProfilePage/WebSite, sitemap y robots. La estructura facilita la lectura por buscadores y asistentes, pero no garantiza posiciones en Google ni menciones en respuestas de IA. Los proyectos ficticios no se presentan como clientes reales en datos estructurados.

HTTPS de GitHub Pages, recursos servidos desde el mismo origen, Content Security Policy, sin formularios que recojan datos, sin evaluaciones dinámicas ni HTML construido desde entradas del usuario, permisos mínimos del workflow y lockfile. GitHub Pages no permite personalizar encabezados HTTP como `frame-ancestors`; la CSP de tipo meta no sustituye esos encabezados. La protección de la cuenta y repositorio depende de su configuración (2FA y acceso).

## Fuentes y licencias

- Yantramanav: Google Fonts / SIL Open Font License (distribuida con `@fontsource/yantramanav`).
- Material Symbols Rounded: Google / Apache 2.0. Subconjunto alojado localmente.
- Fotografía provisional: [Joseph Gonzalez / Unsplash](https://unsplash.com/es/fotos/hombre-con-camisa-blanca-con-cuello-en-v-iFgRcqHznqg), [licencia](https://unsplash.com/es/licencia).
- Escena, modelos y composiciones de proyectos: originales de este portafolio.

Inspiración visual: [Vizcom](https://vizcom.com/), [SKF](https://www.skf.com/group/fighting-friction/01), [Dropbox × McLaren](https://dash.dropbox.com/mclarenf1), [Ponpon Mania](https://ponpon-mania.com/about#support), [Oryzo](https://oryzo.ai/) y [BreachBunny](https://www.breachbunny.com/). No se reutilizó su código ni sus modelos.

## Publicación

En GitHub → Settings → Pages, seleccionar **GitHub Actions**. El workflow `.github/workflows/pages.yml` publica `dist/` con cada cambio en `main`. Las rutas relativas permiten desplegar dentro de un subdirectorio sin romper fuentes, imágenes o GLB. Los originales de Blender están versionados, pero no se incluyen en el sitio publicado.
