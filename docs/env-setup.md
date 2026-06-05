# Variables de entorno

Copia este contenido a un fichero **`.env.local`** en la raíz del proyecto (ese fichero está en `.gitignore` y no debe subirse a Git).

```env
# PostgreSQL (Neon). Obtén la URL en el panel de Neon → Connection string.
DATABASE_URL=

# URL pública de la app (desarrollo)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Token para el endpoint interno de seed (elige un valor aleatorio largo)
SEED_TOKEN=

# Sesiones de autenticación (mín. 16 caracteres). Generar: npm run auth:secret
AUTH_SECRET=
```

## Sandbox Docker (auditoría al publicar)

Necesitas **Docker Desktop** en ejecución (estado «Running»).

### Workflows (`reference_architecture`)

Escaneo estático del JSON del flujo con la imagen local `certia-sandbox`:

```bash
npm run sandbox:build
```

### Contenedores (`runtime_artifact`)

Escaneo real de capas con **Trivy** (se descarga `aquasec/trivy:latest` en el primer uso). El daemon Docker debe poder acceder al registro donde está la imagen declarada en `image_registry_uri`.

```bash
docker pull aquasec/trivy:latest
```

Si ves errores del tipo `docker_engine` o `docker daemon is not running`, abre Docker Desktop y reintenta la auditoría.

## Si alguna credencial pudo haberse filtrado

1. **Neon**: resetea la contraseña del rol de base de datos y actualiza `DATABASE_URL`.
2. **SEED_TOKEN** y **AUTH_SECRET**: genera valores nuevos y actualiza `.env.local`.
3. En GitHub: Settings → **Secret scanning** (alertas si vuelve a pasar).
