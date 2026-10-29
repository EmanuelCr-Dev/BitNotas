/* Inicio - HU-003 Visualizar Dashboard. Indicadores y gráficos según el rol. */
(function () {
  const VN = window.VN, ic = VN.icono, esc = VN.esc, ui = VN.ui;

  const kpi = (icono, valor, etiqueta, i) => '<div class="kpi" style="--d:' + i * 60 + 'ms"><span class="ti">' + ic(icono) + '</span><div><b>' + esc(valor) + '</b><span class="l">' + esc(etiqueta) + '</span></div></div>';
  const pctTxt = v => v == null ? 'Sin datos' : VN.fmtNum(v, 1) + '%';
  const tono = (v, min) => v >= 90 ? '' : v >= 76 ? '' : v >= min ? 'warn' : 'bad';

  function barras(filas, opciones) {
    if (!filas.length) return ui.vacio('Sin datos todavía', 'Aparecerán cuando se registren notas.', 'chart');
    const max = opciones.max || 100;
    return '<div class="bars">' + filas.map(f => '<div class="brow"><span class="t" title="' + esc(f.t) + '">' + esc(f.t) + '</span><div class="btrack" role="img" aria-label="' + esc(f.t) + ': ' + esc(f.txt) + '"><div class="bfill ' + (f.tono || '') + '" style="width:' + Math.min(100, f.v * 100 / max) + '%"></div></div><span class="v">' + esc(f.txt) + '</span></div>').join('') + '</div>';
  }

  const panelDist = (d, nota) => {
    const tot = d.AA + d.AS + d.AF + d.AI;
    const filas = [['AA', 'Avanzado (90-100)', ''], ['AS', 'Satisfactorio (76-89)', ''], ['AF', 'Fundamental (' + nota + '-75)', 'warn'], ['AI', 'Inicial (menos de ' + nota + ')', 'bad']].map(x => ({ t: x[1], v: d[x[0]], txt: String(d[x[0]]), tono: x[2] }));
    return '<div class="panel"><h3>Rendimiento por escala</h3><p class="psub">Promedio final de cada estudiante en cada curso (' + tot + ' en total).</p>' + (tot ? barras(filas, { max: Math.max(1, tot) }) : ui.vacio('Sin datos todavía', '', 'chart')) + '</div>';
  };
  const panelAsig = (lista, nota, titulo) => '<div class="panel"><h3>' + titulo + '</h3><p class="psub">Promedio de las notas registradas, sobre 100.</p>' + barras(lista.map(a => ({ t: a.nombre, v: a.promedio, txt: VN.fmtNum(a.promedio, 1), tono: tono(a.promedio, nota) })), {}) + '</div>';

  VN.vista('Inicio', async function (c) {
    const u = VN.app.usuario, h = new Date().getHours(), s = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    const f = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    VN.app.titulo('Panel', '');
    c.innerHTML = '<section class="banner"><div><small>' + esc(f) + '</small><h2>' + s + ', <span id="bn">' + esc(VN.app.nombre()) + '</span></h2><p>Este es el resumen de tu actividad académica.</p></div><span class="role">' + esc(u.nombreRol) + '</span></section><div id="dash"></div>';
    const dash = c.querySelector('#dash'); ui.cargando(dash, 'Cargando indicadores');
    let d;
    try { d = await VN.pedir('GET', 'dashboard'); } catch (e) { dash.innerHTML = ui.vacio('No se pudo cargar el panel', e.message, 'alert'); return; }
    const k = d.kpis; let h2 = '', k2 = [];
    if (d.rol === 'Administrador') {
      k2 = [kpi('cap', k.estudiantes, 'Estudiantes', 0), kpi('users', k.docentes, 'Docentes', 1), kpi('book', k.asignaturas, 'Asignaturas activas', 2), kpi('layers', k.cursos, 'Cursos del año', 3), kpi('check', k.notas, 'Notas registradas', 4), kpi('chart', VN.fmtNum(k.promedio, 1), 'Promedio general', 5), kpi('trend', pctTxt(k.aprobacion), 'Aprobación', 6), kpi('cal', pctTxt(k.asistencia), 'Asistencia', 7)];
      h2 = '<div class="cols2">' + panelDist(d.distribucion, d.notaMinima) + panelAsig(d.porAsignatura, d.notaMinima, 'Promedio por asignatura') + '</div>' +
        '<div class="panel" style="margin-bottom:16px"><h3>Actividad reciente</h3><p class="psub">Últimos movimientos registrados en el sistema.</p>' +
        (d.actividad.length ? '<ul class="feed">' + d.actividad.map(a => '<li><span class="dot"></span><div>' + esc(a.accion) + ' - ' + esc(a.entidad) + (a.detalle ? ': ' + esc(a.detalle) : '') + '<small>' + esc(a.usuario) + ' · ' + esc(VN.fmtFechaHora(a.fecha)) + '</small></div></li>').join('') + '</ul>' : ui.vacio('Sin actividad', '', 'info')) + '</div>';
    } else if (d.rol === 'Docente') {
      k2 = [kpi('book', k.cursos, 'Mis cursos', 0), kpi('cap', k.alumnos, 'Estudiantes a cargo', 1), kpi('check', k.notas, 'Notas registradas', 2), kpi('chart', VN.fmtNum(k.promedio, 1), 'Promedio de mis cursos', 3), kpi('trend', pctTxt(k.aprobacion), 'Aprobación', 4)];
      h2 = '<div class="cols2">' + panelDist(d.distribucion, d.notaMinima) + panelAsig(d.porAsignatura, d.notaMinima, 'Promedio por asignatura') + '</div>' +
        '<div class="panel" style="margin-bottom:16px"><h3>Últimas notas registradas</h3><p class="psub">Tus cinco movimientos más recientes.</p>' + (d.ultimasNotas.length ? '<ul class="feed">' + d.ultimasNotas.map(n => '<li><span class="dot"></span><div>' + esc(n.estudiante) + ': ' + esc(n.titulo) + ' (' + VN.fmtNum(n.valor, 1) + ')<small>' + esc(VN.fmtFecha(n.fecha)) + '</small></div></li>').join('') + '</ul>' : ui.vacio('Aún no registras notas', '', 'info')) + '</div>';
    } else {
      const e = d.escala;
      k2 = [kpi('chart', VN.fmtNum(k.promedio, 1), 'Promedio general' + (e.codigo !== '-' ? ' (' + e.codigo + ')' : ''), 0), kpi('book', k.cursos, 'Cursos', 1), kpi('check', k.notas, 'Notas registradas', 2), kpi('cal', pctTxt(k.asistencia), 'Asistencia', 3)];
      h2 = '<div class="cols2">' + panelAsig(d.porAsignatura, d.notaMinima, 'Mi promedio por asignatura') +
        '<div class="panel"><h3>Mis últimas notas</h3><p class="psub">Las evaluaciones más recientes.</p>' + (d.ultimasNotas.length ? '<ul class="feed">' + d.ultimasNotas.map(n => '<li><span class="dot"></span><div>' + esc(n.asignatura) + ': ' + esc(n.titulo) + ' (' + VN.fmtNum(n.valor, 1) + ')<small>' + esc(VN.fmtFecha(n.fecha)) + '</small></div></li>').join('') + '</ul>' : ui.vacio('Aún no tienes notas', '', 'info')) + '</div></div>';
    }
    const items = VN.app.items.slice(1);
    dash.innerHTML = '<div class="kpis">' + k2.join('') + '</div>' + h2 +
      '<h2 class="sec-title">Accesos rápidos</h2><div class="grid">' + items.map((m, i) => '<button type="button" class="tile" data-n="' + esc(m[1]) + '" style="--d:' + i * 70 + 'ms"><span class="ti">' + ic(m[0]) + '</span><h3>' + esc(m[1]) + '</h3><p>' + esc(VN.app.DESC[m[1]] || '') + '</p><em>' + ic('arrow') + '</em></button>').join('') + '</div>';
    dash.querySelectorAll('.tile').forEach(t => { t.onclick = () => VN.app.ir(t.dataset.n); });
  });
})();
