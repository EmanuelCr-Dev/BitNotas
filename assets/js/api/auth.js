/* VitNota - autenticación: inicio de sesión, bloqueo por intentos, recuperación y cambio de contraseña. */
(function () {
  const VN = window.VN, E = VN.ApiError, C = VN.CONFIG, R = VN.ruta;

  const minutosRestantes = hasta => Math.max(1, Math.ceil((new Date(hasta) - new Date()) / 60000));
  const respuestaSesion = u => ({ idUsuario: u.id_usuario, nombreUsuario: u.nombre_usuario, correo: u.correo, nombreRol: u.rol, debeCambiarContrasena: u.debe_cambiar });

  /* Las escrituras que deben persistir aunque la operación falle (contadores) devuelven un error en vez de lanzarlo */
  const ejecutar = res => { if (res && res.error) throw res.error; return res; };

  function claveNueva(clave, u, actual) {
    if (!clave || !VN.seg.clavValida(clave)) throw new E(422, 'La nueva contraseña debe tener mínimo 8 caracteres, mayúsculas, minúsculas y un número.', { nueva: 'No cumple la política de contraseñas.' });
    if (clave.length > 64) throw new E(422, 'La contraseña es demasiado larga (máximo 64 caracteres).');
    if (actual !== undefined && clave === actual) throw new E(422, 'La nueva contraseña debe ser distinta de la actual.', { nueva: 'Debe ser distinta de la actual.' });
    const local = u.correo.split('@')[0].toLowerCase();
    if (local.length >= 4 && clave.toLowerCase().includes(local)) throw new E(422, 'La contraseña no puede contener tu nombre de usuario.', { nueva: 'No uses tu usuario dentro de la contraseña.' });
  }

  R('POST', 'auth/login', ({ body }) => {
    const correo = VN.limpiar(body.correo).toLowerCase(), clave = String(body.contrasena || '');
    const errores = {};
    if (!correo) errores.correo = 'Escribe tu correo institucional.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.correo = 'El correo no tiene un formato válido.';
    if (!clave) errores.contrasena = 'Escribe tu contraseña.';
    if (Object.keys(errores).length) throw new E(422, 'Revisa los campos marcados.', errores);

    const res = VN.DB.tx(db => {
      const u = db.usuarios.find(x => x.correo === correo);
      if (!u) return { error: new E(401, 'Correo o contraseña incorrectos.') };
      if (!u.activo) return { error: new E(403, 'Tu cuenta está desactivada. Contacta al administrador.') };
      if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date())
        return { error: new E(429, 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ' + minutosRestantes(u.bloqueado_hasta) + ' minuto(s).') };
      if (!VN.seg.verificar(clave, u.sal, u.hash)) {
        u.intentos = (u.intentos || 0) + 1;
        let msg;
        if (u.intentos >= C.MAX_INTENTOS) {
          u.bloqueado_hasta = new Date(Date.now() + C.BLOQUEO_MIN * 60000).toISOString(); u.intentos = 0;
          VN.DB.auditar(db, u.correo, 'Bloqueo de cuenta', 'Usuario', 'Demasiados intentos fallidos');
          msg = 'Superaste el máximo de intentos. La cuenta quedó bloqueada ' + C.BLOQUEO_MIN + ' minutos.';
        } else msg = 'Correo o contraseña incorrectos. Te quedan ' + (C.MAX_INTENTOS - u.intentos) + ' intento(s).';
        return { error: new E(401, msg) };
      }
      u.intentos = 0; u.bloqueado_hasta = null;
      VN.DB.auditar(db, u.correo, 'Inicio de sesión', 'Usuario', u.rol);
      return { u };
    });
    ejecutar(res);
    const r = respuestaSesion(res.u);
    VN.sesion = { idUsuario: r.idUsuario };
    return r;
  });

  R('POST', 'auth/salir', () => { VN.sesion = null; return { ok: true }; });

  /* Busca la cuenta por correo institucional o por correo personal registrado */
  function cuentaPorCorreo(db, correo) {
    let u = db.usuarios.find(x => x.correo === correo && x.activo);
    if (u) return u;
    const p = db.estudiantes.find(x => x.correo_personal === correo) || db.docentes.find(x => x.correo_personal === correo);
    return p ? db.usuarios.find(x => x.id_usuario === p.id_usuario && x.activo) : null;
  }

  R('POST', 'auth/solicitar-recuperacion', ({ body }) => {
    const correo = VN.limpiar(body.correo).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new E(422, 'Escribe un correo válido.', { correo: 'Escribe un correo válido.' });
    return VN.DB.tx(db => {
      const u = cuentaPorCorreo(db, correo);
      const respuesta = { ok: true, mensaje: 'Si el correo existe, te enviamos un código.' };
      if (!u) return respuesta;
      db.recuperaciones = db.recuperaciones.filter(r => r.id_usuario !== u.id_usuario);
      const codigo = VN.seg.codigo6();
      db.recuperaciones.push({ id_usuario: u.id_usuario, codigo, expira: new Date(Date.now() + C.CODIGO_VENCE_MIN * 60000).toISOString(), intentos: 0 });
      VN.DB.auditar(db, u.correo, 'Solicitud de recuperación', 'Usuario', '');
      /* En producción el código viaja por correo. En esta demostración se devuelve para poder probar el flujo. */
      respuesta.demoCodigo = codigo; respuesta.demoDestino = correo;
      return respuesta;
    });
  });

  R('POST', 'auth/restablecer', ({ body }) => {
    const correo = VN.limpiar(body.correo).toLowerCase(), codigo = String(body.codigo || '').trim(), nueva = String(body.nuevaContrasena || '');
    if (!/^\d{6}$/.test(codigo)) throw new E(422, 'El código debe tener 6 dígitos.', { codigo: 'Escribe los 6 dígitos del código.' });
    const res = VN.DB.tx(db => {
      const u = cuentaPorCorreo(db, correo);
      const rec = u && db.recuperaciones.find(r => r.id_usuario === u.id_usuario);
      if (!rec) return { error: new E(400, 'Código inválido o vencido. Solicita uno nuevo.') };
      if (new Date(rec.expira) < new Date()) { db.recuperaciones = db.recuperaciones.filter(r => r !== rec); return { error: new E(400, 'El código venció. Solicita uno nuevo.') }; }
      if (rec.codigo !== codigo) {
        rec.intentos++;
        if (rec.intentos >= 5) { db.recuperaciones = db.recuperaciones.filter(r => r !== rec); return { error: new E(400, 'Demasiados intentos. Solicita un código nuevo.') }; }
        return { error: new E(400, 'Código incorrecto. Te quedan ' + (5 - rec.intentos) + ' intento(s).') };
      }
      try { claveNueva(nueva, u); } catch (e) { return { error: e }; }
      u.sal = VN.seg.sal(); u.hash = VN.seg.hash(nueva, u.sal); u.debe_cambiar = false; u.intentos = 0; u.bloqueado_hasta = null;
      db.recuperaciones = db.recuperaciones.filter(r => r !== rec);
      VN.DB.auditar(db, u.correo, 'Contraseña restablecida', 'Usuario', 'Por código de recuperación');
      return { ok: true };
    });
    ejecutar(res);
    return { ok: true };
  });

  R('POST', 'auth/cambiar', ({ body }) => {
    const actual = String(body.actual || ''), nueva = String(body.nueva || '');
    const res = VN.DB.tx(db => {
      const u = VN.autenticar(db);
      if (u.id_usuario !== Number(body.idUsuario)) throw new E(403, 'No puedes cambiar la contraseña de otra persona.');
      if (!VN.seg.verificar(actual, u.sal, u.hash)) return { error: new E(401, 'La contraseña actual no es correcta.', { actual: 'No coincide con tu contraseña actual.' }) };
      try { claveNueva(nueva, u, actual); } catch (e) { return { error: e }; }
      u.sal = VN.seg.sal(); u.hash = VN.seg.hash(nueva, u.sal); u.debe_cambiar = false;
      VN.DB.auditar(db, u.correo, 'Cambio de contraseña', 'Usuario', '');
      return { ok: true };
    });
    ejecutar(res);
    return { ok: true };
  });
})();
