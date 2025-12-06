# Guía: Push a Repositorio Público

**Repo Público:** https://github.com/MauricioPerera/LOKIVECTOR  
**Fecha:** 2025-12-06

---

## 🎯 Objetivo

Hacer push del código MIT-only al repositorio público de forma segura, sin exponer código Commercial.

---

## ⚠️ Importante

**NO hacer push directo desde el branch `main`** si contiene código Commercial.

Debemos crear un branch limpio con solo código MIT.

---

## 🚀 Proceso Recomendado

### Opción A: Script Automatizado (RECOMENDADO)

```bash
# Ejecutar script de preparación
./scripts/prepare-public-repo.sh

# El script:
# 1. Crea branch limpio
# 2. Remueve código Commercial
# 3. Valida release MIT-only
# 4. Prepara commit
```

### Opción B: Manual

#### Paso 1: Crear Branch Limpio

```bash
# Crear branch desde main
git checkout -b public-release

# Remover código Commercial
rm -rf src/commercial
rm -rf server/commercial

# Validar
node scripts/prepare-mit-release.js
```

#### Paso 2: Commit

```bash
git add -A
git commit -m "Public release - MIT-only Community Edition"
```

#### Paso 3: Push a Repo Público

```bash
# Push branch a repo público
git push public public-release:main

# O si quieres mantener branch separado
git push public public-release
```

---

## 📋 Checklist Antes de Push

- [ ] Código Commercial removido
- [ ] Validación MIT-only pasa
- [ ] Tests pasan (opcional, pero recomendado)
- [ ] package.json actualizado (@lokivector/core)
- [ ] README actualizado
- [ ] LICENSE presente
- [ ] Remote 'public' configurado

---

## 🔍 Verificación Post-Push

Después de hacer push, verificar en GitHub:

1. **Estructura de directorios:**
   - ✅ `src/core/` existe
   - ✅ `server/core/` existe
   - ❌ `src/commercial/` NO existe
   - ❌ `server/commercial/` NO existe

2. **Archivos clave:**
   - ✅ `package.json` con name: `@lokivector/core`
   - ✅ `README.md` presente
   - ✅ `LICENSE` presente
   - ✅ `LICENSE_FEATURES.md` presente

3. **Validación:**
   ```bash
   # Clonar repo público en directorio temporal
   cd /tmp
   git clone https://github.com/MauricioPerera/LOKIVECTOR.git test-public
   cd test-public
   
   # Validar
   node scripts/prepare-mit-release.js
   # Debe pasar sin errores
   ```

---

## 🛡️ Protecciones

### 1. Branch Protection (Recomendado)

En GitHub → Settings → Branches:
- Proteger branch `main`
- Requerir pull requests
- Bloquear pushes directos

### 2. GitHub Actions (Opcional)

Crear workflow que valide MIT-only en cada push:

```yaml
# .github/workflows/validate-mit.yml
name: Validate MIT-only
on: [push]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: node scripts/prepare-mit-release.js
```

---

## 🔄 Sincronización Futura

### Para actualizar repo público con cambios MIT:

```bash
# 1. En repo privado, hacer cambios en código MIT
# 2. Crear branch limpio
git checkout -b sync-public

# 3. Remover Commercial (si se agregó)
rm -rf src/commercial server/commercial

# 4. Push a repo público
git push public sync-public:main

# 5. Verificar en GitHub
```

### Para mantener ambos repos sincronizados:

```bash
# Script de sincronización (crear scripts/sync-public.sh)
# 1. Copiar cambios de core/ desde repo privado
# 2. Validar MIT-only
# 3. Push a repo público
```

---

## ⚠️ Qué NO Hacer

### ❌ NO hacer push directo desde main si tiene Commercial

```bash
# ❌ MAL
git push public main

# ✅ BIEN
git checkout -b public-release
# ... remover Commercial ...
git push public public-release:main
```

### ❌ NO usar force push

```bash
# ❌ MAL
git push public main --force

# ✅ BIEN
git push public public-release:main
```

### ❌ NO commitear código Commercial accidentalmente

Siempre validar antes de push:
```bash
node scripts/prepare-mit-release.js
```

---

## 📊 Estado Actual

- ✅ Remote 'public' configurado
- ✅ Script de preparación creado
- ✅ Validación MIT-only lista
- ⏳ Pendiente: Ejecutar preparación y push

---

## 🎯 Próximos Pasos

1. **Ejecutar preparación:**
   ```bash
   ./scripts/prepare-public-repo.sh
   ```

2. **Revisar cambios:**
   ```bash
   git diff main..prepare-public-release
   ```

3. **Push a repo público:**
   ```bash
   git push public prepare-public-release:main
   ```

4. **Verificar en GitHub:**
   - Ir a https://github.com/MauricioPerera/LOKIVECTOR
   - Verificar estructura
   - Verificar que no hay código Commercial

---

**Última actualización:** 2025-12-06

