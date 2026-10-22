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