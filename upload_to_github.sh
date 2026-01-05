#!/bin/bash
# Este script inicializa un repositorio de Git, añade los archivos y los sube a tu repositorio remoto.

echo "Iniciando el proceso para subir a GitHub..."

# 1. Añade una línea al README para el commit inicial (si es necesario)
# La línea que proporcionaste ya está en el comando de commit.
# Si el README.md ya existe y tiene contenido, este paso es para asegurar
# que el primer commit tenga algo que registrar.
echo "# academiacode" >> README.md

# 2. Inicializa el repositorio de Git
git init
echo "Repositorio Git inicializado."

# 3. Añade todos los archivos al área de preparación
# Usaremos 'git add .' para añadir todos los archivos del proyecto, no solo el README.
git add .
echo "Todos los archivos añadidos al área de preparación."

# 4. Realiza el primer commit
git commit -m "first commit"
echo "Primer commit realizado."

# 5. Cambia el nombre de la rama a 'main'
git branch -M main
echo "Rama principal renombrada a 'main'."

# 6. Añade el repositorio remoto
git remote add origin https://github.com/vallrack/academiacode.git
echo "Repositorio remoto 'origin' añadido."

# 7. Sube los cambios a la rama 'main'
echo "Subiendo los cambios a GitHub..."
git push -u origin main

echo "¡Proceso completado! Tu código debería estar en GitHub."
