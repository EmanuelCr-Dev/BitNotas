/* VitNota - validación declarativa. Se usa en el formulario (respuesta inmediata)
   y de nuevo en la capa de datos (nunca se confía en lo que llega del cliente). */
(function () {
  const VN = window.VN;
  const LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
  const TEXTO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,;:'\-()&\/#°ªº]*$/;
  const EMAIL = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;

  const telefono = v => {
    let d = String(v).replace(/[\s\-().]/g, '');
    if (d.startsWith('+505')) d = d.slice(4); else if (/^505\d{8}$/.test(d)) d = d.slice(3);
    if (!/^[2578]\d{7}$/.test(d)) return null;
    return d.slice(0, 4) + '-' + d.slice(4);
  };

  /* esquema: { campo: { label, req, tipo, min, max, opciones, ... } } */
  function validar(esquema, entrada) {
    const datos = {}, errores = {};
    Object.keys(esquema).forEach(k => {
      const r = esquema[k], etiqueta = r.label || k;
      let v = entrada[k];
      const vacio = v === undefined || v === null || String(v).trim() === '';
      if (vacio) {
        if (r.req) errores[k] = 'Completa el campo «' + etiqueta + '».';
        datos[k] = null; return;
      }
      switch (r.tipo) {
        case 'nombre': {
          v = VN.limpiar(v);
          if (v.length < (r.min || 2) || v.length > (r.max || 50)) { errores[k] = etiqueta + ' debe tener entre ' + (r.min || 2) + ' y ' + (r.max || 50) + ' caracteres.'; break; }
          if (!LETRAS.test(v)) { errores[k] = etiqueta + ' solo admite letras, espacios, guion y apóstrofo.'; break; }
          datos[k] = VN.titulo(v); break;
        }
        case 'texto': {
          v = VN.limpiar(v);
          if (v.length < (r.min || 1) || v.length > (r.max || 100)) { errores[k] = etiqueta + ' debe tener entre ' + (r.min || 1) + ' y ' + (r.max || 100) + ' caracteres.'; break; }
          if (!r.libre && !TEXTO.test(v)) { errores[k] = etiqueta + ' contiene caracteres no permitidos.'; break; }
          datos[k] = v; break;
        }
        case 'email': {
          v = String(v).trim().toLowerCase();
          if (v.length > 100 || !EMAIL.test(v)) { errores[k] = 'Escribe un correo válido, por ejemplo nombre@dominio.com.'; break; }
          datos[k] = v; break;
        }
        case 'telefono': {
          const t = telefono(v);
          if (!t) { errores[k] = 'Teléfono inválido. Usa 8 dígitos que inicien en 2, 5, 7 u 8 (ej. 8888-7777).'; break; }
          datos[k] = t; break;
        }
        case 'fecha': {
          v = String(v).trim();
          const d = new Date(v + 'T00:00:00');
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(d) || d.toISOString().slice(0, 10) !== v) { errores[k] = 'Fecha inválida.'; break; }
          if (r.noFutura && v > VN.hoy()) { errores[k] = 'La ' + etiqueta.toLowerCase() + ' no puede ser futura.'; break; }
          if (r.edad) {
            const e = VN.edad(v);
            if (e < r.edad[0] || e > r.edad[1]) { errores[k] = 'La edad debe estar entre ' + r.edad[0] + ' y ' + r.edad[1] + ' años.'; break; }
          }
          datos[k] = v; break;
        }
        case 'entero': {
          const n = Number(v);
          if (!/^-?\d+$/.test(String(v).trim()) || !isFinite(n)) { errores[k] = etiqueta + ' no es válido.'; break; }
          if (r.min != null && n < r.min || r.max != null && n > r.max) { errores[k] = etiqueta + ' fuera de rango.'; break; }
          datos[k] = n; break;
        }
        case 'numero': {
          const s = String(v).trim().replace(',', '.');
          const n = Number(s);
          if (!/^\d+(\.\d{1,2})?$/.test(s) || !isFinite(n)) { errores[k] = etiqueta + ': ingresa un número entre ' + r.min + ' y ' + r.max + ' (máximo 2 decimales).'; break; }
          if (n < r.min || n > r.max) { errores[k] = etiqueta + ': el valor debe estar entre ' + r.min + ' y ' + r.max + '.'; break; }
          datos[k] = VN.redondear(n); break;
        }
        case 'opcion': {
          if (r.opciones.map(String).indexOf(String(v)) < 0) { errores[k] = 'Selecciona una opción válida.'; break; }
          datos[k] = v; break;
        }
        default: datos[k] = v;
      }
    });
    return { ok: Object.keys(errores).length === 0, datos, errores };
  }

  /* Esquemas reutilizados por formularios y capa de datos */
  const persona = {
    nombres: { label: 'Nombres', req: true, tipo: 'nombre' },
    apellidos: { label: 'Apellidos', req: true, tipo: 'nombre' },
    telefono: { label: 'Teléfono', tipo: 'telefono' },
    correoPersonal: { label: 'Correo personal', req: true, tipo: 'email' }
  };
  VN.val = {
    validar, telefono,
    esquema: {
      estudiante: Object.assign({}, persona, {
        fechaNacimiento: { label: 'Fecha de nacimiento', req: true, tipo: 'fecha', noFutura: true, edad: [VN.CONFIG.EDAD_MIN_ESTUDIANTE, VN.CONFIG.EDAD_MAX_ESTUDIANTE] },
        sexo: { label: 'Sexo', req: true, tipo: 'opcion', opciones: ['F', 'M'] },
        direccion: { label: 'Dirección', tipo: 'texto', max: 150 }
      }),
      docente: Object.assign({}, persona, {
        especialidad: { label: 'Especialidad', req: true, tipo: 'texto', min: 3, max: 80 }
      }),
      asignatura: { nombre: { label: 'Nombre', req: true, tipo: 'texto', min: 3, max: 60 } },
      nota: {
        titulo: { label: 'Evaluación', req: true, tipo: 'texto', min: 3, max: 60 },
        valor: { label: 'Nota', req: true, tipo: 'numero', min: 0, max: VN.CONFIG.NOTA_MAX },
        observacion: { label: 'Observación', tipo: 'texto', max: 200, libre: true }
      }
    }
  };
})();
