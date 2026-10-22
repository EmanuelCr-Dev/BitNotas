/* Generado desde Casos_de_Prueba-Sistema-Academico.xlsx y Diagrama_PERT. Ver tools/generar-historias.py */
window.VN = window.VN || {};
VN.HISTORIAS = [
 {
  "id": "HU-001",
  "cp": "CP-001",
  "titulo": "Diseño, programación e implementación de base de datos",
  "sprint": 1,
  "fechas": "10 - 15 de Agosto",
  "rol": "Administrador",
  "vista": "Configuración",
  "como": "Como equipo de desarrollo",
  "quiero": "contar con una base de datos diseñada e implementada",
  "para": "que el sistema almacene y consulte la información académica de forma consistente",
  "descripcion": "Verificar que la base de datos del Sistema Académico pueda ser diseñada, programada e implementada correctamente.",
  "precondiciones": "Contar con el diseño definido del sistema y el entorno disponible para implementar la base de datos.",
  "pasos": [
   "Diseñar la estructura de datos",
   "definir las entidades necesarias",
   "programar la base de datos",
   "ejecutar la implementación y verificar que la estructura quede disponible."
  ],
  "datos": "Estructura y definiciones de la base de datos del Sistema Académico.",
  "esperado": "La base de datos queda implementada correctamente y disponible para el funcionamiento del sistema.",
  "criterio": "La estructura se implementa sin errores y los elementos definidos quedan disponibles para ser utilizados por el sistema.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-002",
  "cp": "CP-002",
  "titulo": "Redacción de historias de usuarios",
  "sprint": 1,
  "fechas": "10 - 15 de Agosto",
  "rol": "Administrador",
  "vista": "Historias de usuario",
  "como": "Como equipo de desarrollo",
  "quiero": "tener las historias de usuario redactadas y organizadas",
  "para": "guiar el alcance, los sprints y las pruebas del proyecto",
  "descripcion": "Verificar que las historias de usuario del proyecto estén redactadas y organizadas correctamente.",
  "precondiciones": "Contar con los requerimientos funcionales identificados para el Sistema Académico.",
  "pasos": [
   "Revisar las historias de usuario",
   "verificar su identificación",
   "comprobar que estén redactadas y organizadas de acuerdo con el proyecto."
  ],
  "datos": "Historias de usuario HU-001 a HU-020 y sus descripciones.",
  "esperado": "Las historias de usuario quedan redactadas, identificadas y organizadas correctamente.",
  "criterio": "Las 20 historias están identificadas, tienen una descripción comprensible y corresponden a las funcionalidades definidas en el PERT.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-003",
  "cp": "CP-003",
  "titulo": "Visualizar Dashboard",
  "sprint": 2,
  "fechas": "18 - 26 de Agosto",
  "rol": "Todos",
  "vista": "Inicio",
  "como": "Como usuario del sistema",
  "quiero": "ver un panel de inicio con indicadores y accesos",
  "para": "conocer el estado académico de un vistazo según mi rol",
  "descripcion": "Verificar que el usuario pueda visualizar correctamente el Dashboard del Sistema Académico.",
  "precondiciones": "El sistema debe estar disponible y el módulo Dashboard debe estar implementado.",
  "pasos": [
   "Ingresar al sistema",
   "acceder al Dashboard",
   "verificar que la pantalla se muestre correctamente y que su contenido sea visible."
  ],
  "datos": "Acceso al sistema y navegación hacia Dashboard.",
  "esperado": "El Dashboard se visualiza correctamente sin errores de carga.",
  "criterio": "El Dashboard es accesible y su interfaz se muestra correctamente al usuario.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-004",
  "cp": "CP-004",
  "titulo": "Registrar estudiante",
  "sprint": 2,
  "fechas": "18 - 26 de Agosto",
  "rol": "Administrador",
  "vista": "Estudiantes",
  "como": "Como administrador",
  "quiero": "registrar un nuevo estudiante",
  "para": "que quede matriculado y con acceso al sistema",
  "descripcion": "Verificar que sea posible registrar un nuevo estudiante en el Sistema Académico.",
  "precondiciones": "El sistema debe estar disponible y el módulo de estudiantes debe permitir registros.",
  "pasos": [
   "Ingresar al módulo de estudiantes",
   "seleccionar la opción de registrar",
   "completar los datos solicitados",
   "guardar el registro."
  ],
  "datos": "Datos válidos correspondientes a un nuevo estudiante.",
  "esperado": "El estudiante se registra correctamente y queda disponible en el sistema.",
  "criterio": "Los datos obligatorios son aceptados, el registro se guarda sin errores y el nuevo estudiante puede ser consultado.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-005",
  "cp": "CP-005",
  "titulo": "Editar estudiante",
  "sprint": 2,
  "fechas": "18 - 26 de Agosto",
  "rol": "Administrador",
  "vista": "Estudiantes",
  "como": "Como administrador",
  "quiero": "editar los datos de un estudiante",
  "para": "mantener su información actualizada",
  "descripcion": "Verificar que un estudiante registrado pueda ser editado correctamente.",
  "precondiciones": "Debe existir al menos un estudiante registrado.",
  "pasos": [
   "Ingresar al módulo de estudiantes",
   "localizar un estudiante",
   "seleccionar editar",
   "modificar los datos permitidos",
   "guardar los cambios."
  ],
  "datos": "Estudiante existente y nuevos datos válidos.",
  "esperado": "Los cambios del estudiante se guardan correctamente y se muestran actualizados.",
  "criterio": "El registro existente puede editarse y la información modificada queda almacenada correctamente.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-006",
  "cp": "CP-006",
  "titulo": "Eliminar estudiante",
  "sprint": 3,
  "fechas": "26 de Agosto - 3 de Septiembre",
  "rol": "Administrador",
  "vista": "Estudiantes",
  "como": "Como administrador",
  "quiero": "eliminar un estudiante",
  "para": "retirar registros que ya no corresponden",
  "descripcion": "Verificar que un estudiante registrado pueda ser eliminado correctamente.",
  "precondiciones": "Debe existir al menos un estudiante registrado.",
  "pasos": [
   "Ingresar al módulo de estudiantes",
   "localizar el estudiante",
   "seleccionar eliminar",
   "confirmar la operación."
  ],
  "datos": "Identificador de un estudiante existente.",
  "esperado": "El estudiante seleccionado deja de aparecer como registro disponible.",
  "criterio": "La eliminación se ejecuta correctamente y el estudiante ya no aparece en la lista de registros.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-007",
  "cp": "CP-007",
  "titulo": "Buscar estudiante",
  "sprint": 3,
  "fechas": "26 de Agosto - 3 de Septiembre",
  "rol": "Administrador",
  "vista": "Estudiantes",
  "como": "Como administrador",
  "quiero": "buscar un estudiante",
  "para": "localizarlo rápidamente por nombre, código, correo o grado",
  "descripcion": "Verificar que el sistema permita buscar un estudiante registrado.",
  "precondiciones": "Debe existir al menos un estudiante registrado.",
  "pasos": [
   "Ingresar al módulo de estudiantes",
   "utilizar la opción de búsqueda",
   "introducir un criterio correspondiente a un estudiante existente",
   "ejecutar la búsqueda."
  ],
  "datos": "Criterio de búsqueda de un estudiante existente.",
  "esperado": "El sistema muestra el estudiante que coincide con el criterio ingresado.",
  "criterio": "La búsqueda devuelve correctamente el estudiante correspondiente al criterio proporcionado.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-008",
  "cp": "CP-008",
  "titulo": "Ver lista de estudiantes",
  "sprint": 3,
  "fechas": "26 de Agosto - 3 de Septiembre",
  "rol": "Administrador",
  "vista": "Estudiantes",
  "como": "Como administrador",
  "quiero": "ver la lista de estudiantes",
  "para": "consultar quiénes están registrados",
  "descripcion": "Verificar que el sistema permita visualizar la lista de estudiantes registrados.",
  "precondiciones": "Debe existir información de estudiantes registrada en el sistema.",
  "pasos": [
   "Ingresar al módulo de estudiantes",
   "acceder a la lista de registros",
   "revisar la información mostrada."
  ],
  "datos": "Registros de estudiantes existentes.",
  "esperado": "La lista de estudiantes se muestra correctamente.",
  "criterio": "Los estudiantes registrados aparecen en la lista y la información se presenta de forma legible.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-009",
  "cp": "CP-009",
  "titulo": "Registrar docente",
  "sprint": 3,
  "fechas": "26 de Agosto - 3 de Septiembre",
  "rol": "Administrador",
  "vista": "Docentes",
  "como": "Como administrador",
  "quiero": "registrar un nuevo docente",
  "para": "que pueda recibir cursos y acceder al sistema",
  "descripcion": "Verificar que sea posible registrar un nuevo docente en el Sistema Académico.",
  "precondiciones": "El sistema debe estar disponible y el módulo de docentes debe permitir registros.",
  "pasos": [
   "Ingresar al módulo de docentes",
   "seleccionar registrar",
   "completar los datos solicitados",
   "guardar el registro."
  ],
  "datos": "Datos válidos correspondientes a un nuevo docente.",
  "esperado": "El docente se registra correctamente y queda disponible en el sistema.",
  "criterio": "Los datos obligatorios son aceptados y el nuevo docente queda registrado sin errores.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-010",
  "cp": "CP-010",
  "titulo": "Editar docente",
  "sprint": 3,
  "fechas": "26 de Agosto - 3 de Septiembre",
  "rol": "Administrador",
  "vista": "Docentes",
  "como": "Como administrador",
  "quiero": "editar los datos de un docente",
  "para": "mantener su información actualizada",
  "descripcion": "Verificar que un docente registrado pueda ser editado correctamente.",
  "precondiciones": "Debe existir al menos un docente registrado.",
  "pasos": [
   "Ingresar al módulo de docentes",
   "localizar un docente",
   "seleccionar editar",
   "modificar los datos permitidos",
   "guardar los cambios."
  ],
  "datos": "Docente existente y nuevos datos válidos.",
  "esperado": "Los cambios del docente se guardan y se muestran actualizados.",
  "criterio": "El registro puede modificarse correctamente y los nuevos datos quedan almacenados.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-011",
  "cp": "CP-011",
  "titulo": "Eliminar docente",
  "sprint": 4,
  "fechas": "4 - 11 de Septiembre",
  "rol": "Administrador",
  "vista": "Docentes",
  "como": "Como administrador",
  "quiero": "eliminar un docente",
  "para": "retirar registros que ya no corresponden",
  "descripcion": "Verificar que un docente registrado pueda ser eliminado correctamente.",
  "precondiciones": "Debe existir al menos un docente registrado.",
  "pasos": [
   "Ingresar al módulo de docentes",
   "localizar el docente",
   "seleccionar eliminar",
   "confirmar la operación."
  ],
  "datos": "Identificador de un docente existente.",
  "esperado": "El docente seleccionado deja de aparecer como registro disponible.",
  "criterio": "La eliminación se ejecuta correctamente y el docente ya no aparece en la lista.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-012",
  "cp": "CP-012",
  "titulo": "Buscar docente",
  "sprint": 4,
  "fechas": "4 - 11 de Septiembre",
  "rol": "Administrador",
  "vista": "Docentes",
  "como": "Como administrador",
  "quiero": "buscar un docente",
  "para": "localizarlo rápidamente por nombre, código o especialidad",
  "descripcion": "Verificar que el sistema permita buscar un docente registrado.",
  "precondiciones": "Debe existir al menos un docente registrado.",
  "pasos": [
   "Ingresar al módulo de docentes",
   "utilizar la búsqueda",
   "introducir un criterio correspondiente a un docente existente",
   "ejecutar la búsqueda."
  ],
  "datos": "Criterio de búsqueda de un docente existente.",
  "esperado": "El sistema muestra el docente que coincide con el criterio ingresado.",
  "criterio": "La búsqueda identifica correctamente el docente correspondiente.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-013",
  "cp": "CP-013",
  "titulo": "Ver lista de docentes",
  "sprint": 4,
  "fechas": "4 - 11 de Septiembre",
  "rol": "Administrador",
  "vista": "Docentes",
  "como": "Como administrador",
  "quiero": "ver la lista de docentes",
  "para": "consultar quiénes están registrados",
  "descripcion": "Verificar que el sistema permita visualizar la lista de docentes registrados.",
  "precondiciones": "Debe existir información de docentes registrada en el sistema.",
  "pasos": [
   "Ingresar al módulo de docentes",
   "acceder a la lista",
   "revisar los registros mostrados."
  ],
  "datos": "Registros de docentes existentes.",
  "esperado": "La lista de docentes se muestra correctamente.",
  "criterio": "Los docentes registrados aparecen en la lista y la información se presenta correctamente.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-014",
  "cp": "CP-014",
  "titulo": "Registrar asignatura",
  "sprint": 4,
  "fechas": "4 - 11 de Septiembre",
  "rol": "Administrador",
  "vista": "Cursos",
  "como": "Como administrador",
  "quiero": "registrar una nueva asignatura",
  "para": "ofrecerla y asignarla a un docente y una sección",
  "descripcion": "Verificar que sea posible registrar una nueva asignatura en el Sistema Académico.",
  "precondiciones": "El sistema debe estar disponible y el módulo de asignaturas debe permitir registros.",
  "pasos": [
   "Ingresar al módulo de asignaturas",
   "seleccionar registrar",
   "completar los datos solicitados",
   "guardar el registro."
  ],
  "datos": "Datos válidos correspondientes a una nueva asignatura.",
  "esperado": "La asignatura se registra correctamente y queda disponible en el sistema.",
  "criterio": "Los datos requeridos son aceptados y la nueva asignatura queda registrada sin errores.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-015",
  "cp": "CP-015",
  "titulo": "Editar asignatura",
  "sprint": 4,
  "fechas": "4 - 11 de Septiembre",
  "rol": "Administrador",
  "vista": "Cursos",
  "como": "Como administrador",
  "quiero": "editar una asignatura",
  "para": "corregir su nombre o su estado",
  "descripcion": "Verificar que una asignatura registrada pueda ser editada correctamente.",
  "precondiciones": "Debe existir al menos una asignatura registrada.",
  "pasos": [
   "Ingresar al módulo de asignaturas",
   "localizar una asignatura",
   "seleccionar editar",
   "modificar los datos permitidos",
   "guardar los cambios."
  ],
  "datos": "Asignatura existente y nuevos datos válidos.",
  "esperado": "Los cambios de la asignatura se guardan correctamente y se muestran actualizados.",
  "criterio": "El registro puede modificarse y la información actualizada queda almacenada correctamente.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-016",
  "cp": "CP-016",
  "titulo": "Eliminar asignatura",
  "sprint": 5,
  "fechas": "12 - 18 de Septiembre",
  "rol": "Administrador",
  "vista": "Cursos",
  "como": "Como administrador",
  "quiero": "eliminar una asignatura",
  "para": "retirar asignaturas que no se utilizan",
  "descripcion": "Verificar que una asignatura registrada pueda ser eliminada correctamente.",
  "precondiciones": "Debe existir al menos una asignatura registrada.",
  "pasos": [
   "Ingresar al módulo de asignaturas",
   "localizar la asignatura",
   "seleccionar eliminar",
   "confirmar la operación."
  ],
  "datos": "Identificador de una asignatura existente.",
  "esperado": "La asignatura seleccionada deja de aparecer como registro disponible.",
  "criterio": "La eliminación se ejecuta correctamente y la asignatura ya no aparece en la lista.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-017",
  "cp": "CP-017",
  "titulo": "Buscar asignatura",
  "sprint": 5,
  "fechas": "12 - 18 de Septiembre",
  "rol": "Administrador",
  "vista": "Cursos",
  "como": "Como administrador",
  "quiero": "buscar una asignatura",
  "para": "localizarla rápidamente por nombre",
  "descripcion": "Verificar que el sistema permita buscar una asignatura registrada.",
  "precondiciones": "Debe existir al menos una asignatura registrada.",
  "pasos": [
   "Ingresar al módulo de asignaturas",
   "utilizar la búsqueda",
   "introducir un criterio correspondiente a una asignatura existente",
   "ejecutar la búsqueda."
  ],
  "datos": "Criterio de búsqueda de una asignatura existente.",
  "esperado": "El sistema muestra la asignatura que coincide con el criterio ingresado.",
  "criterio": "La búsqueda devuelve correctamente la asignatura correspondiente al criterio.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-018",
  "cp": "CP-018",
  "titulo": "Ver lista de asignaturas",
  "sprint": 5,
  "fechas": "12 - 18 de Septiembre",
  "rol": "Administrador",
  "vista": "Cursos",
  "como": "Como administrador",
  "quiero": "ver la lista de asignaturas",
  "para": "consultar el catálogo completo",
  "descripcion": "Verificar que el sistema permita visualizar la lista de asignaturas registradas.",
  "precondiciones": "Debe existir información de asignaturas registrada en el sistema.",
  "pasos": [
   "Ingresar al módulo de asignaturas",
   "acceder a la lista de registros",
   "revisar la información mostrada."
  ],
  "datos": "Registros de asignaturas existentes.",
  "esperado": "La lista de asignaturas se muestra correctamente.",
  "criterio": "Las asignaturas registradas aparecen en la lista y la información se presenta correctamente.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-019",
  "cp": "CP-019",
  "titulo": "Registrar nota",
  "sprint": 6,
  "fechas": "26 de Septiembre - 3 de Octubre",
  "rol": "Docente / Administrador",
  "vista": "Calificaciones",
  "como": "Como docente",
  "quiero": "registrar una nota de un estudiante de mis cursos",
  "para": "dejar constancia de su desempeño en el periodo",
  "descripcion": "Verificar que sea posible registrar una nueva nota en el Sistema Académico.",
  "precondiciones": "Debe existir la información necesaria para registrar una nota y el módulo de notas debe estar disponible.",
  "pasos": [
   "Ingresar al módulo de notas",
   "seleccionar registrar",
   "completar la información solicitada",
   "guardar el registro."
  ],
  "datos": "Datos válidos correspondientes a una nueva nota.",
  "esperado": "La nota se registra correctamente y queda disponible en el sistema.",
  "criterio": "Los datos requeridos son aceptados y la nueva nota queda registrada sin errores.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 },
 {
  "id": "HU-020",
  "cp": "CP-020",
  "titulo": "Editar nota",
  "sprint": 6,
  "fechas": "26 de Septiembre - 3 de Octubre",
  "rol": "Docente / Administrador",
  "vista": "Calificaciones",
  "como": "Como docente",
  "quiero": "editar una nota ya registrada",
  "para": "corregir errores mientras el periodo siga abierto",
  "descripcion": "Verificar que una nota registrada pueda ser editada correctamente.",
  "precondiciones": "Debe existir al menos una nota registrada.",
  "pasos": [
   "Ingresar al módulo de notas",
   "localizar una nota",
   "seleccionar editar",
   "modificar el valor o información permitida",
   "guardar los cambios."
  ],
  "datos": "Nota existente y nuevos datos válidos.",
  "esperado": "Los cambios de la nota se guardan correctamente y se muestran actualizados.",
  "criterio": "La nota existente puede modificarse y la información actualizada queda almacenada correctamente.",
  "tecnica": "Caja negra, partición de equivalencia",
  "herramienta": "Playwright"
 }
];
VN.SPRINTS = [
 {
  "n": 1,
  "fechas": "10 - 15 de Agosto",
  "historias": [
   "HU-001",
   "HU-002"
  ]
 },
 {
  "n": 2,
  "fechas": "18 - 26 de Agosto",
  "historias": [
   "HU-003",
   "HU-004",
   "HU-005"
  ]
 },
 {
  "n": 3,
  "fechas": "26 de Agosto - 3 de Septiembre",
  "historias": [
   "HU-006",
   "HU-007",
   "HU-008",
   "HU-009",
   "HU-010"
  ]
 },
 {
  "n": 4,
  "fechas": "4 - 11 de Septiembre",
  "historias": [
   "HU-011",
   "HU-012",
   "HU-013",
   "HU-014",
   "HU-015"
  ]
 },
 {
  "n": 5,
  "fechas": "12 - 18 de Septiembre",
  "historias": [
   "HU-016",
   "HU-017",
   "HU-018"
  ]
 },
 {
  "n": 6,
  "fechas": "26 de Septiembre - 3 de Octubre",
  "historias": [
   "HU-019",
   "HU-020"
  ]
 }
];
