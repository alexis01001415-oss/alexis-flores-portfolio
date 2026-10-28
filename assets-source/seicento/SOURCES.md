# SEICENTO — recursos de producto 3D

Derivados preparados el 27 de octubre de 2026 para el portafolio, a partir de los proyectos locales de Alexis en `C:/Users/alexi/Desktop/Blender GPT/Seicento_Makeup_School`.

## Estuche Silky Pro Palette

- Fuente de modelado y animación: `Web_Scroll/blend/Seicento_Web_Scroll_v007.blend`.
- Fuente de imágenes: `Web_Scroll/renders/v007_eevee_web_1440_png/seicento_web_0001.png` a `seicento_web_0120.png`.
- Los 120 originales son renders Eevee con alpha de 1440 × 810. Se seleccionaron 90 fotogramas uniformes conservando inicio y final; se exportaron a WebP RGBA de 1280 × 720, calidad 82.
- Recorrido: apertura frontal, vista del espejo, giro de cámara a los 35 tonos, cierre del estuche y entrada de dos brochas. Los originales contienen la marca, las texturas, los relieves y la imagen del espejo del proyecto previo.
- `case-poster.webp` procede del fotograma 63 (vista de los tonos), calidad 90.

## Cristal Rubí

Concepto ficticio de aceite labial de SEICENTO, modelado para fotografía de producto. No representa un producto comercial lanzado.

- Fuente: `Lip_Oil_Cristal/blend/Seicento_Cristal_Rubi_Premium_Alpha_v009.blend`.
- Escenas 01–03: arquitectura de estudio, luz rasante y detalle de fluido/aplicador. Son composiciones estáticas originales, no una animación de giro.
- Se renderizaron nuevamente en un proceso Blender 5.1 independiente: Cycles GPU OptiX, 128 muestras máximas, muestreo adaptativo 0.015 y denoise, 720 × 1280. Se conservaron modelos, materiales, cámaras, iluminación y compositor de las escenas fuente. No se guardaron cambios en el archivo `.blend` original.
- Salida web: `rubi-architecture.webp`, `rubi-light.webp` y `rubi-texture.webp`, calidad 88. `rubi-poster.webp` es una copia de la primera composición.
- Recurso adicional `rubi-open.webp`: derivado del recorte aprobado `previews_v009_premium/06_Premium_Alpha.png`, 540 × 960 con transparencia.
- El vidrio, el líquido, los relieves del envase, los acabados metálicos y las fibras del aplicador proceden del modelado original. No se utilizó generación de imágenes para estos recursos.

## Reproducción

`render_portfolio_stills.py` se ejecuta en Blender en segundo plano sobre una copia abierta en memoria del archivo v009. Escribe únicamente renders dentro de esta carpeta; no modifica la escena original en disco. `prepare_assets.py` convierte esos renders y la secuencia existente a los archivos de `public/images/seicento/`.

Las vistas de prueba `*-contact.jpg` y los PNG de `renders/` son recursos de revisión, no son necesarios para publicar el sitio.
