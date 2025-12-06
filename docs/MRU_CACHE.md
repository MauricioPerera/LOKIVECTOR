# Caché MRU (Most Recently Used) en LokiJS

## Descripción General

LokiJS incluye un sistema de caché MRU (Most Recently Used) que mejora significativamente el rendimiento de consultas frecuentes almacenando resultados en memoria.

## Características

- ✅ Caché en memoria de resultados de consultas
- ✅ Política de evicción LRU (Least Recently Used)
- ✅ Configuración de capacidad
- ✅ Integración transparente con colecciones
- ✅ Mejora de rendimiento de hasta 200x

## Uso Básico

### Habilitar Caché en una Colección

```javascript
const loki = require('./src/lokijs.js');
const MRUCache = require('./src/mru-cache.js');

const db = new loki('cache-db.db');
const users = db.addCollection('users');

// Habilitar caché con capacidad de 100 entradas
users.mruCache = new MRUCache(100);
```

### Uso Automático

Una vez habilitado, el caché funciona automáticamente:

```javascript
// Primera consulta - ejecuta normalmente y cachea resultado
const result1 = users.find({ age: { $gte: 30 } });

// Segunda consulta - recupera desde caché (mucho más rápido)
const result2 = users.find({ age: { $gte: 30 } });
```

## Configuración

### Capacidad

```javascript
// Caché pequeño (50 entradas)
users.mruCache = new MRUCache(50);

// Caché mediano (100 entradas) - por defecto
users.mruCache = new MRUCache(100);

// Caché grande (1000 entradas)
users.mruCache = new MRUCache(1000);
```

### Capacidad por Defecto

Si no se especifica capacidad, el valor por defecto es 100:

```javascript
users.mruCache = new MRUCache(); // Capacidad: 100
```

## API del Caché

### get(key)
Obtiene un valor del caché.

```javascript
const cached = users.mruCache.get('query-key');
if (cached) {
  return cached; // Retorna desde caché
}
```

### set(key, value)
Almacena un valor en el caché.

```javascript
users.mruCache.set('query-key', results);
```

### has(key)
Verifica si una clave existe en el caché.

```javascript
if (users.mruCache.has('query-key')) {
  // Clave existe en caché
}
```

### clear()
Limpia todo el caché.

```javascript
users.mruCache.clear();
```

### size (getter)
Obtiene el número de entradas en el caché.

```javascript
const cacheSize = users.mruCache.size;
console.log(`Caché tiene ${cacheSize} entradas`);
```

## Política de Evicción

El caché usa política LRU (Least Recently Used):

- Cuando el caché está lleno, se elimina la entrada menos recientemente usada
- Las entradas más recientemente accedidas se mantienen
- El acceso a una entrada la marca como "más reciente"

### Ejemplo de Evicción

```javascript
const cache = new MRUCache(3); // Capacidad de 3

cache.set('key1', 'value1');
cache.set('key2', 'value2');
cache.set('key3', 'value3');
// Caché: [key1, key2, key3]

cache.get('key1'); // Accede a key1, ahora es más reciente
// Caché: [key2, key3, key1]

cache.set('key4', 'value4'); // key2 es evictado (menos reciente)
// Caché: [key3, key1, key4]
```

## Rendimiento

### Benchmarks

- **Sin caché:** ~0.16ms - 0.26ms por operación
- **Con caché:** ~0.0006ms - 0.0008ms por operación
- **Mejora:** Hasta 200x más rápido

### Cuándo Usar Caché

✅ **Ideal para:**
- Consultas frecuentes y repetitivas
- Consultas complejas que toman tiempo
- Datos que no cambian frecuentemente
- Aplicaciones con muchos usuarios haciendo las mismas consultas

❌ **No ideal para:**
- Consultas únicas que no se repiten
- Datos que cambian constantemente
- Consultas que requieren datos siempre actualizados

## Integración con Colecciones

El caché se integra automáticamente con el método `find()`:

```javascript
const users = db.addCollection('users');
users.mruCache = new MRUCache(100);

// La primera llamada ejecuta la consulta y cachea
const result1 = users.find({ age: { $gte: 30 } });

// La segunda llamada usa el caché
const result2 = users.find({ age: { $gte: 30 } });

// result1 === result2 (mismo resultado, más rápido)
```

## Invalidación

El caché se invalida automáticamente cuando:

- Se insertan nuevos documentos
- Se actualizan documentos existentes
- Se eliminan documentos

```javascript
// Consulta cacheada
const results = users.find({ age: { $gte: 30 } });

// Insertar nuevo documento
users.insert({ name: 'New User', age: 35 });

// La próxima consulta ejecutará de nuevo (caché invalidado)
const newResults = users.find({ age: { $gte: 30 } });
```

## API HTTP

### Habilitar Caché

```bash
POST /collections/:name/cache
Content-Type: application/json

{
  "capacity": 100
}
```

**Respuesta:**
```json
{
  "message": "MRU Cache enabled for collection 'users' with capacity 100"
}
```

## Ejemplos

### Ejemplo Básico

```javascript
const loki = require('./src/lokijs.js');
const MRUCache = require('./src/mru-cache.js');

const db = new loki('example.db');
const products = db.addCollection('products');
products.mruCache = new MRUCache(50);

// Insertar datos
for (let i = 0; i < 1000; i++) {
  products.insert({
    name: `Product ${i}`,
    price: Math.random() * 100,
    category: i % 10
  });
}

// Primera consulta (sin caché)
const start1 = Date.now();
const expensive = products.find({ price: { $gte: 50 } });
const time1 = Date.now() - start1;

// Segunda consulta (con caché)
const start2 = Date.now();
const expensive2 = products.find({ price: { $gte: 50 } });
const time2 = Date.now() - start2;

console.log(`Sin caché: ${time1}ms`);
console.log(`Con caché: ${time2}ms`);
console.log(`Mejora: ${(time1 / time2).toFixed(1)}x`);
```

### Múltiples Consultas

```javascript
// Diferentes consultas se cachean por separado
const query1 = products.find({ category: 1 });
const query2 = products.find({ category: 2 });
const query3 = products.find({ category: 1 }); // Usa caché de query1

// Consultas complejas también se cachean
const complex = products.find({
  $and: [
    { price: { $gte: 50 } },
    { price: { $lte: 100 } },
    { category: { $in: [1, 2, 3] } }
  ]
});
```

## Mejores Prácticas

1. **Capacidad adecuada:** Ajustar según número de consultas únicas
2. **Monitorear uso:** Verificar `cache.size` para optimizar capacidad
3. **Invalidación:** Entender cuándo se invalida el caché
4. **Consultas consistentes:** Usar las mismas consultas para aprovechar el caché
5. **Memoria:** Considerar el uso de memoria con cachés grandes

## Limitaciones

1. **Memoria:** El caché consume memoria RAM
2. **Invalidación automática:** Se invalida en cada inserción/actualización/eliminación
3. **Solo find():** Actualmente solo cachea resultados de `find()`
4. **Claves de consulta:** Las claves se generan con `JSON.stringify(query)`

## Troubleshooting

### Caché no funciona

1. Verificar que `mruCache` esté asignado a la colección
2. Verificar que la capacidad sea mayor que 0
3. Verificar que las consultas sean idénticas (mismo JSON)

### Memoria alta

1. Reducir la capacidad del caché
2. Limpiar el caché periódicamente: `collection.mruCache.clear()`
3. Usar cachés más pequeños para colecciones grandes

## Referencias

- `src/mru-cache.js` - Implementación del caché
- `spec/generic/mru-cache.spec.js` - Tests del caché

