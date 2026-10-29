/* Pruebas de la capa de datos (reglas de negocio y validaciones). Se ejecutan en Node, sin navegador. */
const assert = require('assert'), path = require('path');
globalThis.window = globalThis; globalThis.TextEncoder = TextEncoder; globalThis.crypto = require('crypto').webcrypto;
const mem = {}; globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const R = path.resolve(__dirname, '../assets/js/');
['core/config', 'core/utils', 'core/seguridad', 'core/validacion', 'core/dominio', 'core/db', 'core/seed', 'data/historias', 'api/router', 'api/auth', 'api/personas', 'api/academico', 'api/notas', 'api/sistema'].forEach(f => require(path.join(R, f + '.js')));
VN.CONFIG.LATENCIA_MS = 0;
const P = VN.pedir;
const falla = async (fn, status, texto) => { try { await fn(); } catch (e) { assert.strictEqual(e.status, status, 'estado esperado ' + status + ' y fue ' + e.status + ': ' + e.message); if (texto) assert.ok(e.message.includes(texto) || JSON.stringify(e.errores || {}).includes(texto), 'mensaje: ' + e.message); return e; } assert.fail('debía fallar con ' + status); };

module.exports = async function (t) {
  const admin = () => P('POST', 'auth/login', { correo: 'admin@vitnota.edu.ni', contrasena: 'Admin2026*' });

  await t('SHA-256 coincide con la referencia', () => assert.strictEqual(VN.seg.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
  await t('Sin sesión no se accede a datos protegidos (401)', async () => { await falla(() => P('GET', 'estudiantes'), 401); });
  await t('Login: validaciones de formato', async () => { const e = await falla(() => P('POST', 'auth/login', { correo: 'abc', contrasena: '' }), 422); assert.ok(e.errores.correo && e.errores.contrasena); });
  await t('Login administrador correcto', async () => { const r = await admin(); assert.strictEqual(r.nombreRol, 'Administrador'); });
  await t('Un estudiante no puede listar estudiantes (403)', async () => { await P('POST', 'auth/login', { correo: 'estudiante@vitnota.edu.ni', contrasena: 'Estudiante2026*' }); await falla(() => P('GET', 'estudiantes'), 403); await admin(); });

  await t('CP-004 Registrar estudiante: crea acceso y matrícula', async () => {
    const r = await P('POST', 'estudiantes', { nombres: 'luis  alberto', apellidos: 'pérez gómez', fechaNacimiento: '2012-03-04', sexo: 'M', telefono: '8888 7777', correoPersonal: 'luis.p@gmail.com', idGrado: 2, numeroSeccion: 1 });
    assert.ok(r.correo.endsWith('@vitnota.edu.ni') && r.contrasena_temporal.length >= 8);
    const l = await P('GET', 'estudiantes'); const e = l.find(x => x.id_estudiante === r.id_estudiante);
    assert.strictEqual(e.nombres, 'Luis Alberto'); assert.strictEqual(e.telefono, '8888-7777'); assert.strictEqual(e.nombre_grado, 'Octavo Grado');
  });
  await t('Registrar estudiante: validaciones por campo', async () => {
    const e = await falla(() => P('POST', 'estudiantes', { nombres: 'A1', apellidos: '', fechaNacimiento: '2050-01-01', sexo: 'X', telefono: '12', correoPersonal: 'mal', idGrado: 99, numeroSeccion: 7 }), 422);
    ['nombres', 'apellidos', 'fechaNacimiento', 'sexo', 'telefono', 'correoPersonal', 'idGrado'].forEach(k => assert.ok(e.errores[k], 'falta error en ' + k));
  });
  await t('Registrar estudiante: edad fuera de rango y duplicados', async () => {
    await falla(() => P('POST', 'estudiantes', { nombres: 'Ana', apellidos: 'Ruiz', fechaNacimiento: '1990-01-01', sexo: 'F', correoPersonal: 'ana.r@x.com', idGrado: 1, numeroSeccion: 1 }), 422, 'edad');
    await falla(() => P('POST', 'estudiantes', { nombres: 'Otro', apellidos: 'Nombre', fechaNacimiento: '2012-03-04', sexo: 'M', correoPersonal: 'luis.p@gmail.com', idGrado: 2, numeroSeccion: 1 }), 409, 'correo');
    await falla(() => P('POST', 'estudiantes', { nombres: 'Luis Alberto', apellidos: 'Pérez Gómez', fechaNacimiento: '2012-03-04', sexo: 'M', correoPersonal: 'otro@x.com', idGrado: 2, numeroSeccion: 1 }), 409, 'mismos nombres');
  });
  await t('CP-005 Editar estudiante y CP-006 Eliminar estudiante', async () => {
    const e = (await P('GET', 'estudiantes')).find(x => x.nombres === 'Luis Alberto');
    await P('PUT', 'estudiantes/' + e.id_estudiante, { nombres: 'Luis Alberto', apellidos: 'Pérez Gómez', fechaNacimiento: '2012-03-04', sexo: 'M', telefono: '7777-1111', correoPersonal: 'luis.p@gmail.com' });
    assert.strictEqual((await P('GET', 'estudiantes')).find(x => x.id_estudiante === e.id_estudiante).telefono, '7777-1111');
    await P('DELETE', 'estudiantes/' + e.id_estudiante);
    assert.ok(!(await P('GET', 'estudiantes')).some(x => x.id_estudiante === e.id_estudiante));
    await falla(() => P('DELETE', 'estudiantes/' + e.id_estudiante), 404);
  });
  await t('Eliminar estudiante borra sus notas y su acceso', async () => {
    const e = (await P('GET', 'estudiantes')).find(x => x.codigo === 'EST-2026-0001');
    const imp = await P('GET', 'estudiantes/' + e.id_estudiante + '/impacto'); assert.ok(imp.notas > 0);
    const r = await P('DELETE', 'estudiantes/' + e.id_estudiante); assert.strictEqual(r.notasEliminadas, imp.notas);
    await falla(() => P('POST', 'auth/login', { correo: 'estudiante@vitnota.edu.ni', contrasena: 'Estudiante2026*' }), 401);
    await admin();
  });

  let docNuevo;
  await t('CP-009 Registrar docente, CP-010 Editar y CP-011 Eliminar', async () => {
    docNuevo = await P('POST', 'docentes', { nombres: 'Rosa', apellidos: 'Calero', especialidad: 'Física', correoPersonal: 'rosa.c@gmail.com' });
    await falla(() => P('POST', 'docentes', { nombres: 'Rosa', apellidos: 'Calero', especialidad: 'Física', correoPersonal: 'rosa2@gmail.com' }), 409);
    await P('PUT', 'docentes/' + docNuevo.id_docente, { nombres: 'Rosa María', apellidos: 'Calero', especialidad: 'Física y Química', correoPersonal: 'rosa.c@gmail.com' });
    assert.ok((await P('GET', 'docentes')).some(d => d.nombres === 'Rosa María'));
    await P('DELETE', 'docentes/' + docNuevo.id_docente);
  });
  await t('No se elimina un docente con cursos asignados (integridad)', async () => { await falla(() => P('DELETE', 'docentes/1'), 409, 'curso'); });

  await t('CP-014 a CP-018 Asignaturas: registrar, editar, buscar/listar y eliminar', async () => {
    const r = await P('POST', 'asignaturas', { nombre: 'Artes Plásticas' });
    await falla(() => P('POST', 'asignaturas', { nombre: 'artes plasticas' }), 409, 'Ya existe');
    await falla(() => P('POST', 'asignaturas', { nombre: '' }), 422);
    await falla(() => P('POST', 'asignaturas', { nombre: '@@@' }), 422);
    await P('PUT', 'asignaturas/' + r.id_asignatura, { nombre: 'Artes Visuales' });
    assert.ok((await P('GET', 'asignaturas')).some(a => a.nombre === 'Artes Visuales'));
    await P('DELETE', 'asignaturas/' + r.id_asignatura);
    assert.ok(!(await P('GET', 'asignaturas')).some(a => a.nombre === 'Artes Visuales'));
    await falla(() => P('DELETE', 'asignaturas/1'), 409, 'desactivarla');
  });
  await t('Asignaciones: sin duplicados ni asignaturas inactivas', async () => {
    await falla(() => P('POST', 'asignaciones', { idAsignatura: 1, idDocente: 2, idSeccion: 1, idAnio: 2 }), 409, 'ya está asignada');
    await falla(() => P('POST', 'asignaciones', { idAsignatura: 8, idDocente: 2, idSeccion: 1, idAnio: 2 }), 409, 'inactiva');
    await falla(() => P('POST', 'asignaciones', {}), 422);
    await falla(() => P('DELETE', 'asignaciones/1'), 409, 'nota');
  });

  await t('CP-019 Registrar nota y CP-020 Editar nota (docente)', async () => {
    await P('POST', 'auth/login', { correo: 'docente@vitnota.edu.ni', contrasena: 'Docente2026*' });
    const cursos = await P('GET', 'calificaciones/cursos'); assert.ok(cursos.length === 5);
    const c = cursos[0], al = await P('GET', 'asignaciones/' + c.id_asignacion + '/alumnos');
    const base = { idAsignacion: c.id_asignacion, idMatricula: al[0].id_matricula, idPeriodo: 4, titulo: 'Examen final', valor: '92,5' };
    const n = await P('POST', 'notas', base);
    await falla(() => P('POST', 'notas', base), 409, 'ya tiene una nota');
    await falla(() => P('POST', 'notas', Object.assign({}, base, { titulo: 'Otro', valor: '101' })), 422, 'entre 0 y 100');
    await falla(() => P('POST', 'notas', Object.assign({}, base, { titulo: 'Otro', valor: 'abc' })), 422);
    await falla(() => P('POST', 'notas', Object.assign({}, base, { titulo: 'Otro', valor: '-5' })), 422);
    await falla(() => P('POST', 'notas', Object.assign({}, base, { titulo: 'Otro', idMatricula: 9999 })), 422);
    await P('PUT', 'notas/' + n.id_nota, { titulo: 'Examen final', valor: '88', observacion: 'Corregido' });
    const fila = (await P('GET', 'notas?idAsignacion=' + c.id_asignacion + '&idPeriodo=4')).find(x => x.id_nota === n.id_nota);
    assert.strictEqual(fila.valor, 88); assert.ok(fila.modificada); assert.strictEqual(fila.escala.codigo, 'AS');
    assert.ok((await P('PUT', 'notas/' + n.id_nota, { titulo: 'Examen final', valor: '88', observacion: 'Corregido' })).sinCambios);
  });
  await t('Un docente no califica cursos de otro docente (403)', async () => {
    await P('POST', 'auth/login', { correo: 'docente@vitnota.edu.ni', contrasena: 'Docente2026*' });
    const ajena = (await VN.DB.leer(db => db.asignaciones.find(a => a.id_docente === 2)));
    await falla(() => P('GET', 'notas?idAsignacion=' + ajena.id_asignacion), 403);
    await falla(() => P('PUT', 'notas/' + VN.DB.leer(db => db.notas.find(n => n.id_asignacion === ajena.id_asignacion).id_nota), { titulo: 'x1x', valor: '50' }), 403);
  });
  await t('Periodo cerrado bloquea registro y edición de notas', async () => {
    await admin(); await P('PUT', 'config/periodos/4', { abierto: false });
    await P('POST', 'auth/login', { correo: 'docente@vitnota.edu.ni', contrasena: 'Docente2026*' });
    const c = (await P('GET', 'calificaciones/cursos'))[0], al = await P('GET', 'asignaciones/' + c.id_asignacion + '/alumnos');
    await falla(() => P('POST', 'notas', { idAsignacion: c.id_asignacion, idMatricula: al[1].id_matricula, idPeriodo: 4, titulo: 'Quiz', valor: 80 }), 409, 'cerrado');
    await admin(); await P('PUT', 'config/periodos/4', { abierto: true });
  });

  await t('Boletín y estadísticas coherentes con la escala', async () => {
    const e = (await P('GET', 'estudiantes'))[0], b = await P('GET', 'reportes/boletin/' + e.id_estudiante);
    assert.ok(b.cursos.length > 0 && b.promedioGeneral != null);
    const cur = (await P('GET', 'calificaciones/cursos'))[0], s = await P('GET', 'reportes/curso/' + cur.id_asignacion);
    assert.strictEqual(s.aprobados + s.reprobados, s.conNotas);
  });
  await t('Configuración: nota mínima validada', async () => {
    await falla(() => P('PUT', 'config', { notaMinima: 20, idAnioActivo: 2 }), 422);
    await P('PUT', 'config', { notaMinima: 60, idAnioActivo: 2 });
  });
  await t('Historias de usuario: registro de pruebas', async () => {
    const h = await P('GET', 'historias'); assert.strictEqual(h.historias.length, 20); assert.strictEqual(h.sprints.length, 6);
    await falla(() => P('PUT', 'historias/HU-004/prueba', { estado: 'Fallido', observacion: '' }), 422, 'qué falló');
    await P('PUT', 'historias/HU-004/prueba', { estado: 'Aprobado' });
    assert.strictEqual((await P('GET', 'historias')).historias[3].prueba.estado, 'Aprobado');
  });
  await t('Respaldo exportable y restaurable; archivo inválido rechazado', async () => {
    const r = await P('GET', 'sistema/respaldo'); assert.ok(JSON.parse(r.contenido).notas.length > 0);
    await falla(() => P('POST', 'sistema/restaurar', { contenido: '{no es json' }), 400);
    await falla(() => P('POST', 'sistema/restaurar', { contenido: '{"version":1}' }), 400);
    await P('POST', 'sistema/restaurar', { contenido: r.contenido }); await admin();
  });

  await t('Bloqueo de cuenta tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 4; i++) await falla(() => P('POST', 'auth/login', { correo: 'carlos.nuevo@vitnota.edu.ni', contrasena: 'x' }), 401);
    for (let i = 0; i < 4; i++) await falla(() => P('POST', 'auth/login', { correo: 'maria.lopez@vitnota.edu.ni', contrasena: 'mala' }), 401);
    await falla(() => P('POST', 'auth/login', { correo: 'maria.lopez@vitnota.edu.ni', contrasena: 'mala' }), 401, 'bloqueada');
    await falla(() => P('POST', 'auth/login', { correo: 'maria.lopez@vitnota.edu.ni', contrasena: 'Docente2026*' }), 429);
  });
  await t('Recuperación de contraseña con código', async () => {
    const r = await P('POST', 'auth/solicitar-recuperacion', { correo: 'ana.martinez@vitnota.edu.ni' }); assert.ok(/^\d{6}$/.test(r.demoCodigo));
    await falla(() => P('POST', 'auth/restablecer', { correo: 'ana.martinez@vitnota.edu.ni', codigo: '000000', nuevaContrasena: 'Nueva2026x' }), 400, 'incorrecto');
    await falla(() => P('POST', 'auth/restablecer', { correo: 'ana.martinez@vitnota.edu.ni', codigo: r.demoCodigo, nuevaContrasena: 'corta' }), 422);
    await P('POST', 'auth/restablecer', { correo: 'ana.martinez@vitnota.edu.ni', codigo: r.demoCodigo, nuevaContrasena: 'Nueva2026x' });
    await P('POST', 'auth/login', { correo: 'ana.martinez@vitnota.edu.ni', contrasena: 'Nueva2026x' });
    assert.ok(!(await P('POST', 'auth/solicitar-recuperacion', { correo: 'noexiste@x.com' })).demoCodigo);
  });

  await t('Recuperación de contraseña por preguntas de seguridad personales', async () => {
    // 1. Consultar pregunta por correo institucional
    const q1 = await P('POST', 'auth/recuperar/pregunta', { correo: 'carlos.mendoza.rizo@gmail.com' });
    assert.ok(q1.ok && q1.pregunta);
    // Correo inexistente da 404
    await falla(() => P('POST', 'auth/recuperar/pregunta', { correo: 'nadie@x.com' }), 404);

    // 2. Respuesta incorrecta
    await falla(() => P('POST', 'auth/recuperar/verificar-pregunta', { correo: 'docente@vitnota.edu.ni', respuesta: 'incorrecto' }), 400);

    // 3. Respuesta correcta (tolera mayúsculas y espacios: 'firulais' vs 'Firulais')
    const v = await P('POST', 'auth/recuperar/verificar-pregunta', { correo: 'docente@vitnota.edu.ni', respuesta: 'firulais' });
    assert.strictEqual(v.nombreRol, 'Docente');

    // 4. Restablecer con nueva clave mediante pregunta de seguridad
    await P('POST', 'auth/restablecer-por-pregunta', { correo: 'docente@vitnota.edu.ni', respuesta: 'Firulais', nuevaContrasena: 'ClaveRec2026*' });
    // Iniciar sesión con la nueva clave
    const l = await P('POST', 'auth/login', { correo: 'docente@vitnota.edu.ni', contrasena: 'ClaveRec2026*' });
    assert.strictEqual(l.correo, 'docente@vitnota.edu.ni');
  });

  await t('Restablecer acceso por Administrador (solo admin)', async () => {
    // Estudiante intenta restablecer (403)
    await P('POST', 'auth/login', { correo: 'kevin.ortiz@vitnota.edu.ni', contrasena: 'Estudiante2026*' });
    await falla(() => P('POST', 'estudiantes/2/restablecer'), 403);

    // Administrador restablece con contraseña temporal
    await admin();
    const r1 = await P('POST', 'estudiantes/2/restablecer');
    assert.ok(r1.contrasena_temporal);

    // Administrador restablece con contraseña manual personalizada
    const r2 = await P('POST', 'estudiantes/2/restablecer', { nuevaContrasena: 'Manual2026*' });
    assert.strictEqual(r2.contrasena_temporal, 'Manual2026*');
    // El estudiante puede entrar con la clave manual
    const l = await P('POST', 'auth/login', { correo: r2.correo, contrasena: 'Manual2026*' });
    assert.strictEqual(l.nombreRol, 'Estudiante');
    await admin();
  });

  await t('Registro público con pregunta de seguridad y recuperación', async () => {
    const reg = await P('POST', 'auth/registro', {
      rol: 'Estudiante',
      nombres: 'Mateo',
      apellidos: 'Calero',
      correoPersonal: 'mateo.calero@gmail.com',
      contrasena: 'Mateo2026*',
      preguntaSeguridad: '¿Cuál es tu color favorito?',
      respuestaSeguridad: 'Verde'
    });
    assert.ok(reg.correo.includes('mateo.calero'));
    // Consultar su pregunta por su correo personal
    const q = await P('POST', 'auth/recuperar/pregunta', { correo: 'mateo.calero@gmail.com' });
    assert.strictEqual(q.pregunta, '¿Cuál es tu color favorito?');
    // Verificar respuesta
    const ver = await P('POST', 'auth/recuperar/verificar-pregunta', { correo: 'mateo.calero@gmail.com', respuesta: 'verde' });
    assert.strictEqual(ver.nombreRol, 'Estudiante');
  });
  await t('Reiniciar datos exige confirmación', async () => { await admin(); await falla(() => P('POST', 'sistema/reiniciar', { confirmacion: 'si' }), 422); await P('POST', 'sistema/reiniciar', { confirmacion: 'REINICIAR' }); });
};
