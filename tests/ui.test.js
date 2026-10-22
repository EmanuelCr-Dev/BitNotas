/* Pruebas de interfaz: cargan la web real en jsdom y ejecutan los pasos de los casos del Excel. */
const assert = require('assert');
const { servidor, abrir, ayudas, esperar } = require('./helpers.js');

module.exports = async function (t) {
  const { s, url } = await servidor(); const errores = [];
  const nueva = async () => { const w = await abrir(url, errores); return { w, h: ayudas(w) }; };
  const fila = (h, txt) => h.$$('tbody tr').find(tr => tr.textContent.includes(txt));
  const accion = (h, txt, a) => h.click(fila(h, txt).querySelector('[data-act="' + a + '"]'));
  const modal = h => h.$('.mdl');
  const llenar = (h, form, datos) => Object.keys(datos).forEach(k => h.escribir(form.querySelector('[name="' + k + '"]'), datos[k]));
  const confirmar = async h => { await esperar(() => modal(h)); h.click('[data-r="1"]'); await esperar(() => !modal(h)); };

  /* ---------- Administrador ---------- */
  const A = await nueva();
  await t('Acceso: campos vacíos muestran errores por campo', async () => {
    A.h.enviar('#vLogin'); await esperar(() => A.h.$('#vLogin .ferr'));
    assert.ok(A.h.$$('#vLogin .ferr').length === 2);
  });
  await t('Acceso: credenciales incorrectas muestran intentos restantes', async () => {
    await A.h.login('admin@vitnota.edu.ni', 'mala'); await esperar(() => A.h.$('#lMsg').textContent);
    assert.ok(/Te quedan 4/.test(A.h.$('#lMsg').textContent));
  });
  await t('Acceso: administrador entra y ve su menú', async () => {
    await A.h.login('admin@vitnota.edu.ni', 'Admin2026*');
    assert.ok(!A.w.document.getElementById('app').hidden);
    assert.deepStrictEqual(A.h.$$('.side nav button').map(b => b.textContent.trim()), ['Inicio', 'Estudiantes', 'Docentes', 'Cursos', 'Calificaciones', 'Reportes', 'Historias de usuario', 'Configuración']);
  });
  await t('CP-003 Visualizar Dashboard con indicadores', async () => {
    await esperar(() => A.h.$$('.kpi').length >= 8); assert.ok(A.h.texto().includes('Estudiantes') && A.h.$$('.bfill').length > 0);
  });
  await t('La interfaz no contiene emojis', async () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
    for (const n of ['Inicio', 'Estudiantes', 'Docentes', 'Cursos', 'Calificaciones', 'Reportes', 'Historias de usuario', 'Configuración']) { await A.h.ir(n); assert.ok(!emoji.test(A.h.$('#app').innerHTML), 'emoji en ' + n); }
  });

  await A.h.ir('Estudiantes');
  await t('CP-008 Ver lista de estudiantes (paginada)', async () => { await esperar(() => A.h.$$('tbody tr').length); assert.strictEqual(A.h.$$('tbody tr').length, 10); assert.ok(A.h.$('.pager').textContent.includes('de 14')); });
  await t('CP-004 Registrar estudiante: errores de validación visibles', async () => {
    A.h.click('#nuevo'); await esperar(() => modal(A.h) && A.h.$('#pf'));
    A.h.enviar('#pf'); await esperar(() => A.h.$('#pf .ferr')); assert.ok(A.h.$$('#pf .ferr').length >= 6);
    llenar(A.h, A.h.$('#pf'), { nombres: 'Mario', apellidos: 'Zelaya', fechaNacimiento: '2012-06-01', sexo: 'M', idGrado: '1', numeroSeccion: '2', telefono: '123', correoPersonal: 'mario@' });
    A.h.enviar('#pf'); await esperar(() => A.h.$$('#pf .ferr').length === 2);
  });
  await t('CP-004 Registrar estudiante: datos válidos', async () => {
    llenar(A.h, A.h.$('#pf'), { telefono: '8123-4567', correoPersonal: 'mario.z@gmail.com' }); A.h.enviar('#pf');
    await esperar(() => A.h.$('.cred')); assert.ok(/mario\.zelaya@vitnota\.edu\.ni/.test(A.h.$('.cred').textContent));
    A.h.click('#okCred'); await esperar(() => !modal(A.h)); await esperar(() => A.h.$('.pager').textContent.includes('de 15'));
  });
  await t('CP-007 Buscar estudiante (sin importar tildes ni mayúsculas)', async () => {
    A.h.escribir('#flt', 'PEREZ'); await esperar(() => A.h.$('.pager') && A.h.$$('tbody tr').length >= 1); assert.ok(fila(A.h, 'Pérez Rivas'));
    A.h.escribir('#flt', 'zzzz'); await esperar(() => A.h.$('.empty')); assert.ok(A.h.texto().includes('Sin resultados'));
    A.h.escribir('#flt', 'zelaya'); await esperar(() => A.h.$$('tbody tr').length === 1);
  });
  await t('CP-005 Editar estudiante', async () => {
    accion(A.h, 'Zelaya', 'e'); await esperar(() => A.h.$('#pf'));
    llenar(A.h, A.h.$('#pf'), { nombres: 'Mario José', telefono: '99' }); A.h.enviar('#pf'); await esperar(() => A.h.$('#pf .ferr'));
    llenar(A.h, A.h.$('#pf'), { telefono: '7000-1234' }); A.h.enviar('#pf'); await esperar(() => !modal(A.h));
    await esperar(() => fila(A.h, 'Mario José'));
  });
  await t('CP-006 Eliminar estudiante (con confirmación)', async () => {
    accion(A.h, 'Mario José', 'd'); await esperar(() => modal(A.h) && A.h.$('[data-r="0"]'));
    A.h.click('[data-r="0"]'); await esperar(() => !modal(A.h)); assert.ok(fila(A.h, 'Mario José'));
    accion(A.h, 'Mario José', 'd'); await confirmar(A.h); await esperar(() => !fila(A.h, 'Mario José'));
  });

  await A.h.ir('Docentes');
  await t('CP-013 Ver lista de docentes', async () => { await esperar(() => A.h.$$('tbody tr').length === 4); });
  await t('CP-009 a CP-012 Docente: registrar, buscar, editar, eliminar', async () => {
    A.h.click('#nuevo'); await esperar(() => A.h.$('#pf'));
    llenar(A.h, A.h.$('#pf'), { nombres: 'Elena', apellidos: 'Sandoval', especialidad: 'Física', correoPersonal: 'elena.s@gmail.com' }); A.h.enviar('#pf');
    await esperar(() => A.h.$('.cred')); A.h.click('#okCred'); await esperar(() => !modal(A.h));
    A.h.escribir('#flt', 'fisica'); await esperar(() => A.$ || A.h.$$('tbody tr').length === 1);
    accion(A.h, 'Sandoval', 'e'); await esperar(() => A.h.$('#pf')); llenar(A.h, A.h.$('#pf'), { especialidad: 'Física y Química' }); A.h.enviar('#pf'); await esperar(() => !modal(A.h));
    await esperar(() => fila(A.h, 'Física y Química'));
    accion(A.h, 'Sandoval', 'd'); await confirmar(A.h); await esperar(() => !fila(A.h, 'Sandoval'));
  });
  await t('Docente con cursos no se elimina: mensaje claro', async () => {
    A.h.escribir('#flt', 'mendoza'); await esperar(() => A.h.$$('tbody tr').length === 1);
    accion(A.h, 'Mendoza', 'd'); await confirmar(A.h); await esperar(() => A.h.$('#toast.bad.on')); assert.ok(/curso\(s\) asignado/.test(A.h.$('#toast').textContent));
  });

  await A.h.ir('Cursos');
  await t('CP-018 y CP-014 Asignaturas: listar y registrar con validación', async () => {
    await esperar(() => A.h.$$('tbody tr').length === 8); A.h.click('#nA'); await esperar(() => A.h.$('#af'));
    A.h.enviar('#af'); await esperar(() => A.h.$('#af .ferr'));
    llenar(A.h, A.h.$('#af'), { nombre: 'Matemáticas' }); A.h.enviar('#af'); await esperar(() => /Ya existe/.test(A.h.$('#af').textContent));
    llenar(A.h, A.h.$('#af'), { nombre: 'Artes Plásticas' }); A.h.enviar('#af'); await esperar(() => !modal(A.h)); await esperar(() => fila(A.h, 'Artes Plásticas'));
  });
  await t('CP-017, CP-015 y CP-016 Asignaturas: buscar, editar, eliminar', async () => {
    A.h.escribir('#fltA', 'artes'); await esperar(() => A.h.$$('tbody tr').length === 1);
    accion(A.h, 'Artes', 'e'); await esperar(() => A.h.$('#af')); llenar(A.h, A.h.$('#af'), { nombre: 'Artes Visuales' }); A.h.enviar('#af'); await esperar(() => !modal(A.h)); await esperar(() => fila(A.h, 'Artes Visuales'));
    accion(A.h, 'Artes Visuales', 'd'); await confirmar(A.h); await esperar(() => !fila(A.h, 'Artes Visuales'));
  });
  await t('Asignatura en uso no se elimina; se puede desactivar', async () => {
    A.h.escribir('#fltA', 'matem'); await esperar(() => A.h.$$('tbody tr').length === 1);
    accion(A.h, 'Matemáticas', 'd'); await confirmar(A.h); await esperar(() => A.h.$('#toast.bad.on'));
    accion(A.h, 'Matemáticas', 't'); await esperar(() => fila(A.h, 'Matemáticas').textContent.includes('Inactiva'));
    accion(A.h, 'Matemáticas', 't'); await esperar(() => fila(A.h, 'Matemáticas').textContent.includes('Activa'));
  });
  await t('Asignar docentes: lista por sección y bloqueo de duplicados', async () => {
    A.h.click('#tS'); await esperar(() => A.h.$('#fa')); await esperar(() => A.h.$$('#la tbody tr').length === 5);
    const f = A.h.$('#fa'); llenar(A.h, f, { idAsignatura: '1', idDocente: '2' }); A.h.enviar(f); await esperar(() => /ya está asignada/.test(f.textContent));
  });

  await A.h.ir('Historias de usuario');
  await t('CP-002 Historias de usuario: 20 historias, 6 sprints y registro de resultado', async () => {
    await esperar(() => A.h.$$('.hu').length === 20); assert.strictEqual(A.h.$$('.sprint').length, 6);
    const f = A.h.$('#HU-004 .hu-form'); llenar(A.h, f, { estado: 'Aprobado' }); A.h.enviar(f); await esperar(() => A.h.$('#HU-004 .badge.ok'));
  });
  await A.h.ir('Configuración');
  await t('CP-001 Base de datos: tablas, parámetros y cierre de periodo', async () => {
    await esperar(() => A.h.$$('.dbgrid div').length === 13); A.h.click('[data-p="3"]'); await confirmar(A.h); await esperar(() => /III Periodo[\s\S]*Cerrado/.test(A.h.$('#per').textContent));
    A.h.click('[data-p="3"]'); await esperar(() => /Reabrir|Cerrar/.test(A.h.$('#per').textContent));
    const f = A.h.$('#cf'); llenar(A.h, f, { notaMinima: '99' }); A.h.enviar(f); await esperar(() => f.querySelector('.ferr'));
  });
  await A.h.ir('Reportes');
  await t('Reportes: boletín y estadísticas por curso', async () => {
    await esperar(() => A.h.$('.boletin-head')); assert.ok(A.h.$$('#bol tbody tr').length >= 2);
    A.h.click('#rC'); await esperar(() => A.h.$('#est .kpi')); assert.ok(A.h.$$('#est .bfill').length === 4);
  });

  /* ---------- Docente ---------- */
  const D = await nueva();
  await D.h.login('docente@vitnota.edu.ni', 'Docente2026*');
  await D.h.ir('Calificaciones');
  await t('CP-019 Registrar nota (docente): validaciones y registro', async () => {
    await esperar(() => D.h.$$('#tbN tbody tr').length > 0); D.h.click('#nNota'); await esperar(() => D.h.$('#nf'));
    D.h.enviar('#nf'); await esperar(() => D.h.$('#nf .ferr'));
    const f = D.h.$('#nf'); const alumno = f.elements.idMatricula.options[1].value;
    llenar(D.h, f, { idMatricula: alumno, idPeriodo: '4', titulo: 'Práctica final', valor: '150' }); D.h.enviar(f); await esperar(() => /entre 0 y 100/.test(f.textContent));
    llenar(D.h, f, { valor: '95,5' }); await esperar(() => /AA/.test(D.h.$('#escPrev').textContent)); D.h.enviar(f); await esperar(() => !modal(D.h));
    D.h.escribir('[name=periodo]', '4'); await esperar(() => fila(D.h, 'Práctica final'));
  });
  await t('CP-020 Editar nota (docente)', async () => {
    accion(D.h, 'Práctica final', 'e'); await esperar(() => D.h.$('#nf')); const f = D.h.$('#nf');
    llenar(D.h, f, { valor: '58' }); D.h.enviar(f); await esperar(() => !modal(D.h));
    await esperar(() => /58/.test(fila(D.h, 'Práctica final').textContent) && /Editada/.test(fila(D.h, 'Práctica final').textContent));
  });
  await t('Resumen por periodo disponible', async () => { D.h.click('#vR'); await esperar(() => D.h.$$('#tbR tbody tr').length > 0); });
  await D.h.ir('Asistencia');
  await t('Asistencia: registrar para la fecha de hoy', async () => { await esperar(() => D.h.$$('input[type=radio]').length > 0); D.h.click('#aTodos'); D.h.click('#aGuardar'); await esperar(() => /ya registrada/.test(D.h.$('#aTb').textContent)); });
  await t('Menú del docente no incluye módulos de administración', async () => { assert.ok(!D.h.$$('.side nav button').some(b => /Estudiantes|Docentes|Configuración/.test(b.textContent))); });

  /* ---------- Estudiante: contraseña temporal ---------- */
  const E = await nueva();
  await t('Estudiante: nuevo usuario debe cambiar su contraseña temporal', async () => {
    const r = await E.w.VN.pedir('POST', 'auth/login', { correo: 'admin@vitnota.edu.ni', contrasena: 'Admin2026*' });
    const x = await E.w.VN.pedir('POST', 'estudiantes', { nombres: 'Tania', apellidos: 'Gómez', fechaNacimiento: '2013-01-05', sexo: 'F', correoPersonal: 'tania.g@gmail.com', idGrado: 1, numeroSeccion: 1 });
    await E.w.VN.pedir('POST', 'auth/salir');
    await E.h.login(x.correo, x.contrasena_temporal); await esperar(() => !E.h.$('#vForce').hidden);
    E.h.escribir('#fNew', 'corta'); E.h.escribir('#fNew2', 'otra'); E.h.enviar('#vForce'); await esperar(() => E.h.$('#vForce .ferr'));
    E.h.escribir('#fNew', 'Segura2026a'); E.h.escribir('#fNew2', 'Segura2026a'); E.h.enviar('#vForce'); await esperar(() => !E.w.document.getElementById('app').hidden);
    assert.ok(E.h.$$('.side nav button').some(b => b.textContent.trim() === 'Mis notas'));
  });
  await t('Estudiante: Mis notas sin notas aún muestra mensaje claro y Mi perfil guarda cambios', async () => {
    await E.h.ir('Mis notas'); await esperar(() => !E.h.$('#content .loading'));
    await E.h.ir('Mi perfil'); await esperar(() => E.h.$('#pp')); E.h.escribir(E.h.$('#pp [name=telefono]'), '8000-1111'); E.h.enviar('#pp'); await esperar(() => E.h.$('#toast.on'));
  });
  await t('Cerrar sesión devuelve al acceso', async () => { E.h.click('#bye'); await esperar(() => !E.w.document.getElementById('auth').hidden); });

  /* ---------- Recuperación de contraseña ---------- */
  const Rr = await nueva();
  await t('Recuperar contraseña: código, nueva clave y acceso', async () => {
    Rr.h.click('[data-go="vRec1"]'); Rr.h.escribir('#r1Email', 'ana.martinez@vitnota.edu.ni'); Rr.h.enviar('#vRec1'); await esperar(() => !Rr.h.$('#vRec2').hidden);
    const cod = Rr.h.$('#demoCodigo b:last-child').textContent; assert.ok(/^\d{6}$/.test(cod));
    Rr.h.escribir('#r2Code', cod); Rr.h.escribir('#r2Pass', 'Clave2026ok'); Rr.h.escribir('#r2Pass2', 'Clave2026oc'); Rr.h.enviar('#vRec2'); await esperar(() => Rr.h.$('#vRec2 .ferr'));
    Rr.h.escribir('#r2Pass2', 'Clave2026ok'); Rr.h.enviar('#vRec2'); await esperar(() => !Rr.h.$('#vLogin').hidden);
    await Rr.h.login('ana.martinez@vitnota.edu.ni', 'Clave2026ok'); assert.ok(!Rr.w.document.getElementById('app').hidden);
  });

  await t('Sin errores de JavaScript durante todas las pruebas', async () => { assert.deepStrictEqual(errores, []); });
  s.close();
};
