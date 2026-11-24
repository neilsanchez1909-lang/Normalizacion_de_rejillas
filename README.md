# Normalización de rejilla — GitHub Pages

Formulario en español para registrar intervenciones de rejilla en SED.
El sitio se publica desde **docs/**. No necesita instalar dependencias ni compilar para mostrar el formulario.

## Publicar en GitHub Pages

1. Extrae el ZIP y crea un repositorio en tu cuenta de GitHub.
2. Sube **el contenido de esta carpeta** a la raíz del repositorio. Deben verse las carpetas `docs`, `worker` y `scripts`, junto con este README. No subas únicamente el ZIP ni una carpeta adicional que las envuelva.
3. En el repositorio, abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama donde subiste los archivos (normalmente `main`) y la carpeta **`/docs`**. Presiona **Save**.
6. Espera a que termine la publicación y abre el enlace mostrado en Pages, con formato `https://TU-USUARIO.github.io/TU-REPOSITORIO/`.

La disponibilidad de Pages en repositorios privados depende de tu plan. El sitio y el catálogo publicado deben considerarse visibles a quienes tengan acceso a Pages. Esta copia no incluye credenciales ni fotos de intervenciones.

Referencia: [configurar la publicación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Dónde modificar

| Cambio | Archivo |
| --- | --- |
| Logo, Retiro, Clasificación y URL del intermediario | `docs/config.js` |
| Textos y título | `docs/index.html` |
| Colores y tamaños | `docs/style.css` |
| SED y alimentadores | `docs/catalog.json` |

Para cambiar el logo:

1. Guarda tu imagen como `docs/assets/logo.png`.
2. En `docs/config.js`, cambia `logoUrl: ''` por `logoUrl: './assets/logo.png'`.
3. Sube o confirma ambos cambios en GitHub. Pages publicará la actualización automáticamente.

Si la imagen es JPG, usa `.jpg` tanto en el nombre del archivo como en la configuración. Los nombres distinguen mayúsculas y minúsculas. No es necesario compilar para actualizar el formulario.

## Vista previa en tu computadora

Requiere Node.js 22.9 o posterior:

```bash
npm start
```

Abre `http://localhost:4174/normalizacion-rejilla/`. No abras `index.html` haciendo doble clic: se cargan módulos y un archivo JSON mediante HTTP.

## Conexión con Power Automate

GitHub Pages solo aloja la interfaz. El envío usa el intermediario de `worker/`, que se despliega por separado en Cloudflare Workers y mantiene la URL firmada de Power Automate como secreto.

**El formulario se puede publicar ahora; el guardado real requiere configurar ese intermediario y el flujo.** El servicio anterior de Sites sigue privado y no se reutiliza como API pública.

1. Prepara el flujo por etapas siguiendo `GUIA-POWER-AUTOMATE.txt`: `iniciar`, una llamada `foto` por imagen, y `finalizar`.
2. En esta carpeta ejecuta `npm run build` para generar `dist/server/index.js`.
3. Edita `ALLOWED_ORIGINS` en `wrangler.toml`: usa `https://TU-USUARIO.github.io`, **sin el nombre del repositorio ni barra final**. Para un dominio propio, usa su origen exacto. Para probar localmente, agrega `http://localhost:4174` separado por coma.
4. Con tu cuenta de Cloudflare, instala/ejecuta Wrangler desde el paquete oficial, inicia sesión y despliega:

```bash
npx wrangler login
npx wrangler deploy
npx wrangler secret put POWER_AUTOMATE_URL
npx wrangler secret put API_ACCESS_KEY
```

Cada comando `secret put` pedirá el valor: pega la URL del flujo o una clave larga que tú elijas, según corresponda. No guardes estos valores en GitHub, `docs/config.js` ni `wrangler.toml`.

5. Copia la URL pública del Worker a `apiBaseUrl` en `docs/config.js`, por ejemplo:

```js
apiBaseUrl: 'https://normalizacion-rejilla-api.TU-SUBDOMINIO.workers.dev',
```

6. Sube ese cambio a GitHub. Al confirmar cada registro, el formulario pedirá la **clave de conexión** definida en `API_ACCESS_KEY`; se mantiene solo durante el envío y se borra del campo al terminar. No es la contraseña de Microsoft.

El intermediario comprueba tanto el origen permitido como la clave. CORS por sí solo no autentica a los usuarios. Esta clave compartida es una protección básica; si necesitas identidad individual, revocación por técnico o auditoría de acceso, incorpora autenticación de la organización antes de ese uso.

Para un flujo que requiera OAuth se admite `POWER_AUTOMATE_BEARER_TOKEN` como secreto adicional, pero debes implementar la renovación externa del token. La URL por sí sola funciona únicamente con el método de autorización que tenga configurado tu flujo. Comprueba las licencias y políticas de tu organización.

Referencia: [secretos de Cloudflare Workers](https://developers.cloudflare.com/workers/configuration/secrets/).

## Catálogo y límites

- Origen: `Base de SED.xlsx`, hoja `Base de SED`, columnas SED y ALIMENTADOR.
- 1.053 SED utilizables. Los ceros y sufijos se conservan.
- SED **01214S** excluida: tiene alimentadores VM30 y VM35. Corrige la relación antes de incorporarla.
- Entre 1 y 10 fotos JPEG o PNG, hasta 10 MiB por foto. Se envían una por una.
- No se borra el formulario hasta confirmar todos los adjuntos.
- Los borradores se conservan en la página abierta; no sobreviven al cierre o recarga.
- La prevención de duplicados requiere también implementar el contrato del flujo.

## Verificación

```bash
npm test
npm run build
```

Las pruebas cubren validación, catálogo, fecha de Lima, límites, respuestas parciales, reintentos, rutas para repositorios, CORS y clave del intermediario. El envío real a SharePoint necesita la configuración de tu entorno.

Si modificas opciones o catálogo, actualiza también el Worker (`npm run build` y `npx wrangler deploy`) para mantener iguales la validación del navegador y la del servidor.
