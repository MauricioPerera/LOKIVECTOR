# Replicación Leader-Follower en LokiJS

## Descripción General

LokiJS ahora incluye soporte completo para replicación Leader-Follower, permitiendo sincronización de datos entre múltiples instancias del servidor. Esta característica es ideal para:

- Alta disponibilidad
- Escalado de lecturas
- Sincronización entre servidores
- Backup y recuperación

## Arquitectura

### Leader (Líder)
El servidor Leader es la fuente de verdad. Todas las operaciones de escritura (insert, update, remove) se realizan en el Leader y se registran en un oplog (operation log) persistente.

### Follower (Seguidor)
Los servidores Follower se sincronizan periódicamente con el Leader, aplicando los cambios desde su última secuencia conocida.

### Oplog (Operation Log)
El oplog es un registro persistente de todas las operaciones realizadas en el Leader. Cada entrada contiene:
- **sequence**: Número de secuencia monótono incremental
- **timestamp**: Marca de tiempo Unix en milisegundos
- **collection**: Nombre de la colección afectada
- **operation**: Tipo de operación ('I'=Insert, 'U'=Update, 'R'=Remove)
- **document**: El documento completo o referencia
- **metadata**: Metadatos adicionales (opcional)

## Configuración

### Leader

```bash
# Variables de entorno
export REPLICATION_ROLE=leader
export PORT=4000

# Iniciar servidor
node server/index.js
```

### Follower

```bash
# Variables de entorno
export REPLICATION_ROLE=follower
export PORT=4001
export LEADER_URL=http://localhost:4000
export SYNC_INTERVAL=5000  # Intervalo de sincronización en ms

# Iniciar servidor
node server/index.js
```

## Uso con Docker Compose

```bash
# Iniciar cluster Leader-Follower
docker compose up -d --build

# Leader corre en puerto 4000
# Follower corre en puerto 4001
```

Ver `docker-compose.yml` para más detalles.

## API de Replicación

### Leader Endpoints

#### GET /replication/changes
Obtiene cambios desde una secuencia específica.

**Parámetros de consulta:**
- `since` (number): Secuencia desde la cual obtener cambios (default: 0)
- `limit` (number): Número máximo de entradas a retornar (default: 1000)

**Ejemplo:**
```bash
curl "http://localhost:4000/replication/changes?since=100&limit=500"
```

**Respuesta:**
```json
{
  "changes": {
    "users": [
      {
        "operation": "I",
        "obj": { "name": "Alice", "age": 30 },
        "sequence": 101,
        "timestamp": 1234567890
      }
    ]
  },
  "latestSequence": 150,
  "count": 50
}
```

#### GET /replication/oplog/stats
Obtiene estadísticas del oplog.

**Ejemplo:**
```bash
curl "http://localhost:4000/replication/oplog/stats"
```

**Respuesta:**
```json
{
  "totalEntries": 1000,
  "latestSequence": 1000,
  "oldestSequence": 1,
  "collections": {
    "users": 500,
    "products": 300,
    "orders": 200
  }
}
```

## Sincronización

### Flujo de Sincronización

1. **Follower solicita cambios:**
   ```
   GET /replication/changes?since={lastSequence}
   ```

2. **Leader retorna cambios:**
   - Entradas desde `lastSequence` hasta `latestSequence`
   - Agrupadas por colección
   - Ordenadas por secuencia

3. **Follower aplica cambios:**
   - Crea colecciones si no existen
   - Aplica operaciones en orden (Insert, Update, Remove)
   - Actualiza `lastProcessedSequence`

4. **Follower persiste estado:**
   - Guarda última secuencia procesada
   - Permite recuperación después de reinicios

### Manejo de IDs

El sistema de replicación maneja IDs de manera inteligente:

1. **Prioridad de matching:**
   - `uuid` (si existe)
   - `id` (si existe)
   - `$loki` (ID interno de LokiJS)

2. **Insert:**
   - Busca documento existente por UUID/id
   - Si no existe, inserta nuevo documento
   - Preserva UUID/id si están presentes

3. **Update:**
   - Encuentra documento por UUID/id/$loki
   - Actualiza campos (excepto metadatos internos)
   - Si no se encuentra, inserta como nuevo

4. **Remove:**
   - Encuentra documento por UUID/id/$loki
   - Elimina si existe

### Recomendación: Usar UUIDs

Para mejor sincronización, se recomienda usar campos `uuid` o `id` externos:

```javascript
// En el Leader
collection.insert({
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Alice',
  age: 30
});
```

Esto asegura que los documentos se puedan identificar correctamente entre Leader y Followers, incluso si los IDs internos de LokiJS (`$loki`) divergen.

## Oplog

### Configuración

