# Estadísticas del portafolio

El indicador del hero muestra las visitas de los últimos **7 días**, **30 días** y el **total** registrado por GoatCounter. Está oculto visualmente hasta seleccionar la página con **Ctrl+A** (Cmd+A en macOS). También puede mostrarse abriendo el portafolio con `?estadisticas=ver`, útil en el móvil.

La integración queda desactivada mientras `VITE_GOATCOUNTER_SITE` esté vacío. No muestra cifras inventadas ni cuenta visitas antes de conectar una cuenta real. Las visitas anteriores a la activación no se pueden recuperar.

## Activar el servicio

1. Crear una cuenta en [GoatCounter](https://www.goatcounter.com/signup). No hace falta compartir la contraseña ni un token API con el portafolio.
2. Configurar el dominio del sitio como `https://alexis01001415-oss.github.io/alexis-flores-portfolio/`.
3. Habilitar **Allow adding visitor counts on your website** en la configuración del sitio. El panel completo puede permanecer privado; esta opción publica únicamente los contadores consultables.
4. Mantener activada la opción **Sessions** en la recopilación de datos para agrupar recargas de una misma visita. Las cifras son visitas estimadas por el servicio, no personas únicas identificadas permanentemente.
5. En el repositorio de GitHub, ir a **Settings → Secrets and variables → Actions → Variables**, y crear la variable de repositorio `VITE_GOATCOUNTER_SITE` con el código del sitio. Si el panel es `https://mi-codigo.goatcounter.com`, el valor es únicamente `mi-codigo`.
6. Ejecutar de nuevo el workflow **Deploy portfolio to GitHub Pages**. El valor se incorpora al compilar; cambiar la variable sin desplegar de nuevo no activa la integración publicada.

Para compilar localmente, copiar `.env.example` a `.env.local` y completar el mismo código. `.env.local` está ignorado por Git. Las vistas locales y las vistas fuera de la dirección de producción no se registran.

El código del sitio es público, no una credencial. La configuración de compilación solo admite letras minúsculas, números y guiones. Cuando existe un código válido, Vite añade a la política CSP el script oficial `https://gc.zgo.at` y el origen exacto `https://CODIGO.goatcounter.com` para consultas y el transporte de visitas. Sin configuración no se habilitan estos orígenes. No hay comodines de dominio ni claves privadas en el navegador.

## Excluir tus visitas

Abrir una vez en **cada navegador y dispositivo** que utilices:

[Excluir este navegador](https://alexis01001415-oss.github.io/alexis-flores-portfolio/?visitas=excluir)

La preferencia se guarda localmente antes de cargar el contador. Abrir de nuevo ese enlace mantiene la exclusión; no la alterna. No es necesario conservar el parámetro en los enlaces que compartas. Borrar los datos del sitio, utilizar otro perfil de navegador o abrir una ventana privada requiere repetirlo. Si el navegador impide guardar la preferencia, la exclusión solo podrá mantenerse durante esa visita y se indicará en pantalla.

Para volver a registrar ese navegador, abrir [volver a contar](https://alexis01001415-oss.github.io/alexis-flores-portfolio/?visitas=incluir).

Si también se activó la exclusión general del propio GoatCounter (`skipgc`), se respeta y se oculta el control de reactivación del portafolio. Esa preferencia general debe gestionarse con los controles del proveedor para no cambiar la exclusión de otros sitios del mismo origen.

También se puede excluir una IP pública desde **Settings → Tracking → Ignore IPs** en GoatCounter. Esta opción evita contar cualquier dispositivo que salga por esa conexión, incluyendo a otras personas que compartan la misma IP. Si el proveedor cambia tu IP, habrá que actualizar el filtro. La exclusión por navegador continúa funcionando aunque cambies de red. No hay que publicar tu IP en el código del portafolio.

## Cómo se muestran las cifras

Se consultan tres endpoints públicos y sin autenticación:

```text
https://CODIGO.goatcounter.com/counter/%2Falexis-flores-portfolio%2F.json?start=week
https://CODIGO.goatcounter.com/counter/%2Falexis-flores-portfolio%2F.json?start=month
https://CODIGO.goatcounter.com/counter/%2Falexis-flores-portfolio%2F.json
```

La ruta canónica codificada limita las cifras a la página del portafolio, sin sumar eventos u otras páginas. El frontend respeta las señales **Do Not Track (DNT)** y **Global Privacy Control (GPC)**: si están activadas, no registra la visita. No envía parámetros de consulta, anclas ni la URL completa de procedencia. Hacer scroll, cambiar de sección o abrir el menú no genera visitas adicionales.

El servicio devuelve el campo `count` ya formateado. El contador público puede tardar **hasta cuatro horas** en actualizarse; no es una medición en tiempo real. `week` corresponde a siete días y `month` a treinta. El panel privado ofrece un desglose más detallado y filtros por fecha. Las estadísticas pueden omitir visitas si el visitante utiliza un bloqueador o solicita no ser rastreado.

Ocultarlo con Ctrl+A es únicamente una decisión visual: cualquier visitante puede seleccionar el indicador o consultar esos endpoints. El enlace `?estadisticas=ver` tampoco autentica al propietario. No se deben colocar datos privados en este indicador. Para estadísticas reservadas al propietario, consultar el panel de GoatCounter con su inicio de sesión.

## Referencias oficiales

- [Contadores públicos y su caché](https://www.goatcounter.com/help/visitor-counter)
- [Exclusión de visitas propias](https://www.goatcounter.com/help/skip-dev)
- [Sesiones y visitas](https://www.goatcounter.com/help/sessions)
- [Política de privacidad del servicio](https://www.goatcounter.com/help/privacy)
