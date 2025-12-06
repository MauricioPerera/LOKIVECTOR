# Guía de Deployment: LokiVector

**Fecha:** 2025-12-06  
**Versión:** 0.1.0

---

## 🚀 Deployment Rápido

### Opción 1: Docker (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/MauricioPerera/db.git
cd db

# Construir imagen
docker build -t lokivector .

# Ejecutar contenedor
docker run -d \
  --name lokivector \
  -p 4000:4000 \
  -v $(pwd)/data:/app/data \
  -e PORT=4000 \
  lokivector
```

### Opción 2: Docker Compose (Para Replicación)

```bash
# Iniciar cluster leader-follower
docker-compose up -d

# Leader: http://localhost:4000
# Follower: http://localhost:4001
```

### Opción 3: Node.js Directo

```bash
# Instalar dependencias
npm install

# Iniciar servidor
node server/index.js
```

---

## 🐳 Docker

### Dockerfile

El Dockerfile está optimizado para producción:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
COPY server ./server
VOLUME /app/data
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
```

### Variables de Entorno

```bash
# Puerto del servidor
PORT=4000

# Rol de replicación
REPLICATION_ROLE=leader  # o 'follower'

# URL del leader (para followers)
LEADER_URL=http://leader:4000

# Intervalo de sincronización (ms)
SYNC_INTERVAL=5000

# Archivo de base de datos
DB_FILE=/app/data/loki-vector.db
```

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 🌐 Nginx Reverse Proxy

### Configuración Básica