```javascript
const LokiOplog = require('./src/loki-oplog.js');

const oplog = new LokiOplog({
  db: db,                    // Instancia de LokiJS
  maxSize: 10000,            // Máximo de entradas antes de rotación
  retentionDays: 7,          // Días de retención
  collectionName: '__oplog__' // Nombre de la colección
});
```

### Métodos

#### append(collection, operation, document, metadata)
Agrega una operación al oplog.

```javascript
oplog.append('users', 'I', { name: 'Alice' }, { source: 'api' });
// Retorna: sequence number
```

#### getSince(sinceSequence, limit)
Obtiene entradas desde una secuencia específica.

```javascript
const entries = oplog.getSince(100, 1000);
```

#### getRange(fromSequence, toSequence)
Obtiene entradas en un rango específico.

```javascript
const entries = oplog.getRange(100, 200);
```

#### getSinceForCollection(collection, sinceSequence, limit)
Obtiene entradas de una colección específica.

```javascript
const entries = oplog.getSinceForCollection('users', 50, 100);
```

#### getLatestSequence()
Obtiene la última secuencia procesada.

```javascript
const latest = oplog.getLatestSequence();
```

#### getStats()
Obtiene estadísticas del oplog.

```javascript
const stats = oplog.getStats();
// {
//   totalEntries: 1000,
//   latestSequence: 1000,
//   oldestSequence: 1,
//   collections: { ... }
// }
```

#### clear()
Limpia todas las entradas del oplog.

```javascript
oplog.clear();
```

## Rotación y Limpieza

El oplog realiza limpieza automática basada en:

1. **Tamaño máximo:** Cuando se excede `maxSize`, se eliminan las entradas más antiguas
2. **Retención:** Entradas más antiguas que `retentionDays` se eliminan automáticamente

Esto previene el crecimiento infinito del oplog mientras mantiene suficiente historial para sincronización.

## Múltiples Followers

El sistema soporta múltiples followers simultáneos. Cada follower:

- Mantiene su propia `lastProcessedSequence`
- Solicita cambios desde su última secuencia conocida
- No interfiere con otros followers
- Puede reconectarse y recuperar desde su última posición

## Ejemplo Completo

### Leader

```javascript
const loki = require('./src/lokijs.js');
const LokiOplog = require('./src/loki-oplog.js');

const db = new loki('leader.db');
const oplog = new LokiOplog({ db: db });
oplog._initializeCollection();

const users = db.addCollection('users');
users.insert({
  uuid: 'user-1',
  name: 'Alice',
  age: 30
});
// Oplog automáticamente registra la inserción
```

### Follower

```javascript
const loki = require('./src/lokijs.js');

const db = new loki('follower.db');
let lastSequence = 0;

// Función de sincronización
async function sync() {
  const response = await fetch(
    `http://leader:4000/replication/changes?since=${lastSequence}`
  );
  const { changes, latestSequence } = await response.json();
  
  // Aplicar cambios
  Object.keys(changes).forEach(colName => {
    let coll = db.getCollection(colName);
    if (!coll) coll = db.addCollection(colName);
    
    changes[colName].forEach(change => {
      switch(change.operation) {
        case 'I':
          // Insert logic
          break;
        case 'U':
          // Update logic
          break;
        case 'R':
          // Remove logic
          break;
      }
    });
  });
  
  lastSequence = latestSequence;
}

// Sincronizar cada 5 segundos
setInterval(sync, 5000);
```

## Troubleshooting

### Follower no sincroniza

1. Verificar que `LEADER_URL` sea correcto
2. Verificar que el Leader esté corriendo
3. Revisar logs del Follower para errores de conexión

### IDs divergentes

- Usar campos `uuid` o `id` externos
- Verificar que los documentos tengan identificadores únicos
- Revisar logs para errores de matching

### Oplog crece demasiado

- Reducir `maxSize` en la configuración
- Reducir `retentionDays`
- Verificar que la limpieza automática esté funcionando

## Limitaciones

1. **Solo lectura en Followers:** Los Followers no aceptan escrituras directamente
2. **Sincronización eventual:** Los cambios se propagan según `SYNC_INTERVAL`
3. **Conflictos:** No hay resolución automática de conflictos (usar UUIDs para evitarlos)

## Mejores Prácticas

1. **Usar UUIDs:** Para mejor identificación de documentos
2. **Configurar retención:** Ajustar `maxSize` y `retentionDays` según necesidades
3. **Monitorear oplog:** Usar `/replication/oplog/stats` para monitoreo
4. **Backup regular:** Hacer backup del Leader regularmente
5. **Testing:** Probar sincronización en entorno de desarrollo primero

## Referencias

- `src/loki-oplog.js` - Implementación del oplog
- `server/index.js` - Integración en el servidor
- `spec/generic/replication.spec.js` - Tests de replicación

