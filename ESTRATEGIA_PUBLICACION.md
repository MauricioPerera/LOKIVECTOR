# Estrategia de Publicación del Repositorio

**Fecha:** 2025-12-06  
**Situación:** Repositorio actualmente privado con código MIT + Commercial

---

## ⚠️ **NO hacer público todavía**

### Razón Principal

El repositorio actual contiene **código Commercial** en:
- `src/commercial/` (2 archivos)
- `server/commercial/` (1 archivo)
- `server/index.js` (versión completa con Commercial)

Si haces el repo público ahora, **cualquiera podrá acceder al código Commercial** sin licencia.

---

## ✅ Opciones Recomendadas

### Opción 1: Repositorio Separado (RECOMENDADO)

**Estructura:**
- **Repo Público:** `lokivector-core` (solo código MIT)
- **Repo Privado:** `lokivector-commercial` (código Commercial)

**Ventajas:**
- ✅ Separación clara y segura
- ✅ Fácil de mantener
- ✅ No hay riesgo de exponer código Commercial
- ✅ Modelo estándar (como Elastic, GitLab, etc.)

**Pasos:**
1. Crear nuevo repo público: `lokivector-core`
2. Copiar solo código MIT a nuevo repo
3. Mantener repo actual privado con todo el código
4. Sincronizar cambios MIT entre ambos repos

---

### Opción 2: Branch Separado (ALTERNATIVA)

**Estructura:**
- **Branch `main`:** Privado (MIT + Commercial)
- **Branch `public`:** Público (solo MIT)

**Ventajas:**
- ✅ Un solo repositorio
- ✅ Fácil de mantener sincronizado

**Desventajas:**
- ⚠️ Riesgo de exponer código Commercial si se hace push incorrecto
- ⚠️ Historial de git puede contener código Commercial

**Pasos:**
1. Crear branch `public` desde `main`
2. Remover código Commercial del branch `public`
3. Hacer branch `public` público
4. Mantener `main` privado

---

### Opción 3: Release Branch Público (MÁS SEGURO)

**Estructura:**
- **Repo:** Privado (MIT + Commercial)
- **Releases:** Tags públicos (solo código MIT)

**Ventajas:**
- ✅ Máximo control
- ✅ No expone código Commercial
- ✅ Releases validados

**Desventajas:**
- ⚠️ No hay acceso al código fuente completo públicamente
- ⚠️ Solo releases están disponibles

**Pasos:**
1. Mantener repo privado
2. Crear release branch MIT-only
3. Crear tag público desde release branch
4. Publicar releases en GitHub Releases

---

## 🎯 Recomendación: Opción 1 (Repositorio Separado)

### Por qué es la mejor opción:

1. **Seguridad Máxima**
   - Código Commercial nunca está en repo público
   - No hay riesgo de exposición accidental

2. **Modelo Estándar**
   - Usado por Elastic, GitLab, Sentry, n8n
   - Fácil de entender para usuarios

3. **Mantenimiento Simple**
   - Cambios MIT → repo público
   - Cambios Commercial → repo privado
   - Sincronización clara

4. **Escalabilidad**
   - Fácil agregar más repos (Enterprise, etc.)
   - Estructura clara para crecimiento

---

## 📋 Plan de Acción Recomendado

### Paso 1: Preparar Repo Público

```bash
# Crear nuevo directorio para repo público
cd ..
mkdir lokivector-core
cd lokivector-core
git init

# Copiar solo código MIT desde repo actual
cp -r ../LokiJS/src/core/* src/
cp -r ../LokiJS/server/core/* server/
cp ../LokiJS/package.json .
cp ../LokiJS/README.md .
cp ../LokiJS/LICENSE .
# ... otros archivos MIT

# Commit inicial
git add .
git commit -m "Initial commit - LokiVector Community Edition (MIT)"
```

### Paso 2: Configurar Repo Público

```bash
# Agregar remote
git remote add origin https://github.com/MauricioPerera/lokivector-core.git

# Push inicial
git push -u origin main
```

### Paso 3: Hacer Repo Público

1. Ve a GitHub → Settings → Danger Zone
2. Cambia visibilidad a "Public"
3. Confirma

### Paso 4: Mantener Sincronización

```bash
# Script para sincronizar cambios MIT
# (crear script que copie cambios de core/ entre repos)
```

---

## ⚠️ Qué NO hacer

### ❌ NO hacer público el repo actual con código Commercial

**Razones:**
- Cualquiera podrá ver código Commercial
- No podrás hacer cumplir la licencia Commercial
- Modelo de negocio comprometido
- Difícil de revertir después

### ❌ NO usar .gitignore para "ocultar" código Commercial

**Razones:**
- `.gitignore` no oculta código ya commiteado
- Historial de git contiene todo
- Fácil de acceder con `git log`

---

## ✅ Checklist Antes de Hacer Público

### Si usas Opción 1 (Repo Separado):
- [ ] Nuevo repo público creado
- [ ] Solo código MIT copiado
- [ ] Validación MIT-only pasa
- [ ] Tests pasan en repo público
- [ ] README actualizado
- [ ] LICENSE presente
- [ ] Repo público configurado en GitHub
- [ ] Visibilidad cambiada a "Public"

### Si usas Opción 2 (Branch Separado):
- [ ] Branch `public` creado
- [ ] Código Commercial removido
- [ ] Validación MIT-only pasa
- [ ] Branch `public` configurado como público
- [ ] Protecciones de branch configuradas
- [ ] `.gitignore` actualizado

### Si usas Opción 3 (Solo Releases):
- [ ] Release branch MIT-only creado
- [ ] Tag público creado
- [ ] GitHub Release publicado
- [ ] Repo principal permanece privado

---

## 🎯 Recomendación Final

**NO hacer público el repo actual todavía.**

**Hacer esto en su lugar:**

1. **Crear nuevo repo público** `lokivector-core`
2. **Copiar solo código MIT** al nuevo repo
3. **Validar** que no hay código Commercial
4. **Hacer público** el nuevo repo
5. **Mantener repo actual privado** con todo el código

---

## 📚 Referencias

- `PLAN_SEPARACION_REPO.md` - Plan de separación
- `GUIA_RELEASE_MIT.md` - Guía de release
- `RELEASE_CHECKLIST.md` - Checklist de release

---

**Última actualización:** 2025-12-06

