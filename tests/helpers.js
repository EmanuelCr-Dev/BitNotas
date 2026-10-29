/* Utilidades de prueba: servidor estático + jsdom para ejecutar la web real. */
const http = require('http'), fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const RAIZ = path.resolve(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };

function servidor() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
      if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'text/plain' }); r.end(fs.readFileSync(f));
    }).listen(0, () => res({ s, url: 'http://127.0.0.1:' + s.address().port + '/' }));
  });
}

const esperar = (fn, ms = 4000) => new Promise((ok, no) => { const t0 = Date.now(); (function p() { let v; try { v = fn(); } catch (e) { v = false; } if (v) return ok(v); if (Date.now() - t0 > ms) return no(new Error('Tiempo agotado esperando condición: ' + fn)); setTimeout(p, 15); })(); });

async function abrir(url, errores) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errores.push('jsdomError: ' + (e.detail || e.message)));
  vc.on('error', (...a) => errores.push('console.error: ' + a.join(' ')));
  const dom = await JSDOM.fromURL(url, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.scrollTo = () => {}; w.print = () => { w.__impreso = true; }; w.Element.prototype.scrollIntoView = () => {}; w.HTMLElement.prototype.focus = function () {}; } });
  const w = dom.window;
  await esperar(() => w.VN && w.VN.app && w.document.readyState === 'complete');
  w.VN.CONFIG.LATENCIA_MS = 0;
  return w;
}

function ayudas(w) {
  const d = w.document, $ = s => d.querySelector(s);
  const ev = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles: true, cancelable: true }));
  return {
    $, $$: s => Array.from(d.querySelectorAll(s)), ev,
    escribir(sel, v) { const e = typeof sel === 'string' ? $(sel) : sel; e.value = v; ev(e, 'input'); ev(e, 'change'); },
    click(sel) { const e = typeof sel === 'string' ? $(sel) : sel; if (!e) throw new Error('No existe ' + sel); e.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); },
    enviar(f) { const e = typeof f === 'string' ? $(f) : f; e.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); },
    texto: () => d.body.textContent.replace(/\s+/g, ' '),
    async login(correo, clave) { this.escribir('#lEmail', correo); this.escribir('#lPass', clave); this.enviar('#vLogin'); await esperar(() => !$('#app').hidden || $('#vLogin .msg').textContent || !$('#vForce').hidden); },
    async ir(nombre) { const b = this.$$('.side nav button').find(x => x.textContent.trim() === nombre); if (!b) throw new Error('Sin menú ' + nombre); b.click(); await esperar(() => $('#tTitle').textContent === nombre || nombre === 'Inicio'); await esperar(() => !$('#content .loading')); }
  };
}
module.exports = { servidor, abrir, ayudas, esperar, RAIZ };
