/* VitNota - grados, asignaturas, asignaciones, cursos y asistencia (HU-014 a HU-018). */
(function () {
  const VN = window.VN, E = VN.ApiError, R = VN.ruta, A = VN.api, ADM = ['Administrador'];
  const ESTADOS_ASISTENCIA = ['Presente', 'Ausente', 'Permiso'];

  /* ---------- Catálogos ---------- */
  R('GET', 'anios', () => VN.DB.leer(db => { VN.autenticar(db); return db.anios.slice().sort((a, b) => b.id_anio - a.id_anio).map(a => Object.assign({}, a, { activo: a.id_anio === db.config.idAnioActivo })); }));
  R('GET', 'grados', () => VN.DB.leer(db => { VN.autenticar(db); return db.grados; }));
  R('GET', 'secciones', () => VN.DB.leer(db => { VN.autenticar(db); return db.secciones; }));

  /* ---------- Asignaturas ---------- */
  const usosAsignatura = (db, id) => db.asignaciones.filter(a => a.id_asignatura === id).length;
  const nombreLibre = (db, nombre, excepto) => {
    if (db.asignaturas.some(a => a !== excepto && VN.norm(a.nombre) === VN.norm(nombre)))
      throw new E(409, 'Ya existe una asignatura con ese nombre.', { nombre: 'Ya existe una asignatura con este nombre.' });
  };
  const validarAsignatura = body => {
    const v = VN.val.validar(VN.val.esquema.asignatura, body);
    if (!v.ok) throw new E(422, 'Revisa los campos marcados.', v.errores);
    return v.datos;
  };

  R('GET', 'asignaturas', () => VN.DB.leer(db => {
    VN.autenticar(db);
    return db.asignaturas.map(a => Object.assign({}, a, { usos: usosAsignatura(db, a.id_asignatura) })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }));

  R('POST', 'asignaturas', ({ body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM), d = validarAsignatura(body);
    nombreLibre(db, d.nombre);
    const a = { id_asignatura: VN.DB.siguienteId(db, 'asignaturas'), nombre: d.nombre, estado: true };
    db.asignaturas.push(a);
    VN.DB.auditar(db, u.correo, 'Registro', 'Asignatura', a.nombre);
    return { id_asignatura: a.id_asignatura };
  }));

  R('PUT', 'asignaturas/:id', ({ params, body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM);
    const a = A.buscar(db.asignaturas, 'id_asignatura', A.exigirId(params.id, 'asignatura'), 'La asignatura no existe.');
    const d = validarAsignatura(body);
    nombreLibre(db, d.nombre, a);
    if (body.estado !== undefined && typeof body.estado !== 'boolean') throw new E(400, 'Estado inválido.');
    a.nombre = d.nombre; if (typeof body.estado === 'boolean') a.estado = body.estado;
    VN.DB.auditar(db, u.correo, 'Edición', 'Asignatura', a.nombre + (a.estado ? '' : ' (inactiva)'));
    return { ok: true };
  }));

  R('DELETE', 'asignaturas/:id', ({ params }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM);
    const a = A.buscar(db.asignaturas, 'id_asignatura', A.exigirId(params.id, 'asignatura'), 'La asignatura no existe.');
    const n = usosAsignatura(db, a.id_asignatura);
    if (n) throw new E(409, 'No se puede eliminar «' + a.nombre + '» porque está asignada en ' + n + ' curso(s). Puedes desactivarla en su lugar.');
    db.asignaturas = db.asignaturas.filter(x => x !== a);
    VN.DB.auditar(db, u.correo, 'Eliminación', 'Asignatura', a.nombre);
    return { ok: true };
  }));

  /* ---------- Asignación de docentes a secciones ---------- */
  const filaAsignacion = (db, a) => {
    const as = db.asignaturas.find(x => x.id_asignatura === a.id_asignatura), d = db.docentes.find(x => x.id_docente === a.id_docente), s = A.seccion(db, a.id_seccion);
    return { id_asignacion: a.id_asignacion, asignatura: as ? as.nombre : '-', docente: d ? A.nombreDoc(d) : '-', seccion: s ? s.etiqueta : '-', id_seccion: a.id_seccion, id_anio: a.id_anio };
  };

  R('GET', 'asignaciones', ({ query }) => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    const idS = A.id(query.idSeccion), idA = A.id(query.idAnio) || db.config.idAnioActivo;
    return db.asignaciones.filter(a => (!idS || a.id_seccion === idS) && a.id_anio === idA).map(a => filaAsignacion(db, a)).sort((x, y) => x.asignatura.localeCompare(y.asignatura, 'es'));
  }));

  R('POST', 'asignaciones', ({ body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM);
    const idAs = A.id(body.idAsignatura), idD = A.id(body.idDocente), idS = A.id(body.idSeccion), idA = A.id(body.idAnio);
    if (!idAs || !idD || !idS || !idA) throw new E(422, 'Completa todos los campos.');
    const asig = A.buscar(db.asignaturas, 'id_asignatura', idAs, 'La asignatura no existe.');
    const doc = A.buscar(db.docentes, 'id_docente', idD, 'El docente no existe.');
    A.buscar(db.secciones, 'id_seccion', idS, 'La sección no existe.'); A.buscar(db.anios, 'id_anio', idA, 'El año lectivo no existe.');
    if (!asig.estado) throw new E(409, 'La asignatura «' + asig.nombre + '» está inactiva. Actívala antes de asignarla.');
    const previa = db.asignaciones.find(a => a.id_asignatura === idAs && a.id_seccion === idS && a.id_anio === idA);
    if (previa) { const dp = db.docentes.find(d => d.id_docente === previa.id_docente); throw new E(409, '«' + asig.nombre + '» ya está asignada en esta sección a ' + (dp ? A.nombreDoc(dp) : 'otro docente') + '. Quita esa asignación primero.'); }
    const x = { id_asignacion: VN.DB.siguienteId(db, 'asignaciones'), id_asignatura: idAs, id_docente: idD, id_seccion: idS, id_anio: idA };
    db.asignaciones.push(x);
    VN.DB.auditar(db, u.correo, 'Asignación', 'Curso', asig.nombre + ' - ' + A.nombreDoc(doc) + ' - ' + A.seccion(db, idS).etiqueta);
    return { id_asignacion: x.id_asignacion };
  }));

  R('DELETE', 'asignaciones/:id', ({ params }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM);
    const a = A.buscar(db.asignaciones, 'id_asignacion', A.exigirId(params.id, 'asignación'), 'La asignación no existe.');
    const nNotas = db.notas.filter(n => n.id_asignacion === a.id_asignacion).length;
    if (nNotas) throw new E(409, 'No se puede quitar: el curso ya tiene ' + nNotas + ' nota(s) registrada(s).');
    db.asistencias = db.asistencias.filter(x => x.id_asignacion !== a.id_asignacion);
    db.asignaciones = db.asignaciones.filter(x => x !== a);
    VN.DB.auditar(db, u.correo, 'Quitar asignación', 'Curso', filaAsignacion(db, a).asignatura);
    return { ok: true };
  }));

  /* ---------- Mis cursos y listado de alumnos ---------- */
  R('GET', 'mis-cursos/:idUsuario', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db);
    const id = A.soloYo(u, params.idUsuario), idA = db.config.idAnioActivo, anio = A.anio(db).nombre;
    const dueno = db.usuarios.find(x => x.id_usuario === id);
    let lista = [];
    if (dueno.rol === 'Docente') {
      const d = A.docenteDe(db, dueno);
      lista = d ? db.asignaciones.filter(a => a.id_docente === d.id_docente && a.id_anio === idA) : [];
    } else if (dueno.rol === 'Estudiante') {
      const e = A.estudianteDe(db, dueno), m = e && db.matriculas.find(x => x.id_estudiante === e.id_estudiante && x.id_anio === idA && x.estado === 'Activa');
      lista = m ? db.asignaciones.filter(a => a.id_seccion === m.id_seccion && a.id_anio === idA) : [];
    }
    return lista.map(a => Object.assign(filaAsignacion(db, a), { anio })).sort((x, y) => x.asignatura.localeCompare(y.asignatura, 'es'));
  }));

  R('GET', 'asignaciones/:id/alumnos', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db, ['Administrador', 'Docente']);
    const a = A.asignacionPermitida(db, u, A.exigirId(params.id, 'asignación'));
    return A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).map(m => {
      const e = db.estudiantes.find(x => x.id_estudiante === m.id_estudiante);
      return { id_matricula: m.id_matricula, codigo: e.codigo, nombres: e.nombres, apellidos: e.apellidos };
    }).sort((x, y) => (x.apellidos + x.nombres).localeCompare(y.apellidos + y.nombres, 'es'));
  }));

  /* ---------- Asistencia ---------- */
  R('GET', 'asistencia/cursos-docente/:idUsuario', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db, ADM.concat('Docente'));
    const id = A.soloYo(u, params.idUsuario), dueno = db.usuarios.find(x => x.id_usuario === id);
    const d = dueno && A.docenteDe(db, dueno);
    if (!d) return [];
    return db.asignaciones.filter(a => a.id_docente === d.id_docente && a.id_anio === db.config.idAnioActivo).map(a => {
      const s = A.seccion(db, a.id_seccion), g = db.grados.find(x => x.id_grado === s.id_grado), as = db.asignaturas.find(x => x.id_asignatura === a.id_asignatura);
      return { idAsignacion: a.id_asignacion, asignatura: as.nombre, grado: g.nombre_grado, seccion: 'Sección ' + s.nombre_seccion };
    }).sort((x, y) => (x.grado + x.asignatura).localeCompare(y.grado + y.asignatura, 'es'));
  }));

  const fechaAsistencia = f => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(f)) || isNaN(new Date(f + 'T00:00:00'))) throw new E(422, 'La fecha no es válida.');
    if (f > VN.hoy()) throw new E(422, 'No se puede registrar asistencia en una fecha futura.');
    return f;
  };

  R('GET', 'asistencia/asignacion/:id/fecha/:fecha', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db, ['Administrador', 'Docente']);
    const a = A.asignacionPermitida(db, u, A.exigirId(params.id, 'curso'));
    const fecha = fechaAsistencia(params.fecha);
    return A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).map(m => {
      const e = db.estudiantes.find(x => x.id_estudiante === m.id_estudiante);
      const reg = db.asistencias.find(x => x.id_matricula === m.id_matricula && x.id_asignacion === a.id_asignacion && x.fecha === fecha);
      return { idMatricula: m.id_matricula, estudiante: A.nombreEst(e), estado: reg ? reg.estado : null };
    }).sort((x, y) => x.estudiante.localeCompare(y.estudiante, 'es'));
  }));

  R('POST', 'asistencia/lote', ({ body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ['Administrador', 'Docente']);
    const a = A.asignacionPermitida(db, u, A.exigirId(body.idAsignacion, 'curso'));
    const fecha = fechaAsistencia(body.fecha);
    if (!Array.isArray(body.items) || !body.items.length) throw new E(422, 'No hay estudiantes para registrar.');
    const validas = A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).map(m => m.id_matricula);
    body.items.forEach(it => {
      if (!validas.includes(Number(it.idMatricula))) throw new E(422, 'Hay un estudiante que no pertenece a este curso.');
      if (!ESTADOS_ASISTENCIA.includes(it.estado)) throw new E(422, 'Estado de asistencia inválido.');
    });
    body.items.forEach(it => {
      const idM = Number(it.idMatricula);
      const reg = db.asistencias.find(x => x.id_matricula === idM && x.id_asignacion === a.id_asignacion && x.fecha === fecha);
      if (reg) reg.estado = it.estado;
      else db.asistencias.push({ id_asistencia: VN.DB.siguienteId(db, 'asistencias'), id_matricula: idM, id_asignacion: a.id_asignacion, fecha, estado: it.estado });
    });
    VN.DB.auditar(db, u.correo, 'Asistencia', 'Curso', 'Curso ' + a.id_asignacion + ' - ' + fecha);
    return { ok: true, registros: body.items.length };
  }));

  R('GET', 'asistencia/mi-asistencia/:idUsuario', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db);
    const id = A.soloYo(u, params.idUsuario), dueno = db.usuarios.find(x => x.id_usuario === id);
    const e = dueno && A.estudianteDe(db, dueno);
    if (!e) return [];
    const ms = db.matriculas.filter(m => m.id_estudiante === e.id_estudiante).map(m => m.id_matricula);
    return db.asistencias.filter(x => ms.includes(x.id_matricula)).map(x => {
      const a = db.asignaciones.find(y => y.id_asignacion === x.id_asignacion), as = a && db.asignaturas.find(y => y.id_asignatura === a.id_asignatura);
      return { fecha: x.fecha, asignatura: as ? as.nombre : '-', estado: x.estado };
    }).sort((p, q) => q.fecha.localeCompare(p.fecha) || p.asignatura.localeCompare(q.asignatura, 'es'));
  }));
})();
