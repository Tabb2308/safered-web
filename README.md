# SafeRed

### 👉 [Ver la página en vivo: tabb2308.github.io/safered-web](https://tabb2308.github.io/safered-web/)

Landing page de **SafeRed**: gasfitería e instalaciones de redes de gas y agua en la Región Metropolitana, con Instalador Certificado SEC.

Sitio estático en un solo archivo (`index.html`), sin dependencias ni proceso de compilación. Pensado primero para celular.

## Estructura

```
index.html        Página completa (HTML, CSS y JS en línea)
img/              Fotos de trabajos (WebP optimizado, sin metadatos GPS)
img/logo/         Kit de marca: logos SVG (texto en curvas), sello e íconos
```

## Ver en local

Abre `index.html` en el navegador, o levanta un servidor simple para que carguen las imágenes:

```bash
python -m http.server 8000
```

y entra a http://localhost:8000

## Datos a mantener

- **Teléfono / WhatsApp:** constante `PHONE` al final de `index.html`.
- **Licencia SEC:** el enlace "Verificar en la SEC" apunta a la ficha pública del instalador. La licencia vence el **26/12/2026**: renovarla antes.
- **Colores de marca:** azul marino `#0A2A57`, azul `#0B5BD3`, naranjo `#EA5A12`, celeste `#12A8DC`.

## Créditos

- Tipografía: [Archivo](https://fonts.google.com/specimen/Archivo) (SIL Open Font License).
- Íconos: [Tabler Icons](https://tabler.io/icons) (MIT).
- Límites comunales de la Región Metropolitana: [caracena/chile-geojson](https://github.com/caracena/chile-geojson), simplificados.
