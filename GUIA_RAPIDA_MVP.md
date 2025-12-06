# Guía Rápida: Usar el MVP de LokiVector

**Fecha:** 2025-12-06

---

## 🚀 Inicio Rápido (5 minutos)

### 1. Iniciar el Servidor

```bash
# Opción 1: Usando Node.js directamente
node server/index.js

# Opción 2: Usando el CLI (cuando esté instalado)
loki-vector start
```

El servidor iniciará en `http://localhost:4000`

### 2. Crear tu Primera API Key

```bash
curl -X POST http://localhost:4000/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "mi-usuario",
    "metadata": {
      "name": "Mi Primera Key"
    }
  }'
```

**Respuesta:**
```json
{
  "id": "key_abc123...",
  "key": "lvk_xyz789...",
  "message": "API key created successfully. Save this key now - it will not be shown again."
}
```

⚠️ **IMPORTANTE:** Guarda la key ahora, no se mostrará de nuevo.

### 3. Usar la API Key

```bash
# Guardar la key en variable
export API_KEY="lvk_xyz789..."

# Listar colecciones
curl -H "X-API-Key: $API_KEY" http://localhost:4000/collections

# Crear una colección
curl -X POST http://localhost:4000/collections \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "productos"}'

# Insertar documentos
curl -X POST http://localhost:4000/collections/productos/insert \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {"name": "Laptop", "price": 999},
      {"name": "Mouse", "price": 29}
    ]
  }'
```

---

## 📋 Endpoints Disponibles

### Públicos (No requieren API Key)

- `GET /health` - Health check
- `GET /metrics` - Métricas Prometheus
- `GET /` - Estado del servidor

### Protegidos (Requieren API Key)

#### Colecciones
- `GET /collections` - Listar colecciones
- `POST /collections` - Crear colección
- `POST /collections/:name/insert` - Insertar documentos
- `POST /collections/:name/find` - Buscar documentos
- `POST /collections/:name/search` - Búsqueda vectorial
- `POST /collections/:name/update` - Actualizar documentos
- `POST /collections/:name/remove` - Eliminar documentos

#### API Keys
- `POST /api/keys` - Crear API key (sin auth para primera key)
- `GET /api/keys` - Listar keys (requiere auth)
- `DELETE /api/keys/:keyId` - Revocar key (requiere auth)
- `GET /api/keys/stats` - Estadísticas de keys (requiere auth)

---

## 🔐 Autenticación

### Formas de Enviar API Key

**1. Header X-API-Key:**
```bash
curl -H "X-API-Key: lvk_..." http://localhost:4000/collections
```

**2. Header Authorization:**
```bash
curl -H "Authorization: Bearer lvk_..." http://localhost:4000/collections
```

**3. Query Parameter:**
```bash
curl "http://localhost:4000/collections?apiKey=lvk_..."
```

---

## ⚡ Rate Limiting

Cada API key tiene límites configurables:

```json
{
  "permissions": {
    "rateLimit": {
      "requests": 1000,
      "window": "1h"
    }
  }
}
```

**Headers de respuesta:**
- `X-RateLimit-Limit`: Límite total
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Timestamp de reset

**Cuando se excede el límite:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Limit: 1000 per 1h",
  "resetAt": "2025-12-06T18:00:00.000Z"
}
```

---

## 🧪 Ejemplos Completos

### Ejemplo 1: Búsqueda Vectorial

```bash
# 1. Crear colección con índice vectorial
curl -X POST http://localhost:4000/collections/productos/index \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "embedding",
    "options": {
      "distanceFunction": "cosine"
    }
  }'

# 2. Insertar documentos con vectores
curl -X POST http://localhost:4000/collections/productos/insert \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [{
      "name": "Laptop",
      "embedding": [0.9, 0.1, 0.2]
    }]
  }'

# 3. Búsqueda vectorial
curl -X POST http://localhost:4000/collections/productos/search \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "embedding",
    "vector": [0.8, 0.2, 0.1],
    "limit": 5
  }'
```

### Ejemplo 2: Gestión de API Keys

```bash
# Listar todas las keys
curl -H "X-API-Key: $API_KEY" http://localhost:4000/api/keys

# Crear key con permisos específicos
curl -X POST http://localhost:4000/api/keys \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usuario2",
    "permissions": {
      "collections": ["productos"],
      "operations": ["read"],
      "rateLimit": {
        "requests": 500,
        "window": "1h"
      }
    },
    "metadata": {
      "name": "Key Solo Lectura"
    }
  }'

# Revocar una key
curl -X DELETE \
  -H "X-API-Key: $API_KEY" \
  http://localhost:4000/api/keys/key_abc123
```

---

## 🐳 Docker

```bash
# Construir imagen
docker build -t lokivector .

# Ejecutar contenedor
docker run -p 4000:4000 \
  -v $(pwd)/data:/app/data \
  -e API_KEYS_ENABLED=true \
  lokivector
```

---

## 📊 Monitoreo

### Health Check

```bash
curl http://localhost:4000/health
```

### Métricas Prometheus

```bash
curl http://localhost:4000/metrics
```

### Estadísticas de API Keys

```bash
curl -H "X-API-Key: $API_KEY" http://localhost:4000/api/keys/stats
```

---

## 🔧 Configuración

### Variables de Entorno

```bash
# Puerto HTTP
PORT=4000

# Puerto TCP
TCP_PORT=5000

# Directorio de datos
DATA_DIR=./data

# Habilitar/deshabilitar API keys
API_KEYS_ENABLED=true

# Modo SaaS (sistema legacy)
SAAS_MODE=false

# Replicación
REPLICATION_ROLE=leader
LEADER_URL=http://localhost:4000
SYNC_INTERVAL=5000
```

---

## ❓ Troubleshooting

### Error: "API key required"

**Solución:** Asegúrate de incluir el header `X-API-Key` o usar query parameter `apiKey`.

### Error: "Invalid or expired API key"

**Solución:** Verifica que la key sea correcta y no haya expirado.

### Error: "Rate limit exceeded"

**Solución:** Espera hasta el `resetAt` o crea una nueva key con límite mayor.

### Error: "Access denied"

**Solución:** Verifica que la key tenga permisos para la colección/operación.

---

## 📚 Próximos Pasos

1. **Explorar CLI:** `loki-vector --help`
2. **Leer documentación:** Ver `docs/` para guías completas
3. **Probar casos de uso:** Ver `CASOS_USO_MODERNOS.md`
4. **Unirse a beta:** Visitar landing page

---

**¡Listo para usar!** 🚀

