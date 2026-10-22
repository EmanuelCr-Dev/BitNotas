/* VitNota - calificaciones (HU-019 Registrar nota y HU-020 Editar nota) y consulta de notas. */
(function () {
  const VN = window.VN, E = VN.ApiError, R = VN.ruta, A = VN.api, TEACH = ['Administrador', 'Docente'];

  const periodoAbierto = (db, id) => {
    const p = db.config.periodos.find(x => x.id === id);
    if (!p) throw new E(422, 'Selecciona un periodo válido.', { idPeriodo: 'Selecciona un periodo válido.' });
    if (!p.abierto) throw new E(409, 'El ' + p.nombre + ' está cerrado. Solo el administrador puede reabrirlo desde Configuración.');
    return p;
  };
  const tituloLibre = (db, n, excepto) => {
    if (db.notas.some(x => x !== excepto && x.id_matricula === n.id_matricula && x.id_asignacion === n.id_asignacion && x.id_periodo === n.id_periodo && VN.norm(x.titulo) === VN.norm(n.titulo)))
      throw new E(409, 'Este estudiante ya tiene una nota con esa evaluación en el mismo periodo.', { titulo: 'Ya existe una nota con este nombre en el periodo.' });
  };
  const validarNota = (body, campos) => {
    const esq = {}; campos.forEach(c => { esq[c] = VN.val.esquema.nota[c]; });
    const v = VN.val.validar(esq, body);
    if (!v.ok) throw new E(422, 'Revisa los campos marcados.', v.errores);
    return v.datos;
  };

  function filaNota(db, n) {
    const m = db.matriculas.find(x => x.id_matricula === n.id_matricula), e = db.estudiantes.find(x => x.id_estudiante === m.id_estudiante), p = db.config.periodos.find(x => x.id === n.id_periodo);
    const esc = VN.dom.escala(n.valor, db.config.notaMinima);
    return { id_nota: n.id_nota, id_matricula: n.id_matricula, id_asignacion: n.id_asignacion, estudiante: A.nombreEst(e), codigo: e.codigo, titulo: n.titulo, valor: n.valor, id_periodo: n.id_periodo, periodo: p.nombre, periodo_abierto: p.abierto, fecha: n.fecha, observacion: n.observacion, escala: esc, aprobado: n.valor >= db.config.notaMinima, modificada: !!n.fecha_modificacion };
  }

  R('GET', 'periodos', () => VN.DB.leer(db => { VN.autenticar(db); return db.config.periodos; }));

  /* Cursos sobre los que el usuario puede calificar */
  R('GET', 'calificaciones/cursos', () => VN.DB.leer(db => {
    const u = VN.autenticar(db, TEACH);
    const d = u.rol === 'Docente' ? A.docenteDe(db, u) : null;
    return db.asignaciones.filter(a => a.id_anio === db.config.idAnioActivo && (u.rol === 'Administrador' || (d && a.id_docente === d.id_docente))).map(a => {
      const as = db.asignaturas.find(x => x.id_asignatura === a.id_asignatura), s = A.seccion(db, a.id_seccion), doc = db.docentes.find(x => x.id_docente === a.id_docente);
      return { id_asignacion: a.id_asignacion, asignatura: as.nombre, seccion: s.etiqueta, docente: A.nombreDoc(doc), alumnos: A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).length };
    }).sort((x, y) => (x.seccion + x.asignatura).localeCompare(y.seccion + y.asignatura, 'es'));
  }));

  R('GET', 'notas', ({ query }) => VN.DB.leer(db => {
    const u = VN.autenticar(db, TEACH);
    const a = A.asignacionPermitida(db, u, A.exigirId(query.idAsignacion, 'curso'));
    const idP = A.id(query.idPeriodo);
    return db.notas.filter(n => n.id_asignacion === a.id_asignacion && (!idP || n.id_periodo === idP)).map(n => filaNota(db, n))
      .sort((x, y) => x.estudiante.localeCompare(y.estudiante, 'es') || x.id_periodo - y.id_periodo || x.fecha.localeCompare(y.fecha));
  }));

  R('POST', 'notas', ({ body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, TEACH);
    const a = A.asignacionPermitida(db, u, A.exigirId(body.idAsignacion, 'curso'));
    const errores = {};
    const idM = A.id(body.idMatricula), idP = A.id(body.idPeriodo);
    if (!idM) errores.idMatricula = 'Selecciona un estudiante.';
    if (!idP) errores.idPeriodo = 'Selecciona un periodo.';
    const d = VN.val.validar({ titulo: VN.val.esquema.nota.titulo, valor: VN.val.esquema.nota.valor, observacion: VN.val.esquema.nota.observacion }, body);
    Object.assign(errores, d.errores);
    if (Object.keys(errores).length) throw new E(422, 'Revisa los campos marcados.', errores);
    if (!A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).some(m => m.id_matricula === idM)) throw new E(422, 'El estudiante no pertenece a la sección de este curso.', { idMatricula: 'No pertenece a este curso.' });
    periodoAbierto(db, idP);
    const n = { id_nota: 0, id_matricula: idM, id_asignacion: a.id_asignacion, id_periodo: idP, titulo: d.datos.titulo, valor: d.datos.valor, observacion: d.datos.observacion, fecha: VN.hoy(), registrado_por: u.id_usuario, modificado_por: null, fecha_modificacion: null };
    tituloLibre(db, n);
    n.id_nota = VN.DB.siguienteId(db, 'notas');
    db.notas.push(n);
    VN.DB.auditar(db, u.correo, 'Registro', 'Nota', filaNota(db, n).estudiante + ' - ' + n.titulo + ': ' + n.valor);
    return { id_nota: n.id_nota };
  }));

  R('PUT', 'notas/:id', ({ params, body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, TEACH);
    const n = A.buscar(db.notas, 'id_nota', A.exigirId(params.id, 'nota'), 'La nota no existe.');
    A.asignacionPermitida(db, u, n.id_asignacion);
    periodoAbierto(db, n.id_periodo);
    const d = validarNota(body, ['titulo', 'valor', 'observacion']);
    const prev = { titulo: n.titulo, valor: n.valor, observacion: n.observacion };
    if (d.titulo === prev.titulo && d.valor === prev.valor && (d.observacion || null) === (prev.observacion || null)) return { ok: true, sinCambios: true };
    tituloLibre(db, Object.assign({}, n, { titulo: d.titulo }), n);
    n.titulo = d.titulo; n.valor = d.valor; n.observacion = d.observacion; n.modificado_por = u.id_usuario; n.fecha_modificacion = VN.ahora();
    VN.DB.auditar(db, u.correo, 'Edición', 'Nota', filaNota(db, n).estudiante + ': ' + prev.valor + ' a ' + n.valor);
    return { ok: true };
  }));

  /* Construye el boletín de un estudiante: cada curso con sus notas por periodo */
  VN.api.boletin = (db, est) => {
    const idA = db.config.idAnioActivo, m = db.matriculas.find(x => x.id_estudiante === est.id_estudiante && x.id_anio === idA && x.estado === 'Activa');
    const base = { estudiante: { id_estudiante: est.id_estudiante, codigo: est.codigo, nombre: A.nombreEst(est) }, anio: A.anio(db).nombre, notaMinima: db.config.notaMinima, periodos: db.config.periodos.map(p => ({ id: p.id, nombre: p.nombre })), cursos: [], promedioGeneral: null, escala: VN.dom.escala(null), estado: 'Sin notas', seccion: null };
    if (!m) return base;
    const s = A.seccion(db, m.id_seccion); base.seccion = s.etiqueta;
    base.cursos = db.asignaciones.filter(a => a.id_seccion === m.id_seccion && a.id_anio === idA).map(a => {
      const as = db.asignaturas.find(x => x.id_asignatura === a.id_asignatura), doc = db.docentes.find(x => x.id_docente === a.id_docente);
      const notas = db.notas.filter(n => n.id_matricula === m.id_matricula && n.id_asignacion === a.id_asignacion);
      const pr = VN.dom.promedios(notas);
      return {
        id_asignacion: a.id_asignacion, asignatura: as.nombre, docente: A.nombreDoc(doc), final: pr.final, escala: VN.dom.escala(pr.final, db.config.notaMinima), estado: VN.dom.estado(pr.final, db.config.notaMinima),
        periodos: db.config.periodos.map(p => ({ id: p.id, nombre: p.nombre, promedio: pr.porPeriodo[p.id] == null ? null : pr.porPeriodo[p.id], notas: notas.filter(n => n.id_periodo === p.id).sort((x, y) => x.fecha.localeCompare(y.fecha)).map(n => ({ titulo: n.titulo, valor: n.valor, fecha: n.fecha, observacion: n.observacion })) }))
      };
    }).sort((x, y) => x.asignatura.localeCompare(y.asignatura, 'es'));
    const finales = base.cursos.map(c => c.final).filter(v => v != null);
    if (finales.length) { base.promedioGeneral = VN.redondear(VN.promedio(finales)); base.escala = VN.dom.escala(base.promedioGeneral, db.config.notaMinima); base.estado = VN.dom.estado(base.promedioGeneral, db.config.notaMinima); }
    return base;
  };

  R('GET', 'notas/mis-notas/:idUsuario', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db);
    const id = A.soloYo(u, params.idUsuario), dueno = db.usuarios.find(x => x.id_usuario === id);
    const e = dueno && A.estudianteDe(db, dueno);
    if (!e) throw new E(404, 'Esta cuenta no corresponde a un estudiante.');
    return A.boletin(db, e);
  }));

  /* Resumen por curso: matriz estudiante x periodo */
  R('GET', 'notas/resumen/:idAsignacion', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db, TEACH);
    const a = A.asignacionPermitida(db, u, A.exigirId(params.idAsignacion, 'curso'));
    const filas = A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).map(m => {
      const e = db.estudiantes.find(x => x.id_estudiante === m.id_estudiante);
      const pr = VN.dom.promedios(db.notas.filter(n => n.id_matricula === m.id_matricula && n.id_asignacion === a.id_asignacion));
      return { id_matricula: m.id_matricula, estudiante: A.nombreEst(e), codigo: e.codigo, porPeriodo: pr.porPeriodo, final: pr.final, escala: VN.dom.escala(pr.final, db.config.notaMinima), estado: VN.dom.estado(pr.final, db.config.notaMinima) };
    }).sort((x, y) => x.estudiante.localeCompare(y.estudiante, 'es'));
    return { periodos: db.config.periodos.map(p => ({ id: p.id, nombre: p.nombre })), filas };
  }));
})();
