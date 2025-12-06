# Plan Detallado: Crash Recovery Tests para LokiVector

**Fecha:** 2025-12-06  
**Prioridad:** 🔥 **CRÍTICA**  
**Estimación:** 3-4 horas

---

## 🎯 Objetivo

Implementar tests automatizados de crash recovery que validen que LokiVector:
1. Mantiene consistencia después de un crash
2. Recupera índices vectoriales (HNSW) correctamente
3. Recupera replicación automáticamente
4. Maneja operaciones parciales (partial writes)
5. Garantiza idempotencia

---

## 📋 Escenarios de Test

### 1. Crash Recovery Básico

**Escenario:**
```
1. Insertar 100 documentos
2. Forzar crash (kill -9)
3. Reiniciar servidor
4. Validar:
   - Todos los documentos están presentes
   - Índices están intactos
   - Queries funcionan correctamente
```

**Test:** `spec/e2e/crash-recovery.spec.js` - `should recover after basic crash`

---

### 2. Recovery de Índices Vectoriales

**Escenario:**
```
1. Crear colección con índice vectorial
2. Insertar documentos con vectores
3. Realizar búsquedas vectoriales
4. Forzar crash durante inserción
5. Reiniciar
6. Validar:
   - Índice vectorial se reconstruye correctamente
   - Búsquedas vectoriales funcionan
   - Resultados son consistentes
```

**Test:** `should recover vector index after crash`

---

### 3. Recovery de Replicación (Leader)

**Escenario:**
```
1. Configurar leader-follower
2. Insertar documentos en leader
3. Forzar crash del leader
4. Reiniciar leader
5. Validar:
   - Leader se recupera correctamente
   - Oplog está intacto
   - Follower puede resync
```

**Test:** `should recover leader after crash and allow follower resync`

---

### 4. Recovery de Replicación (Follower)

**Escenario:**
```
1. Configurar leader-follower
2. Follower sincronizando
3. Forzar crash del follower
4. Reiniciar follower
5. Validar:
   - Follower se resync automáticamente
   - Datos están consistentes
   - No hay duplicados
```

**Test:** `should recover follower after crash and resync automatically`

---

### 5. Partial Write Recovery

**Escenario:**
```
1. Iniciar inserción de múltiples documentos
2. Forzar crash durante la escritura
3. Reiniciar
4. Validar:
   - No hay documentos corruptos
   - Transacciones parciales se revierten
   - Estado es consistente
```

**Test:** `should handle partial writes correctly after crash`

---

### 6. Idempotencia de Operaciones

**Escenario:**
```
1. Insertar documento con ID específico
2. Forzar crash antes de confirmar
3. Reiniciar
4. Reintentar inserción con mismo ID
5. Validar:
   - No hay duplicados
   - Operación es idempotente
   - Estado final es correcto
```

**Test:** `should handle idempotent operations after crash`

---

### 7. Recovery de Oplog

**Escenario:**
```
1. Leader con oplog activo
2. Múltiples operaciones (insert, update, remove)
3. Forzar crash durante escritura de oplog
4. Reiniciar
5. Validar:
   - Oplog está consistente
   - Secuencias son correctas
   - No hay gaps en el oplog
```

**Test:** `should recover oplog consistency after crash`

---

### 8. Stress Test: Múltiples Crashes

**Escenario:**
```
1. Ejecutar operaciones normales
2. Forzar crash aleatorio
3. Reiniciar
4. Repetir 10 veces
5. Validar:
   - Sistema se recupera cada vez
   - Datos permanecen consistentes
   - No hay corrupción acumulativa
```

**Test:** `should recover from multiple sequential crashes`

---

## 🛠️ Implementación Técnica

### Archivos a Crear

1. **`spec/e2e/crash-recovery.spec.js`**
   - Suite completa de tests de crash recovery
   - Helpers para simular crashes
   - Validadores de integridad

2. **`spec/helpers/crash-helper.js`**
   - Funciones para forzar crashes
   - Helpers para validar integridad
   - Utilidades de recovery

### Archivos a Modificar

1. **`server/index.js`**
   - Mejorar manejo de señales (SIGTERM, SIGINT)
   - Asegurar flush de datos antes de cerrar
   - Validación de integridad al iniciar

2. **`src/loki-oplog.js`**
   - Validación de integridad del oplog
   - Recovery de secuencias
   - Detección de gaps

3. **`src/loki-hnsw-index.js`**
   - Validación de integridad del índice
   - Reconstrucción automática si es necesario
   - Verificación de consistencia

4. **`src/lokijs.js`** (si es necesario)
   - Mejorar persistencia de índices
   - Validación de integridad al cargar
   - Recovery de datos corruptos

---

## 🧪 Estructura de Tests