```nginx
server {
    listen 80;
    server_name lokivector.example.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### SSL/TLS con Let's Encrypt

```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d lokivector.example.com
```

### Configuración con SSL

```nginx
server {
    listen 443 ssl http2;
    server_name lokivector.example.com;

    ssl_certificate /etc/letsencrypt/live/lokivector.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lokivector.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name lokivector.example.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🔒 Seguridad en Producción

### 1. API Keys

**Crear API Key Inicial:**

```bash
curl -X POST http://localhost:4000/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin",
    "permissions": {
      "collections": ["*"],
      "operations": ["read", "write", "admin"],
      "rateLimit": {
        "requests": 10000,
        "window": "1h"
      }
    },
    "metadata": {
      "name": "Production Key",
      "environment": "production"
    }
  }'
```

**Usar API Key:**

```bash
export API_KEY="lvk_..."

curl -H "X-API-Key: $API_KEY" \
  http://localhost:4000/collections
```

### 2. Rate Limiting

Configurar límites apropiados por API key:

```json
{
  "rateLimit": {
    "requests": 1000,
    "window": "1h"
  }
}
```

### 3. Firewall

```bash
# Permitir solo puerto 4000 desde reverse proxy
sudo ufw allow from 127.0.0.1 to any port 4000
sudo ufw deny 4000
```

---

## 📊 Monitoreo

### Health Check

```bash
# Verificar estado
curl http://localhost:4000/health

# Respuesta:
{
  "status": "healthy",
  "timestamp": 1701878400000,
  "uptime": 3600.5,
  "collections": 5,
  "memory": { ... }
}
```

### Métricas Prometheus

```bash
# Obtener métricas
curl http://localhost:4000/metrics

# Integrar con Prometheus
# prometheus.yml:
scrape_configs:
  - job_name: 'lokivector'
    static_configs:
      - targets: ['localhost:4000']
```

### Logs

```bash
# Ver logs del contenedor
docker logs lokivector

# Seguir logs
docker logs -f lokivector

# Logs con timestamps
docker logs -t lokivector
```

---

## 🔄 Replicación en Producción

### Configuración Leader

```bash
docker run -d \
  --name lokivector-leader \
  -p 4000:4000 \
  -v $(pwd)/data-leader:/app/data \
  -e REPLICATION_ROLE=leader \
  -e PORT=4000 \
  lokivector
```

### Configuración Follower

```bash
docker run -d \
  --name lokivector-follower \
  -p 4001:4001 \
  -v $(pwd)/data-follower:/app/data \
  -e REPLICATION_ROLE=follower \
  -e PORT=4001 \
  -e LEADER_URL=http://leader:4000 \
  -e SYNC_INTERVAL=5000 \
  lokivector
```

### Docker Compose para Replicación

```yaml
version: '3.8'

services:
  leader:
    build: .
    ports:
      - "4000:4000"
    environment:
      - REPLICATION_ROLE=leader
      - PORT=4000
    volumes:
      - ./data-leader:/app/data
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 30s

  follower:
    build: .
    ports:
      - "4001:4001"
    environment:
      - REPLICATION_ROLE=follower
      - PORT=4001
      - LEADER_URL=http://leader:4000
      - SYNC_INTERVAL=5000
    volumes:
      - ./data-follower:/app/data
    depends_on:
      - leader
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4001/health"]
      interval: 30s
```

---

## 💾 Backup y Restore

### Backup Manual

```bash
# Backup de base de datos
cp data/loki-vector.db backups/loki-vector-$(date +%Y%m%d).db

# Backup con compresión
tar -czf backups/loki-vector-$(date +%Y%m%d).tar.gz data/
```

### Backup Automatizado

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DB_DIR="/app/data"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear backup
tar -czf "$BACKUP_DIR/lokivector-$DATE.tar.gz" "$DB_DIR"

# Mantener solo últimos 7 días
find "$BACKUP_DIR" -name "lokivector-*.tar.gz" -mtime +7 -delete
```

**Cron Job:**

```bash
# Ejecutar backup diario a las 2 AM
0 2 * * * /path/to/backup.sh
```

### Restore

```bash
# Detener servidor
docker stop lokivector

# Restaurar backup
cp backups/loki-vector-20241206.db data/loki-vector.db

# Reiniciar servidor
docker start lokivector
```

---

## 🔧 Troubleshooting

### Problema: Servidor no inicia

```bash
# Verificar logs
docker logs lokivector

# Verificar puerto
netstat -tulpn | grep 4000

# Verificar permisos
ls -la data/
```

### Problema: Datos no persisten

```bash
# Verificar volumen montado
docker inspect lokivector | grep Mounts

# Verificar espacio en disco
df -h

# Verificar permisos de escritura
touch data/test.txt && rm data/test.txt
```

### Problema: Replicación no funciona

```bash
# Verificar conectividad
docker exec lokivector-follower wget -O- http://leader:4000/health

# Verificar variables de entorno
docker exec lokivector-follower env | grep LEADER

# Verificar logs
docker logs lokivector-follower
```

---

## 📈 Escalabilidad

### Horizontal Scaling

1. **Múltiples Followers**
   - Un leader puede tener múltiples followers
   - Cada follower lee del mismo leader

2. **Load Balancing**
   - Usar Nginx/HAProxy para balancear lecturas
   - Escribir solo al leader

### Vertical Scaling

- Aumentar memoria para índices vectoriales grandes
- Aumentar CPU para búsquedas vectoriales intensivas

---

## ✅ Checklist de Deployment

### Pre-Deployment

- [ ] API keys creadas y guardadas de forma segura
- [ ] Variables de entorno configuradas
- [ ] Volúmenes de datos configurados
- [ ] Health checks configurados
- [ ] Logs configurados

### Post-Deployment

- [ ] Health check pasando
- [ ] API keys funcionando
- [ ] Replicación sincronizando (si aplica)
- [ ] Métricas disponibles
- [ ] Backups configurados

---

## 📚 Referencias

- **Docker:** https://docs.docker.com/
- **Nginx:** https://nginx.org/en/docs/
- **Prometheus:** https://prometheus.io/docs/
- **Let's Encrypt:** https://letsencrypt.org/

---

**LokiVector está listo para producción** ✅

