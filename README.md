# AcademiaCode - Instrucciones para Subir a GitHub

Esta guía te ayudará a subir tu proyecto a GitHub por primera vez.

---

### Opción 1: Pasos Manuales (Recomendado y compatible con Windows/Mac/Linux)

Sigue estos pasos en tu terminal (en Windows, puedes usar **Git Bash** que viene al instalar Git, o la Terminal de Windows).

**Paso 1: Ve al directorio de tu proyecto**
Abre tu terminal y navega a la carpeta donde se encuentran los archivos de este proyecto.

**Paso 2: Inicializa el repositorio de Git**
Si no lo has hecho antes, ejecuta este comando. Si ya existe una carpeta `.git`, puedes saltar este paso.
```bash
git init
```

**Paso 3: Añade todos los archivos al área de preparación**
Este comando prepara todos los archivos de tu proyecto para ser guardados en el historial de Git.
```bash
git add .
```

**Paso 4: Guarda los cambios (commit)**
Crea una "fotografía" del estado actual de tu proyecto con un mensaje descriptivo.
```bash
git commit -m "Primer commit del proyecto AcademiaCode"
```

**Paso 5: Renombra la rama principal a `main`**
Es una buena práctica usar `main` como el nombre de la rama principal.
```bash
git branch -M main
```

**Paso 6: Conecta tu repositorio local con GitHub**
Este comando le dice a tu Git local dónde está el repositorio remoto en GitHub.
```bash
git remote add origin https://github.com/vallrack/academiacode.git
```
> **Nota:** Si recibes un error que dice `remote origin already exists`, ejecuta `git remote remove origin` y luego vuelve a intentar el comando anterior.

**Paso 7: Sube tu código**
Finalmente, sube tus cambios a GitHub. La opción `-u` establece una relación de seguimiento para que en el futuro solo necesites escribir `git push`.
```bash
git push -u origin main
```
> Al ejecutar este comando, GitHub te pedirá que inicies sesión. Es posible que necesites usar un **Personal Access Token** en lugar de tu contraseña.

---

### Opción 2: Usar el Script (Solo para Mac/Linux)

Si estás en un sistema operativo tipo Unix (como macOS o Linux), puedes usar el script que preparé.

1.  **Da permisos de ejecución al script:**
    ```bash
    chmod +x upload_to_github.sh
    ```
2.  **Ejecuta el script:**
    ```bash
    ./upload_to_github.sh
    ```

¡Con esto, tu código debería estar en tu repositorio de GitHub! Si sigues teniendo problemas, asegúrate de tener Git instalado y de haber iniciado sesión correctamente en GitHub en tu máquina.