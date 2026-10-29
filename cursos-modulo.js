/* VitNota - módulo Cursos. Se carga con una línea en index.html */
const escH = s => String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const bsm = 'style="padding:7px 16px"';

/* ---------- ADMIN: pestañas ---------- */
function cursosAdmin(){
  $('#content').innerHTML = `<div style="display:flex;gap:8px;margin-bottom:16px"><button class="btn sm" id="tA">Asignaturas</button><button class="btn ghost sm" id="tS">Asignar docentes</button></div><div id="cv"></div>`;
  const tab = t => {
    $('#tA').className = 'btn sm' + (t === 'A' ? '' : ' ghost');
    $('#tS').className = 'btn sm' + (t === 'S' ? '' : ' ghost');
    t === 'A' ? vAsignaturas() : vAsignar();
  };
  $('#tA').onclick = () => tab('A');
  $('#tS').onclick = () => tab('S');
  tab('A');
}

/* ---------- ADMIN: catálogo de asignaturas ---------- */
async function vAsignaturas(){
  $('#cv').innerHTML = `<div class="tools"><span></span><button class="btn sm" id="nA">Nueva asignatura</button></div><div class="tbl" id="tbA"><div class="empty">Cargando...</div></div>`;
  let rows = [];
  const draw = () => {
    $('#tbA').innerHTML = rows.length
      ? `<table><thead><tr><th>Asignatura</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(r => `<tr><td>${escH(r.nombre)}</td><td>${r.estado ? 'Activa' : 'Inactiva'}</td><td><button class="btn ghost sm" ${bsm} data-e="${r.id_asignatura}">Editar</button><button class="btn ghost sm" style="padding:7px 16px;margin-left:8px" data-t="${r.id_asignatura}">${r.estado ? 'Desactivar' : 'Activar'}</button></td></tr>`).join('')}</tbody></table>`
      : '<div class="empty">Aún no hay asignaturas.</div>';
    document.querySelectorAll('[data-e]').forEach(b => b.onclick = () => abrir(rows.find(x => x.id_asignatura == b.dataset.e)));
    document.querySelectorAll('[data-t]').forEach(b => b.onclick = async () => {
      const r = rows.find(x => x.id_asignatura == b.dataset.t);
      try { await pedir('PUT', 'asignaturas/' + r.id_asignatura, {nombre: r.nombre, estado: !r.estado}); toast(r.estado ? 'Asignatura desactivada' : 'Asignatura activada'); load(); }
      catch(err){ toast(err.message); }
    });
  };
  const load = async () => { try { rows = await pedir('GET', 'asignaturas'); draw(); } catch(e){ $('#tbA').innerHTML = '<div class="empty">No se pudo cargar la lista.</div>'; } };
  const abrir = r => {
    const m = modal(`<h2>${r ? 'Editar' : 'Nueva'} asignatura</h2><p class="sub">Escribe el nombre del curso.</p><form id="af"><div class="fl"><input name="nombre" placeholder=" " value="${escH(r && r.nombre)}" maxlength="100" required><label>Nombre</label></div><div class="row2"><button type="button" class="btn ghost" id="cxA">Cancelar</button><button class="btn">Guardar</button></div><div class="msg" id="am"></div></form>`);
    $('#cxA').onclick = () => m.remove();
    $('#af').onsubmit = async e => {
      e.preventDefault();
      const b = e.target.querySelector('.btn:not(.ghost)'); b.disabled = true;
      const d = {nombre: e.target.nombre.value.trim()};
      try {
        if(r) await pedir('PUT', 'asignaturas/' + r.id_asignatura, d); else await pedir('POST', 'asignaturas', d);
        m.remove(); toast('Asignatura guardada'); load();
      } catch(err){ msg($('#am'), err.message); b.disabled = false; }
    };
  };
  $('#nA').onclick = () => abrir();
  load();
}

