/* VitNota - capa de persistencia (HU-001: diseño, programación e implementación de la base de datos).
   La base se guarda como un único documento JSON en localStorage, organizado en tablas relacionadas
   por claves foráneas (ver docs/BASE-DE-DATOS.md). Cada operación de escritura es atómica. */
(function () {
  const VN = window.VN, C = VN.CONFIG;

  const TABLAS = ['anios', 'grados', 'secciones', 'usuarios', 'estudiantes', 'docentes', 'matriculas',
    'asignaturas', 'asignaciones', 'notas', 'asistencias', 'recuperaciones', 'auditoria'];

  let memoria = null; // respaldo cuando el navegador bloquea localStorage

  function leerCrudo() { try { return localStorage.getItem(C.DB_KEY); } catch (e) { return memoria; } }
  function escribirCrudo(txt) {
    try { localStorage.setItem(C.DB_KEY, txt); memoria = null; }
    catch (e) {
      if (e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message)))) throw new VN.ApiError(507, 'No hay espacio de almacenamiento en el navegador. Exporta un respaldo y reinicia los datos.');
      memoria = txt;
    }
  }

  const DB = VN.DB = {
    TABLAS,

    cargar() {
      const crudo = leerCrudo();
      if (crudo) {
        try {
          const db = JSON.parse(crudo);
          if (db && db.version === C.DB_VERSION && TABLAS.every(t => Array.isArray(db[t]))) return db;
        } catch (e) { /* se reconstruye abajo */ }
        try { localStorage.setItem(C.DB_KEY + '.corrupta', crudo); } catch (e) { /* sin espacio: se descarta */ }
      }
      const nueva = VN.seed();
      escribirCrudo(JSON.stringify(nueva));
      return nueva;
    },

    guardar(db) { escribirCrudo(JSON.stringify(db)); },

    /* Transacción: si la función lanza un error, no se guarda nada. */
    tx(fn) { const db = DB.cargar(); const r = fn(db); DB.guardar(db); return r; },

    leer(fn) { return fn(DB.cargar()); },

    siguienteId(db, tabla) { db.seq[tabla] = (db.seq[tabla] || 0) + 1; return db.seq[tabla]; },

    auditar(db, usuario, accion, entidad, detalle) {
      db.auditoria.push({ id: DB.siguienteId(db, 'auditoria'), fecha: VN.ahora(), usuario: usuario || 'sistema', accion, entidad, detalle: detalle || '' });
      if (db.auditoria.length > 300) db.auditoria.splice(0, db.auditoria.length - 300);
    },

    reiniciar() { const n = VN.seed(); escribirCrudo(JSON.stringify(n)); return n; },

    exportar() { return JSON.stringify(DB.cargar(), null, 2); },

    /* Valida estructura antes de restaurar un respaldo */
    importar(texto) {
      let db;
      try { db = JSON.parse(texto); } catch (e) { throw new VN.ApiError(400, 'El archivo no es un respaldo válido (JSON dañado).'); }
      if (!db || db.version !== C.DB_VERSION || !db.seq || !db.config || !TABLAS.every(t => Array.isArray(db[t])))
        throw new VN.ApiError(400, 'El archivo no corresponde a un respaldo de VitNota compatible.');
      if (!db.usuarios.some(u => u.rol === 'Administrador')) throw new VN.ApiError(400, 'El respaldo no contiene ningún administrador.');
      escribirCrudo(JSON.stringify(db));
      return db;
    },

    tamanoKB() { const c = leerCrudo(); return c ? Math.round(c.length / 102.4) / 10 : 0; }
  };
})();
