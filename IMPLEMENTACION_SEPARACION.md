# Implementación: Separación MIT vs Commercial

**Fecha:** 2025-12-06  
**Prioridad:** 🔥 **CRÍTICA - Antes de Lanzamiento**

---

## 🎯 Objetivo

Separar código MIT de Commercial **antes** de hacer el repositorio público para proteger el modelo de negocio.

---

## 📋 Plan de Acción Inmediato

### Fase 1: Análisis (COMPLETADO)
- [x] Crear `PLAN_SEPARACION_REPO.md`
- [x] Crear script `analyze-licenses.js`
- [x] Identificar archivos MIT vs Commercial

### Fase 2: Estructura de Directorios
- [ ] Crear estructura `src/core/`, `src/commercial/`, `src/enterprise/`
- [ ] Crear estructura `server/core/`, `server/commercial/`, `server/enterprise/`
- [ ] Mover archivos según licencia

### Fase 3: Headers Legales
- [ ] Ejecutar `scripts/add-license-headers.js`
- [ ] Verificar 100% de cobertura
- [ ] Validar headers correctos

### Fase 4: Enforcement Técnico
- [ ] Integrar `src/core/edition.js` en server
- [ ] Agregar validaciones en features Commercial
- [ ] Crear stubs para features Commercial (solo errores)

### Fase 5: Scripts de Validación
- [ ] Probar `scripts/prepare-mit-release.js`
- [ ] Validar que detecta código Commercial
- [ ] Crear release branch limpio

---

## 🔧 Archivos a Mover

### De `src/` a `src/core/` (MIT)
- `lokijs.js`
- `loki-hnsw-index.js`
- `loki-vector-plugin.js`
- `loki-indexed-adapter.js`
- `loki-fs-sync-adapter.js`
- Todos los otros adapters

### De `src/` a `src/commercial/` (Commercial)
- `loki-oplog.js` (versión avanzada con features Pro)
- `mru-cache.js` (versión avanzada)

### De `server/index.js` a Separar
- Versión básica → `server/core/index.js` (MIT)
- Features de replication → `server/commercial/replication/` (Commercial)
- Dashboard completo → `server/commercial/dashboard/` (Commercial)

---

## ⚠️ Consideraciones Críticas

### 1. Compatibilidad
- No romper imports existentes
- Mantener API pública estable
- Asegurar que MIT funciona independientemente

### 2. Historial Git
- Opción A: Crear nuevo repo para Commercial
- Opción B: Usar git-filter-branch
- Opción C: Mantener Commercial en repo privado

### 3. NPM Package
- Publicar solo `@lokivector/core` (MIT)
- Commercial en paquete separado o repo privado

---

## 🚨 Acción Requerida

**ANTES de hacer el repo público, ejecutar:**

```bash
# 1. Analizar código actual
node scripts/analyze-licenses.js

# 2. Separar código (manual o script)
# Mover archivos según PLAN_SEPARACION_REPO.md

# 3. Agregar headers
node scripts/add-license-headers.js

# 4. Validar release MIT-only
node scripts/prepare-mit-release.js

# 5. Crear release
./scripts/create-release.sh 0.1.0
```

---

## ✅ Checklist Final

- [ ] Código MIT completamente separado
- [ ] Headers legales en todos los archivos
- [ ] Enforcement técnico funcional
- [ ] Validación de release MIT-only pasa
- [ ] Tests pasan con código MIT solo
- [ ] Documentación actualizada
- [ ] NPM package preparado (solo MIT)

---

**Estado:** ⏳ **PENDIENTE - Ejecutar antes de lanzamiento**

