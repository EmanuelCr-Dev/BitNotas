/* VitNota - panel de inicio (HU-003), configuración, base de datos (HU-001), historias de usuario (HU-002) y reportes. */
(function () {
  const VN = window.VN, E = VN.ApiError, R = VN.ruta, A = VN.api, ADM = ['Administrador'];

  const pct = (a, b) => b ? VN.redondear(a * 100 / b) : null;

  /* Promedio final por (matrícula, curso) para un conjunto de cursos */
  function finales(db, asignaciones) {
    const res = [];
    asignaciones.forEach(a => A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).forEach(m => {
      const pr = VN.dom.promedios(db.notas.filter(n => n.id_matricula === m.id_matricula && n.id_asignacion === a.id_asignacion));
      if (pr.final != null) res.push({ asig: a, id_matricula: m.id_matricula, final: pr.final });
    }));
    return res;
  }
  function distribucion(db, lista) {
    const d = { AA: 0, AS: 0, AF: 0, AI: 0 };
    lista.forEach(x => { d[VN.dom.escala(x.final, db.config.notaMinima).codigo]++; });
    return d;
  }
  function porAsignatura(db, notas) {
    const g = {};
    notas.forEach(n => {
      const a = db.asignaciones.find(x => x.id_asignacion === n.id_asignacion), as = db.asignaturas.find(x => x.id_asignatura === a.id_asignatura);
      (g[as.nombre] = g[as.nombre] || []).push(n.valor);
    });
    return Object.keys(g).map(k => ({ nombre: k, promedio: VN.redondear(VN.promedio(g[k])) })).sort((x, y) => y.promedio - x.promedio);
  }
  const asistenciaPct = lista => pct(lista.filter(x => x.estado === 'Presente').length, lista.length);

  R('GET', 'dashboard', () => VN.DB.leer(db => {
    const u = VN.autenticar(db), idA = db.config.idAnioActivo, min = db.config.notaMinima;
    const cursosAnio = db.asignaciones.filter(a => a.id_anio === idA);
    const r = { rol: u.rol, notaMinima: min, anio: A.anio(db).nombre };

    if (u.rol === 'Administrador') {
      const f = finales(db, cursosAnio);
      r.kpis = { estudiantes: db.estudiantes.length, docentes: db.docentes.length, asignaturas: db.asignaturas.filter(a => a.estado).length, cursos: cursosAnio.length, notas: db.notas.length, promedio: db.notas.length ? VN.redondear(VN.promedio(db.notas.map(n => n.valor))) : null, aprobacion: pct(f.filter(x => x.final >= min).length, f.length), asistencia: asistenciaPct(db.asistencias) };
      r.distribucion = distribucion(db, f);
      r.porAsignatura = porAsignatura(db, db.notas);
      r.actividad = db.auditoria.filter(x => x.accion !== 'Inicio de sesión').slice(-8).reverse();
    } else if (u.rol === 'Docente') {
      const d = A.docenteDe(db, u), mis = cursosAnio.filter(a => d && a.id_docente === d.id_docente), ids = mis.map(a => a.id_asignacion);
      const notas = db.notas.filter(n => ids.includes(n.id_asignacion)), f = finales(db, mis);
      const alumnos = new Set(); mis.forEach(a => A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).forEach(m => alumnos.add(m.id_matricula)));
      r.kpis = { cursos: mis.length, alumnos: alumnos.size, notas: notas.length, promedio: notas.length ? VN.redondear(VN.promedio(notas.map(n => n.valor))) : null, aprobacion: pct(f.filter(x => x.final >= min).length, f.length) };
      r.distribucion = distribucion(db, f);
      r.porAsignatura = porAsignatura(db, notas);
      r.ultimasNotas = notas.slice().sort((x, y) => y.id_nota - x.id_nota).slice(0, 6).map(n => { const m = db.matriculas.find(x => x.id_matricula === n.id_matricula), e = db.estudiantes.find(x => x.id_estudiante === m.id_estudiante); return { estudiante: A.nombreEst(e), titulo: n.titulo, valor: n.valor, fecha: n.fecha }; });
    } else {
      const e = A.estudianteDe(db, u), b = e ? A.boletin(db, e) : null;
      const ms = e ? db.matriculas.filter(m => m.id_estudiante === e.id_estudiante).map(m => m.id_matricula) : [];
      const notas = db.notas.filter(n => ms.includes(n.id_matricula));
      r.kpis = { promedio: b ? b.promedioGeneral : null, cursos: b ? b.cursos.length : 0, notas: notas.length, asistencia: asistenciaPct(db.asistencias.filter(x => ms.includes(x.id_matricula))) };
      r.escala = b ? b.escala : VN.dom.escala(null);
      r.porAsignatura = b ? b.cursos.filter(c => c.final != null).map(c => ({ nombre: c.asignatura, promedio: c.final })).sort((x, y) => y.promedio - x.promedio) : [];
      r.ultimasNotas = notas.slice().sort((x, y) => y.id_nota - x.id_nota).slice(0, 6).map(n => { const a = db.asignaciones.find(x => x.id_asignacion === n.id_asignacion); return { asignatura: db.asignaturas.find(x => x.id_asignatura === a.id_asignatura).nombre, titulo: n.titulo, valor: n.valor, fecha: n.fecha }; });
    }
    return r;
  }));

  /* ---------- Configuración ---------- */
  R('GET', 'config', () => VN.DB.leer(db => { VN.autenticar(db); return { notaMinima: db.config.notaMinima, idAnioActivo: db.config.idAnioActivo, periodos: db.config.periodos, anios: db.anios }; }));

  R('PUT', 'config', ({ body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM);
    const v = VN.val.validar({ notaMinima: { label: 'Nota mínima', req: true, tipo: 'entero', min: 50, max: 75 }, idAnioActivo: { label: 'Año lectivo', req: true, tipo: 'entero', min: 1 } }, body);
    if (!v.ok) throw new E(422, 'Revisa los campos marcados.', v.errores);
    A.buscar(db.anios, 'id_anio', v.datos.idAnioActivo, 'El año lectivo no existe.');
    db.config.notaMinima = v.datos.notaMinima; db.config.idAnioActivo = v.datos.idAnioActivo;
    db.anios.forEach(a => { a.activo = a.id_anio === v.datos.idAnioActivo; });
    VN.DB.auditar(db, u.correo, 'Configuración', 'Parámetros', 'Nota mínima ' + v.datos.notaMinima);
    return { ok: true };
  }));

  R('PUT', 'config/periodos/:id', ({ params, body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM);
    const p = db.config.periodos.find(x => x.id === A.exigirId(params.id, 'periodo'));
    if (!p) throw new E(404, 'El periodo no existe.');
    if (typeof body.abierto !== 'boolean') throw new E(400, 'Estado inválido.');
    p.abierto = body.abierto;
    VN.DB.auditar(db, u.correo, p.abierto ? 'Apertura de periodo' : 'Cierre de periodo', 'Periodo', p.nombre);
    return { ok: true };
  }));

  /* ---------- Base de datos (HU-001) ---------- */
  const ETIQUETAS = { anios: 'Años lectivos', grados: 'Grados', secciones: 'Secciones', usuarios: 'Usuarios', estudiantes: 'Estudiantes', docentes: 'Docentes', matriculas: 'Matrículas', asignaturas: 'Asignaturas', asignaciones: 'Asignaciones', notas: 'Notas', asistencias: 'Asistencias', recuperaciones: 'Recuperaciones', auditoria: 'Auditoría' };
  R('GET', 'sistema/resumen', () => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    return { version: VN.CONFIG.VERSION, esquema: db.version, creada: db.creada, tamanoKB: VN.DB.tamanoKB(), tablas: VN.DB.TABLAS.map(t => ({ tabla: t, nombre: ETIQUETAS[t], registros: db[t].length })) };
  }));
  R('GET', 'sistema/respaldo', () => VN.DB.leer(db => { const u = VN.autenticar(db, ADM); return { nombre: 'respaldo-vitnota-' + VN.hoy() + '.json', contenido: VN.DB.exportar(), usuario: u.correo }; }));
  R('POST', 'sistema/restaurar', ({ body }) => {
    VN.DB.leer(db => VN.autenticar(db, ADM));
    if (typeof body.contenido !== 'string' || !body.contenido.trim()) throw new E(400, 'El archivo está vacío.');
    VN.DB.importar(body.contenido); VN.sesion = null;
    return { ok: true };
  });
  R('POST', 'sistema/reiniciar', ({ body }) => {
    VN.DB.leer(db => VN.autenticar(db, ADM));
    if (body.confirmacion !== 'REINICIAR') throw new E(422, 'Escribe REINICIAR para confirmar.', { confirmacion: 'Escribe REINICIAR en mayúsculas.' });
    VN.DB.reiniciar(); VN.sesion = null;
    return { ok: true };
  });

  /* ---------- Historias de usuario y casos de prueba (HU-002) ---------- */
  R('GET', 'historias', () => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    return { historias: VN.HISTORIAS.map(h => Object.assign({}, h, { prueba: db.pruebas[h.id] || { estado: 'Pendiente', observacion: null, fecha: null, usuario: null } })), sprints: VN.SPRINTS };
  }));
  R('PUT', 'historias/:id/prueba', ({ params, body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db, ADM);
    const h = VN.HISTORIAS.find(x => x.id === params.id);
    if (!h) throw new E(404, 'La historia de usuario no existe.');
    if (['Pendiente', 'Aprobado', 'Fallido'].indexOf(body.estado) < 0) throw new E(422, 'Estado de prueba inválido.', { estado: 'Selecciona un resultado.' });
    const obs = VN.limpiar(body.observacion);
    if (obs.length > 300) throw new E(422, 'La observación no puede superar 300 caracteres.', { observacion: 'Máximo 300 caracteres.' });
    if (body.estado === 'Fallido' && !obs) throw new E(422, 'Describe brevemente el fallo encontrado.', { observacion: 'Indica qué falló.' });
    db.pruebas[h.id] = { estado: body.estado, observacion: obs || null, fecha: VN.hoy(), usuario: u.correo };
    VN.DB.auditar(db, u.correo, 'Prueba ' + body.estado, h.cp, h.id + ' - ' + h.titulo);
    return { ok: true };
  }));

  /* ---------- Reportes ---------- */
  R('GET', 'reportes/boletin/:idEstudiante', ({ params }) => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    return A.boletin(db, A.buscar(db.estudiantes, 'id_estudiante', A.exigirId(params.idEstudiante, 'estudiante'), 'El estudiante no existe.'));
  }));

  R('GET', 'reportes/curso/:idAsignacion', ({ params, query }) => VN.DB.leer(db => {
    const u = VN.autenticar(db, ['Administrador', 'Docente']);
    const a = A.asignacionPermitida(db, u, A.exigirId(params.idAsignacion, 'curso')), idP = A.id(query.idPeriodo), min = db.config.notaMinima;
    const vals = A.matriculasDeSeccion(db, a.id_seccion, a.id_anio).map(m => {
      const e = db.estudiantes.find(x => x.id_estudiante === m.id_estudiante);
      const notas = db.notas.filter(n => n.id_matricula === m.id_matricula && n.id_asignacion === a.id_asignacion && (!idP || n.id_periodo === idP));
      const pr = VN.dom.promedios(notas);
      return { estudiante: A.nombreEst(e), promedio: pr.final };
    });
    const con = vals.filter(v => v.promedio != null);
    const prom = con.map(v => v.promedio);
    return {
      alumnos: vals.length, conNotas: con.length, promedio: prom.length ? VN.redondear(VN.promedio(prom)) : null,
      maximo: con.length ? con.slice().sort((x, y) => y.promedio - x.promedio)[0] : null, minimo: con.length ? con.slice().sort((x, y) => x.promedio - y.promedio)[0] : null,
      aprobados: con.filter(v => v.promedio >= min).length, reprobados: con.filter(v => v.promedio < min).length,
      distribucion: distribucion(db, con.map(v => ({ final: v.promedio }))), notaMinima: min
    };
  }));

  R('GET', 'reportes/exportar', () => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    return db.notas.map(n => {
      const m = db.matriculas.find(x => x.id_matricula === n.id_matricula), e = db.estudiantes.find(x => x.id_estudiante === m.id_estudiante), s = A.seccion(db, m.id_seccion);
      const a = db.asignaciones.find(x => x.id_asignacion === n.id_asignacion), as = db.asignaturas.find(x => x.id_asignatura === a.id_asignatura), d = db.docentes.find(x => x.id_docente === a.id_docente), p = db.config.periodos.find(x => x.id === n.id_periodo);
      return [e.codigo, A.nombreEst(e), s.etiqueta, as.nombre, A.nombreDoc(d), p.nombre, n.titulo, n.valor, VN.dom.escala(n.valor, db.config.notaMinima).codigo, n.fecha];
    });
  }));
})();
