# VitNota - Sistema de Gestión Académica

Guía de instalación, ejecución y uso. Incluye las credenciales de prueba, los roles, el stack tecnológico y, para cada historia de usuario (HU-001 a HU-020) del Excel de casos de prueba y del diagrama PERT, cómo probarla dentro de la web.

## Índice

1. [Resumen del proyecto](#1-resumen-del-proyecto)
2. [Qué se mejoró respecto a la versión original](#2-qué-se-mejoró-respecto-a-la-versión-original)
3. [Tecnologías y stack](#3-tecnologías-y-stack)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Cómo ejecutar el proyecto](#5-cómo-ejecutar-el-proyecto)
6. [Credenciales y roles](#6-credenciales-y-roles)
7. [Reglas de negocio y validaciones](#7-reglas-de-negocio-y-validaciones)
8. [Guía de uso por historia de usuario](#8-guía-de-uso-por-historia-de-usuario)
9. [Flujos transversales](#9-flujos-transversales)
10. [Pruebas automáticas](#10-pruebas-automáticas)
11. [Base de datos](#11-base-de-datos)
12. [Límites de esta versión y paso a producción](#12-límites-de-esta-versión-y-paso-a-producción)
13. [Solución de problemas](#13-solución-de-problemas)

---

## 1. Resumen del proyecto

VitNota es una aplicación web para gestionar estudiantes, docentes, asignaturas, calificaciones y asistencia, con acceso por roles (Administrador, Docente y Estudiante). Está construida con HTML, CSS y JavaScript puro, sin dependencias en el navegador, y mantiene la estructura y la estética de la versión original (mismo acceso con panel lateral rotativo, mismo menú lateral, mismas tarjetas de acceso rápido, tema claro y oscuro).

Cubre las 20 historias de usuario del PERT, organizadas en 6 sprints:

| Sprint | Fechas | Historias |
|---|---|---|
| 1 | 10 - 15 de Agosto | HU-001, HU-002 |
| 2 | 18 - 26 de Agosto | HU-003, HU-004, HU-005 |
| 3 | 26 de Agosto - 3 de Septiembre | HU-006 a HU-010 |
| 4 | 4 - 11 de Septiembre | HU-011 a HU-015 |
| 5 | 12 - 18 de Septiembre | HU-016 a HU-018 |
| 6 | 26 de Septiembre - 3 de Octubre | HU-019, HU-020 |

El mismo diagrama, con el estado de cada caso de prueba, está dentro de la web en el módulo **Historias de usuario** (rol Administrador).

## 2. Qué se mejoró respecto a la versión original

- **La web ya funciona sola.** La versión original llamaba a una API (`/api/...`) que no venía en el proyecto, por lo que casi ninguna pantalla podía cargar datos. Ahora existe una capa de datos local (`assets/js/api/`) que responde a las mismas rutas, valida permisos, datos y reglas de integridad, y guarda todo en el navegador.
- **Estructura por carpetas.** El `index.html` de 1 200 líneas se separó en estilos, núcleo, capa de datos y un archivo por módulo. El nombre del archivo `aistencia.js` (con error de tipeo y que el `index.html` ni siquiera encontraba) y el código de asistencia duplicado dentro de `cursos-modulo.js` se unificaron en `modules/asistencia.js`.
- **Módulos nuevos que estaban como "Próximamente":** Calificaciones (HU-019 y HU-020), Reportes (boletín, estadísticas y exportación CSV), Configuración, y los módulos nuevos Historias de usuario y Mis notas.
- **Panel de inicio real (HU-003)** con indicadores y gráficos distintos para cada rol.
- **Validaciones completas** en cada formulario, con mensajes por campo y doble validación (en la pantalla y de nuevo en la capa de datos).
- **Eliminación segura:** confirmaciones propias (no los cuadros del navegador) y reglas de integridad.
- **Seguridad de acceso:** contraseñas con sal y hash, política de contraseñas, bloqueo por intentos fallidos, cierre por inactividad y permisos por rol.
- **Iconos profesionales:** todos los iconos son SVG vectoriales que heredan el color del tema. No hay emojis en ninguna pantalla (hay una prueba automática que lo comprueba).
- **Búsqueda, orden y paginación** en todas las tablas, ignorando tildes y mayúsculas.
- **Pruebas automáticas** (55) que ejecutan los pasos de los casos de prueba del Excel.

## 3. Tecnologías y stack

| Capa | Tecnología | Para qué se usa |
|---|---|---|
| Interfaz | HTML5 semántico, CSS3 (variables, grid, flex), JavaScript (ES2020) | Pantallas, tema claro y oscuro, diseño adaptable a móvil |
| Iconos | SVG propios (`assets/js/core/icons.js`) | Sustituyen a los emojis |
| Datos | `localStorage` del navegador, organizado en tablas relacionadas | Persistencia sin servidor (ver [sección 11](#11-base-de-datos)) |
| Sesión | `sessionStorage` | Mantiene la sesión mientras la pestaña esté abierta |
| Seguridad | SHA-256 propio con sal, 250 iteraciones | Almacenar contraseñas sin guardarlas en claro |
| Servidor de desarrollo | `http-server` (vía npm) o Live Server de VS Code | Servir los archivos estáticos |
| Pruebas | Node.js + jsdom | Ejecutar la web real y los flujos del Excel |

**Sobre Tailwind:** no se usa. Tu diseño original ya tiene su propio sistema de estilos (variables de color, tarjetas, tablas); mantenerlo evita mezclar dos sistemas y no depende de internet. La web funciona completamente sin conexión.

Los roles y la lógica de negocio viven en JavaScript puro, por lo que no hace falta compilar nada.

## 4. Estructura de carpetas

```
web-gestion-notas/
├── index.html                     Estructura de la página (acceso y panel)
├── GUIA.md                        Este documento
├── package.json                   Scripts: start, dev, test
├── assets/
│   ├── css/
│   │   ├── styles.css             Estilos originales (tema, acceso, panel, tablas)
│   │   └── extras.css             Componentes nuevos (validación, gráficos, insignias)
│   └── js/
│       ├── app.js                 Armazón: acceso, menú, navegación, sesión
│       ├── core/                  Configuración, utilidades, validación, seguridad,
│       │                          reglas académicas, base de datos, datos de demostración,
│       │                          iconos y componentes de interfaz
│       ├── data/historias.js      20 historias, sprints y casos de prueba (generado del Excel)
│       ├── api/                   Capa de datos: autenticación, personas, académico,
│       │                          notas, sistema y reportes
│       └── modules/               Una pantalla por archivo: inicio, personas, perfil,
│                                  cursos, asistencia, calificaciones, reportes,
│                                  historias, configuración
├── docs/BASE-DE-DATOS.md          Tablas, relaciones y reglas de integridad
├── tests/                         Pruebas automáticas
└── tools/generar-historias.py     Regenera data/historias.js desde el Excel
```

Los scripts se cargan en orden desde `index.html` y comparten un único espacio de nombres (`VN`). No se usan módulos ES, por lo que la web también abre haciendo doble clic en `index.html`.

## 5. Cómo ejecutar el proyecto

### Opción A: Live Server en VS Code (la más simple)

1. Abre la carpeta del proyecto en VS Code.
2. Instala la extensión **Live Server** (Ritwick Dey).
3. Clic derecho sobre `index.html` y elige **Open with Live Server**.
4. Se abre en `http://127.0.0.1:5500`.

### Opción B: npm

Requiere Node.js 18 o superior.

```bash
npm install
npm start
```

`npm start` sirve la web en `http://localhost:5500` y abre el navegador. Si no quieres que lo abra, usa `npm run dev`.

### Opción C: sin instalar nada

Haz doble clic en `index.html`. Funciona, aunque los datos quedan guardados por separado de los de `localhost` (cada dirección tiene su propio almacenamiento). Para pruebas serias usa la opción A o B.

### Importante sobre los datos

Los datos viven en el navegador y son distintos para cada dirección y navegador (`localhost:5500`, `127.0.0.1:5500` y `file://` no comparten datos). Para volver a empezar: **Configuración > Base de datos > Restablecer datos de demostración**.

## 6. Credenciales y roles

### Cuentas de demostración

| Rol | Correo | Contraseña | Quién es |
|---|---|---|---|
| Administrador | `admin@vitnota.edu.ni` | `Admin2026*` | Administración del sistema |
| Docente | `docente@vitnota.edu.ni` | `Docente2026*` | Carlos Mendoza (Matemáticas e Informática, 5 cursos) |
| Estudiante | `estudiante@vitnota.edu.ni` | `Estudiante2026*` | Daniela Pérez (Séptimo Grado, Sección 1) |

Otros docentes de ejemplo (misma contraseña `Docente2026*`): `maria.lopez@vitnota.edu.ni`, `jose.gutierrez@vitnota.edu.ni`, `ana.martinez@vitnota.edu.ni`.
Otros estudiantes de ejemplo (misma contraseña `Estudiante2026*`): `kevin.ortiz@`, `valeria.cruz@`, `marcos.silva@`, `camila.guzman@`, `gabriela.mejia@`, `stephanie.blandon@` y otros, todos terminados en `@vitnota.edu.ni`.

### Cuentas que crees tú

Al registrar un estudiante o docente, el sistema crea su acceso automáticamente con el formato `nombre.apellido@vitnota.edu.ni` y una **contraseña temporal** que se muestra una sola vez en pantalla (con botón Copiar). La persona debe cambiarla en su primer ingreso.

### Qué puede hacer cada rol

| Módulo | Administrador | Docente | Estudiante |
|---|---|---|---|
| Inicio (panel con indicadores) | Sí, global | Sí, de sus cursos | Sí, personal |
| Estudiantes (registrar, editar, eliminar, buscar, listar) | Sí | No | No |
| Docentes (registrar, editar, eliminar, buscar, listar) | Sí | No | No |
| Cursos (asignaturas y asignar docentes) | Sí | No | No |
| Mis cursos | No | Sí, con lista de alumnos | Sí |
| Calificaciones (registrar y editar notas) | Sí, todos los cursos | Sí, solo sus cursos | No |
| Mis notas | No | No | Sí |
| Asistencia | No | Sí, de sus cursos | No |
| Mi asistencia | No | No | Sí |
| Reportes (boletín, estadísticas, CSV) | Sí | No | No |
| Historias de usuario | Sí | No | No |
| Configuración | Sí | No | No |
| Mi perfil | No | Sí | Sí |

Los permisos se comprueban en la capa de datos, no solo en el menú: un docente no puede ver ni modificar las notas de un curso que no es suyo, aunque conozca su identificador.

## 7. Reglas de negocio y validaciones

**Acceso**
- Contraseña nueva: mínimo 8 caracteres, con mayúsculas, minúsculas y un número. No puede ser igual a la actual ni contener la parte inicial del correo.
- 5 intentos fallidos bloquean la cuenta 5 minutos. El mensaje indica los intentos que quedan.
- La sesión se cierra tras 30 minutos sin actividad.
- El código de recuperación tiene 6 dígitos, vence en 15 minutos y se invalida tras 5 intentos fallidos.

**Personas**
- Nombres y apellidos: solo letras, espacios, guion y apóstrofo (2 a 50 caracteres). Se normalizan a mayúscula inicial.
- Teléfono (opcional): 8 dígitos que inicien en 2, 5, 7 u 8. Acepta `8888 7777`, `8888-7777` o `+505 8888 7777` y lo guarda como `8888-7777`.
- Correo personal (obligatorio): formato válido y único; se usa para recuperar la contraseña.
- Fecha de nacimiento del estudiante: no futura, edad entre 10 y 25 años.
- No se permiten dos estudiantes con los mismos nombres, apellidos y fecha de nacimiento.

**Asignaturas y cursos**
- Nombre de 3 a 60 caracteres, único sin importar tildes ni mayúsculas.
- Una asignatura no se asigna dos veces a la misma sección en el mismo año, ni si está inactiva.
- Una asignatura asignada a un curso no se elimina (se desactiva). Una asignación con notas no se quita. Un docente con cursos no se elimina.

**Notas**
- Valor de 0 a 100, hasta 2 decimales (acepta coma o punto).
- Escala: **AA** 90 a 100, **AS** 76 a 89, **AF** desde la nota mínima hasta 75, **AI** por debajo de la nota mínima. La nota mínima de aprobación es 60 y se puede cambiar (50 a 75) en Configuración.
- No se repite la misma evaluación para el mismo estudiante, curso y periodo.
- Un periodo cerrado no admite registrar ni editar notas.
- El promedio de un curso es la media de los promedios de los periodos que tienen notas.

## 8. Guía de uso por historia de usuario

Cada historia indica el caso de prueba del Excel, el rol, el camino en la web y qué debe ocurrir. Todos los pasos se pueden repetir con las cuentas de la [sección 6](#6-credenciales-y-roles).

### HU-001 (CP-001): Diseño, programación e implementación de base de datos

- **Rol:** Administrador.
- **Dónde:** menú **Configuración**, panel **Base de datos**.
- **Cómo probar:**
  1. Revisa el recuento de registros de las 13 tablas.
  2. Pulsa **Exportar respaldo** para descargar el JSON completo.
  3. Pulsa **Restaurar respaldo** y elige ese mismo archivo; el sistema valida su estructura y pide iniciar sesión de nuevo.
  4. Elige un archivo cualquiera que no sea un respaldo y comprueba que se rechaza con un mensaje.
- **Resultado esperado:** la base existe, está disponible y se puede respaldar y restaurar. El diseño completo está en `docs/BASE-DE-DATOS.md`.

### HU-002 (CP-002): Redacción de historias de usuarios

- **Rol:** Administrador.
- **Dónde:** menú **Historias de usuario**.
- **Cómo probar:**
  1. Verifica el diagrama PERT con los 6 sprints y sus fechas.
  2. Abre cualquier historia: verás su redacción, precondiciones, pasos, datos de entrada, resultado esperado, criterio de aceptación, técnica y herramienta.
  3. Usa el buscador (por ejemplo `docente` o `CP-012`).
  4. En una historia, pulsa **Ir al módulo** para saltar a la pantalla que se prueba, ejecuta los pasos y luego elige **Aprobado** o **Fallido** y guarda. Un resultado Fallido exige describir el fallo.
- **Resultado esperado:** las 20 historias están identificadas y el avance de las pruebas queda registrado y coloreado en el diagrama.

### HU-003 (CP-003): Visualizar Dashboard

- **Rol:** todos.
- **Dónde:** menú **Inicio**.
- **Cómo probar:** entra con cada una de las tres cuentas.
  - Administrador: 8 indicadores, rendimiento por escala, promedio por asignatura y actividad reciente.
  - Docente: sus cursos, estudiantes a cargo, notas registradas, promedio, aprobación y sus últimas notas.
  - Estudiante: promedio general con su escala, cursos, asistencia y sus últimas notas.
  Debajo de cada panel hay accesos rápidos a los módulos de su rol.
- **Resultado esperado:** la pantalla carga sin errores y muestra datos reales.

### HU-004 (CP-004): Registrar estudiante

- **Rol:** Administrador.
- **Dónde:** **Estudiantes > Nuevo estudiante**.
- **Cómo probar:**
  1. Pulsa **Guardar** sin llenar nada: se marcan en rojo los campos obligatorios.
  2. Prueba datos inválidos: nombre con números, teléfono `123`, correo `mario@`, fecha futura.
  3. Completa datos válidos, elige grado y sección, y guarda.
- **Resultado esperado:** aparece una ventana con el correo y la contraseña temporal; el estudiante queda en la lista, matriculado y listo para ingresar. Registrar el mismo estudiante dos veces, o repetir el correo personal, se rechaza.

### HU-005 (CP-005): Editar estudiante

- **Rol:** Administrador.
- **Dónde:** **Estudiantes**, botón **Editar** de la fila.
- **Cómo probar:** cambia nombre, teléfono o dirección y guarda; también prueba un dato inválido. El grado y sección se muestran como información (no se cambian desde aquí para no descuadrar sus notas).
- **Resultado esperado:** la lista muestra los datos actualizados y la persona verá su nombre actualizado en su próximo ingreso.

### HU-006 (CP-006): Eliminar estudiante

- **Rol:** Administrador.
- **Dónde:** **Estudiantes**, botón **Eliminar**.
- **Cómo probar:** pulsa Eliminar; el mensaje indica cuántas notas y registros de asistencia se borrarán junto con su acceso. Cancela una vez, luego confirma.
- **Resultado esperado:** el estudiante desaparece de la lista y ya no puede iniciar sesión.

### HU-007 (CP-007): Buscar estudiante

- **Rol:** Administrador.
- **Dónde:** **Estudiantes**, caja de búsqueda superior.
- **Cómo probar:** escribe parte del nombre, código (`EST-2026-0003`), correo o grado. Funciona sin tildes ni mayúsculas (`perez` encuentra `Pérez`) y con varias palabras. Pulsa la X para limpiar. Una búsqueda sin coincidencias muestra "Sin resultados".
- **Resultado esperado:** la tabla muestra solo las coincidencias y cuántas hay.

### HU-008 (CP-008): Ver lista de estudiantes

- **Rol:** Administrador.
- **Dónde:** **Estudiantes**.
- **Cómo probar:** revisa la tabla (código, nombre, correo de acceso, grado y sección); pulsa los encabezados para ordenar; usa la paginación (10 por página).
- **Resultado esperado:** todos los estudiantes se muestran de forma legible.

### HU-009 a HU-013 (CP-009 a CP-013): Docentes

Funcionan igual que las historias de estudiantes, en el menú **Docentes**:

| Historia | Acción | Detalle |
|---|---|---|
| HU-009 | Registrar docente | **Nuevo docente**: nombres, apellidos, especialidad y correo personal son obligatorios. Se entrega correo y contraseña temporal. |
| HU-010 | Editar docente | Botón **Editar**: se actualizan datos y especialidad. |
| HU-011 | Eliminar docente | Botón **Eliminar**. Si el docente tiene cursos asignados el sistema lo impide y explica por qué; para probar la eliminación con éxito, registra primero un docente nuevo (sin cursos) y elimínalo. |
| HU-012 | Buscar docente | Por nombre, código (`DOC-0002`), correo o especialidad. |
| HU-013 | Ver lista de docentes | Incluye cuántos cursos tiene cada docente en el año activo. |

Cada fila también tiene el botón **Clave**, que genera una nueva contraseña temporal si alguien la olvida (disponible también para estudiantes).

### HU-014 (CP-014): Registrar asignatura

- **Rol:** Administrador.
- **Dónde:** **Cursos > Asignaturas > Nueva asignatura**.
- **Cómo probar:** guarda vacío (error); escribe un nombre ya existente, incluso con otra tilde o mayúscula (rechazado); escribe un nombre válido.
- **Resultado esperado:** la asignatura queda activa en la lista y disponible para asignarla a un docente y una sección en la pestaña **Asignar docentes**.

### HU-015 (CP-015): Editar asignatura

- **Dónde:** **Cursos > Asignaturas**, botón **Editar** (cambia el nombre) y **Desactivar / Activar** (cambia el estado).
- **Resultado esperado:** los cambios se ven en la lista. Una asignatura inactiva no se puede asignar a nuevos cursos.

### HU-016 (CP-016): Eliminar asignatura

- **Dónde:** **Cursos > Asignaturas**, botón **Eliminar**.
- **Cómo probar:** crea una asignatura nueva y elimínala (se elimina). Luego intenta eliminar `Matemáticas`: el sistema lo impide porque está asignada a cursos y sugiere desactivarla.
- **Resultado esperado:** la asignatura eliminada deja de aparecer en la lista.

### HU-017 (CP-017): Buscar asignatura

- **Dónde:** **Cursos > Asignaturas**, caja de búsqueda. Funciona por nombre y por estado (`activa`, `inactiva`), sin tildes.

### HU-018 (CP-018): Ver lista de asignaturas

- **Dónde:** **Cursos > Asignaturas**. Muestra nombre, estado y cuántos cursos tienen asignada cada asignatura; se puede ordenar por cada columna.

### HU-019 (CP-019): Registrar nota

- **Rol:** Docente (sus cursos) o Administrador (todos).
- **Dónde:** **Calificaciones > Registrar nota**.
- **Cómo probar:**
  1. Entra como `docente@vitnota.edu.ni`, abre **Calificaciones** y elige un curso.
  2. Pulsa **Registrar nota** y guarda vacío: se marcan los campos obligatorios.
  3. Prueba notas inválidas: `150`, `-3`, `abc`, `85.555`.
  4. Elige estudiante y periodo, escribe una evaluación (por ejemplo `Examen final`) y una nota `92,5`. Mientras escribes verás la escala equivalente (AA, AS, AF o AI).
  5. Intenta registrar la misma evaluación otra vez para ese estudiante y periodo: se rechaza.
- **Resultado esperado:** la nota aparece en la tabla con su escala; el estudiante la ve en **Mis notas**; el promedio del curso y del panel se actualizan. La pestaña **Resumen por periodo** muestra la matriz de promedios.

### HU-020 (CP-020): Editar nota

- **Rol:** Docente o Administrador.
- **Dónde:** **Calificaciones**, botón **Editar** de la nota.
- **Cómo probar:** cambia el valor, el nombre de la evaluación o la observación y guarda. Después cierra un periodo (Configuración, como administrador) y comprueba que las notas de ese periodo ya no se pueden editar (aparece "Cerrado" en lugar del botón).
- **Resultado esperado:** la nota queda actualizada y marcada como **Editada**; el cambio se registra en la auditoría.

### Funciones adicionales (fuera de las 20 historias)

- **Asistencia** (docente) y **Mi asistencia** (estudiante).
- **Reportes** (administrador): boletín por estudiante con impresión, estadísticas por curso y exportación de todas las notas a CSV.
- **Mi perfil** (administrador, docente y estudiante): datos personales, cambio de contraseña y configuración de preguntas de seguridad personales.
- **Crear cuenta / Autoregistro**: estudiantes y docentes pueden registrarse desde el inicio con su rol, datos personales, contraseña y pregunta de seguridad.

## 9. Flujos transversales

**Primer ingreso de una persona nueva.** Inicia sesión con la contraseña temporal; el sistema pide crear una nueva (con indicador de fortaleza y lista de requisitos) y luego entra.

**Recuperación de contraseña mediante preguntas de seguridad (Principal).**
1. En la pantalla de inicio de sesión, pulsa **¿Olvidaste tu contraseña?**.
2. Escribe tu correo institucional (BitNotas) o tu correo personal registrado y pulsa **Buscar cuenta**.
3. El sistema identifica la cuenta y muestra la **pregunta de seguridad personal** configurada (por ejemplo: "¿Cuál es el nombre de tu mascota favorita?" o "¿Cuál es tu color favorito?").
4. Escribe la respuesta correspondiente y pulsa **Verificar y continuar**.
5. Al validar la identidad, se abre una **ventana emergente modal centrada**:
   - Da aviso de que la identidad fue confirmada con éxito.
   - Da dos opciones:
     * **Aceptar (Restablecer ahorita):** Abre el formulario emergente para definir y confirmar una nueva contraseña de inmediato.
     * **Cancelar (Ir a mi cuenta):** Inicia sesión directamente en la cuenta para que el usuario pueda restablecerla cuando desee desde el apartado **Mi perfil**.

**Restablecer contraseña por parte del Administrador.**
- **Solo el Administrador** (o roles con permisos asignados de administrador) tiene acceso a restablecer la contraseña de estudiantes o docentes registrados.
- En los módulos **Estudiantes** y **Docentes**, el botón **Clave** abre un diálogo donde el administrador puede elegir entre:
  * Generar una contraseña temporal aleatoria.
  * Asignar manualmente una nueva contraseña personalizada que cumpla con las políticas de seguridad.
- Al confirmar, el sistema actualiza la credencial, levanta cualquier bloqueo temporal por intentos fallidos y registra la acción en la auditoría del sistema.

**Recuperación alternativa por código de 6 dígitos.** En la pantalla de recuperación también se conserva la opción de solicitar un código numérico de 6 dígitos con vigencia de 15 minutos (mostrado en modo demostración en pantalla).

**Bloqueo de cuenta.** Equivócate 5 veces con la misma cuenta para ver el bloqueo de 5 minutos. El administrador puede desbloquear de inmediato con el botón **Clave** de esa persona.

**Cerrar un periodo.** Configuración > Periodos de calificación > **Cerrar**. Ese periodo queda en solo lectura para todos.

**Empezar de cero.** Configuración > Base de datos > **Restablecer datos de demostración** (pide escribir REINICIAR).

## 10. Pruebas automáticas

```bash
npm install
npm test
```

Se ejecutan 55 pruebas en unos segundos:

- **Capa de datos (24):** validaciones, permisos entre roles, integridad, bloqueo de cuenta, recuperación de contraseña, periodos cerrados, respaldo y restauración.
- **Interfaz (31):** carga la web real y ejecuta los pasos de los casos del Excel: dashboard (CP-003), estudiantes (CP-004 a CP-008), docentes (CP-009 a CP-013), asignaturas (CP-014 a CP-018), notas (CP-019 y CP-020), además de acceso, contraseña temporal, recuperación, historias de usuario, configuración, reportes y la ausencia de emojis y de errores de JavaScript.

El Excel indica Playwright como herramienta. Estas pruebas usan jsdom para poder ejecutarse en cualquier equipo sin descargar navegadores; si quieres repetirlas en un navegador real con Playwright, los flujos y los selectores son los mismos.

## 11. Base de datos

El diseño completo (tablas, campos, relaciones, reglas de integridad y respaldo) está en [`docs/BASE-DE-DATOS.md`](docs/BASE-DE-DATOS.md). Los datos se guardan en `localStorage` bajo la clave `vitnota.db.v1`. Si el contenido se daña, el sistema conserva una copia en `vitnota.db.v1.corrupta` y reconstruye los datos de demostración.

## 12. Límites de esta versión y paso a producción

Esta versión es completamente funcional para demostración, pruebas y entrega académica, pero conviene tener claro qué la distingue de un sistema en producción:

- **No hay servidor.** Los datos viven en el navegador de cada persona; otra persona en otro equipo no ve tus registros. Para uso real con varios usuarios hace falta un backend con base de datos.
- **La seguridad es del lado del cliente.** El hash de contraseñas y los permisos protegen la demostración, pero un usuario con conocimientos podría manipular su propio almacenamiento. En producción esas reglas deben ejecutarse en el servidor.
- **No se envían correos.** La recuperación de contraseña muestra el código en pantalla.
- **Cómo migrar.** Toda la interfaz habla con los datos mediante una sola función, `VN.pedir(metodo, ruta, cuerpo)`, en `assets/js/api/router.js`. Sustitúyela por una llamada `fetch('/api/' + ruta)` hacia tu servidor (Node, .NET, PHP u otro) con las mismas rutas y respuestas, y las pantallas seguirán funcionando sin cambios. Las validaciones de `core/validacion.js` se pueden reutilizar tal cual.

## 13. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| Veo pantalla en blanco o sin estilos | Se abrió un archivo suelto o falta una carpeta | Abre `index.html` desde la raíz del proyecto, con la carpeta `assets` al lado |
| Mis datos desaparecieron | Se abrió desde otra dirección (`localhost` en lugar de `127.0.0.1`) o se borró el almacenamiento | Usa siempre la misma dirección; restaura un respaldo exportado |
| "Tu sesión se cerró por inactividad" | Pasaron 30 minutos sin usar la web | Inicia sesión de nuevo |
| Cuenta bloqueada | 5 intentos fallidos | Espera 5 minutos o pide al administrador el botón **Clave** |
| `npm start` falla con el puerto en uso | Otro programa usa el 5500 | Cambia `-p 5500` en `package.json` |
| `npm test` no encuentra jsdom | No se instalaron las dependencias | Ejecuta `npm install` primero |
| La página muestra datos viejos tras actualizar el código | Caché del navegador | Recarga con Ctrl + F5 |

### Notas sobre el diagrama PERT

En el PERT, las etiquetas de actividad de los sprints 3 y 4 no coinciden exactamente con las historias que contienen (por ejemplo, el Sprint 3 dice "Gestión de estudiantes" pero incluye HU-009 y HU-010, que son de docentes; el Sprint 4 dice "Gestión de docentes" pero incluye HU-014 y HU-015, que son de asignaturas). Este proyecto sigue el **título de cada historia** (HU-001 a HU-020), que coincide con el Excel de casos de prueba. Si quieres, puedes corregir esas etiquetas en el diagrama.
