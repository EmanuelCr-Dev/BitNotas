/* Configuración (administrador): parámetros académicos, periodos y base de datos (HU-001). */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;

  VN.vista('Configuración', async function (c) {
    ui.cargando(c);
    let cfg, res;
    try { [cfg, res] = await Promise.all([VN.pedir('GET', 'config'), VN.pedir('GET', 'sistema/resumen')]); } catch (e) { c.innerHTML = '<div class="tbl">' + ui.vacio('No se pudo cargar', e.message, 'alert') + '</div>'; return; }
    c.innerHTML = '<div class="cols2"><div class="panel"><h3>Parámetros académicos</h3><p class="psub">Definen cómo se interpretan las notas en todo el sistema.</p><form id="cf"><div class="fg">' +
      campo('idAnioActivo', 'Año lectivo activo', { vacio: false, opciones: cfg.anios.map(a => ({ v: a.id_anio, t: a.nombre })), valor: cfg.idAnioActivo }) +
      campo('notaMinima', 'Nota mínima de aprobación', { req: 1, max: 2, attrs: 'inputmode="numeric"', valor: cfg.notaMinima, ayuda: 'Entre 50 y 75' }) +
      '</div><button class="btn sm" type="submit" style="margin-top:18px">' + ic('save') + '<span>Guardar parámetros</span></button><div class="msg" role="alert"></div></form>' +
      '<p class="fhint" style="margin-top:14px">Escala: AA 90-100 · AS 76-89 · AF desde la nota mínima · AI por debajo.</p></div>' +
      '<div class="panel"><h3>Periodos de calificación</h3><p class="psub">Un periodo cerrado no permite registrar ni editar notas.</p><div id="per"></div></div></div>' +
      '<div class="panel" style="margin-bottom:16px"><h3>Base de datos</h3><p class="psub">Esquema v' + res.esquema + ' · Aplicación v' + esc(res.version) + ' · Creada ' + esc(VN.fmtFechaHora(res.creada)) + ' · Ocupa ' + res.tamanoKB + ' KB en este navegador.</p><div class="dbgrid">' +
      res.tablas.map(t => '<div><b>' + t.registros + '</b>' + esc(t.nombre) + '</div>').join('') + '</div>' +
      '<div class="acts" style="margin-top:16px"><button type="button" class="btn ghost sm" id="bkp">' + ic('download') + '<span>Exportar respaldo</span></button><button type="button" class="btn ghost sm" id="rst">' + ic('upload') + '<span>Restaurar respaldo</span></button><button type="button" class="btn ghost sm danger" id="rei">' + ic('refresh') + '<span>Restablecer datos de demostración</span></button><input type="file" id="fil" accept="application/json,.json" hidden></div><div class="msg" id="dbm" role="alert"></div></div>';

    const per = c.querySelector('#per');
    const pintarPer = () => {
      per.innerHTML = cfg.periodos.map(p => '<div class="cfg-row"><div><b>' + esc(p.nombre) + '</b><small>' + (p.abierto ? 'Se pueden registrar y editar notas' : 'Solo lectura') + '</small></div><div class="acts">' + ui.badge(p.abierto ? 'Abierto' : 'Cerrado', p.abierto ? 'ok' : 'bad') + '<button type="button" class="btn ghost xs" data-p="' + p.id + '">' + ic(p.abierto ? 'lock' : 'refresh') + '<span>' + (p.abierto ? 'Cerrar' : 'Reabrir') + '</span></button></div></div>').join('');
    };
    pintarPer();
    per.onclick = async ev => {
      const b = ev.target.closest('[data-p]'); if (!b) return;
      const p = cfg.periodos.find(x => x.id === +b.dataset.p);
      if (p.abierto && !await ui.confirmar({ titulo: 'Cerrar ' + p.nombre, mensaje: 'Mientras esté cerrado nadie podrá registrar ni editar notas de ese periodo. Podrás reabrirlo cuando lo necesites.', textoOk: 'Cerrar periodo' })) return;
      try { await VN.pedir('PUT', 'config/periodos/' + p.id, { abierto: !p.abierto }); p.abierto = !p.abierto; pintarPer(); ui.toast(p.nombre + (p.abierto ? ' reabierto' : ' cerrado')); } catch (e) { ui.manejar(e); }
    };

    ui.enviar(c.querySelector('#cf'), {
      validar: d => { const e = {}; if (!/^\d+$/.test(d.notaMinima) || +d.notaMinima < 50 || +d.notaMinima > 75) e.notaMinima = 'Ingresa un entero entre 50 y 75.'; return e; },
      ejecutar: async d => { await VN.pedir('PUT', 'config', { notaMinima: +d.notaMinima, idAnioActivo: +d.idAnioActivo }); cfg.notaMinima = +d.notaMinima; ui.toast('Parámetros guardados'); }
    });

    const dbm = c.querySelector('#dbm'), msg = (t, ok) => { dbm.textContent = t; dbm.className = 'msg ' + (ok ? 'ok' : 'bad'); };
    c.querySelector('#bkp').onclick = async () => { try { const r = await VN.pedir('GET', 'sistema/respaldo'); VN.descargar(r.nombre, r.contenido, 'application/json'); ui.toast('Respaldo exportado'); } catch (e) { ui.manejar(e); } };
    c.querySelector('#rst').onclick = () => c.querySelector('#fil').click();
    c.querySelector('#fil').onchange = async ev => {
      const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
      if (f.size > 5 * 1024 * 1024) return msg('El archivo supera los 5 MB.');
      if (!await ui.confirmar({ titulo: 'Restaurar respaldo', mensaje: 'Se reemplazarán TODOS los datos actuales por los del archivo «' + f.name + '». Tendrás que iniciar sesión de nuevo.', textoOk: 'Restaurar', peligro: true })) return;
      try { await VN.pedir('POST', 'sistema/restaurar', { contenido: await f.text() }); VN.app.salir('Respaldo restaurado. Inicia sesión de nuevo.'); } catch (e) { msg(e.message); }
    };
    c.querySelector('#rei').onclick = () => {
      const m = ui.modal('<div class="mhead danger"><span class="ti">' + ic('alert') + '</span><div><h2>Restablecer datos</h2></div></div><p class="sub">Se borrarán todos los cambios y se cargarán de nuevo los datos de demostración. Escribe <b>REINICIAR</b> para confirmar.</p><form id="rf">' + campo('confirmacion', 'Confirmación', { max: 12 }) + '<div class="row2"><button type="button" class="btn ghost" id="rx">Cancelar</button><button type="submit" class="btn solid-danger">Restablecer</button></div><div class="msg" role="alert"></div></form>', { clase: 'sm', cerrarFuera: false });
      m.querySelector('#rx').onclick = () => m.cerrar();
      ui.enviar(m.querySelector('#rf'), { validar: d => d.confirmacion === 'REINICIAR' ? {} : { confirmacion: 'Escribe REINICIAR en mayúsculas.' }, ejecutar: async d => { await VN.pedir('POST', 'sistema/reiniciar', { confirmacion: d.confirmacion }); m.cerrar(); VN.app.salir('Datos restablecidos. Inicia sesión con las credenciales de demostración.'); }, sinSesion: true });
    };
  });
})();
