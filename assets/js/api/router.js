/* VitNota - "servidor" simulado. Expone VN.pedir(metodo, ruta, cuerpo) con la misma forma que usaba
   la interfaz original (fetch a /api/...), pero resuelve contra la base local. Cada endpoint valida
   permisos, datos y reglas de integridad, exactamente como lo haría un backend real. */
(function () {
  const VN = window.VN, E = VN.ApiError;
  const rutas = [];
  VN.sesion = null;

  VN.ruta = (metodo, patron, handler) => {
    const keys = [];
    const re = new RegExp('^' + patron.replace(/:([a-zA-Z]+)/g, (m, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    rutas.push({ metodo, re, keys, handler });
  };

  /* Usuario autenticado; lanza 401/403 si no corresponde */
  VN.autenticar = (db, roles) => {
    const s = VN.sesion;
    const u = s && db.usuarios.find(x => x.id_usuario === s.idUsuario && x.activo);
    if (!u) throw new E(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
    if (roles && roles.indexOf(u.rol) < 0) throw new E(403, 'No tienes permiso para realizar esta acción.');
    return u;
  };

  VN.pedir = async function (metodo, ruta, cuerpo) {
    if (VN.CONFIG.LATENCIA_MS) await new Promise(r => setTimeout(r, VN.CONFIG.LATENCIA_MS));
    const [path, qs] = String(ruta).split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    const body = cuerpo === undefined ? undefined : JSON.parse(JSON.stringify(cuerpo));
    for (const r of rutas) {
      if (r.metodo !== metodo) continue;
      const m = r.re.exec(path);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      try {
        return JSON.parse(JSON.stringify(r.handler({ params, query, body: body || {} }) ?? {}));
      } catch (e) {
        if (e instanceof E) throw e;
        console.error('[VitNota] Error interno en', metodo, ruta, e);
        throw new E(500, 'Ocurrió un error interno. Intenta de nuevo.');
      }
    }
    throw new E(404, 'Recurso no encontrado.');
  };

  /* Utilidades compartidas por los endpoints */
  VN.api = {
    id(v) { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; },
    exigirId(v, que) { const n = VN.api.id(v); if (!n) throw new E(400, 'Identificador de ' + (que || 'registro') + ' inválido.'); return n; },
    buscar(lista, campo, id, mensaje) { const x = lista.find(r => r[campo] === id); if (!x) throw new E(404, mensaje); return x; },
    anio: db => db.anios.find(a => a.id_anio === db.config.idAnioActivo),
    seccion: (db, id) => db.secciones.find(s => s.id_seccion === id),
    matriculasDeSeccion: (db, idSeccion, idAnio) => db.matriculas.filter(m => m.id_seccion === idSeccion && m.id_anio === idAnio && m.estado === 'Activa'),
    nombreEst: e => e.apellidos + ', ' + e.nombres,
    nombreDoc: d => d.nombres + ' ' + d.apellidos,
    docenteDe: (db, u) => db.docentes.find(d => d.id_usuario === u.id_usuario),
    estudianteDe: (db, u) => db.estudiantes.find(e => e.id_usuario === u.id_usuario),
    /* Un docente solo puede operar sobre sus propias asignaciones; el administrador sobre todas */
    asignacionPermitida(db, u, idAsignacion) {
      const a = VN.api.buscar(db.asignaciones, 'id_asignacion', idAsignacion, 'El curso no existe.');
      if (u.rol === 'Administrador') return a;
      const d = VN.api.docenteDe(db, u);
      if (u.rol === 'Docente' && d && a.id_docente === d.id_docente) return a;
      throw new E(403, 'Ese curso no está asignado a tu usuario.');
    },
    soloYo(u, idUsuario) {
      const id = VN.api.exigirId(idUsuario, 'usuario');
      if (u.rol !== 'Administrador' && u.id_usuario !== id) throw new E(403, 'No puedes consultar datos de otra persona.');
      return id;
    }
  };
})();
