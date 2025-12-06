# ✅ Release Checklist - v0.1.0 MIT-Only

**Fecha:** 2025-12-06  
**Versión:** 0.1.0  
**Edición:** Community Edition (MIT)

---

## 📋 Pre-Release Checklist

### Estructura y Código
- [x] Estructura core/commercial creada
- [x] Headers legales agregados (39 archivos)
- [x] Sistema de enforcement implementado
- [x] Imports actualizados
- [x] Tests actualizados
- [x] Scripts de validación funcionando

### Package Configuration
- [x] `package.json` actualizado:
  - [x] name: `@lokivector/core`
  - [x] description: Community Edition (MIT)
  - [x] main: `src/core/lokijs.js`
  - [x] files: Solo código MIT
- [x] `.npmignore` creado (excluye Commercial)

### Documentación
- [x] README.md actualizado
- [x] LICENSE presente
- [x] LICENSE_FEATURES.md presente
- [x] TRADEMARK_POLICY.md presente
- [x] EDITIONS.md presente
- [x] CHANGELOG.md actualizado

### Validación
- [ ] Ejecutar `node scripts/prepare-mit-release.js` → Debe pasar
- [ ] Ejecutar `npm test` → Todos los tests deben pasar
- [ ] Ejecutar `npm run lint` → Sin errores
- [ ] Verificar `npm pack --dry-run` → Solo incluye código MIT

---

## 🚀 Proceso de Release

### Paso 1: Preparar Branch
```bash
# Asegúrate de estar en main/master
git checkout main

# Crea release branch
git checkout -b release/v0.1.0-mit
```

### Paso 2: Validar Release
```bash
# Validar que no hay código Commercial
node scripts/prepare-mit-release.js

# Ejecutar tests
npm test

# Verificar lint
npm run lint
```

### Paso 3: Verificar Package
```bash
# Ver qué se incluirá en NPM
npm pack --dry-run

# Verificar que no incluye:
# - src/commercial/
# - server/commercial/
# - server/index.js (versión completa)
```

### Paso 4: Commit y Tag
```bash
# Agregar cambios
git add .

# Commit
git commit -m "Release v0.1.0 - MIT-only Community Edition

- Core database functionality (MIT)
- Vector search with HNSW (MIT)
- HTTP REST API (MIT)
- TCP server (MIT)
- Crash-tested durability (MIT)
- Comprehensive test suite

Commercial features available separately.
See LICENSE_FEATURES.md for details."

# Crear tag
git tag -a v0.1.0 -m "LokiVector v0.1.0 - Community Edition (MIT)"

# Push
git push origin release/v0.1.0
git push origin v0.1.0
```

### Paso 5: Crear GitHub Release

1. Ve a: https://github.com/MauricioPerera/db/releases/new
2. Selecciona tag: `v0.1.0`
3. Título: `LokiVector v0.1.0 - Community Edition (MIT)`
4. Descripción:

```markdown
## LokiVector Community Edition v0.1.0

First public release of LokiVector Community Edition.

### 🎉 Features

- **Document Store** - Fast, in-memory document database
- **Vector Search** - HNSW-based approximate nearest neighbor search
- **HTTP REST API** - Full REST API for database operations
- **TCP Server** - Low-latency TCP server for high-performance use cases
- **Crash-Tested Durability** - Validated recovery from crashes
- **Comprehensive Tests** - Full test suite with E2E crash recovery tests

### 📦 Installation

```bash
npm install @lokivector/core
```

### 📚 Documentation

- [README.md](README.md) - Getting started
- [LICENSE_FEATURES.md](LICENSE_FEATURES.md) - Feature comparison
- [EDITIONS.md](EDITIONS.md) - Edition details
- [docs/](docs/) - Technical documentation

### 📄 License

This release is **MIT Licensed**. Commercial features (replication, advanced cache, etc.) are available in Pro and Enterprise editions.

See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for details.

### 🔗 Links

- Documentation: [docs/](docs/)
- Commercial Licensing: commercial@lokivector.io
- Issues: [GitHub Issues](https://github.com/MauricioPerera/db/issues)

---

**Community Edition - MIT License**
```

### Paso 6: Publicar a NPM (Opcional)

```bash
# Verificar que estás en el release branch
git checkout release/v0.1.0

# Verificar package
npm pack --dry-run

# Publicar (si tienes acceso)
npm publish --access public
```

---

## ✅ Post-Release Checklist

### Inmediato
- [ ] Verificar que GitHub Release se creó correctamente
- [ ] Verificar que el tag está disponible
- [ ] Monitorear feedback inicial

### Primera Semana
- [ ] Responder a issues rápidamente
- [ ] Monitorear downloads en NPM
- [ ] Recopilar feedback de usuarios
- [ ] Documentar problemas comunes

### Seguimiento
- [ ] Planear próximas features
- [ ] Iterar basado en feedback
- [ ] Preparar siguiente release

---

## 🚨 Troubleshooting

### Validación falla
- Revisar archivos listados en `prepare-mit-release.js`
- Verificar headers MIT en archivos core
- Asegurar que tests están excluidos apropiadamente

### Tests fallan
- Verificar imports actualizados
- Ejecutar tests individualmente para identificar problema
- Revisar que no hay dependencias rotas

### NPM publish falla
- Verificar `.npmignore` incluye código Commercial
- Verificar `package.json` `files` array
- Probar con `npm pack` primero

---

## 📊 Métricas de Éxito

### Objetivos (30 días)
- ⭐ GitHub Stars: 100+
- 🍴 Forks: 20+
- 📥 NPM Downloads: 500+
- 💬 Issues/Discussions: 10+
- 📧 Commercial Inquiries: 2-5

### Señales de Éxito
- ✅ Comunidad activa en issues
- ✅ Contribuciones de la comunidad
- ✅ Casos de uso reales compartidos
- ✅ Feedback positivo en redes sociales
- ✅ Interés comercial medible

---

**Estado:** ✅ **LISTO PARA RELEASE**

**Última actualización:** 2025-12-06

