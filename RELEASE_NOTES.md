# Release Notes - v0.1.0

**Fecha:** 2025-12-06  
**Edición:** Community Edition (MIT License)

---

## 🎉 Primera Release Pública

Esta es la primera release pública de LokiVector Community Edition.

### ✨ Features Principales

#### Core Database
- Document store con documentos tipo JSON
- Schema flexible, sin migraciones
- Rendimiento in-memory con persistencia en disco
- Índices binarios y únicos
- Vistas dinámicas
- Sintaxis de queries estilo MongoDB

#### Vector Search
- Índice HNSW (Hierarchical Navigable Small World)
- Búsqueda aproximada de vecinos más cercanos
- Soporte para múltiples métricas de distancia (Euclidean, Cosine, Inner Product)
- Capacidades de búsqueda semántica
- Creación y gestión de índices vectoriales

#### Server & API
- HTTP REST API con Express.js
- Server TCP raw para operaciones de baja latencia
- Sistema de autenticación con API keys
- Rate limiting configurable por API key
- Endpoint de health check
- Endpoint de métricas

#### Durabilidad & Crash Recovery
- Crash-safe con recuperación validada
- Persistencia basada en journal
- Recuperación automática de datos
- Recuperación de índices vectoriales
- Consistencia de oplog
- Tests E2E completos de crash recovery (7 escenarios)
- Garantía de 0 pérdida de datos, 0 corrupción

#### Developer Tools
- CLI (loki-vector) para gestión del servidor
- Dashboard web de administración
- Documentación OpenAPI 3.0 con Swagger UI
- Ejemplos y guías completas

### 📚 Documentación

- Documentación técnica completa
- Guía de Durabilidad & Crash Recovery
- Guía de Deployment (Docker, Kubernetes, Nginx)
- Guía de Replicación
- Guía de Vector Search
- Documentación de API (OpenAPI)

### 🔒 Seguridad

- Gestión de API keys con hashing seguro
- Rate limiting por API key
- Middleware de autenticación
- Validación de entrada

### ⚡ Performance

- MRU cache para resultados de queries (200× speedup)
- Búsqueda vectorial optimizada (algoritmo HNSW)
- Almacenamiento in-memory eficiente
- Server TCP de baja latencia

### 🧪 Testing

- Tests unitarios completos
- Tests de integración
- Tests E2E para HTTP server
- **Tests E2E de crash recovery (7 escenarios)**
- Helpers para simulación de crashes
- Helpers de validación de guardado de base de datos

---

## 📦 Instalación

```bash
npm install @lokivector/core
```

## 🚀 Quick Start

```javascript
const loki = require('@lokivector/core');

const db = new loki('example.db');
const users = db.addCollection('users');

users.insert({ name: 'John', age: 30 });
const results = users.find({ age: { $gte: 25 } });
```

## 📄 Licencia

Este release está bajo **MIT License**.

Features comerciales (replicación, cache avanzado, etc.) están disponibles en ediciones Pro y Enterprise.

Ver [LICENSE_FEATURES.md](LICENSE_FEATURES.md) para detalles.

## 🔗 Links

- Documentación: [docs/](docs/)
- Commercial Licensing: commercial@lokivector.io
- Issues: [GitHub Issues](https://github.com/MauricioPerera/db/issues)

---

**Community Edition - MIT License**
