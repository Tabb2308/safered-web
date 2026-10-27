# SafeRed

### 👉 [Ver la página en vivo: tabb2308.github.io/safered-web](https://tabb2308.github.io/safered-web/)

Landing page de **SafeRed**: gasfitería e instalaciones de redes de gas y agua en la Región Metropolitana, con Instalador Certificado SEC.

Sitio estático, sin dependencias ni proceso de compilación. Pensado primero para celular.

## Estructura

```
index.html          Contenido de la página
css/styles.css      Estilos
js/app.js           Comportamiento (mapa, buscador, formulario, avisos)
js/comunas.js       Límites simplificados de las 52 comunas de la RM
sw.js               Modo sin señal (guarda la página en el teléfono)
fonts/              Tipografía Archivo propia (subconjunto latino) + licencia OFL
img/                Fotos de trabajos (WebP, sin metadatos GPS)
img/icons/          Íconos Tabler propios
img/logo/           Kit de marca: logos SVG (texto en curvas), sello e íconos
404.html            Página de error propia
site.webmanifest    Permite instalar la página como app
robots.txt, sitemap.xml
vercel.json         Encabezados de seguridad (si se publica en Vercel)
```

## Seguridad y privacidad

- **Sin recursos de terceros:** tipografía, íconos y datos se sirven desde el mismo sitio. No hay cookies, analítica ni publicidad.
- **Content Security Policy:** solo se ejecuta código propio. El único script en línea (`document.documentElement.className+=" js"`) está autorizado por su huella SHA-256; si se modifica, hay que recalcular el hash en `index.html` y `vercel.json`.
- **Formulario:** no envía datos a ningún servidor; limpia y acota el texto y abre WhatsApp con el mensaje.
- **Ubicación:** se procesa solo en el teléfono del visitante para saber su comuna.
- **Enlaces externos** con `rel="noopener noreferrer"`.
- **En Vercel**, `vercel.json` agrega HSTS, `X-Frame-Options`, `Permissions-Policy` y protección contra incrustación (`frame-ancestors`). GitHub Pages no permite encabezados propios; ahí rige la política declarada en `index.html`.

## Ver en local

Abre `index.html` con doble clic, o levanta un servidor simple:

```bash
python -m http.server 8000
```

y entra a http://localhost:8000 (el modo sin señal solo se activa en el sitio publicado con HTTPS).

## Datos a mantener

- **Teléfono / WhatsApp:** constante `PHONE` al inicio de `js/app.js` (y los `href` de respaldo en `index.html` y `404.html`).
- **Licencia SEC:** el enlace "Verificar en la SEC" apunta a la ficha pública del instalador. La licencia vence el **26/12/2026**: renovarla antes.
- **Al cambiar CSS o JS:** sube el número de versión en `index.html` (`styles.css?v=…`, `app.js?v=…`) para que los visitantes reciban la versión nueva.
- **Si se cambia de dominio:** actualiza las URL completas en `index.html` (canonical, Open Graph, datos de Google), `404.html`, `robots.txt` y `sitemap.xml`.
- **Colores de marca:** azul marino `#0A2A57`, azul `#0B5BD3`, naranjo `#EA5A12`, celeste `#12A8DC`.

## Créditos

- Tipografía: [Archivo](https://fonts.google.com/specimen/Archivo) (SIL Open Font License, ver `fonts/OFL.txt`).
- Íconos: [Tabler Icons](https://tabler.io/icons) (MIT).
- Límites comunales de la Región Metropolitana: [caracena/chile-geojson](https://github.com/caracena/chile-geojson), simplificados.
