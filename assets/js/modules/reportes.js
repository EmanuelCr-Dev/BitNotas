/* Reportes (administrador): boletín por estudiante, estadísticas por curso y exportación a CSV. */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;
  const notaHtml = (v, min) => v == null ? '<span class="mut">-</span>' : '<span class="nota ' + (v >= min ? 'ok' : 'bad') + '">' + VN.fmtNum(v, 1) + '</span>';

  VN.vista('Reportes', function (c) {
    c.innerHTML = '<div class="tabs"><button type="button" class="btn sm" id="rB">Boletín</button><button type="button" class="btn ghost sm" id="rC">Estadísticas por curso</button><button type="button" class="btn ghost sm" id="rX">' + ic('download') + '<span>Exportar notas (CSV)</span></button></div><div id="rv"></div>';
    const rv = c.querySelector('#rv'), bB = c.querySelector('#rB'), bC = c.querySelector('#rC');
    const tab = t => { bB.className = 'btn sm' + (t === 'B' ? '' : ' ghost'); bC.className = 'btn sm' + (t === 'C' ? '' : ' ghost'); rv.innerHTML = ''; t === 'B' ? boletin(rv) : curso(rv); };
    bB.onclick = () => tab('B'); bC.onclick = () => tab('C');
    c.querySelector('#rX').onclick = async () => {
      try {
        const filas = await VN.pedir('GET', 'reportes/exportar');
        if (!filas.length) return ui.toast('No hay notas para exportar.', 'bad');
        VN.descargar('notas-vitnota-' + VN.hoy() + '.csv', VN.csv(['Código', 'Estudiante', 'Sección', 'Asignatura', 'Docente', 'Periodo', 'Evaluación', 'Nota', 'Escala', 'Fecha'], filas), 'text/csv;charset=utf-8');
        ui.toast('Exportadas ' + filas.length + ' notas');
      } catch (e) { ui.manejar(e); }
    };
    tab('B');
  });

  async function boletin(rv) {
    ui.cargando(rv);
    let ests;
    try { ests = await VN.pedir('GET', 'estudiantes'); } catch (e) { rv.innerHTML = ui.vacio('No se pudo cargar', e.message, 'alert'); return; }
    if (!ests.length) { rv.innerHTML = '<div class="tbl">' + ui.vacio('No hay estudiantes registrados', '', 'cap') + '</div>'; return; }
    rv.innerHTML = '<div class="tools"><div class="filters">' + campo('est', 'Estudiante', { vacio: false, opciones: ests.map(e => ({ v: e.id_estudiante, t: e.apellidos + ', ' + e.nombres + ' (' + e.codigo + ')' })) }) + '</div><button type="button" class="btn ghost sm no-print" id="prt">' + ic('print') + '<span>Imprimir</span></button></div><div id="bol"></div>';
    const sel = rv.querySelector('[name=est]'), bol = rv.querySelector('#bol');
    const cargar = async () => {
      ui.cargando(bol);
      try {
        const b = await VN.pedir('GET', 'reportes/boletin/' + sel.value), min = b.notaMinima;
        bol.innerHTML = '<div class="panel"><div class="boletin-head"><div><h3>' + esc(b.estudiante.nombre) + '</h3><small>' + esc(b.estudiante.codigo) + ' · ' + esc(b.seccion || 'Sin matrícula') + ' · ' + esc(b.anio) + '</small></div><div><small>Promedio general</small><br><span class="nota ' + (b.promedioGeneral >= min ? 'ok' : 'bad') + '" style="font-size:24px">' + (b.promedioGeneral == null ? '-' : VN.fmtNum(b.promedioGeneral, 1)) + '</span> ' + ui.badge(b.escala.codigo === '-' ? 'Sin notas' : b.escala.codigo, b.escala.tono) + '</div></div>' +
          (b.cursos.length ? '<div class="tbl"><table><thead><tr><th>Asignatura</th>' + b.periodos.map(p => '<th class="num">' + esc(p.nombre) + '</th>').join('') + '<th class="num">Final</th><th>Escala</th><th>Estado</th></tr></thead><tbody>' +
            b.cursos.map(k => '<tr><td>' + esc(k.asignatura) + '<br><small class="mut">' + esc(k.docente) + '</small></td>' + k.periodos.map(p => '<td class="num">' + notaHtml(p.promedio, min) + '</td>').join('') + '<td class="num">' + notaHtml(k.final, min) + '</td><td>' + ui.badge(k.escala.codigo === '-' ? 'Sin notas' : k.escala.codigo, k.escala.tono) + '</td><td>' + ui.badge(k.estado, k.estado === 'Aprobado' ? 'ok' : k.estado === 'Reprobado' ? 'bad' : '') + '</td></tr>').join('') + '</tbody></table></div>' : ui.vacio('Sin cursos', 'El estudiante no tiene matrícula activa.', 'book')) +
          '<p class="fhint" style="margin-top:12px">Nota mínima de aprobación: ' + min + '. Escala: AA 90-100, AS 76-89, AF ' + min + '-75, AI menos de ' + min + '.</p></div>';
      } catch (e) { bol.innerHTML = ui.vacio('No se pudo generar el boletín', e.message, 'alert'); }
    };
    sel.onchange = cargar; rv.querySelector('#prt').onclick = () => window.print();
    cargar();
  }

  async function curso(rv) {
    ui.cargando(rv);
    let cursos, periodos;
    try { [cursos, periodos] = await Promise.all([VN.pedir('GET', 'calificaciones/cursos'), VN.pedir('GET', 'periodos')]); } catch (e) { rv.innerHTML = ui.vacio('No se pudo cargar', e.message, 'alert'); return; }
    if (!cursos.length) { rv.innerHTML = '<div class="tbl">' + ui.vacio('No hay cursos asignados', 'Asigna docentes en el módulo Cursos.', 'layers') + '</div>'; return; }
    rv.innerHTML = '<div class="tools"><div class="filters">' + campo('curso', 'Curso', { vacio: false, opciones: cursos.map(x => ({ v: x.id_asignacion, t: x.asignatura + ' · ' + x.seccion })) }) + campo('periodo', 'Periodo', { vacio: false, opciones: [{ v: '', t: 'Todos los periodos' }].concat(periodos.map(p => ({ v: p.id, t: p.nombre }))) }) + '</div></div><div id="est"></div>';
    const sc = rv.querySelector('[name=curso]'), sp = rv.querySelector('[name=periodo]'), box = rv.querySelector('#est');
    const cargar = async () => {
      ui.cargando(box);
      try {
        const r = await VN.pedir('GET', 'reportes/curso/' + sc.value + (sp.value ? '?idPeriodo=' + sp.value : ''));
        const tot = r.conNotas, d = r.distribucion, filas = [['AA', 'Avanzado', ''], ['AS', 'Satisfactorio', ''], ['AF', 'Fundamental', 'warn'], ['AI', 'Inicial', 'bad']];
        box.innerHTML = '<div class="kpis"><div class="kpi"><span class="ti">' + ic('users') + '</span><div><b>' + r.alumnos + '</b><span class="l">Estudiantes</span></div></div><div class="kpi"><span class="ti">' + ic('chart') + '</span><div><b>' + VN.fmtNum(r.promedio, 1) + '</b><span class="l">Promedio del curso</span></div></div><div class="kpi"><span class="ti">' + ic('trend') + '</span><div><b>' + r.aprobados + '/' + tot + '</b><span class="l">Aprobados</span></div></div><div class="kpi"><span class="ti">' + ic('alert') + '</span><div><b>' + r.reprobados + '</b><span class="l">Reprobados</span></div></div></div>' +
          '<div class="cols2"><div class="panel"><h3>Distribución por escala</h3><p class="psub">Estudiantes con notas: ' + tot + '.</p>' + (tot ? '<div class="bars">' + filas.map(f => '<div class="brow"><span class="t">' + f[0] + ' · ' + f[1] + '</span><div class="btrack"><div class="bfill ' + f[2] + '" style="width:' + d[f[0]] * 100 / tot + '%"></div></div><span class="v">' + d[f[0]] + '</span></div>').join('') + '</div>' : ui.vacio('Sin notas en esta selección', '', 'chart')) + '</div>' +
          '<div class="panel"><h3>Extremos</h3><p class="psub">Mejor y menor promedio.</p>' + (r.maximo ? '<ul class="feed"><li><span class="dot"></span><div>Mayor: ' + esc(r.maximo.estudiante) + '<small>' + VN.fmtNum(r.maximo.promedio, 1) + '</small></div></li><li><span class="dot" style="background:var(--co)"></span><div>Menor: ' + esc(r.minimo.estudiante) + '<small>' + VN.fmtNum(r.minimo.promedio, 1) + '</small></div></li></ul>' : ui.vacio('Sin datos', '', 'info')) + '</div></div>';
      } catch (e) { box.innerHTML = ui.vacio('No se pudo cargar', e.message, 'alert'); }
    };
    sc.onchange = sp.onchange = cargar; cargar();
  }
})();
