/* Calificaciones - HU-019 Registrar nota y HU-020 Editar nota (docente y administrador); "Mis notas" (estudiante). */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;
  const notaHtml = (v, min) => '<span class="nota ' + (v >= min ? 'ok' : 'bad') + '">' + VN.fmtNum(v, 1) + '</span>';
  const escBadge = e => ui.badge(e.codigo === '-' ? 'Sin notas' : e.codigo, e.tono);

  VN.vista('Calificaciones', async function (c) {
    ui.cargando(c);
    let cursos, periodos, cfg;
    try { [cursos, periodos, cfg] = await Promise.all([VN.pedir('GET', 'calificaciones/cursos'), VN.pedir('GET', 'periodos'), VN.pedir('GET', 'config')]); }
    catch (e) { c.innerHTML = '<div class="tbl">' + ui.vacio('No se pudieron cargar los cursos', e.message, 'alert') + '</div>'; return; }
    const min = cfg.notaMinima, admin = VN.app.usuario.nombreRol === 'Administrador';
    if (!cursos.length) { c.innerHTML = '<div class="soon"><span class="ti">' + ic('check') + '</span><h2>Sin cursos</h2><p>' + (admin ? 'Primero asigna docentes a las secciones en el módulo Cursos.' : 'Aún no tienes cursos asignados para calificar.') + '</p></div>'; return; }

    c.innerHTML = '<div class="tabs"><button type="button" class="btn sm" id="vN">Notas</button><button type="button" class="btn ghost sm" id="vR">Resumen por periodo</button></div>' +
      '<div class="tools"><div class="filters">' +
      campo('curso', 'Curso', { vacio: false, opciones: cursos.map(x => ({ v: x.id_asignacion, t: x.asignatura + ' · ' + x.seccion + (admin ? ' · ' + x.docente : '') })) }) +
      campo('periodo', 'Periodo', { vacio: false, opciones: [{ v: '', t: 'Todos los periodos' }].concat(periodos.map(p => ({ v: p.id, t: p.nombre + (p.abierto ? '' : ' (cerrado)') }))) }) +
      '</div><button type="button" class="btn sm" id="nNota">' + ic('plus') + '<span>Registrar nota</span></button></div><div id="cvN"></div>';
    const selC = c.querySelector('[name=curso]'), selP = c.querySelector('[name=periodo]'), cv = c.querySelector('#cvN');
    let modo = 'N', tabla = null;

    c.querySelector('#vN').onclick = () => { modo = 'N'; c.querySelector('#vN').className = 'btn sm'; c.querySelector('#vR').className = 'btn ghost sm'; selP.closest('.fl').hidden = false; c.querySelector('#nNota').hidden = false; cargar(); };
    c.querySelector('#vR').onclick = () => { modo = 'R'; c.querySelector('#vR').className = 'btn sm'; c.querySelector('#vN').className = 'btn ghost sm'; selP.closest('.fl').hidden = true; c.querySelector('#nNota').hidden = true; cargar(); };
    selC.onchange = selP.onchange = () => cargar();

    async function cargar() {
      tabla = null; ui.cargando(cv);
      try { modo === 'N' ? await vistaNotas() : await vistaResumen(); } catch (e) { cv.innerHTML = '<div class="tbl">' + ui.vacio('No se pudo cargar', e.message, 'alert') + '</div>'; }
    }

    async function vistaNotas() {
      const q = 'idAsignacion=' + selC.value + (selP.value ? '&idPeriodo=' + selP.value : '');
      const notas = await VN.pedir('GET', 'notas?' + q);
      const vals = notas.map(n => n.valor), prom = VN.promedio(vals), apr = vals.length ? Math.round(vals.filter(v => v >= min).length * 1000 / vals.length) / 10 : null;
      cv.innerHTML = '<div class="stats-row"><span>Notas<b>' + notas.length + '</b></span><span>Promedio<b>' + (prom == null ? '-' : VN.fmtNum(prom, 1)) + '</b></span><span>Aprobadas<b>' + (apr == null ? '-' : VN.fmtNum(apr, 1) + '%') + '</b></span><span>Nota mínima<b>' + min + '</b></span></div>' +
        '<div class="tools">' + ui.buscador('Buscar por estudiante, código o evaluación') + '</div><div class="tbl" id="tbN"></div>';
      tabla = ui.tabla(cv.querySelector('#tbN'), {
        columnas: [{ t: 'Estudiante', v: r => r.estudiante, o: 1 }, { t: 'Evaluación', v: r => r.titulo, o: 1, h: r => esc(r.titulo) + (r.modificada ? ' <span class="badge plain" title="Nota editada">Editada</span>' : '') }, { t: 'Nota', v: r => r.valor, o: 1, cls: 'num', h: r => notaHtml(r.valor, min) }, { t: 'Escala', v: r => r.escala.codigo, h: r => escBadge(r.escala) }, { t: 'Periodo', v: r => r.id_periodo, o: 1, h: r => esc(r.periodo) }, { t: 'Fecha', v: r => r.fecha, o: 1, h: r => esc(VN.fmtFecha(r.fecha)) }],
        filas: notas, clave: r => r.id_nota, orden: { col: 0, dir: 'asc' }, buscar: r => r.estudiante + ' ' + r.codigo + ' ' + r.titulo + ' ' + r.periodo,
        vacio: ui.vacio('No hay notas registradas', 'Usa «Registrar nota» para agregar la primera de este curso.', 'check'),
        acciones: r => r.periodo_abierto ? ui.btnAccion('e', 'edit', 'Editar') : '<span class="badge plain" title="Periodo cerrado">' + ic('lock') + ' Cerrado</span>',
        alAccion: (a, r) => abrir(r)
      });
      ui.enlazarBuscador(cv, tabla);
    }

    async function vistaResumen() {
      const r = await VN.pedir('GET', 'notas/resumen/' + selC.value);
      cv.innerHTML = '<div class="tbl" id="tbR"></div>';
      const cols = [{ t: 'Estudiante', v: x => x.estudiante, o: 1 }].concat(r.periodos.map(p => ({ t: p.nombre, v: x => x.porPeriodo[p.id] == null ? -1 : x.porPeriodo[p.id], o: 1, cls: 'num', h: x => x.porPeriodo[p.id] == null ? '<span class="mut">-</span>' : notaHtml(x.porPeriodo[p.id], min) })))
        .concat([{ t: 'Final', v: x => x.final == null ? -1 : x.final, o: 1, cls: 'num', h: x => x.final == null ? '-' : notaHtml(x.final, min) }, { t: 'Escala', v: x => x.escala.codigo, h: x => escBadge(x.escala) }, { t: 'Estado', v: x => x.estado, h: x => ui.badge(x.estado, x.estado === 'Aprobado' ? 'ok' : x.estado === 'Reprobado' ? 'bad' : '') }]);
      ui.tabla(cv.querySelector('#tbR'), { columnas: cols, filas: r.filas, clave: x => x.id_matricula, orden: { col: 0, dir: 'asc' }, vacio: ui.vacio('Este curso no tiene estudiantes matriculados', '', 'users') });
    }

    async function abrir(n) {
      const ed = !!n;
      let alumnos = [];
      if (!ed) { try { alumnos = await VN.pedir('GET', 'asignaciones/' + selC.value + '/alumnos'); } catch (e) { return ui.manejar(e); } if (!alumnos.length) return ui.toast('Este curso no tiene estudiantes matriculados.', 'bad'); }
      const abiertos = periodos.filter(p => p.abierto);
      if (!ed && !abiertos.length) return ui.toast('Todos los periodos están cerrados. Reábrelo en Configuración.', 'bad');
      const m = ui.modal('<h2>' + (ed ? 'Editar nota' : 'Registrar nota') + '</h2><p class="sub">' + (ed ? esc(n.estudiante) + ' · ' + esc(n.periodo) : 'Completa los datos de la evaluación. Los campos con * son obligatorios.') + '</p><form id="nf"><div class="fg">' +
        (ed ? '' : campo('idMatricula', 'Estudiante', { full: 1, req: 1, opciones: alumnos.map(a => ({ v: a.id_matricula, t: a.apellidos + ', ' + a.nombres })) }) +
          campo('idPeriodo', 'Periodo', { req: 1, vacio: false, opciones: abiertos.map(p => ({ v: p.id, t: p.nombre })), valor: selP.value && abiertos.some(p => String(p.id) === selP.value) ? selP.value : abiertos[0].id })) +
        campo('titulo', 'Evaluación', { full: ed, req: 1, max: 60, valor: n && n.titulo, ayuda: 'Ej. Examen parcial, Tarea 2' }) +
        campo('valor', 'Nota (0 a 100)', { req: 1, tipo: 'text', auto: 'off', attrs: 'inputmode="decimal"', max: 6, valor: n && n.valor }) +
        campo('observacion', 'Observación', { full: 1, max: 200, valor: n && n.observacion }) +
        '</div><div id="escPrev" style="margin-top:12px"></div><div class="row2"><button type="button" class="btn ghost" id="cxN">Cancelar</button><button type="submit" class="btn">Guardar</button></div><div class="msg" role="alert"></div></form>', { cerrarFuera: false });
      const f = m.querySelector('#nf'), prev = m.querySelector('#escPrev');
      const mostrarEscala = () => { const v = VN.val.validar({ valor: VN.val.esquema.nota.valor }, { valor: f.elements.valor.value }); prev.innerHTML = v.ok && v.datos.valor != null ? 'Equivale a: ' + escBadge(VN.dom.escala(v.datos.valor, min)) + ' ' + (v.datos.valor >= min ? 'Aprobado' : 'Reprobado') : ''; };
      f.elements.valor.addEventListener('input', mostrarEscala); mostrarEscala();
      m.querySelector('#cxN').onclick = () => m.cerrar();
      ui.enviar(f, {
        esquema: VN.val.esquema.nota,
        validar: d => { const e = {}; if (!ed) { if (!d.idMatricula) e.idMatricula = 'Selecciona un estudiante.'; if (!d.idPeriodo) e.idPeriodo = 'Selecciona un periodo.'; } return e; },
        ejecutar: async d => {
          if (ed) { const r = await VN.pedir('PUT', 'notas/' + n.id_nota, { titulo: d.titulo, valor: d.valor, observacion: d.observacion }); m.cerrar(); ui.toast(r.sinCambios ? 'No hubo cambios que guardar' : 'Nota actualizada'); }
          else { await VN.pedir('POST', 'notas', { idAsignacion: +selC.value, idMatricula: +d.idMatricula, idPeriodo: +d.idPeriodo, titulo: d.titulo, valor: d.valor, observacion: d.observacion }); m.cerrar(); ui.toast('Nota registrada'); }
          cargar();
        }
      });
    }
    c.querySelector('#nNota').onclick = () => abrir();
    cargar();
  });

  /* ---------- Estudiante: Mis notas ---------- */
  VN.vista('Mis notas', async function (c) {
    ui.cargando(c);
    let b;
    try { b = await VN.pedir('GET', 'notas/mis-notas/' + VN.app.usuario.idUsuario); } catch (e) { c.innerHTML = '<div class="tbl">' + ui.vacio('No se pudieron cargar tus notas', e.message, 'alert') + '</div>'; return; }
    const min = b.notaMinima;
    if (!b.cursos.length) { c.innerHTML = '<div class="tbl">' + ui.vacio('Aún no tienes cursos', 'Cuando estés matriculado verás aquí tus calificaciones.', 'book') + '</div>'; return; }
    c.innerHTML = '<div class="stats-row"><span>Promedio general<b>' + (b.promedioGeneral == null ? '-' : VN.fmtNum(b.promedioGeneral, 1)) + '</b></span><span>Escala<b>' + esc(b.escala.codigo) + '</b></span><span>Estado<b>' + esc(b.estado) + '</b></span><span>Nota mínima<b>' + min + '</b></span></div>' +
      '<div class="hu-list">' + b.cursos.map((k, i) => '<div class="hu' + (i === 0 ? ' open' : '') + '"><button type="button" class="hu-head" aria-expanded="' + (i === 0) + '"><span class="hu-id">' + (k.final == null ? '-' : VN.fmtNum(k.final, 1)) + '</span><span class="hu-t"><b>' + esc(k.asignatura) + '</b><small>' + esc(k.docente) + '</small></span>' + escBadge(k.escala) + ui.badge(k.estado, k.estado === 'Aprobado' ? 'ok' : k.estado === 'Reprobado' ? 'bad' : '') + '</button><div class="hu-body">' +
        k.periodos.map(p => '<h5>' + esc(p.nombre) + (p.promedio == null ? '' : ' · promedio ' + VN.fmtNum(p.promedio, 1)) + '</h5>' + (p.notas.length ? '<div class="tbl"><table style="min-width:0"><tbody>' + p.notas.map(n => '<tr><td>' + esc(n.titulo) + (n.observacion ? '<br><small class="mut">' + esc(n.observacion) + '</small>' : '') + '</td><td class="mut">' + esc(VN.fmtFecha(n.fecha)) + '</td><td class="num">' + notaHtml(n.valor, min) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="mut">Sin notas en este periodo.</p>')).join('') + '</div></div>').join('') + '</div>';
    c.querySelectorAll('.hu-head').forEach(h => { h.onclick = () => { const o = h.parentElement.classList.toggle('open'); h.setAttribute('aria-expanded', o); }; });
  });
})();
