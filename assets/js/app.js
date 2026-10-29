/* VitNota - armazón de la aplicación: acceso, menú lateral, navegación entre módulos y sesión.
   Cada módulo registra su pantalla con VN.vista('Nombre', function (contenedor) { ... }). */
(function () {
  const VN = window.VN, $ = VN.$, ic = VN.icono, ui = VN.ui, esc = VN.esc, C = VN.CONFIG;

  const MENUS = {
    Administrador: [['home', 'Inicio'], ['cap', 'Estudiantes'], ['users', 'Docentes'], ['book', 'Cursos'], ['check', 'Calificaciones'], ['chart', 'Reportes'], ['list', 'Historias de usuario'], ['sliders', 'Configuración']],
    Docente: [['home', 'Inicio'], ['book', 'Mis cursos'], ['check', 'Calificaciones'], ['cal', 'Asistencia'], ['user', 'Mi perfil']],
    Estudiante: [['home', 'Inicio'], ['book', 'Mis cursos'], ['check', 'Mis notas'], ['cal', 'Mi asistencia'], ['user', 'Mi perfil']]
  };
  const DESC = {
    Estudiantes: 'Registrar y consultar estudiantes', Docentes: 'Registrar y asignar docentes', Cursos: 'Grados, secciones y asignaturas',
    Calificaciones: 'Notas por periodo y asignatura', Reportes: 'Boletines y estadísticas', 'Configuración': 'Año lectivo, periodos y escala',
    'Historias de usuario': 'Alcance, sprints y casos de prueba del proyecto', 'Mis cursos': 'Tus asignaturas y secciones',
    Asistencia: 'Control diario de asistencia', 'Mis notas': 'Tus calificaciones por periodo', 'Mi asistencia': 'Tu historial de asistencia',
    'Mi perfil': 'Actualiza tus datos personales y tu contraseña'
  };
  const vistas = {};

  const app = VN.app = { usuario: null, items: [], actual: null, MENUS, DESC };
  VN.vista = (nombre, fn) => { vistas[nombre] = fn; };

  app.nombre = () => app.usuario.nombreMostrar || app.usuario.nombreUsuario;
  app.refrescarNombre = () => {
    const n = app.nombre(), i = $('.who i'), b = $('.who b'), bn = $('#bn');
    if (i) i.textContent = n[0].toUpperCase(); if (b) b.textContent = n; if (bn) bn.textContent = n;
  };
  app.titulo = (t, s) => { $('#tTitle').textContent = t; $('#tSub').textContent = s || ''; };

  /* ---------- Navegación ---------- */
  app.ir = function (nombre) {
    $('#app').classList.remove('open');
    $('#q').value = ''; $('#q').dispatchEvent(new Event('input'));
    document.querySelectorAll('.side nav button').forEach(b => { const on = app.items[b.dataset.i][1] === nombre; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    app.actual = nombre;
    app.titulo(nombre, DESC[nombre] || '');
    const cont = document.createElement('div'); cont.className = 'view-root';
    const host = $('#content'); host.innerHTML = ''; host.appendChild(cont);
    const fn = vistas[nombre];
    if (!fn) { const m = app.items.find(x => x[1] === nombre); cont.innerHTML = '<div class="soon"><span class="ti">' + ic(m ? m[0] : 'info') + '</span><h2>' + esc(nombre) + '</h2><p>Este módulo no está disponible para tu rol.</p></div>'; return; }
    try { const r = fn(cont); if (r && r.catch) r.catch(ui.manejar); } catch (e) { console.error(e); ui.manejar(e); }
    window.scrollTo(0, 0);
  };

  /* ---------- Tema ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(C.TEMA_KEY, t); } catch (e) { /* sin almacenamiento */ }
    const b = $('#theme'); if (b) b.innerHTML = ic(t === 'dark' ? 'sun' : 'moon') + '<span>' + (t === 'dark' ? 'Modo claro' : 'Modo oscuro') + '</span>';
  }

  /* ---------- Entrada y salida ---------- */
  app.entrar = function (u) {
    app.usuario = u;
    try { sessionStorage.setItem(C.SESION_KEY, JSON.stringify({ idUsuario: u.idUsuario, nombreUsuario: u.nombreUsuario, correo: u.correo, nombreRol: u.nombreRol })); } catch (e) { /* sin almacenamiento */ }
    VN.sesion = { idUsuario: u.idUsuario };
    app.items = MENUS[u.nombreRol] || MENUS.Estudiante;
    $('#auth').hidden = true; $('#app').hidden = false;
    $('#burger').innerHTML = ic('menu'); if (!$('#srch svg')) $('#srch').insertAdjacentHTML('afterbegin', ic('search'));
    $('#side').innerHTML = '<div class="brand"><span class="logo">Vit<b>Nota</b></span><button class="ib" id="fold" title="Contraer menú" aria-label="Contraer menú">' + ic('menu') + '</button></div>' +
      '<nav aria-label="Módulos">' + app.items.map((m, i) => '<button type="button" data-i="' + i + '">' + ic(m[0]) + '<span>' + m[1] + '</span></button>').join('') + '</nav>' +
      '<div class="foot"><div class="who" style="cursor:pointer" title="Ver mi perfil y preguntas de seguridad"><i>' + esc(app.nombre()[0].toUpperCase()) + '</i><div><b>' + esc(app.nombre()) + '</b><small>' + esc(u.nombreRol) + '</small></div></div>' +
      '<button type="button" id="theme"></button><button type="button" class="danger" id="bye">' + ic('out') + '<span>Cerrar sesión</span></button></div>';
    document.querySelectorAll('.side nav button').forEach(b => { b.onclick = () => app.ir(app.items[b.dataset.i][1]); });
    const who = $('.who'); if (who) who.onclick = () => app.ir('Mi perfil');
    $('#fold').onclick = () => $('#app').classList.toggle('mini');
    $('#burger').onclick = () => $('#app').classList.add('open');
    $('#veil').onclick = () => $('#app').classList.remove('open');
    $('#theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    $('#bye').onclick = () => app.salir();
    setTheme(document.documentElement.dataset.theme || 'light');
    app.ir('Inicio'); ui.toast('Bienvenido, ' + app.nombre());
    reiniciarInactividad();
  };

  app.salir = function (motivo) {
    VN.pedir('POST', 'auth/salir').catch(() => {});
    try { sessionStorage.removeItem(C.SESION_KEY); } catch (e) { /* sin almacenamiento */ }
    clearTimeout(app.tInact);
    document.querySelectorAll('.mdl').forEach(m => m.remove());
    app.usuario = null; VN.sesion = null;
    $('#app').hidden = true; $('#app').classList.remove('open', 'mini'); $('#auth').hidden = false;
    $('#content').innerHTML = '';
    ['lEmail', 'lPass', 'fOld', 'fNew', 'fNew2', 'r2Code', 'r2Pass', 'r2Pass2'].forEach(id => { const e = $('#' + id); if (e) e.value = ''; });
    mostrar('vLogin');
    if (motivo) msg($('#lMsg'), motivo, false);
  };

  function reiniciarInactividad() {
    clearTimeout(app.tInact);
    if (!app.usuario) return;
    app.tInact = setTimeout(() => app.salir('Tu sesión se cerró por inactividad.'), C.INACTIVIDAD_MIN * 60000);
  }
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { if (app.usuario) { clearTimeout(app.tInact); app.tInact = setTimeout(() => app.salir('Tu sesión se cerró por inactividad.'), C.INACTIVIDAD_MIN * 60000); } }, { passive: true }));

  /* ---------- Acceso ---------- */
  function mostrar(id) {
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== id; if (v.tagName === 'FORM') ui.limpiarErrores(v); });
    document.querySelectorAll('.demo-note').forEach(n => { if (id !== 'vRec2') n.hidden = true; });
    if (id === 'vRec1') {
      const p1 = $('#recPaso1'), p2 = $('#recPaso2');
      if (p1 && p2) { p1.hidden = false; p2.hidden = true; }
      const m1 = $('#r1Msg'), m2 = $('#recMsgRespuesta');
      if (m1) m1.textContent = ''; if (m2) m2.textContent = '';
    }
    if (id === 'vRegistro') {
      prepararRegistro();
    }
    const f = $('#' + id + ' input:not([disabled])'); if (f) setTimeout(() => f.focus(), 30);
  }

  async function prepararRegistro() {
    const selP = $('#regPregunta');
    if (selP && !selP.children.length) {
      (VN.CONFIG.PREGUNTAS_SEGURIDAD || []).forEach(p => {
        const o = document.createElement('option'); o.value = p; o.textContent = p; selP.appendChild(o);
      });
    }
    const selG = $('#regGrado');
    if (selG && !selG.children.length) {
      try {
        const grados = await VN.pedir('GET', 'grados');
        grados.forEach(g => {
          const o = document.createElement('option'); o.value = g.id_grado; o.textContent = g.nombre_grado; selG.appendChild(o);
        });
      } catch (e) { /* se cargan al vuelo */ }
    }
  }

  function msg(el, t, ok) { el.textContent = t; el.className = 'msg ' + (ok ? 'ok' : 'bad'); }

  function enlazarEnvio(form, ejecutar, esquemaCliente) {
    const f = $(form);
    if (!f) return;
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', async ev => {
      ev.preventDefault();
      const b = f.querySelector('.btn'); if (b && b.disabled) return;
      ui.limpiarErrores(f);
      if (esquemaCliente) { const er = esquemaCliente(); if (er && Object.keys(er).length) { ui.marcarErrores(f, er); ui.mensaje(f, 'Revisa los campos marcados en rojo.'); return; } }
      if (b) b.disabled = true;
      try { await ejecutar(); }
      catch (e) {
        if (e && e.errores) ui.marcarErrores(f, e.errores);
        ui.mensaje(f, e && e.message === 'Failed to fetch' ? 'No hay conexión con el servidor.' : (e && e.message) || 'Ocurrió un error. Intenta de nuevo.');
      }
      if (b) b.disabled = false;
    });
  }

  const FR = ['Notas claras para decisiones a tiempo.', 'Cada estudiante, cada docente, en su lugar.', 'Menos papeles, más tiempo para enseñar.'];
  let fi = 0;
  function frase() {
    const h = $('#rot'); if (!h) return; h.classList.add('out');
    setTimeout(() => { h.textContent = FR[fi]; h.classList.remove('out'); document.querySelectorAll('#dots i').forEach((d, i) => d.classList.toggle('on', i === fi)); fi = (fi + 1) % FR.length; }, 450);
  }

  function abrirModalVerificacionExitosa(u, respuesta) {
    const m = ui.modal(
      '<div class="mhead"><span class="ti" style="color:var(--ac)">' + ic('okc') + '</span><div><h2>¡Identidad confirmada!</h2></div></div>' +
      '<p class="sub" style="margin-top:6px">Hola <b>' + esc(u.nombreUsuario) + '</b> (' + esc(u.nombreRol) + '). Has respondido correctamente a tu pregunta de seguridad personal.</p>' +
      '<div style="background:var(--bg);padding:14px;border-radius:12px;margin:16px 0;border:1px solid var(--line);font-size:13px;line-height:1.5">' +
        '<p style="font-weight:600;margin-bottom:6px;color:var(--tx)">¿Qué deseas hacer en este momento?</p>' +
        '<ul style="padding-left:18px;margin:0;color:var(--mut)">' +
          '<li style="margin-bottom:6px"><b style="color:var(--tx)">Aceptar (Restablecer ahorita):</b> Te permite definir una nueva contraseña inmediatamente.</li>' +
          '<li><b style="color:var(--tx)">Cancelar (Ir a mi cuenta):</b> Puedes ingresar a tu cuenta de inmediato y restablecer tu contraseña más adelante desde la sección <b>Mi perfil</b>.</li>' +
        '</ul>' +
      '</div>' +
      '<div class="row2">' +
        '<button type="button" class="btn ghost" id="btnAccederCuentaDir">Cancelar (Ir a mi cuenta)</button>' +
        '<button type="button" class="btn" id="btnRestablecerAhoraModal">Aceptar (Restablecer ahorita)</button>' +
      '</div>',
      { cerrarFuera: false }
    );

    m.querySelector('#btnAccederCuentaDir').onclick = () => {
      m.cerrar();
      mostrar('vLogin');
      app.entrar(u);
      ui.toast('Has iniciado sesión. Puedes restablecer tu contraseña en Mi perfil cuando lo desees.');
    };

    m.querySelector('#btnRestablecerAhoraModal').onclick = () => {
      m.cerrar();
      abrirModalRestablecerClave(u, respuesta);
    };
  }

  function abrirModalRestablecerClave(u, respuesta) {
    const m = ui.modal(
      '<div class="mhead"><span class="ti">' + ic('lock') + '</span><div><h2>Reestablecer contraseña</h2></div></div>' +
      '<p class="sub">Escribe tu nueva contraseña segura para la cuenta <b>' + esc(u.correo) + '</b>.</p>' +
      '<form id="fResetRapido">' +
        '<div class="fl full"><input id="mrNueva" name="nueva" type="password" placeholder=" " maxlength="64"><label for="mrNueva">Nueva contraseña</label><button type="button" class="eye" data-eye="mrNueva"></button></div>' +
        '<div class="str"><i id="smrNueva"></i></div><ul class="pwr" id="rmrNueva"></ul>' +
        '<div class="fl full"><input id="mrConf" name="confirmar" type="password" placeholder=" " maxlength="64"><label for="mrConf">Confirmar nueva contraseña</label></div>' +
        '<div class="row2" style="margin-top:16px">' +
          '<button type="button" class="btn ghost" id="mrCx">Cancelar</button>' +
          '<button type="submit" class="btn">Guardar y acceder</button>' +
        '</div>' +
        '<div class="msg" role="alert"></div>' +
      '</form>',
      { cerrarFuera: false }
    );
    m.querySelector('#mrCx').onclick = () => {
      m.cerrar();
      mostrar('vLogin');
      app.entrar(u);
    };
    const inpN = m.querySelector('#mrNueva'), bEye = m.querySelector('[data-eye="mrNueva"]');
    bEye.innerHTML = ic('eye');
    bEye.onclick = () => { const v = inpN.type === 'password'; inpN.type = v ? 'text' : 'password'; bEye.innerHTML = ic(v ? 'eyeoff' : 'eye'); };
    ui.reglasClave(inpN, m.querySelector('#smrNueva'), m.querySelector('#rmrNueva'));

    ui.enviar(m.querySelector('#fResetRapido'), {
      validar: d => {
        const e = {};
        if (!VN.seg.clavValida(d.nueva || '')) e.nueva = 'La contraseña debe tener mayúscula, minúscula, número y 8 caracteres.';
        if (d.nueva !== d.confirmar) e.confirmar = 'Las contraseñas no coinciden.';
        return e;
      },
      ejecutar: async d => {
        await VN.pedir('POST', 'auth/restablecer-por-pregunta', {
          correo: u.correo,
          respuesta,
          nuevaContrasena: d.nueva
        });
        m.cerrar();
        mostrar('vLogin');
        app.entrar(u);
        ui.toast('Contraseña restablecida exitosamente. Bienvenido a BitNotas.');
      }
    });
  }

  function iniciarAcceso() {
    frase(); setInterval(frase, 4500);
    document.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => mostrar(b.dataset.go); });
    document.querySelectorAll('[data-eye]').forEach(b => {
      b.innerHTML = ic('eye'); b.setAttribute('aria-label', 'Mostrar u ocultar contraseña');
      b.onclick = () => { const i = $('#' + b.dataset.eye); if (!i) return; const v = i.type === 'password'; i.type = v ? 'text' : 'password'; b.innerHTML = ic(v ? 'eyeoff' : 'eye'); };
    });
    [['fNew', 'sfNew', 'rfNew'], ['r2Pass', 'sr2Pass', 'rr2Pass'], ['regPass', 'sregPass', 'rregPass']].forEach(x => {
      const i = $('#' + x[0]), b = $('#' + x[1]), r = $('#' + x[2]);
      if (i && b && r) ui.reglasClave(i, b, r);
    });

    /* Registro: cambio de rol */
    const rRol = $('#regRol');
    if (rRol) {
      rRol.onchange = () => {
        const esD = rRol.value === 'Docente';
        $('#regBloqueEstudiante').hidden = esD;
        $('#regBloqueDocente').hidden = !esD;
      };
    }

    /* Inicio de sesión */
    enlazarEnvio('#vLogin', async () => {
      const u = await VN.pedir('POST', 'auth/login', { correo: $('#lEmail').value, contrasena: $('#lPass').value });
      app.usuario = u;
      if (u.debeCambiarContrasena) { $('#fOld').value = $('#lPass').value; app.usuario = null; app.pendiente = u; mostrar('vForce'); }
      else { $('#lPass').value = ''; app.entrar(u); }
    });

    /* Recuperación por preguntas de seguridad */
    const btnB = $('#btnBuscarCuenta');
    if (btnB) {
      btnB.onclick = async () => {
        const correo = $('#r1Email').value.trim();
        const m = $('#r1Msg');
        if (!correo) { msg(m, 'Escribe tu correo institucional o personal.', false); return; }
        btnB.disabled = true; msg(m, 'Buscando cuenta...', true);
        try {
          const r = await VN.pedir('POST', 'auth/recuperar/pregunta', { correo });
          $('#recPaso1').hidden = true;
          $('#recPaso2').hidden = false;
          $('#recBadge').innerHTML = '<strong>' + esc(r.nombreUsuario) + '</strong> (' + esc(r.rol) + ') &bull; ' + esc(r.correo);
          $('#recPreguntaTexto').textContent = r.pregunta;
          $('#recRespuesta').value = '';
          m.textContent = '';
          setTimeout(() => $('#recRespuesta').focus(), 40);
        } catch (e) {
          msg(m, (e && e.message) || 'No encontramos ninguna cuenta con ese correo.', false);
        }
        btnB.disabled = false;
      };
    }

    const btnVolver = $('#btnCambiarCorreoRec');
    if (btnVolver) {
      btnVolver.onclick = () => {
        $('#recPaso2').hidden = true;
        $('#recPaso1').hidden = false;
        $('#r1Email').focus();
      };
    }

    const btnVerif = $('#btnVerificarPregunta');
    if (btnVerif) {
      btnVerif.onclick = async () => {
        const correo = $('#r1Email').value.trim();
        const respuesta = $('#recRespuesta').value.trim();
        const m = $('#recMsgRespuesta');
        if (!respuesta) { msg(m, 'Escribe tu respuesta a la pregunta de seguridad.', false); return; }
        btnVerif.disabled = true;
        try {
          const u = await VN.pedir('POST', 'auth/recuperar/verificar-pregunta', { correo, respuesta });
          m.textContent = '';
          abrirModalVerificacionExitosa(u, respuesta);
        } catch (e) {
          msg(m, (e && e.message) || 'Respuesta incorrecta. Intenta nuevamente.', false);
        }
        btnVerif.disabled = false;
      };
    }

    /* Enviar con Enter en recRespuesta o r1Email */
    const r1 = $('#r1Email'); if (r1) r1.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#btnBuscarCuenta').click(); } });
    const rr = $('#recRespuesta'); if (rr) rr.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#btnVerificarPregunta').click(); } });

    /* Recuperación alternativa por código de 6 dígitos */
    enlazarEnvio('#vRec2', async () => {
      await VN.pedir('POST', 'auth/restablecer', { correo: $('#r1Email').value, codigo: $('#r2Code').value, nuevaContrasena: $('#r2Pass').value });
      mostrar('vLogin'); msg($('#lMsg'), 'Contraseña cambiada exitosamente. Ya puedes iniciar sesión.', true);
      $('#r2Code').value = ''; $('#r2Pass').value = ''; $('#r2Pass2').value = '';
    }, () => {
      const e = {};
      if (!/^\d{6}$/.test($('#r2Code').value.trim())) e.codigo = 'Escribe los 6 dígitos del código.';
      if (!VN.seg.clavValida($('#r2Pass').value)) e.nuevaContrasena = 'La contraseña no cumple los requisitos.';
      if ($('#r2Pass').value !== $('#r2Pass2').value) e.confirmar = 'Las contraseñas no coinciden.';
      return e;
    });

    /* Autoregistro */
    enlazarEnvio('#vRegistro', async () => {
      const datos = {
        rol: $('#regRol').value,
        nombres: $('#regNombres').value,
        apellidos: $('#regApellidos').value,
        correoPersonal: $('#regEmail').value,
        telefono: $('#regTel').value,
        idGrado: $('#regGrado').value,
        numeroSeccion: $('#regSec').value,
        especialidad: $('#regEsp').value,
        preguntaSeguridad: $('#regPregunta').value,
        respuestaSeguridad: $('#regRespuesta').value,
        contrasena: $('#regPass').value
      };
      const res = await VN.pedir('POST', 'auth/registro', datos);
      mostrar('vLogin');
      ui.credenciales('¡Cuenta creada exitosamente!', {
        correo: res.correo,
        contrasena_temporal: datos.contrasena
      });
      ui.toast('Tu cuenta ha sido creada. Tu correo es: ' + res.correo);
    }, () => {
      const e = {};
      if (!$('#regNombres').value.trim()) e.nombres = 'Escribe tus nombres.';
      if (!$('#regApellidos').value.trim()) e.apellidos = 'Escribe tus apellidos.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#regEmail').value.trim())) e.correoPersonal = 'Escribe un correo personal válido.';
      if (!$('#regRespuesta').value.trim()) e.respuestaSeguridad = 'Escribe la respuesta a tu pregunta de seguridad.';
      if (!VN.seg.clavValida($('#regPass').value)) e.contrasena = 'La contraseña debe tener mínimo 8 caracteres, mayúsculas, minúsculas y número.';
      if ($('#regPass').value !== $('#regPass2').value) e.confirmar = 'Las contraseñas no coinciden.';
      return e;
    });

    /* Cambio forzoso de clave */
    enlazarEnvio('#vForce', async () => {
      app.usuario = app.pendiente; VN.sesion = { idUsuario: app.pendiente.idUsuario };
      try { await VN.pedir('POST', 'auth/cambiar', { idUsuario: app.pendiente.idUsuario, actual: $('#fOld').value, nueva: $('#fNew').value }); }
      catch (e) { app.usuario = null; throw e; }
      const u = app.pendiente; u.debeCambiarContrasena = false; app.pendiente = null;
      $('#fOld').value = ''; $('#fNew').value = ''; $('#fNew2').value = '';
      app.entrar(u);
    }, () => {
      const e = {};
      if (!$('#fOld').value) e.actual = 'Escribe tu contraseña actual.';
      if (!VN.seg.clavValida($('#fNew').value)) e.nueva = 'La contraseña no cumple los requisitos.';
      if ($('#fNew').value !== $('#fNew2').value) e.confirmar = 'Las contraseñas no coinciden.';
      return e;
    });
  }

  /* Búsqueda de módulos en la barra superior (atajo: /) */
  function iniciarBuscador() {
    $('#q').addEventListener('input', e => {
      const t = VN.norm(e.target.value);
      document.querySelectorAll('.side nav button').forEach(b => { b.style.display = VN.norm(b.textContent).includes(t) ? '' : 'none'; });
    });
    $('#q').addEventListener('keydown', e => {
      if (e.key === 'Enter') { const b = Array.from(document.querySelectorAll('.side nav button')).find(x => x.style.display !== 'none'); if (b) { b.click(); e.target.blur(); } }
      if (e.key === 'Escape') { e.target.value = ''; e.target.dispatchEvent(new Event('input')); e.target.blur(); }
    });
    document.addEventListener('keydown', e => { if (e.key === '/' && !$('#app').hidden && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); } });
  }

  /* ---------- Arranque ---------- */
  app.iniciar = function () {
    try { setTheme(localStorage.getItem(C.TEMA_KEY) || 'light'); } catch (e) { setTheme('light'); }
    iniciarAcceso(); iniciarBuscador();
    let guardada = null; try { guardada = sessionStorage.getItem(C.SESION_KEY); } catch (e) { /* sin almacenamiento */ }
    if (guardada) {
      try {
        const s = JSON.parse(guardada);
        const ok = VN.DB.leer(db => db.usuarios.some(x => x.id_usuario === s.idUsuario && x.activo && !x.debe_cambiar));
        if (ok) { VN.sesion = { idUsuario: s.idUsuario }; app.entrar(s); return; }
      } catch (e) { /* sesión dañada: se ignora */ }
      try { sessionStorage.removeItem(C.SESION_KEY); } catch (e) { /* nada */ }
    }
    $('#vLogin input').focus();
  };

  window.addEventListener('storage', e => { if (e.key === C.DB_KEY && e.newValue === null && app.usuario) app.salir('Los datos fueron reiniciados en otra pestaña.'); });
  window.go = app.ir; // compatibilidad con la función go() original
})();
