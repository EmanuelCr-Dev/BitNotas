/* Asistencia: registro diario por curso (docente) y consulta del historial (estudiante). */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;
  const ESTADOS = ['Presente', 'Ausente', 'Permiso'];
  const tono = e => e === 'Presente' ? 'ok' : e === 'Ausente' ? 'bad' : 'warn';

  VN.vista('Asistencia', async function (c) {
    const u = VN.app.usuario;
    ui.cargando(c);
    let cursos;
    try { cursos = await VN.pedir('GET', 'asistencia/cursos-docente/' + u.idUsuario); } catch (e) { c.innerHTML = '<div class="tbl">' + ui.vacio('No se pudieron cargar tus cursos', e.message, 'alert') + '</div>'; return; }
    if (!cursos.length) { c.innerHTML = '<div class="soon"><h2>Sin cursos</h2><p>Aún no tienes cursos asignados.</p></div>'; return; }
    c.innerHTML = '<div class="tools"><div class="filters">' +
      campo('curso', 'Curso', { vacio: false, opciones: cursos.map(x => ({ v: x.idAsignacion, t: x.asignatura + ' · ' + x.grado + ' ' + x.seccion })) }) +
      campo('fecha', 'Fecha', { tipo: 'date', valor: VN.hoy(), attrs: 'max="' + VN.hoy() + '"' }) +
      '</div><div class="acts"><button type="button" class="btn ghost sm" id="aTodos">Marcar todos presentes</button><button type="button" class="btn sm" id="aGuardar">' + ic('save') + '<span>Guardar asistencia</span></button></div></div><div class="tbl" id="aTb"></div>';
    const tb = c.querySelector('#aTb'), selC = c.querySelector('[name=curso]'), inpF = c.querySelector('[name=fecha]');
    let rows = [];
    const dibujar = () => {
      tb.innerHTML = rows.length ? '<table><thead><tr><th>#</th><th>Estudiante</th><th>Estado</th></tr></thead><tbody>' + rows.map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(r.estudiante) + '</td><td>' +
        ESTADOS.map(e => '<label style="margin-right:16px;cursor:pointer;white-space:nowrap"><input type="radio" name="e' + r.idMatricula + '" value="' + e + '"' + ((r.estado || 'Presente') === e ? ' checked' : '') + '> ' + e + '</label>').join('') + '</td></tr>').join('') + '</tbody></table>' +
        '<div class="pager"><span>' + rows.length + ' estudiantes' + (rows.some(r => r.estado) ? ' · asistencia ya registrada para esta fecha' : ' · aún sin registrar') + '</span></div>'
        : ui.vacio('Este curso no tiene estudiantes matriculados', '', 'users');
    };
    const cargar = async () => {
      if (!inpF.value) { tb.innerHTML = ui.vacio('Selecciona una fecha', '', 'cal'); return; }
      if (inpF.value > VN.hoy()) { tb.innerHTML = ui.vacio('Fecha futura', 'No se puede registrar asistencia en una fecha futura.', 'alert'); rows = []; return; }
      ui.cargando(tb);
      try { rows = await VN.pedir('GET', 'asistencia/asignacion/' + selC.value + '/fecha/' + inpF.value); dibujar(); } catch (e) { tb.innerHTML = ui.vacio('No se pudo cargar la lista', e.message, 'alert'); }
    };
    selC.onchange = cargar; inpF.onchange = cargar;
    c.querySelector('#aTodos').onclick = () => tb.querySelectorAll('input[value=Presente]').forEach(i => { i.checked = true; });
    c.querySelector('#aGuardar').onclick = async function () {
      if (!rows.length) return ui.toast('No hay estudiantes para guardar.', 'bad');
      if (!inpF.value || inpF.value > VN.hoy()) return ui.toast('Selecciona una fecha válida (no futura).', 'bad');
      const b = this; b.disabled = true;
      const items = rows.map(r => ({ idMatricula: r.idMatricula, estado: (tb.querySelector('input[name="e' + r.idMatricula + '"]:checked') || {}).value || 'Presente' }));
      try { await VN.pedir('POST', 'asistencia/lote', { idAsignacion: +selC.value, fecha: inpF.value, items }); ui.toast('Asistencia guardada'); cargar(); } catch (e) { ui.manejar(e); }
      b.disabled = false;
    };
    cargar();
  });

  VN.vista('Mi asistencia', async function (c) {
    ui.cargando(c);
    let r;
    try { r = await VN.pedir('GET', 'asistencia/mi-asistencia/' + VN.app.usuario.idUsuario); } catch (e) { c.innerHTML = '<div class="tbl">' + ui.vacio('No se pudo cargar tu asistencia', e.message, 'alert') + '</div>'; return; }
    const n = e => r.filter(x => x.estado === e).length, pct = r.length ? Math.round(n('Presente') * 1000 / r.length) / 10 : null;
    c.innerHTML = '<div class="stats-row"><span>Registros<b>' + r.length + '</b></span><span>Presente<b>' + n('Presente') + '</b></span><span>Ausente<b>' + n('Ausente') + '</b></span><span>Permiso<b>' + n('Permiso') + '</b></span><span>Asistencia<b>' + (pct == null ? '-' : VN.fmtNum(pct, 1) + '%') + '</b></span></div>' +
      '<div class="tools">' + ui.buscador('Buscar por asignatura, fecha o estado') + '</div><div class="tbl" id="tbAs"></div>';
    const t = ui.tabla(c.querySelector('#tbAs'), { columnas: [{ t: 'Fecha', v: r => r.fecha, o: 1, h: r => esc(VN.fmtFecha(r.fecha)) }, { t: 'Asignatura', v: r => r.asignatura, o: 1 }, { t: 'Estado', v: r => r.estado, o: 1, h: r => ui.badge(r.estado, tono(r.estado)) }], filas: r, clave: (x) => x.fecha + x.asignatura, orden: { col: 0, dir: 'desc' }, buscar: x => x.fecha + ' ' + VN.fmtFecha(x.fecha) + ' ' + x.asignatura + ' ' + x.estado, vacio: ui.vacio('Aún no hay registros de asistencia', '', 'cal') });
    ui.enlazarBuscador(c, t);
  });
})();
