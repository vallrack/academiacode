#!/bin/bash
# Este script inicializa un repositorio de Git, añade todos los archivos del proyecto y los sube a tu repositorio remoto.

echo "Iniciando el proceso para subir a GitHub..."

# Verifica si el directorio .git ya existe
if [ -d ".git" ]; then
  echo "El repositorio Git ya ha sido inicializado."
else
  # 1. Inicializa el repositorio de Git
  git init
  echo "Repositorio Git inicializado."
fi

# 2. Añade todos los archivos al área de preparación
git add .
echo "Todos los archivos del proyecto han sido añadidos al área de preparación."

# 3. Realiza el primer commit (solo si hay cambios para commitear)
if [ -n "$(git status --porcelain)" ]; then
  git commit -m "feat: Initial project structure for AcademiaCode"
  echo "Commit inicial realizado."
else
  echo "No hay cambios para commitear."
fi

# 4. Cambia el nombre de la rama a 'main'
git branch -M main
echo "Rama principal renombrada a 'main'."

# 5. Añade el repositorio remoto (si no existe ya)
if ! git remote | grep -q "origin"; then
  git remote add origin https://github.com/vallrack/academiacode.git
  echo "Repositorio remoto 'origin' añadido."
else
  echo "El repositorio remoto 'origin' ya existe."
  git remote set-url origin https://github.com/vallrack/academiacode.git
  echo "URL del repositorio remoto 'origin' actualizada."
fi

# 6. Sube los cambios a la rama 'main'
echo "Subiendo los cambios a GitHub..."
git push -u origin main

echo "¡Proceso completado! Tu código debería estar en GitHub."
