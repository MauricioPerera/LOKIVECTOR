# Plan de Separación: MIT vs Commercial

**Fecha:** 2025-12-06  
**Objetivo:** Separar código MIT de Commercial antes del lanzamiento público

---

## 🎯 Objetivo

Crear una estructura clara que permita:
- ✅ Publicar solo código MIT en GitHub
- ✅ Mantener código Commercial privado o en repositorio separado
- ✅ Enforcement técnico de licencias
- ✅ Headers legales en cada archivo
- ✅ Detección de edición en runtime

---

## 📁 Estructura Propuesta

### Estructura Actual
```
LokiJS/
├── src/                    (Mezclado MIT + Commercial)
├── server/                 (Mezclado MIT + Commercial)
├── docs/                   (MIT - documentación pública)
├── spec/                   (MIT - tests públicos)
└── ...
```

### Estructura Objetivo
```
LokiJS/
├── src/
│   ├── core/               ✅ MIT (público)
│   │   ├── lokijs.js
│   │   ├── loki-hnsw-index.js
│   │   ├── loki-vector-plugin.js
│   │   └── adapters/       (IndexedDB, FS, etc.)
│   │
│   ├── commercial/        ❌ Commercial (privado)
│   │   ├── loki-oplog.js   (versión avanzada)
│   │   └── mru-cache.js    (versión avanzada)
│   │
│   └── enterprise/         ❌ Enterprise (privado)
│       └── multi-tenant/
│
├── server/
│   ├── core/               ✅ MIT (público)
│   │   ├── index.js        (versión básica)
│   │   ├── auth/
│   │   │   └── api-keys.js (versión básica)
│   │   └── middleware/
│   │       ├── auth.js     (versión básica)
│   │       └── rate-limit.js (versión básica)
│   │
│   ├── commercial/         ❌ Commercial (privado)
│   │   ├── replication/
│   │   ├── advanced-cache/
│   │   └── dashboard/     (versión completa)
│   │
│   └── enterprise/         ❌ Enterprise (privado)
│       ├── multi-tenant/
│       ├── sso/
│       ├── rbac/
│       └── audit/
│
├── docs/                   ✅ MIT (público)
├── spec/                   ✅ MIT (público)
└── ...
```

---

## 📋 Mapeo de Archivos Actuales

### ✅ MIT (Público)

**Core Database:**
- `src/lokijs.js` → `src/core/lokijs.js`
- `src/loki-hnsw-index.js` → `src/core/loki-hnsw-index.js`
- `src/loki-vector-plugin.js` → `src/core/loki-vector-plugin.js`
- `src/loki-indexed-adapter.js` → `src/core/adapters/loki-indexed-adapter.js`
- `src/loki-fs-sync-adapter.js` → `src/core/adapters/loki-fs-sync-adapter.js`
- Todos los otros adapters → `src/core/adapters/`

**Server Básico:**
- `server/index.js` → `server/core/index.js` (versión básica, sin replication)
- `server/auth/api-keys.js` → `server/core/auth/api-keys.js` (versión básica)
- `server/middleware/auth.js` → `server/core/middleware/auth.js` (versión básica)
- `server/middleware/rate-limit.js` → `server/core/middleware/rate-limit.js` (versión básica)

**Documentación:**
- `docs/` → Todo público (MIT)
- `README.md` → Público
- `LICENSE` → Público
- `LICENSE_FEATURES.md` → Público
- `TRADEMARK_POLICY.md` → Público

**Tests:**
- `spec/` → Tests públicos (MIT features only)

### ❌ Commercial (Privado o Repo Separado)

**Replication:**
- `src/loki-oplog.js` → `src/commercial/loki-oplog.js` (versión avanzada)
- Código de replication en `server/index.js` → `server/commercial/replication/`

**Advanced Cache:**
- `src/mru-cache.js` → `src/commercial/mru-cache.js` (versión avanzada)

**Dashboard Completo:**
- `dashboard/index.html` → `server/commercial/dashboard/` (versión completa)

**Deployment Templates:**
- Templates avanzados → `deployment/commercial/`

### ❌ Enterprise (Privado)

**Multi-Tenancy:**
- `server/enterprise/multi-tenant/` (si existe)

**SSO/SAML:**
- `server/enterprise/sso/` (si existe)

**RBAC:**
- `server/enterprise/rbac/` (si existe)

**Audit:**
- `server/enterprise/audit/` (si existe)

---

## 🔧 Plan de Implementación

### Fase 1: Preparación (Ahora)
1. ✅ Crear estructura de directorios
2. ✅ Identificar todos los archivos MIT vs Commercial
3. ✅ Crear scripts de migración
4. ✅ Preparar headers legales

### Fase 2: Separación de Código
1. Mover archivos MIT a `src/core/` y `server/core/`
2. Mover archivos Commercial a `src/commercial/` y `server/commercial/`
3. Crear versiones "stub" de features Commercial (solo errores)
4. Actualizar imports y requires

### Fase 3: Headers Legales
1. Agregar headers MIT a todos los archivos en `core/`
2. Agregar headers Commercial a todos los archivos en `commercial/`
3. Verificar que todos los archivos tengan headers

### Fase 4: Enforcement Técnico
1. Crear sistema de detección de edición
2. Agregar validación de licencia en runtime
3. Crear mensajes de error claros

