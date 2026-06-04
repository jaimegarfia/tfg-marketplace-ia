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

## Si alguna credencial pudo haberse filtrado

1. **Neon**: resetea la contraseña del rol de base de datos y actualiza `DATABASE_URL`.
2. **SEED_TOKEN** y **AUTH_SECRET**: genera valores nuevos y actualiza `.env.local`.
3. En GitHub: Settings → **Secret scanning** (alertas si vuelve a pasar).