```javascript
describe('Crash Recovery', function() {
  let dbPath;
  let serverProcess;
  
  beforeEach(function() {
    // Setup: crear DB temporal
    dbPath = path.join(__dirname, '../data/crash-test-' + Date.now() + '.db');
  });
  
  afterEach(function() {
    // Cleanup: eliminar DB temporal
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });
  
  describe('Basic Crash Recovery', function() {
    it('should recover all documents after crash', async function() {
      // 1. Insertar documentos
      // 2. Forzar crash
      // 3. Reiniciar
      // 4. Validar
    });
  });
  
  describe('Vector Index Recovery', function() {
    it('should recover vector index after crash', async function() {
      // Test de recovery de índices HNSW
    });
  });
  
  describe('Replication Recovery', function() {
    it('should recover leader after crash', async function() {
      // Test de recovery de leader
    });
    
    it('should recover follower after crash', async function() {
      // Test de recovery de follower
    });
  });
  
  describe('Partial Write Recovery', function() {
    it('should handle partial writes correctly', async function() {
      // Test de operaciones parciales
    });
  });
  
  describe('Idempotency', function() {
    it('should handle idempotent operations', async function() {
      // Test de idempotencia
    });
  });
  
  describe('Oplog Recovery', function() {
    it('should recover oplog consistency', async function() {
      // Test de recovery de oplog
    });
  });
  
  describe('Stress Tests', function() {
    it('should recover from multiple sequential crashes', async function() {
      // Test de múltiples crashes
    });
  });
});
```

---

## 🔧 Helpers Necesarios

### `spec/helpers/crash-helper.js`

```javascript
/**
 * Simula un crash forzando la terminación del proceso
 */
function forceCrash(process) {
  // kill -9 equivalente
  process.kill('SIGKILL');
}

/**
 * Valida integridad de la base de datos
 */
function validateDatabaseIntegrity(db) {
  // Validar:
  // - Todas las colecciones están presentes
  // - Índices están intactos
  // - No hay documentos corruptos
  // - Oplog está consistente
}

/**
 * Valida integridad de índices vectoriales
 */
function validateVectorIndexIntegrity(collection) {
  // Validar:
  // - Índice existe
  // - Estructura HNSW es válida
  // - Búsquedas funcionan
}

/**
 * Valida integridad de replicación
 */
function validateReplicationIntegrity(leader, follower) {
  // Validar:
  // - Datos están sincronizados
  // - Oplog está consistente
  // - No hay duplicados
}
```

---

## ✅ Criterios de Éxito

### Tests Deben Pasar

- [ ] Todos los documentos se recuperan después de crash
- [ ] Índices vectoriales se reconstruyen correctamente
- [ ] Replicación se recupera automáticamente
- [ ] No hay pérdida de datos
- [ ] No hay corrupción de índices
- [ ] Operaciones parciales se manejan correctamente
- [ ] Idempotencia funciona correctamente
- [ ] Oplog mantiene consistencia
- [ ] Múltiples crashes no causan corrupción acumulativa

### Validaciones Post-Crash

1. **Integridad de Datos**
   - Todos los documentos insertados están presentes
   - No hay documentos corruptos
   - Queries funcionan correctamente

2. **Integridad de Índices**
   - Índices vectoriales funcionan
   - Búsquedas vectoriales retornan resultados correctos
   - Índices binarios están intactos

3. **Integridad de Replicación**
   - Leader y follower están sincronizados
   - Oplog está consistente
   - No hay gaps en secuencias

4. **Performance**
   - Recovery no toma más de 5 segundos
   - No hay degradación de performance post-recovery

---

## 📊 Métricas de Validación

### Tiempos de Recovery

- **Recovery básico:** < 1 segundo
- **Recovery con índices vectoriales:** < 3 segundos
- **Recovery de replicación:** < 5 segundos

### Integridad

- **Pérdida de datos:** 0%
- **Corrupción de índices:** 0%
- **Inconsistencias de replicación:** 0%

---

## 🚀 Orden de Implementación

1. **Setup básico** (30 min)
   - Crear estructura de tests
   - Implementar helpers de crash
   - Setup de DB temporal

2. **Test básico de crash** (30 min)
   - Insertar → Crash → Validar

3. **Test de índices vectoriales** (45 min)
   - Recovery de HNSW
   - Validación de búsquedas

4. **Test de replicación** (1 hora)
   - Leader recovery
   - Follower recovery
   - Resync automático

5. **Tests avanzados** (1 hora)
   - Partial writes
   - Idempotencia
   - Oplog recovery
   - Stress tests

6. **Validación y polish** (15 min)
   - Asegurar todos los tests pasan
   - Documentar resultados

---

## 📝 Notas Técnicas

### Simulación de Crash

Para simular un crash real:
- Usar `process.kill('SIGKILL')` (equivalente a kill -9)
- No permitir cleanup graceful
- Forzar terminación inmediata

### Validación de Integridad

- Verificar checksums de datos
- Validar estructura de índices
- Comparar estado antes/después del crash

### Recovery Automático

- Al iniciar, verificar integridad
- Si hay problemas, intentar recovery automático
- Si recovery falla, reportar error claro

---

## 🎯 Resultado Esperado

Después de implementar estos tests:

1. ✅ LokiVector demuestra durabilidad
2. ✅ Confianza en el producto aumenta
3. ✅ Nivel de calidad comparable a SQLite/RocksDB
4. ✅ Listo para producción real
5. ✅ MVP alcanza 100% real

---

**¿Quieres que implemente estos tests ahora?**