### Fase 5: Scripts de Publicación
1. Script para crear release MIT-only
2. Script para validar que no hay código Commercial
3. GitHub Action para releases seguros

---

## 📝 Headers Legales Requeridos

### Header MIT (src/core/*.js)
```javascript
/**
 * LokiVector Core - MIT Licensed
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * 
 * Commercial features are located in /commercial and /enterprise directories.
 * See LICENSE_FEATURES.md for details.
 */
```

### Header Commercial (src/commercial/*.js)
```javascript
/**
 * LokiVector Commercial Module - Proprietary License
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * This file is part of LokiVector Commercial Edition.
 * Unauthorized copying, hosting, or redistribution is prohibited.
 * 
 * This software is licensed under the LokiVector Commercial License.
 * See LICENSE-COMMERCIAL.md for terms.
 * 
 * For licensing inquiries: commercial@lokivector.io
 * 
 * All rights reserved.
 */
```

---

## 🛡️ Sistema de Detección de Edición

### Archivo: `src/core/edition.js`
```javascript
/**
 * Edition Detection
 * MIT Licensed
 */

const EDITION = process.env.LOKIVECTOR_EDITION || 
                process.env.EDITION || 
                'MIT';

module.exports = {
  EDITION,
  isMIT: () => EDITION === 'MIT',
  isPro: () => EDITION === 'PRO' || EDITION === 'COMMERCIAL',
  isEnterprise: () => EDITION === 'ENTERPRISE',
  
  requireCommercial: (featureName) => {
    if (EDITION === 'MIT') {
      throw new Error(
        `Feature "${featureName}" requires LokiVector Pro or Enterprise License. ` +
        `Contact commercial@lokivector.io for licensing information.`
      );
    }
  },
  
  requireEnterprise: (featureName) => {
    if (EDITION !== 'ENTERPRISE') {
      throw new Error(
        `Feature "${featureName}" requires LokiVector Enterprise License. ` +
        `Contact commercial@lokivector.io for licensing information.`
      );
    }
  }
};
```

---

## 📦 Scripts de Publicación

### Script: `scripts/prepare-mit-release.js`
```javascript
/**
 * Prepare MIT-only release
 * Removes all Commercial and Enterprise code
 */

const fs = require('fs');
const path = require('path');

// Lista de directorios a excluir
const EXCLUDE_DIRS = [
  'src/commercial',
  'src/enterprise',
  'server/commercial',
  'server/enterprise',
  'deployment/commercial',
  'deployment/enterprise'
];

// Lista de archivos a excluir
const EXCLUDE_FILES = [
  'LICENSE-COMMERCIAL.md', // Mantener referencia pero no código
  // ... otros archivos comerciales
];

function prepareMITRelease() {
  console.log('Preparing MIT-only release...');
  
  // Validar que no hay código Commercial
  EXCLUDE_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.error(`ERROR: Commercial directory found: ${dir}`);
      process.exit(1);
    }
  });
  
  console.log('✅ MIT release validated');
}
```

---

## ✅ Checklist de Separación

### Pre-Separación
- [ ] Crear estructura de directorios
- [ ] Identificar todos los archivos por licencia
- [ ] Crear plan de migración detallado

### Separación
- [ ] Mover código MIT a `core/`
- [ ] Mover código Commercial a `commercial/`
- [ ] Mover código Enterprise a `enterprise/`
- [ ] Actualizar todos los imports
- [ ] Crear stubs para features Commercial

### Headers
- [ ] Agregar headers MIT a archivos core
- [ ] Agregar headers Commercial a archivos commercial
- [ ] Verificar cobertura 100%

### Enforcement
- [ ] Crear sistema de detección de edición
- [ ] Agregar validaciones en runtime
- [ ] Crear mensajes de error claros

### Scripts
- [ ] Script de preparación de release MIT
- [ ] Script de validación
- [ ] GitHub Action para releases

### Testing
- [ ] Verificar que MIT funciona sin Commercial
- [ ] Verificar que Commercial requiere licencia
- [ ] Verificar que Enterprise requiere licencia
- [ ] Tests de enforcement

---

## 🚨 Consideraciones Críticas

### 1. Historial de Git
- Considerar crear nuevo repo para código Commercial
- O usar git-filter-branch para limpiar historial
- O mantener Commercial en repo privado separado

### 2. Compatibilidad
- Asegurar que código MIT funciona independientemente
- No romper imports existentes
- Mantener API pública estable

### 3. Documentación
- Actualizar todos los ejemplos
- Clarificar qué features requieren licencia
- Mantener documentación sincronizada

### 4. NPM Package
- Publicar solo `@lokivector/core` (MIT)
- Commercial features en paquete separado
- O en repositorio privado de NPM

---

## 📊 Estado Actual vs Objetivo

### Estado Actual
- ❌ Código MIT y Commercial mezclado
- ❌ Sin headers legales por archivo
- ❌ Sin enforcement técnico
- ❌ Sin separación clara

### Estado Objetivo
- ✅ Código MIT completamente separado
- ✅ Headers legales en todos los archivos
- ✅ Enforcement técnico funcional
- ✅ Separación clara y mantenible

---

**Próximo paso:** Ejecutar plan de separación
