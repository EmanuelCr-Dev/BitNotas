/* VitNota - utilidades de seguridad del lado del cliente.
   Nota: al no existir servidor, esto protege la demostración, no sustituye a un backend real. */
(function () {
  const VN = window.VN;

  /* SHA-256 en JavaScript puro (funciona igual con Live Server, npm o abriendo el archivo) */
  const K = [], H0 = [];
  (function () {
    const primos = []; for (let n = 2; primos.length < 64; n++) { if (primos.every(p => n % p)) primos.push(n); }
    const frac = x => Math.floor((x - Math.floor(x)) * 4294967296);
    primos.forEach((p, i) => { K[i] = frac(Math.cbrt(p)); if (i < 8) H0[i] = frac(Math.sqrt(p)); });
  })();

  /* Codificación UTF-8 sin depender de TextEncoder (ausente en algunos entornos antiguos) */
  function utf8(texto) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(texto);
    const bytes = [];
    for (const ch of String(texto)) {
      let c = ch.codePointAt(0);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(bytes);
  }

  function sha256(texto) {
    const datos = utf8(texto);
    const largo = datos.length, bits = largo * 8;
    const total = ((largo + 9 + 63) >> 6) << 6;
    const b = new Uint8Array(total);
    b.set(datos); b[largo] = 0x80;
    const dv = new DataView(b.buffer);
    dv.setUint32(total - 8, Math.floor(bits / 4294967296)); dv.setUint32(total - 4, bits >>> 0);
    const h = H0.slice(), w = new Array(64);
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < total; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, bb, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c);
        const t2 = (S0 + mj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + bb) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    return h.map(x => x.toString(16).padStart(8, '0')).join('');
  }

  const aleatorio = n => {
    const a = new Uint32Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
    return a;
  };

  VN.seg = {
    sha256,
    sal: () => Array.from(aleatorio(4)).map(x => x.toString(16).padStart(8, '0')).join(''),
    /* hash con sal e iteraciones para encarecer ataques de fuerza bruta */
    hash(clave, sal) { let h = sal + ':' + clave; for (let i = 0; i < 250; i++) h = sha256(h + sal); return h; },
    verificar(clave, sal, hash) { return this.hash(clave, sal) === hash; },
    /* contraseña temporal legible: 3 letras + 4 dígitos + símbolo + 2 letras */
    temporal() {
      const L = 'abcdefghjkmnpqrstuvwxyz', M = 'ABCDEFGHJKMNPQRSTUVWXYZ', D = '23456789', S = '#*+-';
      const r = aleatorio(10), p = (c, i) => c[r[i] % c.length];
      return p(M, 0) + p(L, 1) + p(L, 2) + p(L, 3) + p(D, 4) + p(D, 5) + p(D, 6) + p(D, 7) + p(S, 8) + p(L, 9);
    },
    codigo6: () => String(aleatorio(1)[0] % 1000000).padStart(6, '0'),
    /* política de contraseñas: devuelve lista de reglas con su cumplimiento */
    reglas(clave) {
      return [
        { ok: clave.length >= 8, t: 'Mínimo 8 caracteres' },
        { ok: /[a-z]/.test(clave) && /[A-Z]/.test(clave), t: 'Mayúsculas y minúsculas' },
        { ok: /\d/.test(clave), t: 'Al menos un número' }
      ];
    },
    fuerza(clave) {
      let s = 0;
      if (clave.length >= 8) s++;
      if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) s++;
      if (/\d/.test(clave)) s++;
      if (/[^A-Za-z0-9]/.test(clave)) s++;
      return s;
    },
    clavValida: clave => VN.seg.reglas(clave).every(r => r.ok)
  };
})();
