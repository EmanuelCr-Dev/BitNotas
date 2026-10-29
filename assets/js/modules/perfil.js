/* Mi perfil: datos personales y cambio de contraseña. */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;

  VN.vista('Mi perfil', async function (c) {
    const u = VN.app.usuario;
    ui.cargando(c);
    let p;
    try { p = await VN.pedir('GET', 'perfil/' + u.idUsuario); } catch (e) { c.innerHTML = '<div class="soon"><h2>Sin perfil</h2><p>' + esc(e.message) + '</p></div>'; return; }
    const est = p.rol === 'Estudiante';
    const adm = p.rol === 'Administrador';
    const opcionesPreg = (VN.CONFIG.PREGUNTAS_SEGURIDAD || []).map(x => ({ v: x, t: x }));

    c.innerHTML = '<div class="cols2">' +
      '<div class="panel"><h3>Datos personales</h3><p class="psub">Mantén tu información al día. Tu correo de acceso no se puede cambiar.</p><form id="pp"><div class="fg">' +
      campo('nombres', 'Nombres', { req: 1, max: 50, valor: p.nombres }) + campo('apellidos', 'Apellidos', { req: 1, max: 50, valor: p.apellidos }) +
      campo('telefono', 'Teléfono', { max: 16, valor: p.telefono, ayuda: 'Ej. 8888-7777' }) + campo('correoPersonal', 'Correo personal (recuperar clave)', { tipo: 'email', req: 1, max: 100, valor: p.correo_personal }) +
      (est ? campo('direccion', 'Dirección', { full: 1, max: 150, valor: p.direccion }) : (adm ? '' : campo('especialidad', 'Especialidad', { full: 1, valor: p.especialidad, off: 1 }))) +
      campo('correo', 'Correo de acceso institucional', { full: 1, valor: p.correo || u.correo, off: 1 }) +
      '</div><button class="btn sm" type="submit" style="margin-top:18px">' + ic('save') + '<span>Guardar cambios</span></button><div class="msg" role="alert"></div></form></div>' +

      '<div class="panel"><h3>Cambiar contraseña</h3><p class="psub">Reestablece tu contraseña actual por una nueva y segura.</p><form id="pc">' +
      campo('actual', 'Contraseña actual', { tipo: 'password', auto: 'current-password', max: 64 }) + campo('nueva', 'Nueva contraseña', { tipo: 'password', auto: 'new-password', max: 64 }) +
      '<div class="str"><i id="pcBar"></i></div><ul class="pwr" id="pcRules"></ul>' + campo('confirmar', 'Confirmar nueva contraseña', { tipo: 'password', auto: 'new-password', max: 64 }) +
      '<button class="btn sm" type="submit" style="margin-top:18px">' + ic('lock') + '<span>Actualizar contraseña</span></button><div class="msg" role="alert"></div></form></div>' +

      '<div class="panel full" style="grid-column:1/-1;margin-top:12px"><h3>Preguntas de seguridad personal</h3><p class="psub">Esta pregunta y su respuesta personal te permitirán recuperar tu contraseña si la olvidas al cerrar sesión.</p><form id="ps"><div class="fg">' +
      campo('preguntaSeguridad', 'Pregunta de seguridad personal', { req: 1, opciones: opcionesPreg, valor: p.pregunta_seguridad || (opcionesPreg[0] && opcionesPreg[0].v), full: 1 }) +
      campo('respuestaSeguridad', 'Tu respuesta secreta', { req: 1, max: 80, valor: p.respuesta_seguridad || '', full: 1, ayuda: 'Escribe una respuesta fácil de recordar para ti (ej. nombre de tu perro favorito, color favorito, nombre de tus padres).' }) +
      '</div><button class="btn sm" type="submit" style="margin-top:18px">' + ic('okc') + '<span>Guardar pregunta de seguridad</span></button><div class="msg" role="alert"></div></form></div>' +
      '</div>';

    const esq = est
      ? { nombres: VN.val.esquema.estudiante.nombres, apellidos: VN.val.esquema.estudiante.apellidos, telefono: VN.val.esquema.estudiante.telefono, correoPersonal: VN.val.esquema.estudiante.correoPersonal, direccion: VN.val.esquema.estudiante.direccion }
      : (adm ? { nombres: VN.val.esquema.docente.nombres, apellidos: VN.val.esquema.docente.apellidos, telefono: VN.val.esquema.docente.telefono, correoPersonal: VN.val.esquema.docente.correoPersonal } : { nombres: VN.val.esquema.docente.nombres, apellidos: VN.val.esquema.docente.apellidos, telefono: VN.val.esquema.docente.telefono, correoPersonal: VN.val.esquema.docente.correoPersonal });

    ui.enviar(c.querySelector('#pp'), { esquema: esq, ejecutar: async d => {
      await VN.pedir('PUT', 'perfil/' + u.idUsuario, d);
      u.nombreMostrar = VN.nombreCorto(VN.val.validar(esq, d).datos.nombres, VN.val.validar(esq, d).datos.apellidos); VN.app.refrescarNombre(); ui.toast('Perfil actualizado');
    } });

    const fSeg = c.querySelector('#ps');
    ui.enviar(fSeg, {
      validar: d => {
        const e = {};
        if (!d.preguntaSeguridad) e.preguntaSeguridad = 'Selecciona una pregunta.';
        if (!d.respuestaSeguridad || d.respuestaSeguridad.trim().length < 2) e.respuestaSeguridad = 'Escribe una respuesta de al menos 2 caracteres.';
        return e;
      },
      ejecutar: async d => {
        await VN.pedir('PUT', 'auth/pregunta-seguridad', { idUsuario: u.idUsuario, pregunta: d.preguntaSeguridad, respuesta: d.respuestaSeguridad });
        ui.mensaje(fSeg, 'Pregunta de seguridad actualizada correctamente.', true);
        ui.toast('Pregunta de seguridad guardada');
      }
    });
    ui.reglasClave(c.querySelector('#pc [name=nueva]'), c.querySelector('#pcBar'), c.querySelector('#pcRules'));
    const f = c.querySelector('#pc');
    ui.enviar(f, {
      validar: d => { const e = {}; if (!d.actual) e.actual = 'Escribe tu contraseña actual.'; if (!VN.seg.clavValida(d.nueva || '')) e.nueva = 'No cumple los requisitos.'; if (d.nueva !== d.confirmar) e.confirmar = 'Las contraseñas no coinciden.'; return e; },
      ejecutar: async d => { await VN.pedir('POST', 'auth/cambiar', { idUsuario: u.idUsuario, actual: d.actual, nueva: d.nueva }); f.reset(); f.querySelector('[name=nueva]').dispatchEvent(new Event('input')); ui.mensaje(f, 'Contraseña actualizada correctamente.', true); ui.toast('Contraseña actualizada'); }
    });
  });
})();
