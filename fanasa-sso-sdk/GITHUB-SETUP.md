# Publicar @fanasa/sso en GitHub Packages

Guía paso a paso para publicar el SDK y que cualquier proyecto lo instale con `npm install @fanasa/sso`.

---

## 1. Crear el repositorio en GitHub

1. Ve a **github.com** → tu organización (ej: `github.com/Fanasa`)
2. **New repository**
3. Nombre: `fanasa-sso-sdk`
4. Visibilidad: **Private**
5. No agregar README ni .gitignore (ya los tenemos)
6. **Create repository**

---

## 2. Subir el código

En tu terminal, dentro de la carpeta `fanasa-sso-sdk`:

```bash
git init
git add .
git commit -m "feat: SDK inicial @fanasa/sso"
git remote add origin https://github.com/TU-ORG/fanasa-sso-sdk.git
git branch -M main
git push -u origin main
```

---

## 3. Actualizar `package.json` con el nombre de tu organización GitHub

El `name` del paquete debe coincidir con tu organización en GitHub:

```json
{
  "name": "@fanasa/sso",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

> Si tu organización en GitHub se llama distinto a `fanasa`, cambia `@fanasa` por `@nombre-de-tu-org`.

---

## 4. Generar un token de acceso en GitHub (quien publica)

1. GitHub → **Settings** → **Developer settings**
2. **Personal access tokens** → **Tokens (classic)** → **Generate new token**
3. Seleccionar permisos:
   - ✅ `write:packages` — para publicar
   - ✅ `read:packages`  — para instalar
   - ✅ `repo`           — acceso al repo privado
4. **Generate token** → copiar el token (solo se muestra una vez)

---

## 5. Autenticarse en el registry (quien publica)

```bash
npm login --registry=https://npm.pkg.github.com --scope=@fanasa
```

- **Username:** tu usuario de GitHub
- **Password:** el token generado en el paso anterior
- **Email:** tu email de GitHub

---

## 6. Publicar el paquete

```bash
npm run build
npm publish
```

✅ El paquete ya está disponible en:
`https://github.com/TU-ORG/fanasa-sso-sdk/packages`

---

## 7. Cómo instalan el paquete los proyectos cliente

### Cada desarrollador hace esto UNA SOLA VEZ en su máquina

Agrega esto a su archivo `~/.npmrc` (en su carpeta de usuario):

```
@fanasa:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=TOKEN_DE_GITHUB
```

> El `TOKEN_DE_GITHUB` debe tener permiso `read:packages`.
> Cada persona genera el suyo en GitHub → Settings → Developer settings.

### Instalar en el proyecto

```bash
npm install @fanasa/sso
```

Eso es todo. Se instala igual que cualquier paquete npm público.

---

## 8. Publicar una nueva versión

Cuando hagas cambios al SDK:

```bash
# Actualizar la versión en package.json
npm version patch   # 1.0.0 → 1.0.1  (corrección de bug)
npm version minor   # 1.0.0 → 1.1.0  (nueva funcionalidad)
npm version major   # 1.0.0 → 2.0.0  (cambio que rompe compatibilidad)

# Publicar
npm publish
```

El commit y tag de versión se crean automáticamente.

---

## 9. Automatizar publicación con GitHub Actions (opcional)

Crea el archivo `.github/workflows/publish.yml` en el repositorio:

```yaml
name: Publish @fanasa/sso

on:
  push:
    tags:
      - 'v*'   # se ejecuta al hacer: git tag v1.0.1 && git push --tags

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@fanasa'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Con esto, cada vez que hagas un tag de versión, GitHub publica el paquete automáticamente.

---

## Resumen de URLs

| Qué | URL |
|---|---|
| Repositorio del SDK | `https://github.com/TU-ORG/fanasa-sso-sdk` |
| Paquete publicado | `https://github.com/TU-ORG/fanasa-sso-sdk/packages` |
| Registry | `https://npm.pkg.github.com` |
