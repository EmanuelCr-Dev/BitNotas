/* VitNota - estudiantes, docentes y perfil (HU-004 a HU-013). */
(function () {
  const VN = window.VN, E = VN.ApiError, C = VN.CONFIG, R = VN.ruta, A = VN.api, ADM = ['Administrador'];

  const soloLetras = s => VN.norm(s).replace(/[^a-z]/g, '');

  function generarCorreo(db, nombres, apellidos) {
    const base = soloLetras(nombres.split(' ')[0]) + '.' + soloLetras(apellidos.split(' ')[0]);
    let correo = base + '@' + C.DOMINIO, n = 2;
    while (db.usuarios.some(u => u.correo === correo)) correo = base + n++ + '@' + C.DOMINIO;
    return correo;
  }

  /* El correo personal sirve para recuperar la clave, por eso no puede repetirse entre personas */
  function correoPersonalLibre(db, correo, excepto) {
    const usado = db.estudiantes.concat(db.docentes).some(p => p.correo_personal === correo && p !== excepto);
    if (usado || db.usuarios.some(u => u.correo === correo)) throw new E(409, 'Ese correo personal ya está registrado.', { correoPersonal: 'Este correo ya pertenece a otra persona.' });
  }
  const mismaPersona = (a, b, nac) => VN.norm(a.nombres) === VN.norm(b.nombres) && VN.norm(a.apellidos) === VN.norm(b.apellidos) && (nac === undefined || a.fecha_nacimiento === nac);

  function validarOError(esquema, entrada) {
    const v = VN.val.validar(esquema, entrada);
    if (!v.ok) throw new E(422, 'Revisa los campos marcados.', v.errores);
    return v.datos;
  }

  function filaEstudiante(db, e) {
    const u = db.usuarios.find(x => x.id_usuario === e.id_usuario);
    const m = db.matriculas.find(x => x.id_estudiante === e.id_estudiante && x.id_anio === db.config.idAnioActivo && x.estado === 'Activa');
    const s = m && A.seccion(db, m.id_seccion), g = s && db.grados.find(x => x.id_grado === s.id_grado);
    return Object.assign({}, e, { correo: u ? u.correo : '-', nombre_grado: g ? g.nombre_grado : null, nombre_seccion: s ? s.nombre_seccion : null, id_matricula: m ? m.id_matricula : null, cuenta_activa: !u || u.activo });
  }

  /* ---------- Estudiantes ---------- */
  R('GET', 'estudiantes', () => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    return db.estudiantes.map(e => filaEstudiante(db, e)).sort((a, b) => (a.apellidos + a.nombres).localeCompare(b.apellidos + b.nombres, 'es'));
  }));

  R('POST', 'estudiantes', ({ body }) => VN.DB.tx(db => {
    const admin = VN.autenticar(db, ADM);
    const v = VN.val.validar(VN.val.esquema.estudiante, body);
    const errores = Object.assign({}, v.errores);
    const idGrado = A.id(body.idGrado);
    if (!idGrado || !db.grados.some(g => g.id_grado === idGrado)) errores.idGrado = 'Selecciona un grado.';
    const sec = idGrado && db.secciones.find(s => s.id_grado === idGrado && s.nombre_seccion === String(body.numeroSeccion));
    if (!sec) errores.numeroSeccion = 'Selecciona una sección válida.';
    if (Object.keys(errores).length) throw new E(422, 'Revisa los campos marcados.', errores);
    const d = v.datos;
    correoPersonalLibre(db, d.correoPersonal);
    if (db.estudiantes.some(e => mismaPersona(e, d, d.fechaNacimiento))) throw new E(409, 'Ya existe un estudiante con los mismos nombres, apellidos y fecha de nacimiento.');

    const temporal = VN.seg.temporal(), sal = VN.seg.sal(), correo = generarCorreo(db, d.nombres, d.apellidos);
    const u = { id_usuario: VN.DB.siguienteId(db, 'usuarios'), nombre_usuario: VN.nombreCorto(d.nombres, d.apellidos), correo, sal, hash: VN.seg.hash(temporal, sal), rol: 'Estudiante', debe_cambiar: true, activo: true, intentos: 0, bloqueado_hasta: null, creado: VN.ahora() };
    db.usuarios.push(u);
    const idE = VN.DB.siguienteId(db, 'estudiantes');
    const e = { id_estudiante: idE, id_usuario: u.id_usuario, codigo: 'EST-' + VN.anio(db) + '-' + String(idE).padStart(4, '0'), nombres: d.nombres, apellidos: d.apellidos, fecha_nacimiento: d.fechaNacimiento, sexo: d.sexo, telefono: d.telefono, correo_personal: d.correoPersonal, direccion: d.direccion, creado: VN.ahora() };
    db.estudiantes.push(e);
    db.matriculas.push({ id_matricula: VN.DB.siguienteId(db, 'matriculas'), id_estudiante: idE, id_seccion: sec.id_seccion, id_anio: db.config.idAnioActivo, estado: 'Activa' });
    VN.DB.auditar(db, admin.correo, 'Registro', 'Estudiante', e.codigo + ' - ' + A.nombreEst(e));
    return { id_estudiante: idE, codigo: e.codigo, correo, contrasena_temporal: temporal };
  }));

  R('PUT', 'estudiantes/:id', ({ params, body }) => VN.DB.tx(db => {
    const admin = VN.autenticar(db, ADM);
    const e = A.buscar(db.estudiantes, 'id_estudiante', A.exigirId(params.id, 'estudiante'), 'El estudiante no existe.');
    const d = validarOError(VN.val.esquema.estudiante, body);
    correoPersonalLibre(db, d.correoPersonal, e);
    if (db.estudiantes.some(x => x !== e && mismaPersona(x, d, d.fechaNacimiento))) throw new E(409, 'Ya existe otro estudiante con los mismos nombres, apellidos y fecha de nacimiento.');
    Object.assign(e, { nombres: d.nombres, apellidos: d.apellidos, fecha_nacimiento: d.fechaNacimiento, sexo: d.sexo, telefono: d.telefono, correo_personal: d.correoPersonal, direccion: d.direccion });
    const u = db.usuarios.find(x => x.id_usuario === e.id_usuario); if (u) u.nombre_usuario = VN.nombreCorto(d.nombres, d.apellidos);
    VN.DB.auditar(db, admin.correo, 'Edición', 'Estudiante', e.codigo + ' - ' + A.nombreEst(e));
    return { ok: true };
  }));

  R('DELETE', 'estudiantes/:id', ({ params }) => VN.DB.tx(db => {
    const admin = VN.autenticar(db, ADM);
    const e = A.buscar(db.estudiantes, 'id_estudiante', A.exigirId(params.id, 'estudiante'), 'El estudiante no existe.');
    const ms = db.matriculas.filter(m => m.id_estudiante === e.id_estudiante).map(m => m.id_matricula);
    const nNotas = db.notas.filter(n => ms.includes(n.id_matricula)).length;
    db.notas = db.notas.filter(n => !ms.includes(n.id_matricula));
    db.asistencias = db.asistencias.filter(x => !ms.includes(x.id_matricula));
    db.matriculas = db.matriculas.filter(m => m.id_estudiante !== e.id_estudiante);
    db.usuarios = db.usuarios.filter(u => u.id_usuario !== e.id_usuario);
    db.recuperaciones = db.recuperaciones.filter(r => r.id_usuario !== e.id_usuario);
    db.estudiantes = db.estudiantes.filter(x => x !== e);
    VN.DB.auditar(db, admin.correo, 'Eliminación', 'Estudiante', e.codigo + ' - ' + A.nombreEst(e) + ' (' + nNotas + ' notas)');
    return { ok: true, notasEliminadas: nNotas };
  }));

  R('GET', 'estudiantes/:id/impacto', ({ params }) => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    const e = A.buscar(db.estudiantes, 'id_estudiante', A.exigirId(params.id, 'estudiante'), 'El estudiante no existe.');
    const ms = db.matriculas.filter(m => m.id_estudiante === e.id_estudiante).map(m => m.id_matricula);
    return { notas: db.notas.filter(n => ms.includes(n.id_matricula)).length, asistencias: db.asistencias.filter(x => ms.includes(x.id_matricula)).length };
  }));

  /* ---------- Docentes ---------- */
  R('GET', 'docentes', () => VN.DB.leer(db => {
    VN.autenticar(db, ADM);
    return db.docentes.map(d => {
      const u = db.usuarios.find(x => x.id_usuario === d.id_usuario);
      return Object.assign({}, d, { correo: u ? u.correo : '-', cursos: db.asignaciones.filter(a => a.id_docente === d.id_docente && a.id_anio === db.config.idAnioActivo).length });
    }).sort((a, b) => (a.apellidos + a.nombres).localeCompare(b.apellidos + b.nombres, 'es'));
  }));

  R('POST', 'docentes', ({ body }) => VN.DB.tx(db => {
    const admin = VN.autenticar(db, ADM);
    const d = validarOError(VN.val.esquema.docente, body);
    correoPersonalLibre(db, d.correoPersonal);
    if (db.docentes.some(x => mismaPersona(x, d))) throw new E(409, 'Ya existe un docente con los mismos nombres y apellidos.');
    const temporal = VN.seg.temporal(), sal = VN.seg.sal(), correo = generarCorreo(db, d.nombres, d.apellidos);
    const u = { id_usuario: VN.DB.siguienteId(db, 'usuarios'), nombre_usuario: VN.nombreCorto(d.nombres, d.apellidos), correo, sal, hash: VN.seg.hash(temporal, sal), rol: 'Docente', debe_cambiar: true, activo: true, intentos: 0, bloqueado_hasta: null, creado: VN.ahora() };
    db.usuarios.push(u);
    const idD = VN.DB.siguienteId(db, 'docentes');
    const doc = { id_docente: idD, id_usuario: u.id_usuario, codigo: 'DOC-' + String(idD).padStart(4, '0'), nombres: d.nombres, apellidos: d.apellidos, especialidad: d.especialidad, telefono: d.telefono, correo_personal: d.correoPersonal, creado: VN.ahora() };
    db.docentes.push(doc);
    VN.DB.auditar(db, admin.correo, 'Registro', 'Docente', doc.codigo + ' - ' + VN.api.nombreDoc(doc));
    return { id_docente: idD, codigo: doc.codigo, correo, contrasena_temporal: temporal };
  }));

  R('PUT', 'docentes/:id', ({ params, body }) => VN.DB.tx(db => {
    const admin = VN.autenticar(db, ADM);
    const doc = A.buscar(db.docentes, 'id_docente', A.exigirId(params.id, 'docente'), 'El docente no existe.');
    const d = validarOError(VN.val.esquema.docente, body);
    correoPersonalLibre(db, d.correoPersonal, doc);
    if (db.docentes.some(x => x !== doc && mismaPersona(x, d))) throw new E(409, 'Ya existe otro docente con los mismos nombres y apellidos.');
    Object.assign(doc, { nombres: d.nombres, apellidos: d.apellidos, especialidad: d.especialidad, telefono: d.telefono, correo_personal: d.correoPersonal });
    const u = db.usuarios.find(x => x.id_usuario === doc.id_usuario); if (u) u.nombre_usuario = VN.nombreCorto(d.nombres, d.apellidos);
    VN.DB.auditar(db, admin.correo, 'Edición', 'Docente', doc.codigo + ' - ' + A.nombreDoc(doc));
    return { ok: true };
  }));

  R('DELETE', 'docentes/:id', ({ params }) => VN.DB.tx(db => {
    const admin = VN.autenticar(db, ADM);
    const doc = A.buscar(db.docentes, 'id_docente', A.exigirId(params.id, 'docente'), 'El docente no existe.');
    const n = db.asignaciones.filter(a => a.id_docente === doc.id_docente).length;
    if (n) throw new E(409, 'No se puede eliminar a ' + A.nombreDoc(doc) + ' porque tiene ' + n + ' curso(s) asignado(s). Quita o reasigna esos cursos primero.');
    db.usuarios = db.usuarios.filter(u => u.id_usuario !== doc.id_usuario);
    db.recuperaciones = db.recuperaciones.filter(r => r.id_usuario !== doc.id_usuario);
    db.docentes = db.docentes.filter(x => x !== doc);
    VN.DB.auditar(db, admin.correo, 'Eliminación', 'Docente', doc.codigo + ' - ' + A.nombreDoc(doc));
    return { ok: true };
  }));

  /* ---------- Restablecer acceso (administrador) ---------- */
  ['estudiantes/:id/restablecer', 'docentes/:id/restablecer'].forEach(ruta => R('POST', ruta, ({ params }) => VN.DB.tx(db => {
    const admin = VN.autenticar(db, ADM);
    const esEst = ruta.startsWith('estudiantes');
    const p = esEst ? A.buscar(db.estudiantes, 'id_estudiante', A.exigirId(params.id), 'El estudiante no existe.') : A.buscar(db.docentes, 'id_docente', A.exigirId(params.id), 'El docente no existe.');
    const u = A.buscar(db.usuarios, 'id_usuario', p.id_usuario, 'La cuenta no existe.');
    const temporal = VN.seg.temporal();
    u.sal = VN.seg.sal(); u.hash = VN.seg.hash(temporal, u.sal); u.debe_cambiar = true; u.intentos = 0; u.bloqueado_hasta = null;
    VN.DB.auditar(db, admin.correo, 'Restablecer acceso', esEst ? 'Estudiante' : 'Docente', p.codigo);
    return { correo: u.correo, contrasena_temporal: temporal };
  })));

  /* ---------- Perfil propio ---------- */
  const esquemaPerfil = rol => {
    const base = rol === 'Estudiante' ? VN.val.esquema.estudiante : VN.val.esquema.docente;
    const e = { nombres: base.nombres, apellidos: base.apellidos, telefono: base.telefono, correoPersonal: base.correoPersonal };
    if (rol === 'Estudiante') e.direccion = base.direccion;
    return e;
  };

  R('GET', 'perfil/:idUsuario', ({ params }) => VN.DB.leer(db => {
    const u = VN.autenticar(db);
    const id = A.soloYo(u, params.idUsuario);
    const dueno = db.usuarios.find(x => x.id_usuario === id);
    const p = dueno && (db.estudiantes.find(x => x.id_usuario === id) || db.docentes.find(x => x.id_usuario === id));
    if (!p) throw new E(404, 'Esta cuenta no tiene datos personales.');
    return Object.assign({}, p, { rol: dueno.rol });
  }));

  R('PUT', 'perfil/:idUsuario', ({ params, body }) => VN.DB.tx(db => {
    const u = VN.autenticar(db);
    const id = A.soloYo(u, params.idUsuario);
    const p = db.estudiantes.find(x => x.id_usuario === id) || db.docentes.find(x => x.id_usuario === id);
    if (!p) throw new E(404, 'Esta cuenta no tiene datos personales.');
    const d = validarOError(esquemaPerfil(u.rol), body);
    correoPersonalLibre(db, d.correoPersonal, p);
    p.nombres = d.nombres; p.apellidos = d.apellidos; p.telefono = d.telefono; p.correo_personal = d.correoPersonal;
    if (u.rol === 'Estudiante') p.direccion = d.direccion;
    u.nombre_usuario = VN.nombreCorto(d.nombres, d.apellidos);
    VN.DB.auditar(db, u.correo, 'Actualización de perfil', u.rol, '');
    return { ok: true };
  }));

  VN.anio = db => String(VN.api.anio(db).nombre.match(/\d{4}/) || new Date().getFullYear());
})();
