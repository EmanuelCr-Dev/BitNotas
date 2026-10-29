/* Estudiantes y Docentes - HU-004 a HU-013: registrar, editar, eliminar, buscar y listar. */
(function () {
  const VN = window.VN, ui = VN.ui, ic = VN.icono, esc = VN.esc, campo = ui.campo;

  async function pantalla(cont, esEst) {
    const ep = esEst ? 'estudiantes' : 'docentes', idk = esEst ? 'id_estudiante' : 'id_docente', quien = esEst ? 'estudiante' : 'docente';
    cont.innerHTML = '<div class="tools">' + ui.buscador(esEst ? 'Buscar por nombre, código, correo o grado' : 'Buscar por nombre, código, correo o especialidad') +
      '<button type="button" class="btn sm" id="nuevo">' + ic('plus') + '<span>' + (esEst ? 'Nuevo estudiante' : 'Nuevo docente') + '</span></button></div><div class="tbl" id="tb"></div>';
    const tb = cont.querySelector('#tb'); ui.cargando(tb);
    const cols = esEst
      ? [{ t: 'Código', v: r => r.codigo, o: 1 }, { t: 'Nombre', v: r => r.apellidos + ', ' + r.nombres, o: 1 }, { t: 'Correo de acceso', v: r => r.correo, o: 1 }, { t: 'Grado y sección', v: r => r.nombre_grado ? r.nombre_grado + ' · Sección ' + r.nombre_seccion : '-', o: 1 }]
      : [{ t: 'Código', v: r => r.codigo, o: 1 }, { t: 'Nombre', v: r => r.apellidos + ', ' + r.nombres, o: 1 }, { t: 'Correo de acceso', v: r => r.correo, o: 1 }, { t: 'Especialidad', v: r => r.especialidad, o: 1 }, { t: 'Cursos', v: r => r.cursos, o: 1, cls: 'num' }];
    let tabla;
    const cargar = async () => {
      try { const filas = await VN.pedir('GET', ep); if (!tabla) { tabla = ui.tabla(tb, { columnas: cols, filas, clave: r => r[idk], orden: { col: 1, dir: 'asc' }, buscar: r => [r.codigo, r.nombres, r.apellidos, r.correo, r.nombre_grado, r.especialidad, r.telefono].join(' '), vacio: ui.vacio('No hay ' + (esEst ? 'estudiantes' : 'docentes') + ' registrados', 'Usa el botón superior para crear el primero.', esEst ? 'cap' : 'users'), acciones: () => ui.btnAccion('e', 'edit', 'Editar') + ui.btnAccion('k', 'key', 'Clave') + ui.btnAccion('d', 'trash', 'Eliminar', 'danger'), alAccion: accion }); ui.enlazarBuscador(cont, tabla); } else tabla.filas(filas); }
      catch (e) { tb.innerHTML = ui.vacio('No se pudo cargar la lista', e.message, 'alert'); ui.manejar(e); }
    };

    async function accion(a, r) {
      if (a === 'e') return abrir(r);
      if (a === 'k') {
        const m = ui.modal('<h2>Restablecer acceso</h2><p class="sub">Como administrador, puedes restablecer la contraseña de ' + esc(r.nombres + ' ' + r.apellidos) + ' (' + esc(r.codigo) + ').</p>' +
          '<form id="formReset">' +
          '<div class="fl full" style="margin-bottom:12px">' +
          '<select id="tipoReset" name="tipoReset">' +
          '<option value="auto">Generar contraseña temporal automática</option>' +
          '<option value="manual">Asignar nueva contraseña manualmente</option>' +
          '</select><label for="tipoReset">Método de restablecimiento</label></div>' +
          '<div class="fl full" id="cajaClaveManual" hidden>' +
          '<input id="nuevaClaveAdmin" name="nuevaContrasena" type="text" placeholder=" " maxlength="64">' +
          '<label for="nuevaClaveAdmin">Nueva contraseña (mínimo 8 caract., mayús., minús. y número)</label>' +
          '</div>' +
          '<div class="row2" style="margin-top:16px"><button type="button" class="btn ghost" id="cxR">Cancelar</button><button type="submit" class="btn">Restablecer contraseña</button></div><div class="msg" role="alert"></div>' +
          '</form>', { cerrarFuera: false });
        m.querySelector('#cxR').onclick = () => m.cerrar();
        const sel = m.querySelector('#tipoReset'), cajaM = m.querySelector('#cajaClaveManual');
        sel.onchange = () => { cajaM.hidden = sel.value !== 'manual'; };
        const fR = m.querySelector('#formReset');
        ui.enviar(fR, {
          validar: d => {
            if (sel.value === 'manual' && !VN.seg.clavValida(d.nuevaContrasena || '')) return { nuevaContrasena: 'La clave debe tener mayúscula, minúscula, número y 8 caracteres.' };
            return {};
          },
          ejecutar: async d => {
            const body = sel.value === 'manual' ? { nuevaContrasena: d.nuevaContrasena } : {};
            const res = await VN.pedir('POST', ep + '/' + r[idk] + '/restablecer', body);
            m.cerrar();
            ui.credenciales('Acceso restablecido por Administrador', res);
          }
        });
        return;
      }
      let detalle = 'Se eliminará también su acceso al sistema.';
      if (esEst) { try { const i = await VN.pedir('GET', 'estudiantes/' + r[idk] + '/impacto'); detalle = 'Se eliminarán también su acceso, ' + i.notas + ' nota(s) y ' + i.asistencias + ' registro(s) de asistencia.'; } catch (e) { return ui.manejar(e); } }
      if (!await ui.confirmar({ titulo: 'Eliminar ' + quien, mensaje: '¿Eliminar a ' + r.nombres + ' ' + r.apellidos + ' (' + r.codigo + ')? ' + detalle + ' Esta acción no se puede deshacer.', textoOk: 'Eliminar', peligro: true })) return;
      try { await VN.pedir('DELETE', ep + '/' + r[idk]); ui.toast(esEst ? 'Estudiante eliminado' : 'Docente eliminado'); cargar(); } catch (e) { ui.manejar(e); }
    }

    async function abrir(r) {
      const ed = !!r;
      let grados = [];
      if (esEst && !ed) { try { grados = await VN.pedir('GET', 'grados'); } catch (e) { return ui.manejar(e); } }
      const hoy = VN.hoy();
      const extra = esEst
        ? campo('fechaNacimiento', 'Fecha de nacimiento', { tipo: 'date', req: 1, valor: r && String(r.fecha_nacimiento).slice(0, 10), attrs: 'max="' + hoy + '"' }) +
          campo('sexo', 'Sexo', { req: 1, opciones: [{ v: 'F', t: 'Femenino' }, { v: 'M', t: 'Masculino' }], valor: r && r.sexo }) +
          (ed ? '<p class="fhint full" style="grid-column:1/-1;margin:8px 4px 0">Grado y sección actuales: ' + esc(r.nombre_grado ? r.nombre_grado + ' · Sección ' + r.nombre_seccion : 'sin matrícula') + '</p>'
            : campo('idGrado', 'Grado', { req: 1, opciones: grados.map(g => ({ v: g.id_grado, t: g.nombre_grado })) }) + campo('numeroSeccion', 'Sección', { req: 1, opciones: [{ v: 1, t: 'Sección 1' }, { v: 2, t: 'Sección 2' }] }))
        : campo('especialidad', 'Especialidad', { full: 1, req: 1, max: 80, valor: r && r.especialidad });
      const opcionesPreg = (VN.CONFIG.PREGUNTAS_SEGURIDAD || []).map(p => ({ v: p, t: p }));
      const respDefecto = esEst ? 'Pelusa' : 'Azul';
      const camposSeguridad = campo('preguntaSeguridad', 'Pregunta de seguridad (recuperación)', { req: 0, opciones: opcionesPreg, valor: (r && r.pregunta_seguridad) || (opcionesPreg[0] && opcionesPreg[0].v), full: 1 }) +
        campo('respuestaSeguridad', 'Respuesta de seguridad', { req: 0, max: 80, valor: (r && r.respuesta_seguridad) || respDefecto, full: 1, ayuda: 'Pregunta personal para recuperar la contraseña si se olvida.' });

      const m = ui.modal('<h2>' + (ed ? 'Editar ' : 'Nuevo ') + quien + '</h2><p class="sub">' + (ed ? 'Actualiza los datos personales. Los campos con * son obligatorios.' : 'El acceso se crea automáticamente. Los campos con * son obligatorios.') + '</p><form id="pf"><div class="fg">' +
        campo('nombres', 'Nombres', { req: 1, max: 50, valor: r && r.nombres }) + campo('apellidos', 'Apellidos', { req: 1, max: 50, valor: r && r.apellidos }) + extra +
        campo('telefono', 'Teléfono', { max: 16, valor: r && r.telefono, ayuda: 'Ej. 8888-7777' }) + campo('correoPersonal', 'Correo personal (recuperar clave)', { tipo: 'email', req: 1, max: 100, valor: r && r.correo_personal }) +
        (esEst ? campo('direccion', 'Dirección', { full: 1, max: 150, valor: r && r.direccion }) : '') +
        camposSeguridad +
        '</div><div class="row2"><button type="button" class="btn ghost" id="cx">Cancelar</button><button type="submit" class="btn">Guardar</button></div><div class="msg" role="alert"></div></form>', { cerrarFuera: false });
      m.querySelector('#cx').onclick = () => m.cerrar();
      const esquema = esEst ? VN.val.esquema.estudiante : VN.val.esquema.docente;
      ui.enviar(m.querySelector('#pf'), {
        esquema,
        validar: d => { const e = {}; if (esEst && !ed) { if (!d.idGrado) e.idGrado = 'Selecciona un grado.'; if (!d.numeroSeccion) e.numeroSeccion = 'Selecciona una sección.'; } return e; },
        ejecutar: async d => {
          const body = Object.assign({}, d); if (esEst && !ed) { body.idGrado = +d.idGrado; body.numeroSeccion = +d.numeroSeccion; }
          if (ed) { await VN.pedir('PUT', ep + '/' + r[idk], body); m.cerrar(); ui.toast(esEst ? 'Estudiante actualizado' : 'Docente actualizado'); cargar(); }
          else { const x = await VN.pedir('POST', ep, body); m.cerrar(); cargar(); ui.toast((esEst ? 'Estudiante' : 'Docente') + ' registrado'); ui.credenciales('Registro creado', x); }
        }
      });
    }
    cont.querySelector('#nuevo').onclick = () => abrir();
    cargar();
  }
  VN.vista('Estudiantes', c => pantalla(c, true));
  VN.vista('Docentes', c => pantalla(c, false));
})();
