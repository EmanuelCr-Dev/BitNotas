/* Cursos - HU-014 a HU-018 (asignaturas) y asignación de docentes; "Mis cursos" para docentes y estudiantes. */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;

  VN.vista('Cursos', function (cont) {
    cont.innerHTML = '<div class="tabs" role="tablist"><button type="button" class="btn sm" id="tA" role="tab">Asignaturas</button><button type="button" class="btn ghost sm" id="tS" role="tab">Asignar docentes</button></div><div id="cv"></div>';
    const cv = cont.querySelector('#cv');
    const tab = t => {
      cont.querySelector('#tA').className = 'btn sm' + (t === 'A' ? '' : ' ghost');
      cont.querySelector('#tS').className = 'btn sm' + (t === 'S' ? '' : ' ghost');
      cont.querySelector('#tA').setAttribute('aria-selected', t === 'A'); cont.querySelector('#tS').setAttribute('aria-selected', t === 'S');
      cv.innerHTML = ''; t === 'A' ? asignaturas(cv) : asignar(cv);
    };
    cont.querySelector('#tA').onclick = () => tab('A'); cont.querySelector('#tS').onclick = () => tab('S');
    tab('A');
  });

  /* ---------- Catálogo de asignaturas ---------- */
  async function asignaturas(cv) {
    cv.innerHTML = '<div class="tools">' + ui.buscador('Buscar asignatura', 'fltA') + '<button type="button" class="btn sm" id="nA">' + ic('plus') + '<span>Nueva asignatura</span></button></div><div class="tbl" id="tbA"></div>';
    const tb = cv.querySelector('#tbA'); ui.cargando(tb);
    let tabla;
    const cargar = async () => {
      try {
        const filas = await VN.pedir('GET', 'asignaturas');
        if (!tabla) {
          tabla = ui.tabla(tb, {
            columnas: [{ t: 'Asignatura', v: r => r.nombre, o: 1 }, { t: 'Estado', v: r => r.estado ? 'Activa' : 'Inactiva', o: 1, h: r => ui.badge(r.estado ? 'Activa' : 'Inactiva', r.estado ? 'ok' : '') }, { t: 'Cursos asignados', v: r => r.usos, o: 1, cls: 'num' }],
            filas, clave: r => r.id_asignatura, orden: { col: 0, dir: 'asc' }, buscar: r => r.nombre + ' ' + (r.estado ? 'activa' : 'inactiva'),
            vacio: ui.vacio('Aún no hay asignaturas', 'Crea la primera con el botón superior.', 'book'),
            acciones: r => ui.btnAccion('e', 'edit', 'Editar') + ui.btnAccion('t', 'refresh', r.estado ? 'Desactivar' : 'Activar') + ui.btnAccion('d', 'trash', 'Eliminar', 'danger'),
            alAccion: async (a, r) => {
              if (a === 'e') return abrir(r);
              if (a === 't') { try { await VN.pedir('PUT', 'asignaturas/' + r.id_asignatura, { nombre: r.nombre, estado: !r.estado }); ui.toast(r.estado ? 'Asignatura desactivada' : 'Asignatura activada'); cargar(); } catch (e) { ui.manejar(e); } return; }
              if (!await ui.confirmar({ titulo: 'Eliminar asignatura', mensaje: '¿Eliminar «' + r.nombre + '»? Esta acción no se puede deshacer.' + (r.usos ? ' Está asignada en ' + r.usos + ' curso(s), por lo que el sistema no lo permitirá.' : ''), textoOk: 'Eliminar', peligro: true })) return;
              try { await VN.pedir('DELETE', 'asignaturas/' + r.id_asignatura); ui.toast('Asignatura eliminada'); cargar(); } catch (e) { ui.manejar(e); }
            }
          });
          ui.enlazarBuscador(cv, tabla, 'fltA');
        } else tabla.filas(filas);
      } catch (e) { tb.innerHTML = ui.vacio('No se pudo cargar la lista', e.message, 'alert'); }
    };
    const abrir = r => {
      const m = ui.modal('<h2>' + (r ? 'Editar' : 'Nueva') + ' asignatura</h2><p class="sub">Escribe el nombre de la asignatura.</p><form id="af">' + campo('nombre', 'Nombre', { req: 1, max: 60, valor: r && r.nombre }) +
        '<div class="row2"><button type="button" class="btn ghost" id="cxA">Cancelar</button><button type="submit" class="btn">Guardar</button></div><div class="msg" role="alert"></div></form>', { cerrarFuera: false, clase: 'sm' });
      m.querySelector('#cxA').onclick = () => m.cerrar();
      ui.enviar(m.querySelector('#af'), { esquema: VN.val.esquema.asignatura, ejecutar: async d => {
        if (r) await VN.pedir('PUT', 'asignaturas/' + r.id_asignatura, { nombre: d.nombre }); else await VN.pedir('POST', 'asignaturas', d);
        m.cerrar(); ui.toast(r ? 'Asignatura actualizada' : 'Asignatura registrada'); cargar();
      } });
    };
    cv.querySelector('#nA').onclick = () => abrir();
    cargar();
  }

  /* ---------- Asignar docente a asignatura y sección ---------- */
  async function asignar(cv) {
    ui.cargando(cv);
    let anios, secs, asigs, docs;
    try { [anios, secs, asigs, docs] = await Promise.all([VN.pedir('GET', 'anios'), VN.pedir('GET', 'secciones'), VN.pedir('GET', 'asignaturas'), VN.pedir('GET', 'docentes')]); }
    catch (e) { cv.innerHTML = ui.vacio('No se pudieron cargar los datos', e.message, 'alert'); return; }
    const opt = (l, v, t) => l.map(x => ({ v: v(x), t: t(x) }));
    cv.innerHTML = '<div class="panel" style="margin-bottom:16px"><form id="fa"><div class="fg">' +
      campo('idAnio', 'Año lectivo', { opciones: opt(anios, a => a.id_anio, a => a.nombre), valor: (anios.find(a => a.activo) || {}).id_anio, vacio: false }) +
      campo('idSeccion', 'Sección', { opciones: opt(secs, s => s.id_seccion, s => s.etiqueta), vacio: false }) +
      campo('idAsignatura', 'Asignatura', { opciones: opt(asigs.filter(a => a.estado), a => a.id_asignatura, a => a.nombre), req: 1 }) +
      campo('idDocente', 'Docente', { opciones: opt(docs, d => d.id_docente, d => d.nombres + ' ' + d.apellidos), req: 1 }) +
      '</div><button class="btn sm" type="submit" style="margin-top:18px">' + ic('plus') + '<span>Asignar</span></button><div class="msg" role="alert"></div></form></div><div class="tbl" id="la"></div>';
    const form = cv.querySelector('#fa'), la = cv.querySelector('#la');
    const listar = async () => {
      try {
        const l = await VN.pedir('GET', 'asignaciones?idSeccion=' + form.elements.idSeccion.value + '&idAnio=' + form.elements.idAnio.value);
        ui.tabla(la, { columnas: [{ t: 'Asignatura', v: r => r.asignatura, o: 1 }, { t: 'Docente', v: r => r.docente, o: 1 }], filas: l, clave: r => r.id_asignacion, vacio: ui.vacio('Esta sección aún no tiene cursos asignados', 'Usa el formulario superior para asignar el primero.', 'layers'),
          acciones: () => ui.btnAccion('q', 'trash', 'Quitar', 'danger'),
          alAccion: async (a, r) => {
            if (!await ui.confirmar({ titulo: 'Quitar asignación', mensaje: '¿Quitar «' + r.asignatura + '» de ' + r.docente + ' en esta sección?', textoOk: 'Quitar', peligro: true })) return;
            try { await VN.pedir('DELETE', 'asignaciones/' + r.id_asignacion); ui.toast('Asignación eliminada'); listar(); } catch (e) { ui.manejar(e); }
          } });
      } catch (e) { la.innerHTML = ui.vacio('No se pudo cargar', e.message, 'alert'); }
    };
    form.elements.idSeccion.onchange = form.elements.idAnio.onchange = listar;
    ui.enviar(form, {
      validar: d => { const e = {}; if (!d.idAsignatura) e.idAsignatura = 'Selecciona una asignatura.'; if (!d.idDocente) e.idDocente = 'Selecciona un docente.'; return e; },
      ejecutar: async d => { await VN.pedir('POST', 'asignaciones', { idAsignatura: +d.idAsignatura, idDocente: +d.idDocente, idSeccion: +d.idSeccion, idAnio: +d.idAnio }); ui.toast('Docente asignado'); form.elements.idAsignatura.value = ''; form.elements.idDocente.value = ''; listar(); }
    });
    listar();
  }

  /* ---------- Mis cursos ---------- */
  VN.vista('Mis cursos', async function (c) {
    const doc = VN.app.usuario.nombreRol === 'Docente';
    ui.cargando(c);
    let l;
    try { l = await VN.pedir('GET', 'mis-cursos/' + VN.app.usuario.idUsuario); } catch (e) { c.innerHTML = '<div class="tbl">' + ui.vacio('No se pudieron cargar tus cursos', e.message, 'alert') + '</div>'; return; }
    c.innerHTML = '<div class="tbl" id="tbm"></div>';
    ui.tabla(c.querySelector('#tbm'), {
      columnas: [{ t: 'Asignatura', v: r => r.asignatura, o: 1 }, { t: doc ? 'Sección' : 'Docente', v: r => doc ? r.seccion : r.docente, o: 1 }, { t: 'Año', v: r => r.anio }],
      filas: l, clave: r => r.id_asignacion, vacio: ui.vacio('Aún no tienes cursos asignados en el año activo', 'Cuando el administrador te asigne cursos aparecerán aquí.', 'book'),
      acciones: doc ? () => ui.btnAccion('a', 'users', 'Ver lista') : null,
      alAccion: async (a, r) => {
        try {
          const al = await VN.pedir('GET', 'asignaciones/' + r.id_asignacion + '/alumnos');
          const m = ui.modal('<h2>Alumnos</h2><p class="sub">' + esc(r.asignatura) + ' · ' + esc(r.seccion) + ' · ' + al.length + ' en total</p>' + (al.length ? '<div class="tbl"><table style="min-width:0"><thead><tr><th>Código</th><th>Nombre</th></tr></thead><tbody>' + al.map(x => '<tr><td>' + esc(x.codigo) + '</td><td>' + esc(x.apellidos) + ', ' + esc(x.nombres) + '</td></tr>').join('') + '</tbody></table></div>' : ui.vacio('Sin alumnos matriculados', '', 'users')) + '<div class="row2"><button type="button" class="btn" id="cl">Cerrar</button></div>');
          m.querySelector('#cl').onclick = () => m.cerrar();
        } catch (e) { ui.manejar(e); }
      }
    });
  });
})();
