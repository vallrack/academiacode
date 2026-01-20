#!/bin/bash
# Script para subir cambios a GitHub

# Mensaje de commit por defecto
COMMIT_MESSAGE="Feat: Add filtering and creator to challenges page"

# Permite pasar un mensaje de commit como argumento
if [ -n "$1" ]; then
  COMMIT_MESSAGE="$1"
fi

echo "🔄 Preparando archivos..."
git add .

echo "💾 Guardando cambios con el mensaje: '$COMMIT_MESSAGE'"
git commit -m "$COMMIT_MESSAGE"

echo "🚀 Subiendo cambios a GitHub..."
git push origin main

echo "✅ ¡Listo! Cambios subidos a la rama 'main'."
