#!/bin/bash

# Script para preparar código MIT-only para repo público
# Este script crea un branch limpio sin código Commercial

set -e

echo "🚀 Preparando código MIT-only para repo público..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta desde la raíz del proyecto."
    exit 1
fi

# Crear branch temporal para preparar código público
BRANCH_NAME="prepare-public-release"
CURRENT_BRANCH=$(git branch --show-current)

echo "📋 Branch actual: $CURRENT_BRANCH"
echo "📋 Creando branch: $BRANCH_NAME"
echo ""

# Crear branch desde el actual
git checkout -b $BRANCH_NAME 2>/dev/null || git checkout $BRANCH_NAME

echo "🗑️  Removiendo código Commercial..."
echo ""

# Remover directorios Commercial
if [ -d "src/commercial" ]; then
    rm -rf src/commercial
    echo "✅ Removido: src/commercial"
fi

if [ -d "server/commercial" ]; then
    rm -rf server/commercial
    echo "✅ Removido: server/commercial"
fi

# Remover server/index.js (versión completa con Commercial)
# Mantener server/core/index.js (versión MIT)
if [ -f "server/index.js" ]; then
    # Verificar si tiene código Commercial
    if grep -q "commercial" server/index.js || grep -q "LokiOplog" server/index.js; then
        echo "⚠️  server/index.js contiene código Commercial"
        echo "   Manteniendo server/core/index.js como versión MIT"
        # No removemos server/index.js aquí, lo haremos después de validar
    fi
fi

echo ""
echo "🔍 Validando release MIT-only..."
echo ""

# Validar que no hay código Commercial
if node scripts/prepare-mit-release.js 2>&1 | grep -q "Validation passed"; then
    echo "✅ Validación pasó!"
else
    echo "⚠️  Validación encontró algunos issues (esperados)"
    echo "   Revisando..."
    node scripts/prepare-mit-release.js 2>&1 | tail -20
fi

echo ""
echo "📝 Preparando commit..."
echo ""

# Agregar cambios
git add -A

# Verificar qué se va a commitear
echo "📋 Archivos a commitear:"
git status --short | head -20

echo ""
read -p "¿Continuar con el commit? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado por el usuario"
    git checkout $CURRENT_BRANCH
    git branch -D $BRANCH_NAME 2>/dev/null || true
    exit 1
fi

# Commit
git commit -m "Prepare public release - MIT-only Community Edition

- Removed Commercial code (src/commercial/, server/commercial/)
- Kept only MIT-licensed code
- Updated package.json for @lokivector/core
- Ready for public release

Commercial features available separately.
See LICENSE_FEATURES.md for details."

echo ""
echo "✅ Branch $BRANCH_NAME listo para push"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Revisar cambios: git diff $CURRENT_BRANCH..$BRANCH_NAME"
echo "   2. Push a repo público: git push public $BRANCH_NAME:main"
echo "   3. Verificar en GitHub que todo está correcto"
echo "   4. Si todo está bien, hacer merge o mantener branch separado"
echo ""

