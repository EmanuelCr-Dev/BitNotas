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
      const u = cuentaPorCorreo(db, correo);
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

  /* ---------- Recuperación por preguntas de seguridad ---------- */
  R('POST', 'auth/recuperar/pregunta', ({ body }) => {
    const correo = VN.limpiar(body.correo).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new E(422, 'Escribe un correo válido.', { correo: 'Escribe un correo válido.' });
    return VN.DB.leer(db => {
      const u = cuentaPorCorreo(db, correo);
      if (!u) throw new E(404, 'No encontramos ninguna cuenta activa asociada a este correo institucional o personal.', { correo: 'Correo no registrado en el sistema.' });
      return {
        ok: true,
        idUsuario: u.id_usuario,
        nombreUsuario: u.nombre_usuario,
        rol: u.rol,
        correo: u.correo,
        pregunta: u.pregunta_seguridad || '¿Cuál es tu color favorito?'
      };
    });
  });

  R('POST', 'auth/recuperar/verificar-pregunta', ({ body }) => {
    const correo = VN.limpiar(body.correo).toLowerCase();
    const respuesta = VN.limpiar(body.respuesta);
    if (!correo) throw new E(422, 'Escribe el correo.', { correo: 'El correo es obligatorio.' });
    if (!respuesta) throw new E(422, 'Escribe la respuesta a la pregunta de seguridad.', { respuesta: 'Escribe tu respuesta.' });

    const res = VN.DB.tx(db => {
      const u = cuentaPorCorreo(db, correo);
      if (!u) return { error: new E(404, 'No se encontró la cuenta.', { correo: 'Cuenta no encontrada.' }) };
      if (!u.activo) return { error: new E(403, 'Tu cuenta está desactivada.') };
      if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date())
        return { error: new E(429, 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta en ' + minutosRestantes(u.bloqueado_hasta) + ' minuto(s).') };

      const guardada = VN.norm(u.respuesta_seguridad || 'Azul');
      const recibida = VN.norm(respuesta);
      if (guardada !== recibida) {
        u.intentos = (u.intentos || 0) + 1;
        if (u.intentos >= C.MAX_INTENTOS) {
          u.bloqueado_hasta = new Date(Date.now() + C.BLOQUEO_MIN * 60000).toISOString(); u.intentos = 0;
          VN.DB.auditar(db, u.correo, 'Bloqueo por recuperación fallida', 'Usuario', 'Respuestas de seguridad incorrectas');
          return { error: new E(429, 'Superaste el límite de intentos. La cuenta ha sido bloqueada ' + C.BLOQUEO_MIN + ' minutos.') };
        }
        return { error: new E(400, 'La respuesta a la pregunta de seguridad no es correcta.', { respuesta: 'Respuesta incorrecta. Te quedan ' + (C.MAX_INTENTOS - u.intentos) + ' intento(s).' }) };
      }

      u.intentos = 0; u.bloqueado_hasta = null;
      VN.DB.auditar(db, u.correo, 'Verificación de seguridad exitosa', 'Usuario', 'Pregunta personal respondida correctamente');
      return { u };
    });
    ejecutar(res);
    const ses = respuestaSesion(res.u);
    VN.sesion = { idUsuario: ses.idUsuario };
    return ses;
  });

  R('POST', 'auth/restablecer-por-pregunta', ({ body }) => {
    const correo = VN.limpiar(body.correo).toLowerCase();
    const respuesta = VN.limpiar(body.respuesta);
    const nueva = String(body.nuevaContrasena || '');
    if (!correo) throw new E(422, 'Correo no especificado.');
    if (!respuesta) throw new E(422, 'Respuesta de seguridad no especificada.');

    const res = VN.DB.tx(db => {
      const u = cuentaPorCorreo(db, correo);
      if (!u) return { error: new E(404, 'Cuenta no encontrada.') };
      const guardada = VN.norm(u.respuesta_seguridad || 'Azul');
      if (guardada !== VN.norm(respuesta)) return { error: new E(400, 'La respuesta de seguridad es incorrecta.', { respuesta: 'Respuesta incorrecta.' }) };
      try { claveNueva(nueva, u); } catch (e) { return { error: e }; }

      u.sal = VN.seg.sal();
      u.hash = VN.seg.hash(nueva, u.sal);
      u.debe_cambiar = false;
      u.intentos = 0;
      u.bloqueado_hasta = null;
      VN.DB.auditar(db, u.correo, 'Contraseña restablecida', 'Usuario', 'Mediante pregunta de seguridad personal');
      return { u };
    });
    ejecutar(res);
    const ses = respuestaSesion(res.u);
    VN.sesion = { idUsuario: ses.idUsuario };
    return ses;
  });

  R('PUT', 'auth/pregunta-seguridad', ({ body }) => {
    const idUsuario = Number(body.idUsuario);
    const pregunta = VN.limpiar(body.pregunta);
    const respuesta = VN.limpiar(body.respuesta);
    if (!pregunta) throw new E(422, 'Selecciona una pregunta de seguridad.', { pregunta: 'Selecciona una pregunta.' });
    if (!respuesta || respuesta.length < 2) throw new E(422, 'Escribe una respuesta válida (mínimo 2 caracteres).', { respuesta: 'Respuesta muy corta.' });

    return VN.DB.tx(db => {
      const actual = VN.autenticar(db);
      if (actual.id_usuario !== idUsuario && actual.rol !== 'Administrador')
        throw new E(403, 'No tienes permiso para modificar esta cuenta.');
      const u = db.usuarios.find(x => x.id_usuario === idUsuario);
      if (!u) throw new E(404, 'Usuario no encontrado.');
      u.pregunta_seguridad = pregunta;
      u.respuesta_seguridad = respuesta;
      VN.DB.auditar(db, actual.correo, 'Actualización de preguntas de seguridad', 'Usuario', u.correo);
      return { ok: true, pregunta: u.pregunta_seguridad };
    });
  });

  /* Registro público para nuevos Estudiantes y Docentes */
  R('POST', 'auth/registro', ({ body }) => VN.DB.tx(db => {
    const rol = body.rol === 'Docente' ? 'Docente' : 'Estudiante';
    const nombres = VN.titulo(VN.limpiar(body.nombres));
    const apellidos = VN.titulo(VN.limpiar(body.apellidos));
    const correoPersonal = VN.limpiar(body.correoPersonal).toLowerCase();
    const telefono = VN.limpiar(body.telefono) || null;
    const clave = String(body.contrasena || '');
    const pregunta = VN.limpiar(body.preguntaSeguridad) || '¿Cuál es el nombre de tu mascota favorita?';
    const respuesta = VN.limpiar(body.respuestaSeguridad);

    const errores = {};
    if (!nombres || nombres.length < 2) errores.nombres = 'Escribe tus nombres.';
    if (!apellidos || apellidos.length < 2) errores.apellidos = 'Escribe tus apellidos.';
    if (!correoPersonal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoPersonal)) errores.correoPersonal = 'Escribe un correo personal válido.';
    if (!respuesta || respuesta.length < 2) errores.respuestaSeguridad = 'Escribe una respuesta para tu pregunta de seguridad.';
    if (!VN.seg.clavValida(clave)) errores.contrasena = 'La contraseña debe tener mínimo 8 caracteres, mayúsculas, minúsculas y un número.';

    if (db.estudiantes.concat(db.docentes).some(p => p.correo_personal === correoPersonal) || db.usuarios.some(u => u.correo === correoPersonal)) {
      errores.correoPersonal = 'Ese correo personal ya está registrado en el sistema.';
    }

    if (Object.keys(errores).length) throw new E(422, 'Revisa los campos marcados.', errores);

    const soloLetras = s => VN.norm(s).replace(/[^a-z]/g, '');
    const base = soloLetras(nombres.split(' ')[0]) + '.' + soloLetras(apellidos.split(' ')[0]);
    let correoInst = base + '@' + C.DOMINIO, n = 2;
    while (db.usuarios.some(u => u.correo === correoInst)) correoInst = base + n++ + '@' + C.DOMINIO;

    const sal = VN.seg.sal();
    const u = {
      id_usuario: VN.DB.siguienteId(db, 'usuarios'),
      nombre_usuario: VN.nombreCorto(nombres, apellidos),
      correo: correoInst,
      sal,
      hash: VN.seg.hash(clave, sal),
      rol,
      debe_cambiar: false,
      activo: true,
      intentos: 0,
      bloqueado_hasta: null,
      pregunta_seguridad: pregunta,
      respuesta_seguridad: respuesta,
      creado: VN.ahora()
    };
    db.usuarios.push(u);

    if (rol === 'Estudiante') {
      const idE = VN.DB.siguienteId(db, 'estudiantes');
      const idGrado = Number(body.idGrado) || 1;
      const numSec = String(body.numeroSeccion || '1');
      const sec = db.secciones.find(s => s.id_grado === idGrado && s.nombre_seccion === numSec) || db.secciones[0];
      const est = {
        id_estudiante: idE,
        id_usuario: u.id_usuario,
        codigo: 'EST-' + String(new Date().getFullYear()) + '-' + String(idE).padStart(4, '0'),
        nombres,
        apellidos,
        fecha_nacimiento: body.fechaNacimiento || '2013-05-10',
        sexo: body.sexo || 'F',
        telefono,
        correo_personal: correoPersonal,
        direccion: body.direccion || 'Managua',
        creado: VN.ahora()
      };
      db.estudiantes.push(est);
      db.matriculas.push({
        id_matricula: VN.DB.siguienteId(db, 'matriculas'),
        id_estudiante: idE,
        id_seccion: sec.id_seccion,
        id_anio: db.config.idAnioActivo,
        estado: 'Activa'
      });
    } else {
      const idD = VN.DB.siguienteId(db, 'docentes');
      const doc = {
        id_docente: idD,
        id_usuario: u.id_usuario,
        codigo: 'DOC-' + String(idD).padStart(4, '0'),
        nombres,
        apellidos,
        especialidad: body.especialidad || 'Educación General',
        telefono,
        correo_personal: correoPersonal,
        creado: VN.ahora()
      };
      db.docentes.push(doc);
    }

    VN.DB.auditar(db, u.correo, 'Autoregistro', rol, 'Cuenta creada con preguntas de seguridad');
    const ses = respuestaSesion(u);
    VN.sesion = { idUsuario: ses.idUsuario };
    return Object.assign({}, ses, { mensaje: 'Cuenta creada exitosamente. Tu correo institucional asignado es ' + correoInst });
  }));
})();
