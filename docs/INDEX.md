# Documentación de LokiJS

Bienvenido a la documentación completa de LokiJS. Esta documentación cubre todas las características y funcionalidades del proyecto.

## Documentación Principal

### Características Core
- **[README.md](../README.md)** - Introducción y guía de inicio rápido
- **[OVERVIEW.md](../OVERVIEW.md)** - Visión general del proyecto

### Características Avanzadas

#### Replicación
- **[REPLICATION.md](REPLICATION.md)** - Guía completa de replicación Leader-Follower
  - Configuración de Leader y Follower
  - Oplog persistente
  - Sincronización y manejo de IDs
  - API de replicación

#### Búsqueda Vectorial
- **[VECTOR_SEARCH.md](VECTOR_SEARCH.md)** - Búsqueda vectorial con HNSW
  - Creación de índices vectoriales
  - Búsqueda de vecinos más cercanos
  - Búsqueda híbrida
  - Optimización y rendimiento

#### Caché MRU
- **[MRU_CACHE.md](MRU_CACHE.md)** - Sistema de caché MRU
  - Configuración y uso
  - Política de evicción
  - Rendimiento y mejores prácticas

#### Servidor TCP
- **[TCP_SERVER.md](TCP_SERVER.md)** - Servidor TCP de alto rendimiento
  - Protocolo y formato de mensajes
  - Acciones soportadas
  - Ejemplos de clientes
  - Seguridad y mejores prácticas

## Tutoriales

Los tutoriales están disponibles en el directorio `tutorials/`:

- **Query Examples.md** - Ejemplos de consultas
- **Autoupdating Collections.md** - Colecciones auto-actualizables
- **Loki Angular.md** - Integración con Angular
- **Persistence Adapters.md** - Adaptadores de persistencia
- **Indexing and Query performance.md** - Optimización de índices
- **Changes API.md** - API de cambios
- **Collection Transforms.md** - Transformaciones de colecciones

## Ejemplos

Los ejemplos están disponibles en el directorio `examples/`:

- `quickstart1.js` - Inicio rápido básico
- `quickstart2.js` - Consultas y filtros
- `quickstart3.js` - Vistas dinámicas
- `quickstart4.js` - Transforms
- `vector-search-example.js` - Búsqueda vectorial
- `session-store-tcp.js` - Servidor TCP
- Y más...

## API Reference

### Clases Principales

#### Loki
Clase principal de la base de datos.

```javascript
const db = new loki('database.db', {
  autosave: true,
  autosaveInterval: 5000,
  autoload: true
});
```

#### Collection
Colección de documentos.

```javascript
const users = db.addCollection('users', {
  indices: ['age'],
  unique: ['email']
});
```

#### DynamicView
Vista dinámica con filtros y ordenamiento.

```javascript
const view = users.addDynamicView('adults');
view.applyFind({ age: { $gte: 18 } });
view.applySimpleSort('name');
```

### Plugins y Extensiones

#### LokiOplog
Operation log para replicación.

```javascript
const LokiOplog = require('./src/loki-oplog.js');
const oplog = new LokiOplog({ db: db });
```

#### MRUCache
Caché MRU para mejor rendimiento.

```javascript
const MRUCache = require('./src/mru-cache.js');
collection.mruCache = new MRUCache(100);
```

#### Vector Search
Búsqueda vectorial con HNSW.

```javascript
require('./src/loki-vector-plugin.js');
collection.ensureVectorIndex('embedding', {
  distanceFunction: 'cosine'
});
```

## Servidores

### Servidor HTTP

El servidor HTTP proporciona una API REST completa:

- `GET /` - Estado del servidor
- `POST /collections` - Crear colección
- `POST /collections/:name/insert` - Insertar documentos
- `POST /collections/:name/find` - Buscar documentos
- `POST /collections/:name/search` - Búsqueda vectorial
- `POST /collections/:name/update` - Actualizar documentos
- `POST /collections/:name/remove` - Eliminar documentos
- `POST /collections/:name/cache` - Habilitar caché MRU
- `GET /replication/changes` - Cambios para replicación
- `GET /replication/oplog/stats` - Estadísticas del oplog

Ver `server/index.js` para más detalles.

### Servidor TCP

Servidor TCP de alto rendimiento con protocolo JSON delimitado por nuevas líneas.

Ver [TCP_SERVER.md](TCP_SERVER.md) para documentación completa.

## Guías de Desarrollo

### Contribuir

Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para guías de contribución.

### Testing

```bash
# Tests de Node.js
npm run test:node

# Tests de navegador
npm run test:browser

# Todos los tests
npm test
```

### Build

```bash
# Build de producción
npm run build

# Linting
npm run lint
```

## Recursos Adicionales

- **GitHub:** https://github.com/techfort/LokiJS
- **Website:** https://techfort.github.io/LokiJS/
- **Sandbox:** https://rawgit.com/techfort/LokiJS/master/examples/sandbox/LokiSandbox.htm

## Soporte

- **Issues:** https://github.com/techfort/LokiJS/issues
- **Gitter:** https://gitter.im/techfort/LokiJS

---

**Última actualización:** 2025-12-06

