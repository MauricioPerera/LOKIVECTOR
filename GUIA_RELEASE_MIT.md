# Guía: Crear Release MIT-Only

**Fecha:** 2025-12-06  
**Objetivo:** Crear un release branch limpio con solo código MIT para publicación pública

---

## 🎯 Objetivo

Crear un release branch que contenga **únicamente código MIT**, listo para:
- Publicación pública en GitHub
- Publicación en NPM
- Distribución como Community Edition

---

## 📋 Pre-requisitos

- ✅ Separación MIT vs Commercial completada
- ✅ Headers legales agregados
- ✅ Tests actualizados
- ✅ Scripts de validación funcionando

---

## 🚀 Proceso de Release

### Paso 1: Crear Release Branch

```bash
# Asegúrate de estar en la rama principal
git checkout main  # o master

# Crea un nuevo branch para el release
git checkout -b release/v0.1.0-mit

# O si prefieres usar un tag directamente
git checkout -b release/v0.1.0
```

### Paso 2: Remover Código Commercial

**Opción A: Remover completamente (recomendado para release público)**

```bash
# Remover directorios Commercial
rm -rf src/commercial
rm -rf server/commercial

# Remover archivos que usan Commercial
# (Opcional: mantener server/index.js pero documentar que requiere Commercial)
```

**Opción B: Mantener pero excluir del package**

Si quieres mantener el código Commercial en el repo pero no incluirlo en el package NPM:

```bash
# Crear .npmignore
echo "src/commercial/" >> .npmignore
echo "server/commercial/" >> .npmignore
echo "server/index.js" >> .npmignore  # Versión completa
```

### Paso 3: Actualizar Imports

Si removiste código Commercial, actualiza los imports:

```bash
# Buscar archivos que importan desde commercial/
grep -r "require.*commercial" . --exclude-dir=node_modules --exclude-dir=.git

# Actualizar a usar solo core/
# (La mayoría ya debería estar actualizado)
```

### Paso 4: Validar Release MIT-Only

```bash
# Ejecutar script de validación
node scripts/prepare-mit-release.js

# Debe pasar sin errores (o solo warnings esperados)
```

### Paso 5: Actualizar package.json

```json
{
  "name": "@lokivector/core",
  "version": "0.1.0",
  "description": "LokiVector Community Edition - MIT Licensed",
  "main": "src/core/lokijs.js",
  "files": [
    "src/core/",
    "server/core/",
    "docs/",
    "LICENSE",
    "LICENSE_FEATURES.md",
    "README.md"
  ]
}
```

### Paso 6: Actualizar README

Asegúrate de que el README indique claramente:

```markdown
## License & Editions

This is the **Community Edition** (MIT License).

Commercial features (replication, advanced cache, etc.) are available in:
- **Pro Edition** - Contact commercial@lokivector.io
- **Enterprise Edition** - Contact commercial@lokivector.io

See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for feature comparison.
See [EDITIONS.md](EDITIONS.md) for edition details.
```

### Paso 7: Commit y Tag

```bash
# Agregar cambios
git add .

# Commit
git commit -m "Release v0.1.0 - MIT-only Community Edition"

# Crear tag
git tag -a v0.1.0 -m "Release v0.1.0 - MIT-only Community Edition"

# Push
git push origin release/v0.1.0
git push origin v0.1.0
```

### Paso 8: Crear GitHub Release

1. Ve a GitHub → Releases → New Release
2. Selecciona el tag `v0.1.0`
3. Título: "LokiVector v0.1.0 - Community Edition (MIT)"
4. Descripción:
   ```markdown
   ## LokiVector Community Edition v0.1.0
   
   First public release of LokiVector Community Edition.
   
   ### Features
   - Document store with JSON-like documents
   - Vector search with HNSW index
   - HTTP REST API
   - TCP server
   - Crash-tested durability
   - Comprehensive test suite
   
   ### License
   This release is MIT-licensed. Commercial features available separately.
   
   See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for details.
   ```

### Paso 9: Publicar a NPM (Opcional)

```bash
# Asegúrate de estar en el release branch
git checkout release/v0.1.0

# Verificar package.json
npm version 0.1.0

# Publicar
npm publish --access public
```

---

## ✅ Checklist de Release

### Pre-Release
- [ ] Release branch creado
- [ ] Código Commercial removido o excluido
- [ ] Imports actualizados
- [ ] Validación MIT-only pasa
- [ ] package.json actualizado
- [ ] README actualizado
- [ ] Tests pasan

### Release
- [ ] Commit de release creado
- [ ] Tag creado
- [ ] Push a GitHub
- [ ] GitHub Release creado
- [ ] NPM publicado (si aplica)

### Post-Release
- [ ] Monitorear feedback
- [ ] Responder issues
- [ ] Documentar proceso para futuros releases

---

## 📝 Notas Importantes

### 1. Mantener Código Commercial

Si quieres mantener el código Commercial en el repositorio:

- **Opción A:** Mantener en branch separado (`commercial` o `pro`)
- **Opción B:** Mantener en directorios pero excluir de `.npmignore`
- **Opción C:** Repositorio privado separado

### 2. Versionado

- **MIT Release:** `v0.1.0`, `v0.2.0`, etc.
- **Commercial Release:** `v0.1.0-pro`, `v0.1.0-enterprise`, etc.

### 3. Documentación

Asegúrate de que:
- README indique claramente que es Community Edition
- LICENSE_FEATURES.md esté actualizado
- EDITIONS.md esté disponible
- Links a Commercial licensing estén presentes

---

## 🚨 Troubleshooting

### Validación falla

Si `prepare-mit-release.js` falla:

1. Revisa los archivos listados
2. Verifica que tienen headers MIT apropiados
3. Asegúrate de que tests/scripts están excluidos apropiadamente
4. Revisa que no hay código Commercial en archivos core

### Tests fallan después de remover Commercial

1. Verifica que tests de Commercial features están en `spec/commercial/` o excluidos
2. Actualiza imports en tests
3. Ejecuta solo tests MIT: `npm test -- --grep "MIT"`

### NPM publish falla

1. Verifica `.npmignore` incluye código Commercial
2. Verifica `package.json` `files` array
3. Prueba con `npm pack` primero para ver qué se incluirá

---

## 📚 Referencias

- `PLAN_SEPARACION_REPO.md` - Plan de separación completo
- `SEPARACION_COMPLETA.md` - Estado de separación
- `LICENSE_FEATURES.md` - Mapeo de features
- `EDITIONS.md` - Comparación de ediciones

---

**Última actualización:** 2025-12-06

