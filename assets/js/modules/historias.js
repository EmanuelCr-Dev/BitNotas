/* Historias de usuario (HU-002): alcance, diagrama PERT por sprints y registro de casos de prueba del Excel. */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;
  const tono = e => e === 'Aprobado' ? 'ok' : e === 'Fallido' ? 'bad' : '';

  VN.vista('Historias de usuario', async function (c) {
    ui.cargando(c);
    let d;
    try { d = await VN.pedir('GET', 'historias'); } catch (e) { c.innerHTML = '<div class="tbl">' + ui.vacio('No se pudo cargar', e.message, 'alert') + '</div>'; return; }
    const H = d.historias, n = e => H.filter(h => h.prueba.estado === e).length;
    c.innerHTML = '<div class="stats-row"><span>Historias<b>' + H.length + '</b></span><span>Casos aprobados<b>' + n('Aprobado') + '</b></span><span>Fallidos<b>' + n('Fallido') + '</b></span><span>Pendientes<b>' + n('Pendiente') + '</b></span></div>' +
      '<h2 class="sec-title" style="margin-top:6px">Diagrama PERT por sprint</h2><div class="pert" id="pert">' + d.sprints.map(s => '<div class="sprint"><h4>Sprint ' + s.n + '</h4><small>' + esc(s.fechas) + '</small>' + s.historias.map(id => { const h = H.find(x => x.id === id); return '<button type="button" class="hchip ' + (h.prueba.estado === 'Aprobado' ? 'ok' : h.prueba.estado === 'Fallido' ? 'bad' : '') + '" data-hu="' + id + '" title="' + esc(h.titulo) + '"><b>' + id + '</b> ' + esc(h.titulo.length > 22 ? h.titulo.slice(0, 21) + '…' : h.titulo) + '</button>'; }).join('') + '</div>').join('') + '</div>' +
      '<p class="fhint" style="margin:8px 2px 0">Cada sprint depende del anterior. Selecciona una historia para ver su caso de prueba.</p>' +
      '<div class="tools" style="margin-top:22px">' + ui.buscador('Buscar historia, caso de prueba o módulo') + '</div><div class="hu-list" id="hl"></div>';
    const hl = c.querySelector('#hl');
    let q = '';
    const dibujar = () => {
      const pal = VN.norm(q).split(' ').filter(Boolean);
      const lista = H.filter(h => { const t = VN.norm([h.id, h.cp, h.titulo, h.vista, h.rol, h.prueba.estado].join(' ')); return pal.every(p => t.includes(p)); });
      hl.innerHTML = lista.length ? lista.map(h => card(h)).join('') : ui.vacio('Sin resultados', '', 'search');
    };
    const card = h => '<div class="hu" id="' + h.id + '"><button type="button" class="hu-head" aria-expanded="false"><span class="hu-id">' + h.id + '</span><span class="hu-t"><b>' + esc(h.titulo) + '</b><small>Sprint ' + h.sprint + ' · ' + esc(h.fechas) + ' · ' + esc(h.cp) + ' · Módulo: ' + esc(h.vista) + '</small></span>' + ui.badge(h.prueba.estado, tono(h.prueba.estado)) + '<span>' + ic('chevron') + '</span></button><div class="hu-body">' +
      '<h5>Historia</h5><p class="story">' + esc(h.como) + ', quiero ' + esc(h.quiero) + ' para ' + esc(h.para) + '.</p>' +
      '<h5>Rol que la usa</h5><p>' + esc(h.rol) + '</p><h5>Precondiciones</h5><p>' + esc(h.precondiciones) + '</p>' +
      '<h5>Pasos de ejecución</h5><ol>' + h.pasos.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol>' +
      '<h5>Datos de entrada</h5><p>' + esc(h.datos) + '</p><h5>Resultado esperado</h5><p>' + esc(h.esperado) + '</p><h5>Criterio de aceptación</h5><p>' + esc(h.criterio) + '</p>' +
      '<h5>Técnica y herramienta</h5><p>' + esc(h.tecnica) + ' · ' + esc(h.herramienta) + '</p>' +
      '<div class="hu-run no-print"><button type="button" class="btn ghost sm" data-ir="' + esc(h.vista) + '">' + ic('arrow') + '<span>Ir al módulo ' + esc(h.vista) + '</span></button>' +
      '<form class="hu-form" data-id="' + h.id + '" style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;flex:1">' + campo('estado', 'Resultado de la prueba', { vacio: false, opciones: ['Pendiente', 'Aprobado', 'Fallido'].map(x => ({ v: x, t: x })), valor: h.prueba.estado }) + '<div class="fl grow"><input name="observacion" placeholder=" " maxlength="300" value="' + esc(h.prueba.observacion || '') + '"><label>Observación' + '</label></div><button class="btn xs" type="submit">' + ic('save') + '<span>Guardar resultado</span></button></form></div>' +
      (h.prueba.fecha ? '<p class="fhint" style="margin-top:8px">Última ejecución: ' + esc(VN.fmtFecha(h.prueba.fecha)) + ' por ' + esc(h.prueba.usuario) + '</p>' : '') + '</div></div>';
    dibujar();
    ui.enlazarBuscador(c, { filtrar: v => { q = v; dibujar(); } });
    c.addEventListener('click', ev => {
      const hd = ev.target.closest('.hu-head'), chip = ev.target.closest('[data-hu]'), go = ev.target.closest('[data-ir]');
      if (hd) { const o = hd.parentElement.classList.toggle('open'); hd.setAttribute('aria-expanded', o); }
      else if (chip) { const el = c.querySelector('#' + chip.dataset.hu); if (!el) return; el.classList.add('open'); el.querySelector('.hu-head').setAttribute('aria-expanded', 'true'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      else if (go) VN.app.ir(go.dataset.ir);
    });
    c.addEventListener('submit', async ev => {
      const f = ev.target.closest('.hu-form'); if (!f) return;
      ev.preventDefault(); ui.limpiarErrores(f);
      const b = f.querySelector('button'); b.disabled = true;
      try {
        await VN.pedir('PUT', 'historias/' + f.dataset.id + '/prueba', { estado: f.elements.estado.value, observacion: f.elements.observacion.value });
        ui.toast('Resultado guardado para ' + f.dataset.id);
        const nuevo = await VN.pedir('GET', 'historias'); d = nuevo; H.splice(0, H.length, ...nuevo.historias);
        const abierto = new Set(Array.from(hl.querySelectorAll('.hu.open')).map(x => x.id)); dibujar(); abierto.forEach(id => { const e = hl.querySelector('#' + id); if (e) { e.classList.add('open'); e.querySelector('.hu-head').setAttribute('aria-expanded', 'true'); } });
        c.querySelectorAll('[data-hu]').forEach(ch => { const h = H.find(x => x.id === ch.dataset.hu); ch.className = 'hchip ' + (h.prueba.estado === 'Aprobado' ? 'ok' : h.prueba.estado === 'Fallido' ? 'bad' : ''); });
      } catch (e) { if (e.errores) ui.marcarErrores(f, e.errores); ui.toast(e.message, 'bad'); b.disabled = false; }
    });
  });
})();
