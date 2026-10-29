# Historias de Usuario - VitNota

Documento de las 20 historias de usuario del proyecto Sistema Académico (HU-001 a HU-020), organizadas en seis sprints según el diagrama PERT. Cada historia incluye su nombre, capturas tomadas de la propia aplicación VitNota y una descripción de lo que resuelve.

Las capturas corresponden a la aplicación en ejecución con los datos de demostración incluidos. Las historias HU-001 a HU-018 se ilustran con la cuenta de Administrador y las historias HU-019 y HU-020 con la cuenta de Docente. Las imágenes están en la carpeta `img/`.

## Índice

1. [Resumen de historias y sprints](#resumen-de-historias-y-sprints)
2. [HU-001: Diseño, programación e implementación de base de datos](#hu-001)
3. [HU-002: Redacción de historias de usuarios](#hu-002)
4. [HU-003: Visualizar Dashboard](#hu-003)
5. [HU-004: Registrar estudiante](#hu-004)
6. [HU-005: Editar estudiante](#hu-005)
7. [HU-006: Eliminar estudiante](#hu-006)
8. [HU-007: Buscar estudiante](#hu-007)
9. [HU-008: Ver lista de estudiantes](#hu-008)
10. [HU-009: Registrar docente](#hu-009)
11. [HU-010: Editar docente](#hu-010)
12. [HU-011: Eliminar docente](#hu-011)
13. [HU-012: Buscar docente](#hu-012)
14. [HU-013: Ver lista de docentes](#hu-013)
15. [HU-014: Registrar asignatura](#hu-014)
16. [HU-015: Editar asignatura](#hu-015)
17. [HU-016: Eliminar asignatura](#hu-016)
18. [HU-017: Buscar asignatura](#hu-017)
19. [HU-018: Ver lista de asignaturas](#hu-018)
20. [HU-019: Registrar nota](#hu-019)
21. [HU-020: Editar nota](#hu-020)

## Resumen de historias y sprints

| Sprint | Fechas | Historias |
|---|---|---|
| Sprint 1 | 10 - 15 de Agosto | HU-001 a HU-002 |
| Sprint 2 | 18 - 26 de Agosto | HU-003 a HU-005 |
| Sprint 3 | 26 de Agosto - 3 de Septiembre | HU-006 a HU-010 |
| Sprint 4 | 4 - 11 de Septiembre | HU-011 a HU-015 |
| Sprint 5 | 12 - 18 de Septiembre | HU-016 a HU-018 |
| Sprint 6 | 26 de Septiembre - 3 de Octubre | HU-019 a HU-020 |

<a id="hu-001"></a>

## HU-001: Diseño, programación e implementación de base de datos

**Sprint 1** (10 - 15 de Agosto) | **Rol:** Administrador | **Módulo:** Configuración | **Caso de prueba:** CP-001

**Historia:** Como equipo de desarrollo, quiero contar con una base de datos diseñada e implementada para que el sistema almacene y consulte la información académica de forma consistente.

![Panel Base de datos del módulo Configuración de VitNota, con el recuento de registros de cada tabla](img/HU-001-base-de-datos.png)

*Figura 001.1. Panel Base de datos dentro de Configuración.*

**Descripción**

VitNota guarda toda su información en una base de datos organizada en 13 tablas relacionadas entre sí: años lectivos, grados, secciones, usuarios, estudiantes, docentes, matrículas, asignaturas, asignaciones, notas, asistencias, recuperaciones y auditoría. Cada estudiante, docente, curso y nota queda enlazado con los demás mediante identificadores, de modo que una nota siempre pertenece a un estudiante matriculado y a un curso real.

La captura muestra el panel Base de datos del módulo Configuración. Allí se ve la versión del esquema, la fecha de creación, el espacio que ocupa y cuántos registros tiene cada tabla (por ejemplo 14 estudiantes, 4 docentes, 8 asignaturas y 246 notas). Desde el mismo panel el administrador puede exportar un respaldo, restaurarlo y restablecer los datos de demostración. El diseño completo de tablas y relaciones está documentado en docs/BASE-DE-DATOS.md.

### Código Fuente de la Historia de Usuario (HU-001)

```javascript
/* assets/js/core/db.js - Persistencia y Transacciones Atómicas en LocalStorage */
const TABLAS = ['anios', 'grados', 'secciones', 'usuarios', 'estudiantes', 'docentes', 'matriculas',
  'asignaturas', 'asignaciones', 'notas', 'asistencias', 'recuperaciones', 'auditoria'];

const DB = VN.DB = {
  TABLAS,
  cargar() {
    const crudo = leerCrudo();
    if (crudo) {
      try {
        const db = JSON.parse(crudo);
        if (db && db.version === C.DB_VERSION && TABLAS.every(t => Array.isArray(db[t]))) return db;
      } catch (e) { /* se reconstruye */ }
    }
    const nueva = VN.seed();
    escribirCrudo(JSON.stringify(nueva));
    return nueva;
  },
  guardar(db) { escribirCrudo(JSON.stringify(db)); },
  tx(fn) { const db = DB.cargar(); const r = fn(db); DB.guardar(db); return r; },
  leer(fn) { return fn(DB.cargar()); },
  siguienteId(db, tabla) { db.seq[tabla] = (db.seq[tabla] || 0) + 1; return db.seq[tabla]; },
  auditar(db, usuario, accion, entidad, detalle) {
    db.auditoria.push({ id: DB.siguienteId(db, 'auditoria'), fecha: VN.ahora(), usuario: usuario || 'sistema', accion, entidad, detalle: detalle || '' });
    if (db.auditoria.length > 300) db.auditoria.splice(0, db.auditoria.length - 300);
  }
};
```

[Volver al índice](#índice)

---

<a id="hu-002"></a>

## HU-002: Redacción de historias de usuarios

**Sprint 1** (10 - 15 de Agosto) | **Rol:** Administrador | **Módulo:** Historias de usuario | **Caso de prueba:** CP-002

**Historia:** Como equipo de desarrollo, quiero tener las historias de usuario redactadas y organizadas para guiar el alcance, los sprints y las pruebas del proyecto.

![Módulo Historias de usuario con el diagrama PERT dividido en seis sprints](img/HU-002-historias-pert.png)

*Figura 002.1. Diagrama PERT por sprint dentro del módulo Historias de usuario.*

![Historia de usuario HU-004 desplegada con sus pasos, datos de entrada y criterio de aceptación](img/HU-002-historia-abierta.png)

*Figura 002.2. Detalle de una historia: pasos, datos de entrada, resultado esperado y criterio de aceptación.*

**Descripción**

El módulo Historias de usuario reúne las 20 historias del proyecto. En la parte superior se muestra el diagrama PERT con los seis sprints, sus fechas y las historias que corresponden a cada uno; al seleccionar una historia, la página baja hasta su detalle.

Cada historia se despliega con su redacción (como, quiero, para), el rol que la usa, las precondiciones, los pasos de ejecución, los datos de entrada, el resultado esperado, el criterio de aceptación y la técnica de prueba. En la parte inferior de cada historia hay un botón para ir directamente al módulo que se prueba y un formulario para registrar el resultado (Pendiente, Aprobado o Fallido) con una observación, de modo que el avance de las pruebas queda guardado y visible en el diagrama.

### Código Fuente de la Historia de Usuario (HU-002)

```javascript
/* assets/js/modules/historias.js - Diagrama PERT y Gestión de Casos de Prueba */
VN.vista('Historias de usuario', async function (c) {
  ui.cargando(c);
  const data = await VN.pedir('GET', 'historias');
  c.innerHTML = '<div class="pert-container"><div class="pert-board">' +
    data.sprints.map(s => '<div class="sprint-col"><h3>' + esc(s.nombre) + '</h3><div class="cards">' +
      s.historias.map(h => '<div class="story-card ' + h.estado + '" onclick="verDetalle('' + h.id + '')">' +
        '<b>' + esc(h.id) + '</b><p>' + esc(h.titulo) + '</p></div>').join('') +
    '</div></div>').join('') + '</div></div><div id="detalleHistoria"></div>';

  window.verDetalle = id => {
    const h = data.historias.find(x => x.id === id);
    const host = c.querySelector('#detalleHistoria');
    host.innerHTML = '<div class="panel story-detail"><h2>' + esc(h.id + ': ' + h.titulo) + '</h2>' +
      '<p class="narrativa"><b>Como:</b> ' + esc(h.como) + '<br><b>Quiero:</b> ' + esc(h.quiero) + '<br><b>Para:</b> ' + esc(h.para) + '</p>' +
      '<h4>Criterio de Aceptación:</h4><p>' + esc(h.criterio) + '</p>' +
      '<form id="formPrueba"><select name="estado"><option value="Pendiente">Pendiente</option><option value="Aprobado">Aprobado</option><option value="Fallido">Fallido</option></select>' +
      '<input name="observacion" placeholder="Observaciones de la prueba">' +
      '<button class="btn sm">Registrar Prueba</button></form></div>';
  };
});
```

[Volver al índice](#índice)

---

<a id="hu-003"></a>

## HU-003: Visualizar Dashboard

**Sprint 2** (18 - 26 de Agosto) | **Rol:** Todos los roles | **Módulo:** Inicio | **Caso de prueba:** CP-003

**Historia:** Como usuario del sistema, quiero ver un panel de inicio con indicadores y accesos para conocer el estado académico de un vistazo según mi rol.

![Panel de inicio del administrador con indicadores principales](img/HU-003-dashboard.png)

*Figura 003.1. Panel de inicio con los indicadores principales.*

![Gráficos de rendimiento, actividad reciente y accesos rápidos del panel de inicio](img/HU-003-dashboard-graficos.png)

*Figura 003.2. Gráficos, actividad reciente y accesos rápidos.*

**Descripción**

El Dashboard es la primera pantalla después de iniciar sesión. Muestra un saludo, la fecha y los indicadores clave del sistema: estudiantes, docentes, asignaturas activas, cursos del año, notas registradas, promedio general, porcentaje de aprobación y porcentaje de asistencia.

Debajo aparecen los gráficos de rendimiento por escala (Avanzado, Satisfactorio, Fundamental e Inicial) y el promedio por asignatura, además de la actividad reciente y los accesos rápidos a cada módulo. Cada rol ve información propia: el administrador ve datos globales, el docente ve los de sus cursos y el estudiante ve su promedio, su asistencia y sus últimas notas.

### Código Fuente de la Historia de Usuario (HU-003)

```javascript
/* assets/js/modules/inicio.js - Panel de Control (Dashboard) con Indicadores y Gráficos */
VN.vista('Inicio', async function (c) {
  const u = VN.app.usuario;
  ui.cargando(c);
  const d = await VN.pedir('GET', 'dashboard');
  c.innerHTML = '<div class="kpi-grid">' +
    '<div class="kpi"><h3>Estudiantes</h3><div class="val">' + d.kpi.estudiantes + '</div></div>' +
    '<div class="kpi"><h3>Docentes</h3><div class="val">' + d.kpi.docentes + '</div></div>' +
    '<div class="kpi"><h3>Asignaturas</h3><div class="val">' + d.kpi.asignaturas + '</div></div>' +
    '<div class="kpi"><h3>Promedio General</h3><div class="val">' + VN.fmtNum(d.kpi.promedio) + '</div></div>' +
    '<div class="kpi"><h3>Aprobación</h3><div class="val">' + d.kpi.aprobacion + '%</div></div>' +
    '<div class="kpi"><h3>Asistencia</h3><div class="val">' + d.kpi.asistencia + '%</div></div>' +
  '</div>' +
  '<div class="cols2" style="margin-top:20px">' +
    '<div class="panel"><h3>Distribución por Escala</h3><div class="bars">' +
      d.escalas.map(e => '<div class="bar-row"><span>' + e.nombre + '</span><div class="btrack"><div class="bfill ' + e.cod + '" style="width:' + e.pct + '%"></div></div><span>' + e.pct + '%</span></div>').join('') +
    '</div></div>' +
    '<div class="panel"><h3>Actividad Reciente</h3><ul class="activity-list">' +
      d.actividad.map(a => '<li><b>' + esc(a.accion) + '</b>: ' + esc(a.detalle) + ' <small>' + VN.fmtFechaHora(a.fecha) + '</small></li>').join('') +
    '</ul></div>' +
  '</div>';
});
```

[Volver al índice](#índice)

---

<a id="hu-004"></a>

## HU-004: Registrar estudiante

**Sprint 2** (18 - 26 de Agosto) | **Rol:** Administrador | **Módulo:** Estudiantes | **Caso de prueba:** CP-004

**Historia:** Como administrador, quiero registrar un nuevo estudiante para que quede matriculado y con acceso al sistema.

![Formulario Nuevo estudiante con los datos personales, grado y sección completados](img/HU-004-registrar-estudiante.png)

*Figura 004.1. Formulario de registro de un nuevo estudiante.*

![Ventana con el correo y la contraseña temporal generados para el estudiante](img/HU-004-credenciales-generadas.png)

*Figura 004.2. Credenciales generadas automáticamente al registrar.*

**Descripción**

Desde el módulo Estudiantes, el botón Nuevo estudiante abre un formulario con nombres, apellidos, fecha de nacimiento, sexo, grado, sección, teléfono, correo personal y dirección. Cada campo se valida: los nombres admiten solo letras, el teléfono debe tener 8 dígitos válidos, el correo debe tener un formato correcto y la fecha de nacimiento no puede ser futura. Los errores se marcan en rojo debajo del campo correspondiente.

Al guardar, el sistema matricula al estudiante en el grado y la sección elegidos, le asigna un código (por ejemplo EST-2026-0015) y crea su acceso con un correo institucional y una contraseña temporal, que se muestran una sola vez en la segunda captura. La persona deberá cambiar esa contraseña en su primer ingreso.

### Código Fuente de la Historia de Usuario (HU-004)

```javascript
/* assets/js/modules/personas.js y api/personas.js - Formulario y Creación de Estudiante */
// Formulario Modal Nuevo Estudiante
const m = ui.modal('<h2>Nuevo estudiante</h2><form id="pf"><div class="fg">' +
  campo('nombres', 'Nombres', { req: 1, max: 50 }) + campo('apellidos', 'Apellidos', { req: 1, max: 50 }) +
  campo('fechaNacimiento', 'Fecha de nacimiento', { tipo: 'date', req: 1 }) + campo('sexo', 'Sexo', { req: 1, opciones: [{ v: 'F', t: 'Femenino' }, { v: 'M', t: 'Masculino' }] }) +
  campo('idGrado', 'Grado', { req: 1, opciones: grados }) + campo('numeroSeccion', 'Sección', { req: 1, opciones: [{ v: 1, t: 'Sección 1' }, { v: 2, t: 'Sección 2' }] }) +
  campo('telefono', 'Teléfono', { max: 16 }) + campo('correoPersonal', 'Correo personal', { tipo: 'email', req: 1 }) +
  campo('preguntaSeguridad', 'Pregunta de seguridad', { opciones: VN.CONFIG.PREGUNTAS_SEGURIDAD.map(p => ({ v: p, t: p })) }) +
  campo('respuestaSeguridad', 'Respuesta de seguridad', { valor: 'Pelusa' }) +
  '</div><div class="row2"><button type="button" class="btn ghost" id="cx">Cancelar</button><button type="submit" class="btn">Guardar</button></div></form>');

// Endpoint POST estudiantes
R('POST', 'estudiantes', ({ body }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const d = validarOError(VN.val.esquema.estudiante, body);
  correoPersonalLibre(db, d.correoPersonal);
  const temporal = VN.seg.temporal(), sal = VN.seg.sal(), correo = generarCorreo(db, d.nombres, d.apellidos);
  const u = { id_usuario: VN.DB.siguienteId(db, 'usuarios'), nombre_usuario: VN.nombreCorto(d.nombres, d.apellidos), correo, sal, hash: VN.seg.hash(temporal, sal), rol: 'Estudiante', debe_cambiar: true, activo: true, intentos: 0, pregunta_seguridad: body.preguntaSeguridad || '¿Cuál es el nombre de tu mascota favorita?', respuesta_seguridad: body.respuestaSeguridad || 'Pelusa', creado: VN.ahora() };
  db.usuarios.push(u);
  const idE = VN.DB.siguienteId(db, 'estudiantes');
  const e = { id_estudiante: idE, id_usuario: u.id_usuario, codigo: 'EST-' + VN.anio(db) + '-' + String(idE).padStart(4, '0'), nombres: d.nombres, apellidos: d.apellidos, fecha_nacimiento: d.fechaNacimiento, sexo: d.sexo, telefono: d.telefono, correo_personal: d.correoPersonal, direccion: d.direccion, creado: VN.ahora() };
  db.estudiantes.push(e);
  db.matriculas.push({ id_matricula: VN.DB.siguienteId(db, 'matriculas'), id_estudiante: idE, id_seccion: sec.id_seccion, id_anio: db.config.idAnioActivo, estado: 'Activa' });
  VN.DB.auditar(db, admin.correo, 'Registro', 'Estudiante', e.codigo + ' - ' + A.nombreEst(e));
  return { id_estudiante: idE, codigo: e.codigo, correo, contrasena_temporal: temporal };
}));
```

[Volver al índice](#índice)

---

<a id="hu-005"></a>

## HU-005: Editar estudiante

**Sprint 2** (18 - 26 de Agosto) | **Rol:** Administrador | **Módulo:** Estudiantes | **Caso de prueba:** CP-005

**Historia:** Como administrador, quiero editar los datos de un estudiante para mantener su información actualizada.

![Formulario Editar estudiante con los datos actuales y cambios en teléfono y dirección](img/HU-005-editar-estudiante.png)

*Figura 005.1. Formulario de edición con los datos actuales.*

![Lista de estudiantes filtrada mostrando el estudiante ya actualizado](img/HU-005-estudiante-actualizado.png)

*Figura 005.2. Lista después de guardar los cambios.*

**Descripción**

El botón Editar de cada fila abre el mismo formulario con los datos actuales del estudiante. Se pueden modificar nombres, apellidos, fecha de nacimiento, sexo, teléfono, correo personal y dirección; el grado y la sección se muestran como información para no desordenar sus notas y asistencias.

Las validaciones son las mismas que al registrar, y el sistema impide repetir el correo personal de otra persona o duplicar un estudiante con los mismos nombres y fecha de nacimiento. Al guardar, la lista se actualiza y el cambio queda registrado en la actividad del sistema.

### Código Fuente de la Historia de Usuario (HU-005)

```javascript
/* assets/js/modules/personas.js y api/personas.js - Edición de Datos de Estudiante */
async function abrir(r) {
  const m = ui.modal('<h2>Editar estudiante</h2><form id="pf"><div class="fg">' +
    campo('nombres', 'Nombres', { req: 1, valor: r.nombres }) +
    campo('apellidos', 'Apellidos', { req: 1, valor: r.apellidos }) +
    campo('telefono', 'Teléfono', { valor: r.telefono }) +
    campo('correoPersonal', 'Correo personal', { valor: r.correo_personal }) +
    campo('direccion', 'Dirección', { valor: r.direccion }) +
    '</div><div class="row2"><button type="button" class="btn ghost" id="cx">Cancelar</button><button type="submit" class="btn">Guardar</button></div></form>');
  ui.enviar(m.querySelector('#pf'), {
    ejecutar: async d => { await VN.pedir('PUT', 'estudiantes/' + r.id_estudiante, d); m.cerrar(); ui.toast('Estudiante actualizado'); cargar(); }
  });
}

// Endpoint PUT estudiantes/:id
R('PUT', 'estudiantes/:id', ({ params, body }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const e = A.buscar(db.estudiantes, 'id_estudiante', A.exigirId(params.id, 'estudiante'), 'El estudiante no existe.');
  const d = validarOError(VN.val.esquema.estudiante, body);
  correoPersonalLibre(db, d.correoPersonal, e);
  Object.assign(e, { nombres: d.nombres, apellidos: d.apellidos, fecha_nacimiento: d.fechaNacimiento, sexo: d.sexo, telefono: d.telefono, correo_personal: d.correoPersonal, direccion: d.direccion });
  const u = db.usuarios.find(x => x.id_usuario === e.id_usuario); if (u) u.nombre_usuario = VN.nombreCorto(d.nombres, d.apellidos);
  VN.DB.auditar(db, admin.correo, 'Edición', 'Estudiante', e.codigo + ' - ' + A.nombreEst(e));
  return { ok: true };
}));
```

[Volver al índice](#índice)

---

<a id="hu-006"></a>

## HU-006: Eliminar estudiante

**Sprint 3** (26 de Agosto - 3 de Septiembre) | **Rol:** Administrador | **Módulo:** Estudiantes | **Caso de prueba:** CP-006

**Historia:** Como administrador, quiero eliminar un estudiante para retirar registros que ya no corresponden.

![Ventana de confirmación antes de eliminar un estudiante](img/HU-006-eliminar-estudiante.png)

*Figura 006.1. Confirmación previa a la eliminación.*

![Lista sin el estudiante eliminado y aviso de eliminación realizada](img/HU-006-estudiante-eliminado.png)

*Figura 006.2. Resultado después de confirmar la eliminación.*

**Descripción**

Al pulsar Eliminar, el sistema no borra de inmediato: abre una ventana de confirmación que indica el nombre y el código del estudiante, y cuántas notas y registros de asistencia se eliminarán junto con su acceso. La acción se puede cancelar sin consecuencias.

Si se confirma, el estudiante desaparece de la lista, se eliminan su matrícula, sus notas, su asistencia y su usuario, y aparece el aviso Estudiante eliminado. Esa persona ya no puede iniciar sesión.

### Código Fuente de la Historia de Usuario (HU-006)

```javascript
/* assets/js/modules/personas.js y api/personas.js - Eliminación con Impacto de Estudiante */
if (a === 'd') {
  const i = await VN.pedir('GET', 'estudiantes/' + r.id_estudiante + '/impacto');
  const detalle = 'Se eliminarán también su acceso, ' + i.notas + ' nota(s) y ' + i.asistencias + ' registro(s) de asistencia.';
  if (!await ui.confirmar({ titulo: 'Eliminar estudiante', mensaje: '¿Eliminar a ' + r.nombres + ' ' + r.apellidos + '? ' + detalle, textoOk: 'Eliminar', peligro: true })) return;
  await VN.pedir('DELETE', 'estudiantes/' + r.id_estudiante);
  ui.toast('Estudiante eliminado'); cargar();
}

// Endpoint DELETE estudiantes/:id
R('DELETE', 'estudiantes/:id', ({ params }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const e = A.buscar(db.estudiantes, 'id_estudiante', A.exigirId(params.id), 'El estudiante no existe.');
  const ms = db.matriculas.filter(m => m.id_estudiante === e.id_estudiante).map(m => m.id_matricula);
  const nNotas = db.notas.filter(n => ms.includes(n.id_matricula)).length;
  db.notas = db.notas.filter(n => !ms.includes(n.id_matricula));
  db.asistencias = db.asistencias.filter(x => !ms.includes(x.id_matricula));
  db.matriculas = db.matriculas.filter(m => m.id_estudiante !== e.id_estudiante);
  db.usuarios = db.usuarios.filter(u => u.id_usuario !== e.id_usuario);
  db.estudiantes = db.estudiantes.filter(x => x !== e);
  VN.DB.auditar(db, admin.correo, 'Eliminación', 'Estudiante', e.codigo + ' (' + nNotas + ' notas)');
  return { ok: true, notasEliminadas: nNotas };
}));
```

[Volver al índice](#índice)

---

<a id="hu-007"></a>

## HU-007: Buscar estudiante

**Sprint 3** (26 de Agosto - 3 de Septiembre) | **Rol:** Administrador | **Módulo:** Estudiantes | **Caso de prueba:** CP-007

**Historia:** Como administrador, quiero buscar un estudiante para localizarlo rápidamente por nombre, código, correo o grado.

![Lista de estudiantes filtrada con la palabra perez en el buscador](img/HU-007-buscar-estudiante.png)

*Figura 007.1. Búsqueda por apellido sin necesidad de escribir la tilde.*

![Lista de estudiantes filtrada con la palabra octavo en el buscador](img/HU-007-buscar-por-grado.png)

*Figura 007.2. Búsqueda por grado.*

**Descripción**

El cuadro de búsqueda de la parte superior filtra la tabla mientras se escribe. Busca en el nombre, el apellido, el código, el correo y el grado, ignora las tildes y las mayúsculas (al escribir perez aparece Pérez) y acepta varias palabras a la vez.

Debajo de la tabla se indica cuántos resultados hay respecto del total. Si no hay coincidencias se muestra el mensaje Sin resultados, y el botón con la X limpia la búsqueda.

### Código Fuente de la Historia de Usuario (HU-007)

```javascript
/* assets/js/modules/personas.js y core/ui.js - Búsqueda de Estudiantes */
cont.innerHTML = '<div class="tools">' + ui.buscador('Buscar por nombre, código, correo o grado') +
  '<button class="btn sm" id="nuevo">Nuevo estudiante</button></div><div class="tbl" id="tb"></div>';

ui.enlazarBuscador = function (contenedor, tabla) {
  const inp = contenedor.querySelector('.srch-box input');
  if (!inp) return;
  inp.addEventListener('input', () => {
    const q = VN.norm(inp.value);
    tabla.filtrar(r => VN.norm([r.codigo, r.nombres, r.apellidos, r.correo, r.nombre_grado].join(' ')).includes(q));
  });
};
```

[Volver al índice](#índice)

---

<a id="hu-008"></a>

## HU-008: Ver lista de estudiantes

**Sprint 3** (26 de Agosto - 3 de Septiembre) | **Rol:** Administrador | **Módulo:** Estudiantes | **Caso de prueba:** CP-008

**Historia:** Como administrador, quiero ver la lista de estudiantes para consultar quiénes están registrados.

![Primera página de la lista de estudiantes](img/HU-008-lista-estudiantes.png)

*Figura 008.1. Lista de estudiantes, página 1.*

![Segunda página de la lista de estudiantes](img/HU-008-lista-estudiantes-pagina-2.png)

*Figura 008.2. Lista de estudiantes, página 2.*

**Descripción**

El módulo Estudiantes presenta una tabla con el código, el nombre completo, el correo de acceso y el grado y sección de cada estudiante, junto con las acciones Editar, Clave y Eliminar. Los encabezados permiten ordenar por cualquier columna.

La lista se muestra de diez en diez con paginación; en la parte inferior se indica el rango visible y el total de registros. El botón Clave genera una nueva contraseña temporal si el estudiante olvidó la suya.

### Código Fuente de la Historia de Usuario (HU-008)

```javascript
/* assets/js/modules/personas.js y core/ui.js - Lista Paginada de Estudiantes */
const cols = [
  { t: 'Código', v: r => r.codigo, o: 1 },
  { t: 'Nombre', v: r => r.apellidos + ', ' + r.nombres, o: 1 },
  { t: 'Correo de acceso', v: r => r.correo, o: 1 },
  { t: 'Grado y sección', v: r => r.nombre_grado ? r.nombre_grado + ' · Sección ' + r.nombre_seccion : '-', o: 1 }
];

tabla = ui.tabla(tb, {
  columnas: cols,
  filas,
  clave: r => r.id_estudiante,
  orden: { col: 1, dir: 'asc' },
  acciones: () => ui.btnAccion('e', 'edit', 'Editar') + ui.btnAccion('k', 'key', 'Clave') + ui.btnAccion('d', 'trash', 'Eliminar', 'danger'),
  alAccion: accion
});
```

[Volver al índice](#índice)

---

<a id="hu-009"></a>

## HU-009: Registrar docente

**Sprint 3** (26 de Agosto - 3 de Septiembre) | **Rol:** Administrador | **Módulo:** Docentes | **Caso de prueba:** CP-009

**Historia:** Como administrador, quiero registrar un nuevo docente para que pueda recibir cursos y acceder al sistema.

![Formulario Nuevo docente con nombres, apellidos, especialidad y correo personal](img/HU-009-registrar-docente.png)

*Figura 009.1. Formulario de registro de un nuevo docente.*

![Ventana con el correo y la contraseña temporal del docente registrado](img/HU-009-credenciales-docente.png)

*Figura 009.2. Credenciales generadas para el docente.*

**Descripción**

En el módulo Docentes, el botón Nuevo docente abre un formulario con nombres, apellidos, especialidad, teléfono y correo personal. Nombres, apellidos, especialidad y correo personal son obligatorios, y todos los campos pasan por las mismas validaciones de formato del resto del sistema.

Al guardar se crea el docente con un código (por ejemplo DOC-0005) y su acceso con correo institucional y contraseña temporal, que se entregan en una ventana con botón para copiarlas. El docente queda disponible para asignarle cursos desde el módulo Cursos.

### Código Fuente de la Historia de Usuario (HU-009)

```javascript
/* assets/js/modules/personas.js y api/personas.js - Registro de Docente */
R('POST', 'docentes', ({ body }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const d = validarOError(VN.val.esquema.docente, body);
  correoPersonalLibre(db, d.correoPersonal);
  const temporal = VN.seg.temporal(), sal = VN.seg.sal(), correo = generarCorreo(db, d.nombres, d.apellidos);
  const u = { id_usuario: VN.DB.siguienteId(db, 'usuarios'), nombre_usuario: VN.nombreCorto(d.nombres, d.apellidos), correo, sal, hash: VN.seg.hash(temporal, sal), rol: 'Docente', debe_cambiar: true, activo: true, intentos: 0, pregunta_seguridad: body.preguntaSeguridad || '¿Cuál es tu color favorito?', respuesta_seguridad: body.respuestaSeguridad || 'Azul', creado: VN.ahora() };
  db.usuarios.push(u);
  const idD = VN.DB.siguienteId(db, 'docentes');
  const doc = { id_docente: idD, id_usuario: u.id_usuario, codigo: 'DOC-' + String(idD).padStart(4, '0'), nombres: d.nombres, apellidos: d.apellidos, especialidad: d.especialidad, telefono: d.telefono, correo_personal: d.correoPersonal, creado: VN.ahora() };
  db.docentes.push(doc);
  VN.DB.auditar(db, admin.correo, 'Registro', 'Docente', doc.codigo + ' - ' + VN.api.nombreDoc(doc));
  return { id_docente: idD, codigo: doc.codigo, correo, contrasena_temporal: temporal };
}));
```

[Volver al índice](#índice)

---

<a id="hu-010"></a>

## HU-010: Editar docente

**Sprint 3** (26 de Agosto - 3 de Septiembre) | **Rol:** Administrador | **Módulo:** Docentes | **Caso de prueba:** CP-010

**Historia:** Como administrador, quiero editar los datos de un docente para mantener su información actualizada.

![Formulario Editar docente con la especialidad y el teléfono modificados](img/HU-010-editar-docente.png)

*Figura 010.1. Formulario de edición de un docente.*

![Lista de docentes después de guardar los cambios](img/HU-010-docente-actualizado.png)

*Figura 010.2. Lista de docentes con los datos actualizados.*

**Descripción**

El botón Editar abre el formulario con los datos actuales del docente para modificar sus nombres, apellidos, especialidad, teléfono o correo personal. Se aplican las mismas validaciones que al registrar y no se permite repetir un correo personal ya usado ni duplicar un docente con el mismo nombre.

Al guardar, la tabla se actualiza con la nueva información y el movimiento queda registrado en la actividad reciente del sistema.

### Código Fuente de la Historia de Usuario (HU-010)

```javascript
/* assets/js/modules/personas.js y api/personas.js - Edición de Datos de Docente */
R('PUT', 'docentes/:id', ({ params, body }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const doc = A.buscar(db.docentes, 'id_docente', A.exigirId(params.id, 'docente'), 'El docente no existe.');
  const d = validarOError(VN.val.esquema.docente, body);
  correoPersonalLibre(db, d.correoPersonal, doc);
  Object.assign(doc, { nombres: d.nombres, apellidos: d.apellidos, especialidad: d.especialidad, telefono: d.telefono, correo_personal: d.correoPersonal });
  const u = db.usuarios.find(x => x.id_usuario === doc.id_usuario); if (u) u.nombre_usuario = VN.nombreCorto(d.nombres, d.apellidos);
  VN.DB.auditar(db, admin.correo, 'Edición', 'Docente', doc.codigo + ' - ' + A.nombreDoc(doc));
  return { ok: true };
}));
```

[Volver al índice](#índice)

---

<a id="hu-011"></a>

## HU-011: Eliminar docente

**Sprint 4** (4 - 11 de Septiembre) | **Rol:** Administrador | **Módulo:** Docentes | **Caso de prueba:** CP-011

**Historia:** Como administrador, quiero eliminar un docente para retirar registros que ya no corresponden.

![Ventana de confirmación antes de eliminar un docente](img/HU-011-eliminar-docente.png)

*Figura 011.1. Confirmación previa a la eliminación de un docente.*

![Lista de docentes sin el docente eliminado y aviso de eliminación](img/HU-011-docente-eliminado.png)

*Figura 011.2. Resultado después de confirmar.*

![Aviso que impide eliminar a un docente que tiene cursos asignados](img/HU-011-docente-con-cursos-protegido.png)

*Figura 011.3. Protección: un docente con cursos asignados no se elimina.*

**Descripción**

Eliminar un docente también pide confirmación. Si el docente no tiene cursos asignados, se elimina junto con su acceso y desaparece de la lista, como muestran las dos primeras capturas.

Para proteger la información académica, el sistema impide eliminar a un docente que tiene cursos asignados y explica el motivo con un aviso (tercera captura): primero hay que quitar o reasignar esos cursos desde el módulo Cursos.

### Código Fuente de la Historia de Usuario (HU-011)

```javascript
/* assets/js/modules/personas.js y api/personas.js - Eliminación Protegida de Docente */
R('DELETE', 'docentes/:id', ({ params }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const doc = A.buscar(db.docentes, 'id_docente', A.exigirId(params.id, 'docente'), 'El docente no existe.');
  const n = db.asignaciones.filter(a => a.id_docente === doc.id_docente).length;
  if (n) throw new E(409, 'No se puede eliminar a ' + A.nombreDoc(doc) + ' porque tiene ' + n + ' curso(s) asignado(s). Quita o reasigna esos cursos primero.');
  db.usuarios = db.usuarios.filter(u => u.id_usuario !== doc.id_usuario);
  db.docentes = db.docentes.filter(x => x !== doc);
  VN.DB.auditar(db, admin.correo, 'Eliminación', 'Docente', doc.codigo + ' - ' + A.nombreDoc(doc));
  return { ok: true };
}));
```

[Volver al índice](#índice)

---

<a id="hu-012"></a>

## HU-012: Buscar docente

**Sprint 4** (4 - 11 de Septiembre) | **Rol:** Administrador | **Módulo:** Docentes | **Caso de prueba:** CP-012

**Historia:** Como administrador, quiero buscar un docente para localizarlo rápidamente por nombre, código o especialidad.

![Lista de docentes filtrada con la palabra ingles en el buscador](img/HU-012-buscar-docente.png)

*Figura 012.1. Búsqueda de un docente por especialidad.*

**Descripción**

El buscador del módulo Docentes filtra la tabla mientras se escribe y funciona por nombre, apellido, código, correo y especialidad. En la captura se escribió ingles, sin tilde, y el sistema encontró a la docente de Inglés.

Igual que en estudiantes, la búsqueda ignora tildes y mayúsculas, indica cuántos resultados hay del total y muestra el mensaje Sin resultados cuando no hay coincidencias.

### Código Fuente de la Historia de Usuario (HU-012)

```javascript
/* assets/js/modules/personas.js - Búsqueda de Docentes por Especialidad o Datos */
tabla = ui.tabla(tb, {
  columnas: cols,
  filas,
  clave: r => r.id_docente,
  orden: { col: 1, dir: 'asc' },
  buscar: r => [r.codigo, r.nombres, r.apellidos, r.correo, r.especialidad, r.telefono].join(' '),
  vacio: ui.vacio('No hay docentes registrados', 'Usa el botón superior para crear el primero.', 'users'),
  acciones: () => ui.btnAccion('e', 'edit', 'Editar') + ui.btnAccion('k', 'key', 'Clave') + ui.btnAccion('d', 'trash', 'Eliminar', 'danger'),
  alAccion: accion
});
```

[Volver al índice](#índice)

---

<a id="hu-013"></a>

## HU-013: Ver lista de docentes

**Sprint 4** (4 - 11 de Septiembre) | **Rol:** Administrador | **Módulo:** Docentes | **Caso de prueba:** CP-013

**Historia:** Como administrador, quiero ver la lista de docentes para consultar quiénes están registrados.

![Lista completa de docentes con código, correo, especialidad y cantidad de cursos](img/HU-013-lista-docentes.png)

*Figura 013.1. Lista de docentes.*

**Descripción**

El módulo Docentes muestra una tabla con el código, el nombre, el correo de acceso, la especialidad y la cantidad de cursos que tiene cada docente en el año lectivo activo. Se puede ordenar por cualquier columna.

Cada fila ofrece las acciones Editar, Clave (nueva contraseña temporal) y Eliminar.

### Código Fuente de la Historia de Usuario (HU-013)

```javascript
/* assets/js/api/personas.js y modules/personas.js - Lista de Docentes con Conteo de Cursos */
R('GET', 'docentes', () => VN.DB.leer(db => {
  VN.autenticar(db, ADM);
  return db.docentes.map(d => {
    const u = db.usuarios.find(x => x.id_usuario === d.id_usuario);
    return Object.assign({}, d, {
      correo: u ? u.correo : '-',
      cursos: db.asignaciones.filter(a => a.id_docente === d.id_docente && a.id_anio === db.config.idAnioActivo).length
    });
  }).sort((a, b) => (a.apellidos + a.nombres).localeCompare(b.apellidos + b.nombres, 'es'));
}));
```

[Volver al índice](#índice)

---

<a id="hu-014"></a>

## HU-014: Registrar asignatura

**Sprint 4** (4 - 11 de Septiembre) | **Rol:** Administrador | **Módulo:** Cursos | **Caso de prueba:** CP-014

**Historia:** Como administrador, quiero registrar una nueva asignatura para ofrecerla y asignarla a un docente y una sección.

![Ventana Nueva asignatura con el nombre escrito](img/HU-014-registrar-asignatura.png)

*Figura 014.1. Formulario de registro de una asignatura.*

![Lista de asignaturas con la nueva asignatura incluida](img/HU-014-asignatura-registrada.png)

*Figura 014.2. La asignatura aparece en el catálogo.*

**Descripción**

En Cursos, la pestaña Asignaturas muestra el catálogo y el botón Nueva asignatura abre un formulario con un solo campo: el nombre. El sistema exige entre 3 y 60 caracteres válidos y no permite repetir un nombre existente, aunque se escriba con otra tilde u otra mayúscula.

Al guardar, la asignatura queda activa en la lista y disponible en la pestaña Asignar docentes para vincularla con un docente y una sección.

### Código Fuente de la Historia de Usuario (HU-014)

```javascript
/* assets/js/modules/cursos.js y api/academico.js - Registro de Nueva Asignatura */
R('POST', 'asignaturas', ({ body }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const nombre = VN.limpiar(body.nombre);
  if (!nombre || nombre.length < 3 || nombre.length > 60) throw new E(422, 'El nombre debe tener entre 3 y 60 caracteres.', { nombre: 'Nombre inválido.' });
  if (db.asignaturas.some(a => VN.norm(a.nombre) === VN.norm(nombre))) throw new E(409, 'Ya existe una asignatura con este nombre.', { nombre: 'Nombre duplicado.' });
  const a = { id_asignatura: VN.DB.siguienteId(db, 'asignaturas'), nombre, estado: true };
  db.asignaturas.push(a);
  VN.DB.auditar(db, admin.correo, 'Registro', 'Asignatura', a.nombre);
  return a;
}));
```

[Volver al índice](#índice)

---

<a id="hu-015"></a>

## HU-015: Editar asignatura

**Sprint 4** (4 - 11 de Septiembre) | **Rol:** Administrador | **Módulo:** Cursos | **Caso de prueba:** CP-015

**Historia:** Como administrador, quiero editar una asignatura para corregir su nombre o su estado.

![Ventana Editar asignatura con el nombre modificado](img/HU-015-editar-asignatura.png)

*Figura 015.1. Formulario de edición de una asignatura.*

![Lista de asignaturas con el nombre actualizado](img/HU-015-asignatura-actualizada.png)

*Figura 015.2. La lista refleja el cambio.*

**Descripción**

El botón Editar permite cambiar el nombre de la asignatura con las mismas validaciones del registro. Además, el botón Desactivar o Activar cambia su estado: una asignatura inactiva se conserva en el sistema pero ya no se puede asignar a nuevos cursos.

Tras guardar, la tabla muestra el nombre actualizado.

### Código Fuente de la Historia de Usuario (HU-015)

```javascript
/* assets/js/modules/cursos.js y api/academico.js - Edición y Estado de Asignatura */
R('PUT', 'asignaturas/:id', ({ params, body }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const a = A.buscar(db.asignaturas, 'id_asignatura', A.exigirId(params.id), 'La asignatura no existe.');
  if (body.nombre !== undefined) {
    const nombre = VN.limpiar(body.nombre);
    if (!nombre || nombre.length < 3 || nombre.length > 60) throw new E(422, 'El nombre debe tener entre 3 y 60 caracteres.');
    if (db.asignaturas.some(x => x !== a && VN.norm(x.nombre) === VN.norm(nombre))) throw new E(409, 'Ya existe otra asignatura con ese nombre.');
    a.nombre = nombre;
  }
  if (body.estado !== undefined) a.estado = !!body.estado;
  VN.DB.auditar(db, admin.correo, 'Edición', 'Asignatura', a.nombre + (a.estado ? ' (Activa)' : ' (Inactiva)'));
  return a;
}));
```

[Volver al índice](#índice)

---

<a id="hu-016"></a>

## HU-016: Eliminar asignatura

**Sprint 5** (12 - 18 de Septiembre) | **Rol:** Administrador | **Módulo:** Cursos | **Caso de prueba:** CP-016

**Historia:** Como administrador, quiero eliminar una asignatura para retirar asignaturas que no se utilizan.

![Ventana de confirmación antes de eliminar una asignatura](img/HU-016-eliminar-asignatura.png)

*Figura 016.1. Confirmación previa a la eliminación.*

![Lista de asignaturas sin la asignatura eliminada](img/HU-016-asignatura-eliminada.png)

*Figura 016.2. Resultado después de confirmar la eliminación.*

**Descripción**

Al eliminar una asignatura, el sistema pide confirmación. Si la asignatura no está asignada a ningún curso se elimina y desaparece del catálogo, tal como se ve en la segunda captura.

Si ya está asignada a uno o más cursos, el sistema no la elimina y sugiere desactivarla en su lugar, para no perder el historial de notas y asistencia.

### Código Fuente de la Historia de Usuario (HU-016)

```javascript
/* assets/js/modules/cursos.js y api/academico.js - Eliminación de Asignatura */
R('DELETE', 'asignaturas/:id', ({ params }) => VN.DB.tx(db => {
  const admin = VN.autenticar(db, ADM);
  const a = A.buscar(db.asignaturas, 'id_asignatura', A.exigirId(params.id), 'La asignatura no existe.');
  const n = db.asignaciones.filter(x => x.id_asignatura === a.id_asignatura).length;
  if (n) throw new E(409, 'No se puede eliminar porque está asignada a ' + n + ' curso(s). Puedes desactivarla.');
  db.asignaturas = db.asignaturas.filter(x => x !== a);
  VN.DB.auditar(db, admin.correo, 'Eliminación', 'Asignatura', a.nombre);
  return { ok: true };
}));
```

[Volver al índice](#índice)

---

<a id="hu-017"></a>

## HU-017: Buscar asignatura

**Sprint 5** (12 - 18 de Septiembre) | **Rol:** Administrador | **Módulo:** Cursos | **Caso de prueba:** CP-017

**Historia:** Como administrador, quiero buscar una asignatura para localizarla rápidamente por nombre.

![Catálogo de asignaturas filtrado con las letras ingl en el buscador](img/HU-017-buscar-asignatura.png)

*Figura 017.1. Búsqueda de una asignatura por nombre.*

**Descripción**

La caja de búsqueda del catálogo filtra mientras se escribe, aunque solo se escriba una parte del nombre, como ingl para encontrar Inglés. También funciona por estado (activa o inactiva) e ignora tildes y mayúsculas.

Debajo de la tabla se indica cuántos resultados hay del total de asignaturas.

### Código Fuente de la Historia de Usuario (HU-017)

```javascript
/* assets/js/modules/cursos.js - Búsqueda de Asignaturas */
tablaAsig = ui.tabla(tb, {
  columnas: [
    { t: 'Asignatura', v: r => r.nombre, o: 1 },
    { t: 'Estado', v: r => ui.badge(r.estado ? 'Activa' : 'Inactiva', r.estado ? 'ok' : 'bad'), o: 1 },
    { t: 'Cursos asignados', v: r => r.cursos, o: 1, cls: 'num' }
  ],
  filas: lista,
  buscar: r => r.nombre + ' ' + (r.estado ? 'activa' : 'inactiva'),
  alAccion: accionAsig
});
```

[Volver al índice](#índice)

---

<a id="hu-018"></a>

## HU-018: Ver lista de asignaturas

**Sprint 5** (12 - 18 de Septiembre) | **Rol:** Administrador | **Módulo:** Cursos | **Caso de prueba:** CP-018

**Historia:** Como administrador, quiero ver la lista de asignaturas para consultar el catálogo completo.

![Catálogo completo de asignaturas con estado y cursos asignados](img/HU-018-lista-asignaturas.png)

*Figura 018.1. Lista de asignaturas.*

**Descripción**

El catálogo muestra el nombre de cada asignatura, su estado (activa o inactiva) y en cuántos cursos está asignada. Las columnas se pueden ordenar y cada fila tiene las acciones Editar, Desactivar o Activar y Eliminar.

En la pestaña vecina, Asignar docentes, se vincula cada asignatura con un docente y una sección del año lectivo.

### Código Fuente de la Historia de Usuario (HU-018)

```javascript
/* assets/js/api/academico.js y modules/cursos.js - Catálogo Completo de Asignaturas */
R('GET', 'asignaturas', () => VN.DB.leer(db => {
  VN.autenticar(db);
  return db.asignaturas.map(a => Object.assign({}, a, {
    cursos: db.asignaciones.filter(x => x.id_asignatura === a.id_asignatura && x.id_anio === db.config.idAnioActivo).length
  })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}));
```

[Volver al índice](#índice)

---

<a id="hu-019"></a>

## HU-019: Registrar nota

**Sprint 6** (26 de Septiembre - 3 de Octubre) | **Rol:** Docente | **Módulo:** Calificaciones | **Caso de prueba:** CP-019

**Historia:** Como docente, quiero registrar una nota de un estudiante de mis cursos para dejar constancia de su desempeño en el periodo.

![Módulo Calificaciones del docente con las notas de un curso](img/HU-019-modulo-calificaciones.png)

*Figura 019.1. Módulo Calificaciones con las notas del curso seleccionado.*

![Formulario Registrar nota con estudiante, periodo, evaluación y nota completados](img/HU-019-registrar-nota.png)

*Figura 019.2. Formulario de registro de una nota.*

![Lista de notas del periodo mostrando la nota recién registrada](img/HU-019-nota-registrada.png)

*Figura 019.3. La nota aparece en la lista del periodo.*

**Descripción**

El docente entra al módulo Calificaciones, elige uno de sus cursos y, si lo desea, un periodo. La tabla muestra las notas con su estudiante, evaluación, valor, escala, periodo y fecha, junto con el total de notas, el promedio y el porcentaje de aprobadas.

El botón Registrar nota abre un formulario con el estudiante, el periodo, el nombre de la evaluación, la nota de 0 a 100 y una observación opcional. Mientras se escribe la nota, el formulario indica su equivalencia en la escala (en la captura, 92,5 equivale a AA, aprobado). El sistema rechaza notas fuera de rango, valores que no son números y evaluaciones repetidas para el mismo estudiante y periodo, y no permite registrar notas en un periodo cerrado.

### Código Fuente de la Historia de Usuario (HU-019)

```javascript
/* assets/js/modules/calificaciones.js y api/notas.js - Registro de Nota */
R('POST', 'notas', ({ body }) => VN.DB.tx(db => {
  const u = VN.autenticar(db, ['Docente', 'Administrador']);
  const asig = A.buscar(db.asignaciones, 'id_asignacion', Number(body.idAsignacion), 'Curso no encontrado.');
  if (u.rol === 'Docente') {
    const d = db.docentes.find(x => x.id_usuario === u.id_usuario);
    if (!d || asig.id_docente !== d.id_docente) throw new E(403, 'No tienes permiso para calificar este curso.');
  }
  const per = db.config.periodos.find(p => p.id === Number(body.idPeriodo));
  if (!per || !per.abierto) throw new E(409, 'El periodo está cerrado para registro de notas.');
  const val = Number(String(body.valor).replace(',', '.'));
  if (isNaN(val) || val < 0 || val > 100) throw new E(422, 'La nota debe estar entre 0 y 100.', { valor: 'Rango 0 a 100.' });
  const n = { id_nota: VN.DB.siguienteId(db, 'notas'), id_matricula: Number(body.idMatricula), id_asignacion: asig.id_asignacion, id_periodo: per.id, titulo: VN.limpiar(body.titulo), valor: val, observacion: body.observacion || null, fecha: VN.hoy(), registrado_por: u.id_usuario };
  db.notas.push(n);
  VN.DB.auditar(db, u.correo, 'Registro de nota', 'Nota', n.titulo + ' (' + n.valor + ')');
  return n;
}));
```

[Volver al índice](#índice)

---

<a id="hu-020"></a>

## HU-020: Editar nota

**Sprint 6** (26 de Septiembre - 3 de Octubre) | **Rol:** Docente | **Módulo:** Calificaciones | **Caso de prueba:** CP-020

**Historia:** Como docente, quiero editar una nota ya registrada para corregir errores mientras el periodo siga abierto.

![Formulario Editar nota con el valor y la observación modificados](img/HU-020-editar-nota.png)

*Figura 020.1. Formulario de edición de una nota.*

![Lista de notas con la nota actualizada y marcada como Editada](img/HU-020-nota-editada.png)

*Figura 020.2. La nota queda actualizada y marcada como Editada.*

**Descripción**

Cada nota tiene un botón Editar que abre el formulario con la evaluación, la nota y la observación. En la captura se corrige la nota de 92,5 a 88 y se agrega una observación que explica el cambio.

Al guardar, la lista muestra el nuevo valor, su escala actualizada (de AA a AS) y la etiqueta Editada junto al nombre de la evaluación. El cambio queda registrado en la actividad del sistema. Si el periodo está cerrado, en lugar del botón Editar aparece el indicador Cerrado.

### Código Fuente de la Historia de Usuario (HU-020)

```javascript
/* assets/js/modules/calificaciones.js y api/notas.js - Edición de Calificación */
R('PUT', 'notas/:id', ({ params, body }) => VN.DB.tx(db => {
  const u = VN.autenticar(db, ['Docente', 'Administrador']);
  const n = A.buscar(db.notas, 'id_nota', A.exigirId(params.id), 'Nota no encontrada.');
  const asig = A.buscar(db.asignaciones, 'id_asignacion', n.id_asignacion);
  if (u.rol === 'Docente') {
    const d = db.docentes.find(x => x.id_usuario === u.id_usuario);
    if (!d || asig.id_docente !== d.id_docente) throw new E(403, 'No tienes permiso para modificar esta nota.');
  }
  const per = db.config.periodos.find(p => p.id === n.id_periodo);
  if (!per || !per.abierto) throw new E(409, 'El periodo está cerrado; no se permite editar calificaciones.');
  const val = Number(String(body.valor).replace(',', '.'));
  if (isNaN(val) || val < 0 || val > 100) throw new E(422, 'La nota debe estar entre 0 y 100.', { valor: 'Rango 0 a 100.' });
  n.titulo = VN.limpiar(body.titulo);
  n.valor = val;
  n.observacion = body.observacion || null;
  n.modificado_por = u.id_usuario;
  n.fecha_modificacion = VN.ahora();
  VN.DB.auditar(db, u.correo, 'Edición de nota', 'Nota', n.titulo + ' (' + n.valor + ')');
  return { ok: true, nota: n };
}));
```

[Volver al índice](#índice)

---
