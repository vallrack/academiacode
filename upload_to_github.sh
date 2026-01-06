#!/bin/bash

# Mensaje de bienvenida
echo "🚀 Iniciando el proceso para subir tu código a GitHub..."
echo ""

# --- Configuración ---
# URL del repositorio remoto de GitHub.
REPO_URL="https://github.com/vallrack/academiacode.git"
# Mensaje para el commit. Puedes cambiarlo si quieres.
COMMIT_MESSAGE="Sincronización de cambios en AcademiaCode"

# --- Lógica del Script ---

# Paso 1: Inicializar el repositorio si no existe.
if [ ! -d ".git" ]; then
  echo "🔎 No se encontró un repositorio Git. Inicializando uno nuevo..."
  git init
  echo "✅ Repositorio Git inicializado."
  echo ""
else
  echo "✅ Repositorio Git ya existente."
  echo ""
fi

# Paso 2: Añadir todos los archivos.
echo "➕ Añadiendo todos los archivos al área de preparación (git add .)..."
git add .
echo "✅ Archivos añadidos."
echo ""

# Paso 3: Crear el commit.
echo "💾 Creando un nuevo commit con el mensaje: \"$COMMIT_MESSAGE\"..."
git commit -m "$COMMIT_MESSAGE"
# Comprobar si el commit se realizó o si no había nada que commitear
if [ $? -ne 0 ]; then
  echo "ℹ️ No había cambios nuevos que guardar. ¡Todo está al día!"
  echo ""
  # Si no hay cambios, podemos intentar hacer push de todas formas por si acaso
  # o simplemente salir. Vamos a intentar hacer push.
else
  echo "✅ Commit creado exitosamente."
  echo ""
fi

# Paso 4: Renombrar la rama a 'main'.
echo "🌿 Asegurando que la rama principal sea 'main'..."
git branch -M main
echo "✅ Rama principal es 'main'."
echo ""

# Paso 5: Conectar con el repositorio remoto.
# Verificamos si el remoto 'origin' ya existe.
if git remote get-url origin > /dev/null 2>&1; then
  echo "🔄 El remoto 'origin' ya existe. Verificando que la URL sea la correcta..."
  git remote set-url origin $REPO_URL
else
  echo "🔗 Añadiendo el repositorio remoto 'origin'..."
  git remote add origin $REPO_URL
fi
echo "✅ Repositorio remoto configurado a: $REPO_URL"
echo ""

# Paso 6: Subir los cambios a GitHub.
echo "☁️ Subiendo los cambios a la rama 'main' en GitHub (git push)..."
git push -u origin main

# Comprobar el resultado del push
if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 ¡Éxito! Tus cambios han sido subidos a GitHub."
  echo "Puedes verlos en: $REPO_URL"
else
  echo ""
  echo "❌ Hubo un error al subir los cambios a GitHub."
  echo "Por favor, revisa los mensajes de error de arriba."
  echo "Asegúrate de tener los permisos correctos y de haber configurado tu Personal Access Token si es necesario."
fi