/* ---------- ADMIN: asignar docente a asignatura + sección ---------- */
async function vAsignar(){
  const cv = $('#cv');
  cv.innerHTML = '<div class="tbl"><div class="empty">Cargando...</div></div>';
  let anios, secs, asigs, docs;
  try { [anios, secs, asigs, docs] = await Promise.all([pedir('GET','anios'), pedir('GET','secciones'), pedir('GET','asignaturas'), pedir('GET','docentes')]); }
  catch(e){ cv.innerHTML = '<div class="empty">No se pudieron cargar los datos.</div>'; return; }
  const op = (a, v, t) => a.map(x => `<option value="${v(x)}">${escH(t(x))}</option>`).join('');
  cv.innerHTML = `<div class="tbl" style="padding:22px;margin-bottom:16px"><div class="fg">
    <div class="fl"><select id="sa">${anios.map(a => `<option value="${a.id_anio}" ${a.activo ? 'selected' : ''}>${escH(a.nombre)}</option>`).join('')}</select><label>Año lectivo</label></div>
    <div class="fl"><select id="ss">${op(secs, s => s.id_seccion, s => s.etiqueta)}</select><label>Sección</label></div>
    <div class="fl"><select id="sg">${op(asigs.filter(a => a.estado), a => a.id_asignatura, a => a.nombre)}</select><label>Asignatura</label></div>
    <div class="fl"><select id="sd">${op(docs, d => d.id_docente, d => d.nombres + ' ' + d.apellidos)}</select><label>Docente</label></div>
  </div><button class="btn sm" id="go" style="margin-top:18px">Asignar</button><div class="msg" id="sm"></div></div>
  <div class="tbl" id="la"></div>`;
  const listar = async () => {
    try {
      const l = await pedir('GET', `asignaciones?idSeccion=${$('#ss').value}&idAnio=${$('#sa').value}`);
      $('#la').innerHTML = l.length
        ? `<table><thead><tr><th>Asignatura</th><th>Docente</th><th>Acciones</th></tr></thead><tbody>${l.map(a => `<tr><td>${escH(a.asignatura)}</td><td>${escH(a.docente)}</td><td><button class="btn ghost sm" style="padding:7px 16px;color:var(--co)" data-q="${a.id_asignacion}">Quitar</button></td></tr>`).join('')}</tbody></table>`
        : '<div class="empty">Esta sección aún no tiene cursos asignados.</div>';
      document.querySelectorAll('[data-q]').forEach(b => b.onclick = async () => {
        if(!confirm('¿Quitar esta asignación?')) return;
        try { await pedir('DELETE', 'asignaciones/' + b.dataset.q); toast('Asignación eliminada'); listar(); } catch(err){ toast(err.message); }
      });
    } catch(e){ $('#la').innerHTML = '<div class="empty">No se pudo cargar.</div>'; }
  };
  $('#ss').onchange = $('#sa').onchange = listar;
  $('#go').onclick = async () => {
    const d = {idAsignatura: +$('#sg').value, idDocente: +$('#sd').value, idSeccion: +$('#ss').value, idAnio: +$('#sa').value};
    if(!d.idAsignatura || !d.idDocente || !d.idSeccion || !d.idAnio) return msg($('#sm'), 'Completa todos los campos.');
    try { await pedir('POST', 'asignaciones', d); $('#sm').textContent = ''; $('#sm').className = 'msg'; toast('Docente asignado'); listar(); }
    catch(err){ msg($('#sm'), err.message); }
  };
  listar();
}

/* ---------- DOCENTE y ESTUDIANTE: Mis cursos ---------- */
async function misCursos(){
  const doc = user.nombreRol === 'Docente';
  $('#content').innerHTML = '<div class="tbl"><div class="empty">Cargando...</div></div>';
  let l;
  try { l = await pedir('GET', 'mis-cursos/' + user.idUsuario); }
  catch(e){ $('#content').innerHTML = '<div class="tbl"><div class="empty">No se pudieron cargar tus cursos.</div></div>'; return; }
  if(!l.length){ $('#content').innerHTML = '<div class="tbl"><div class="empty">Aún no tienes cursos asignados en el año activo.</div></div>'; return; }
  $('#content').innerHTML = `<div class="tbl"><table><thead><tr><th>Asignatura</th><th>${doc ? 'Sección' : 'Docente'}</th><th>Año</th>${doc ? '<th>Alumnos</th>' : ''}</tr></thead><tbody>${l.map(c => `<tr><td>${escH(c.asignatura)}</td><td>${escH(doc ? c.seccion : c.docente)}</td><td>${escH(c.anio)}</td>${doc ? `<td><button class="btn ghost sm" ${bsm} data-a="${c.id_asignacion}">Ver lista</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  document.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
    try {
      const a = await pedir('GET', `asignaciones/${b.dataset.a}/alumnos`);
      const m = modal(`<h2>Alumnos</h2><p class="sub">${a.length} en total</p>${a.length ? `<div class="tbl"><table style="min-width:0"><thead><tr><th>Código</th><th>Nombre</th></tr></thead><tbody>${a.map(x => `<tr><td>${escH(x.codigo)}</td><td>${escH(x.apellidos)}, ${escH(x.nombres)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin alumnos matriculados.</div>'}<div class="row2"><button class="btn" id="cl">Cerrar</button></div>`);
      $('#cl').onclick = () => m.remove();
    } catch(err){ toast(err.message); }
  });
}

/* ---------- CONEXIÓN AUTOMÁTICA CON EL PANEL (no tocar index.html) ---------- */
// "Mis cursos" también para estudiantes
if(!MENUS.Estudiante.some(m => m[1] === 'Mis cursos')) MENUS.Estudiante.splice(1, 0, ['book', 'Mis cursos']);

