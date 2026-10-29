/* VitNota - utilidades generales. */
(function () {
  const VN = window.VN;

  VN.$ = (s, r) => (r || document).querySelector(s);
  VN.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  VN.esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* Texto comparable: sin tildes, en minúsculas y sin espacios sobrantes */
  VN.norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  VN.hoy = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  VN.ahora = () => new Date().toISOString();

  VN.fmtFecha = iso => {
    if (!iso) return '-';
    const p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso);
  };
  VN.fmtFechaHora = iso => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };
  VN.fmtNum = (n, dec) => (n == null || isNaN(n)) ? '-' : (Math.round(n * 100) / 100).toFixed(dec == null ? 1 : dec).replace(/\.0+$/, '');
  VN.redondear = n => Math.round(n * 100) / 100;

  VN.titulo = s => String(s || '').toLowerCase().replace(/(^|[\s'\-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  VN.limpiar = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

  VN.promedio = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  VN.edad = iso => {
    const n = new Date(iso + 'T00:00:00'), h = new Date();
    let e = h.getFullYear() - n.getFullYear();
    const m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--;
    return e;
  };

  /* Error con código HTTP y, opcionalmente, errores por campo */
  VN.ApiError = class ApiError extends Error {
    constructor(status, mensaje, errores) { super(mensaje); this.status = status; this.errores = errores || null; }
  };

  VN.descargar = (nombre, contenido, tipo) => {
    const blob = new Blob([contenido], { type: tipo || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  VN.csv = (cabeceras, filas) => {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    return '\ufeff' + [cabeceras].concat(filas).map(f => f.map(q).join(',')).join('\r\n');
  };
})();
