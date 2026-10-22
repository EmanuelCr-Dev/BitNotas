/* VitNota - componentes de interfaz reutilizables: avisos, modales, formularios con validación y tablas. */
(function () {
  const VN = window.VN, $ = VN.$, esc = VN.esc, ic = VN.icono;

  const ui = VN.ui = {};

  /* ---------- Avisos ---------- */
  ui.toast = function (texto, tipo) {
    const e = $('#toast'); if (!e) return;
    e.className = tipo === 'bad' ? 'bad' : '';
    e.innerHTML = ic(tipo === 'bad' ? 'alert' : 'okc') + '<span>' + esc(texto) + '</span>';
    e.setAttribute('role', 'status');
    requestAnimationFrame(() => e.classList.add('on'));
    clearTimeout(ui.toast.t); ui.toast.t = setTimeout(() => e.classList.remove('on'), tipo === 'bad' ? 4200 : 2600);
  };

  /* Manejo único de errores: una sesión vencida cierra la sesión; el resto se muestra como aviso */
  ui.manejar = function (e) {
    const msg = e && e.message === 'Failed to fetch' ? 'No hay conexión con el servidor.' : (e && e.message) || 'Ocurrió un error.';
    if (e && e.status === 401 && VN.app && VN.app.usuario) { VN.app.salir(msg); return; }
    ui.toast(msg, 'bad');
  };

  /* ---------- Estados de carga y vacío ---------- */
  ui.cargando = (el, texto) => { el.innerHTML = '<div class="loading">' + esc(texto || 'Cargando') + '</div>'; };
  ui.vacio = (titulo, texto, icono) => '<div class="empty">' + ic(icono || 'info') + '<b>' + esc(titulo) + '</b>' + esc(texto || '') + '</div>';
  ui.badge = (texto, tono) => '<span class="badge ' + (tono || '') + '">' + esc(texto) + '</span>';

  /* ---------- Modales ---------- */
  ui.modal = function (html, opts) {
    opts = opts || {};
    const previo = document.activeElement;
    const m = document.createElement('div');
    m.className = 'mdl';
    m.innerHTML = '<div class="mbox ' + (opts.clase || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    const cerrar = () => { document.removeEventListener('keydown', tecla); m.remove(); if (previo && previo.focus) try { previo.focus(); } catch (e) { /* sin foco */ } if (opts.alCerrar) opts.alCerrar(); };
    const tecla = ev => { if (ev.key === 'Escape' && Array.from(document.querySelectorAll('.mdl')).pop() === m) cerrar(); };
    m.cerrar = cerrar;
    m.onmousedown = e => { if (e.target === m && opts.cerrarFuera !== false) cerrar(); };
    document.addEventListener('keydown', tecla);
    document.body.appendChild(m);
    const foco = m.querySelector('input:not([disabled]),select,button.btn:not(.ghost)');
    if (foco) setTimeout(() => foco.focus(), 30);
    return m;
  };

  ui.confirmar = function (o) {
    return new Promise(resolve => {
      let resuelto = false;
      const fin = v => { if (!resuelto) { resuelto = true; resolve(v); } };
      const m = ui.modal('<div class="mhead ' + (o.peligro ? 'danger' : '') + '"><span class="ti">' + ic(o.peligro ? 'alert' : 'info') + '</span><div><h2>' + esc(o.titulo) + '</h2></div></div>' +
        '<p class="sub">' + esc(o.mensaje) + '</p>' +
        '<div class="row2"><button type="button" class="btn ghost" data-r="0">Cancelar</button><button type="button" class="btn ' + (o.peligro ? 'solid-danger' : '') + '" data-r="1">' + esc(o.textoOk || 'Confirmar') + '</button></div>',
        { clase: 'sm', alCerrar: () => fin(false) });
      m.querySelector('[data-r="0"]').onclick = () => { fin(false); m.cerrar(); };
      m.querySelector('[data-r="1"]').onclick = () => { fin(true); m.cerrar(); };
    });
  };

  /* ---------- Formularios ---------- */
  ui.campo = function (nombre, etiqueta, o) {
    o = o || {};
    const id = 'f_' + nombre + '_' + Math.random().toString(36).slice(2, 6);
    const attrs = (o.max ? ' maxlength="' + o.max + '"' : '') + (o.attrs ? ' ' + o.attrs : '') + (o.off ? ' disabled' : '');
    const val = o.valor == null ? '' : o.valor;
    let ctl;
    if (o.opciones) {
      ctl = '<select id="' + id + '" name="' + nombre + '"' + attrs + '>' + (o.vacio === false ? '' : '<option value="">Seleccionar</option>') +
        o.opciones.map(x => '<option value="' + esc(x.v) + '"' + (String(x.v) === String(val) ? ' selected' : '') + '>' + esc(x.t) + '</option>').join('') + '</select>';
    } else {
      ctl = '<input id="' + id + '" name="' + nombre + '" type="' + (o.tipo || 'text') + '" placeholder=" " value="' + esc(val) + '" autocomplete="' + (o.auto || 'off') + '"' + attrs + '>';
    }
    return '<div class="fl' + (o.full ? ' full' : '') + '">' + ctl + '<label for="' + id + '">' + esc(etiqueta) + (o.req ? ' *' : '') + '</label>' + (o.ayuda ? '<div class="fhint">' + esc(o.ayuda) + '</div>' : '') + '</div>';
  };

  ui.leer = form => {
    const d = {};
    new FormData(form).forEach((v, k) => { d[k] = typeof v === 'string' ? v.trim() : v; });
    return d;
  };

  ui.limpiarErrores = form => {
    form.querySelectorAll('.fl.err').forEach(f => f.classList.remove('err'));
    form.querySelectorAll('.ferr').forEach(e => e.remove());
    const m = form.querySelector('.msg'); if (m) { m.textContent = ''; m.className = 'msg'; }
  };

  ui.marcarErrores = (form, errores) => {
    let primero = null;
    Object.keys(errores || {}).forEach(k => {
      const ctl = form.querySelector('[name="' + k + '"]'); if (!ctl) return;
      const fl = ctl.closest('.fl'); if (!fl) return;
      fl.classList.add('err');
      const e = document.createElement('div'); e.className = 'ferr'; e.setAttribute('role', 'alert');
      e.innerHTML = ic('alert') + '<span>' + esc(errores[k]) + '</span>';
      fl.appendChild(e);
      ctl.setAttribute('aria-invalid', 'true');
      if (!primero) primero = ctl;
    });
    if (primero) primero.focus();
  };

  ui.mensaje = (form, texto, ok) => {
    let m = form.querySelector('.msg');
    if (!m) { m = document.createElement('div'); m.className = 'msg'; form.appendChild(m); }
    m.textContent = texto; m.className = 'msg ' + (ok ? 'ok' : 'bad');
  };

  /* Conecta un formulario: valida en el cliente, llama a la acción y refleja errores por campo */
  ui.enviar = function (form, o) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const btn = form.querySelector('button[type=submit], button:not([type])');
      if (btn && btn.disabled) return;
      ui.limpiarErrores(form);
      form.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
      const datos = ui.leer(form);
      let errores = {};
      if (o.esquema) errores = VN.val.validar(o.esquema, datos).errores;
      if (o.validar) Object.assign(errores, o.validar(datos) || {});
      if (Object.keys(errores).length) { ui.marcarErrores(form, errores); ui.mensaje(form, 'Revisa los campos marcados en rojo.'); return; }
      if (btn) btn.disabled = true;
      try { await o.ejecutar(datos); }
      catch (e) {
        if (e && e.status === 401 && VN.app.usuario && !o.sinSesion) { VN.app.salir(e.message); return; }
        if (e && e.errores) ui.marcarErrores(form, e.errores);
        ui.mensaje(form, e && e.message ? e.message : 'Ocurrió un error.');
      }
      if (btn && document.body.contains(btn)) btn.disabled = false;
    });
  };

  /* Fortaleza de contraseña + lista de reglas */
  ui.reglasClave = function (input, barra, lista) {
    const pintar = () => {
      const v = input.value, s = VN.seg.fuerza(v);
      if (barra) { barra.style.width = s * 25 + '%'; barra.style.background = ['#c62f4b', '#c62f4b', '#e0a93c', '#6bb26b', '#0e9f6e'][s]; }
      if (lista) lista.innerHTML = VN.seg.reglas(v).map(r => '<li class="' + (r.ok ? 'ok' : '') + '">' + ic('okc') + r.t + '</li>').join('');
    };
    input.addEventListener('input', pintar); pintar();
  };

  /* ---------- Buscador ---------- */
  ui.buscador = (placeholder, id) => '<div class="srch grow">' + ic('search') + '<input id="' + (id || 'flt') + '" placeholder="' + esc(placeholder) + '" autocomplete="off" aria-label="' + esc(placeholder) + '"><button type="button" class="clr" aria-label="Limpiar búsqueda">' + ic('x') + '</button></div>';

  ui.enlazarBuscador = function (raiz, tabla, id) {
    const inp = raiz.querySelector('#' + (id || 'flt')), clr = raiz.querySelector('.srch .clr');
    inp.addEventListener('input', () => { clr.classList.toggle('on', !!inp.value); tabla.filtrar(inp.value); });
    clr.onclick = () => { inp.value = ''; clr.classList.remove('on'); tabla.filtrar(''); inp.focus(); };
  };

  /* ---------- Tabla con orden, búsqueda y paginación ---------- */
  ui.tabla = function (el, o) {
    const est = { q: '', pag: 1, col: o.orden ? o.orden.col : -1, dir: o.orden ? o.orden.dir : 'asc', filas: o.filas || [] };
    const porPag = o.porPagina || VN.CONFIG.FILAS_POR_PAGINA;
    const clave = o.clave || (r => r.id);
    let visibles = [];

    function filtradas() {
      const palabras = VN.norm(est.q).split(' ').filter(Boolean);
      let r = est.filas.filter(f => { if (!palabras.length) return true; const t = VN.norm(o.buscar ? o.buscar(f) : JSON.stringify(f)); return palabras.every(p => t.includes(p)); });
      if (est.col >= 0) {
        const c = o.columnas[est.col], g = typeof c.o === "function" ? c.o : c.v;
        r = r.slice().sort((a, b) => { const x = g(a), y = g(b); const k = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), 'es', { numeric: true }); return est.dir === 'asc' ? k : -k; });
      }
      return r;
    }

    function pintar() {
      const todas = filtradas(), total = todas.length, paginas = Math.max(1, Math.ceil(total / porPag));
      if (est.pag > paginas) est.pag = paginas;
      visibles = todas.slice((est.pag - 1) * porPag, est.pag * porPag);
      if (!total) {
        el.innerHTML = est.q ? ui.vacio('Sin resultados', 'No hay coincidencias para «' + est.q + '». Revisa la ortografía o prueba con otra palabra.', 'search') : (o.vacio || ui.vacio('No hay registros todavía', '', 'info'));
        return;
      }
      const cab = o.columnas.map((c, i) => '<th class="' + (c.cls || '') + (c.o || c.ord ? ' sortable' : '') + (est.col === i ? ' sorted-' + est.dir : '') + '"' + (c.ord || c.o ? ' data-sort="' + i + '" tabindex="0" aria-sort="' + (est.col === i ? (est.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '"' : '') + '>' + esc(c.t) + '</th>').join('') + (o.acciones ? '<th>Acciones</th>' : '');
      const cuerpo = visibles.map(f => '<tr>' + o.columnas.map(c => '<td class="' + (c.cls || '') + '">' + (c.h ? c.h(f) : esc(c.v(f) == null || c.v(f) === '' ? '-' : c.v(f))) + '</td>').join('') + (o.acciones ? '<td><div class="acts" data-k="' + esc(clave(f)) + '">' + o.acciones(f) + '</div></td>' : '') + '</tr>').join('');
      const desde = (est.pag - 1) * porPag + 1, hasta = Math.min(total, est.pag * porPag);
      let pg = '';
      if (paginas > 1) {
        pg = '<div class="pg"><button type="button" data-pg="' + (est.pag - 1) + '"' + (est.pag === 1 ? ' disabled' : '') + ' aria-label="Página anterior">&lsaquo;</button>';
        for (let i = 1; i <= paginas; i++) if (i === 1 || i === paginas || Math.abs(i - est.pag) <= 1) pg += '<button type="button" data-pg="' + i + '" class="' + (i === est.pag ? 'on' : '') + '">' + i + '</button>'; else if (Math.abs(i - est.pag) === 2) pg += '<span>…</span>';
        pg += '<button type="button" data-pg="' + (est.pag + 1) + '"' + (est.pag === paginas ? ' disabled' : '') + ' aria-label="Página siguiente">&rsaquo;</button></div>';
      }
      el.innerHTML = '<table><thead><tr>' + cab + '</tr></thead><tbody>' + cuerpo + '</tbody></table><div class="pager"><span>Mostrando ' + desde + '-' + hasta + ' de ' + total + (est.q ? ' (filtrado de ' + est.filas.length + ')' : '') + '</span>' + pg + '</div>';
    }

    el.addEventListener('click', ev => {
      const s = ev.target.closest('[data-sort]'), p = ev.target.closest('[data-pg]'), a = ev.target.closest('[data-act]');
      if (s) { const i = +s.dataset.sort; est.dir = est.col === i && est.dir === 'asc' ? 'desc' : 'asc'; est.col = i; pintar(); }
      else if (p && !p.disabled) { est.pag = +p.dataset.pg; pintar(); }
      else if (a && o.alAccion) {
        const k = a.closest('[data-k]').dataset.k, fila = est.filas.find(f => String(clave(f)) === k);
        if (fila) o.alAccion(a.dataset.act, fila, a);
      }
    });
    el.addEventListener('keydown', ev => { const s = ev.target.closest && ev.target.closest('[data-sort]'); if (s && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); s.click(); } });

    pintar();
    return {
      filas(n) { est.filas = n; pintar(); },
      filtrar(q) { est.q = q || ''; est.pag = 1; pintar(); },
      pintar, total: () => est.filas.length
    };
  };

  /* Botón de acción compacto con icono y texto */
  ui.btnAccion = (accion, icono, texto, extra) => '<button type="button" class="btn ghost xs ' + (extra || '') + '" data-act="' + accion + '">' + ic(icono) + '<span>' + esc(texto) + '</span></button>';

  /* Muestra credenciales entregadas tras un registro o un restablecimiento */
  ui.credenciales = function (titulo, x) {
    const m = ui.modal('<div class="mhead"><span class="ti">' + ic('key') + '</span><div><h2>' + esc(titulo) + '</h2></div></div>' +
      '<p class="sub">Entrega estas credenciales a la persona. La contraseña es temporal y deberá cambiarla al ingresar por primera vez.</p>' +
      '<div class="cred"><b>Correo:</b> ' + esc(x.correo) + '<br><b>Contraseña temporal:</b> ' + esc(x.contrasena_temporal) + '</div>' +
      '<div class="row2"><button type="button" class="btn ghost" id="cpCred">Copiar</button><button type="button" class="btn" id="okCred">Listo</button></div>', { cerrarFuera: false, clase: 'sm' });
    m.querySelector('#cpCred').onclick = async () => {
      const t = 'Correo: ' + x.correo + '\nContraseña temporal: ' + x.contrasena_temporal;
      try { await navigator.clipboard.writeText(t); ui.toast('Credenciales copiadas'); } catch (e) { ui.toast('No se pudo copiar. Selecciona el texto manualmente.', 'bad'); }
    };
    m.querySelector('#okCred').onclick = () => m.cerrar();
  };
})();