// Reemplaza el "Próximamente" por las pantallas reales
const goOriginal = go;
go = function(name){
  goOriginal(name);
  if(name === 'Cursos') cursosAdmin();
  else if(name === 'Mis cursos') misCursos();
};

(function () {
    const ESTADOS = ['Presente', 'Ausente', 'Permiso'];
    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const goPrev = go;

    go = function (name) {
        goPrev(name);
        if (name === 'Asistencia' && user.nombreRol === 'Docente') asistDocente();
        else if (name === 'Mi asistencia') asistEstudiante();
    };

    async function asistDocente() {
        const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        $('#content').innerHTML = '<div class="tbl"><div class="empty">Cargando...</div></div>';

        let cursos = [];
        try { cursos = await pedir('GET', 'asistencia/cursos-docente/' + user.idUsuario); }
        catch (e) { $('#content').innerHTML = '<div class="tbl"><div class="empty">No se pudieron cargar tus cursos.</div></div>'; return; }
        if (!cursos.length) {
            $('#content').innerHTML = '<div class="soon"><h2>Sin cursos</h2><p>Aún no tienes cursos asignados.</p></div>';
            return;
        }

        $('#content').innerHTML = `
      <div class="tools">
        <div style="display:flex;gap:12px;flex-wrap:wrap;flex:1">
          <div class="fl" style="min-width:240px;margin:0"><select id="aCur">${cursos.map(c =>
            `<option value="${c.idAsignacion}">${esc(c.asignatura)} · ${esc(c.grado)} ${esc(c.seccion)}</option>`).join('')}</select><label>Curso</label></div>
          <div class="fl" style="margin:0"><input id="aFec" type="date" value="${hoy}" placeholder=" "><label>Fecha</label></div>
        </div>
        <button class="btn sm" id="aGuardar">Guardar asistencia</button>
      </div>
      <div class="tbl" id="aTb"></div>`;

        let rows = [];
        const draw = () => {
            $('#aTb').innerHTML = rows.length
                ? `<table><thead><tr><th>#</th><th>Estudiante</th><th>Estado</th></tr></thead><tbody>${rows.map((r, i) =>
                    `<tr><td>${i + 1}</td><td>${esc(r.estudiante)}</td><td>${ESTADOS.map(e =>
                        `<label style="margin-right:14px;cursor:pointer"><input type="radio" name="e${r.idMatricula}" value="${e}" ${(r.estado || 'Presente') === e ? 'checked' : ''}> ${e}</label>`).join('')}</td></tr>`).join('')}</tbody></table>`
                : '<div class="empty">Este curso no tiene estudiantes matriculados.</div>';
        };
        const cargar = async () => {
            $('#aTb').innerHTML = '<div class="empty">Cargando...</div>';
            try { rows = await pedir('GET', `asistencia/asignacion/${$('#aCur').value}/fecha/${$('#aFec').value}`); draw(); }
            catch (e) { $('#aTb').innerHTML = '<div class="empty">No se pudo cargar la lista.</div>'; }
        };

        $('#aCur').onchange = cargar;
        $('#aFec').onchange = cargar;
        $('#aGuardar').onclick = async () => {
            const b = $('#aGuardar'); b.disabled = true;
            const lista = rows.map(r => ({
                idMatricula: r.idMatricula,
                estado: (document.querySelector(`input[name="e${r.idMatricula}"]:checked`) || {}).value || 'Presente'
            }));
            try {
                await pedir('POST', 'asistencia/lote', { idAsignacion: +$('#aCur').value, fecha: $('#aFec').value, items: lista });
                toast('Asistencia guardada');
            } catch (e) { toast(e.message); }
            b.disabled = false;
        };
        cargar();
    }

    async function asistEstudiante() {
        $('#content').innerHTML = '<div class="tbl"><div class="empty">Cargando...</div></div>';
        try {
            const r = await pedir('GET', 'asistencia/mi-asistencia/' + user.idUsuario);
            $('#content').innerHTML = r.length
                ? `<div class="tbl"><table><thead><tr><th>Fecha</th><th>Asignatura</th><th>Estado</th></tr></thead><tbody>${r.map(x =>
                    `<tr><td>${String(x.fecha).slice(0, 10)}</td><td>${esc(x.asignatura)}</td><td>${esc(x.estado)}</td></tr>`).join('')}</tbody></table></div>`
                : '<div class="tbl"><div class="empty">Aún no hay registros de asistencia.</div></div>';
        } catch (e) {
            $('#content').innerHTML = '<div class="tbl"><div class="empty">No se pudo cargar tu asistencia.</div></div>';
        }
    }
})();