# Modelo de Datos para el Sistema de Cursos (LMS)

Este documento define la estructura de datos que se utilizará en Firestore para gestionar los cursos, usuarios, matrículas y el progreso de los estudiantes.

## 1. Colección `users`

Almacena la información de los usuarios y sus roles dentro de la plataforma.

- **`name`**: (String) Nombre completo del usuario.
- **`email`**: (String) Correo electrónico único del usuario.
- **`role`**: (String) Define los permisos del usuario. Puede ser:
    - `student` (Estudiante): Rol por defecto. Puede matricularse y ver cursos.
    - `teacher` (Docente): Puede crear y gestionar sus propios cursos.
    - `admin` (Administrador): Tiene control total sobre la plataforma.
- **`createdAt`**: (Timestamp) Fecha de creación de la cuenta.

---

## 2. Colección `courses`

Almacena la información principal de cada curso.

- **`title`**: (String) Título del curso. _Ej: "Curso de Next.js desde Cero"_.
- **`description`**: (String) Descripción detallada de lo que enseña el curso.
- **`thumbnailUrl`**: (String) URL de la imagen de portada del curso.
- **`teacherId`**: (String) **Campo clave**. ID del documento del usuario (con rol `teacher`) que imparte el curso.
- **`groupId`**: (String, opcional) ID del grupo al que está asignado este curso. Permite gestionar el acceso para un grupo completo de estudiantes.
- **`isPublished`**: (Boolean) `true` si el curso es visible para los usuarios, `false` si es un borrador.

---

## 3. Colección `modules`

Agrupa las lecciones dentro de un curso en secciones temáticas.

- **`courseId`**: (String) ID del curso al que pertenece el módulo.
- **`title`**: (String) Título del módulo. _Ej: "Módulo 1: Fundamentos de React"_.
- **`order`**: (Number) Número para ordenar los módulos dentro del curso (0, 1, 2...).

---

## 4. Colección `lessons`

Contiene el material de aprendizaje de cada lección individual.

- **`courseId`**: (String) ID del curso al que pertenece.
- **`moduleId`**: (String) ID del módulo al que pertenece.
- **`title`**: (String) Título de la lección. _Ej: "1.1. ¿Qué son los Componentes?"_.
- **`content`**: (String) Contenido principal de la lección en formato de texto o Markdown.
- **`videoUrl`**: (String, opcional) URL del video de la lección (ej. de YouTube, Vimeo, etc.).
- **`documentUrl`**: (String, opcional) URL de un documento adjunto (PDF, slides, etc.).
- **`challengeId`**: (String, opcional) ID del desafío asociado a la lección.
- **`isFree`**: (Boolean) `true` si la lección es de acceso gratuito, `false` si requiere que el usuario esté inscrito.
- **`order`**: (Number) Número para ordenar las lecciones dentro de un módulo.

---

## 5. Colección `groups`

Define grupos de estudiantes, generalmente gestionados por un docente.

- **`name`**: (String) Nombre del grupo. _Ej: "Programación Avanzada - Semestre 2"_.
- **`teacherId`**: (String) ID del usuario (docente) que gestiona el grupo.
- **`createdAt`**: (Timestamp) Fecha de creación del grupo.

---

## 6. Colección `enrollments` (Inscripciones)

Relaciona a un usuario con un curso al que se ha inscrito.

- **`userId`**: (String) ID del usuario inscrito.
- **`courseId`**: (String) ID del curso en el que está inscrito.
- **`enrollmentDate`**: (Timestamp) Fecha en la que se realizó la inscripción.

---

## 7. Sub-colección `userProgress`

Guardará el progreso de un usuario dentro de un curso. Se puede anidar dentro de `enrollments`.

- **`lessonId`**: (String) ID de la lección completada.
- **`completedAt`**: (Timestamp) Fecha en la que se marcó como completada.
