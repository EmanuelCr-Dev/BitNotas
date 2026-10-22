/* VitNota - datos de demostración (se cargan la primera vez o al reiniciar la base). */
(function () {
  const VN = window.VN, C = VN.CONFIG;

  function prng(seed) { // generador determinista para que los datos de ejemplo siempre sean los mismos
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  VN.CREDENCIALES_DEMO = {
    admin: { correo: 'admin@' + C.DOMINIO, clave: 'Admin2026*' },
    docente: { correo: 'docente@' + C.DOMINIO, clave: 'Docente2026*' },
    estudiante: { correo: 'estudiante@' + C.DOMINIO, clave: 'Estudiante2026*' }
  };

  VN.seed = function () {
    const rnd = prng(2026);
    const db = {
      version: C.DB_VERSION, creada: VN.ahora(), seq: {},
      config: { notaMinima: C.NOTA_MIN_DEFECTO, idAnioActivo: 2, periodos: [1, 2, 3, 4].map(n => ({ id: n, nombre: ['I', 'II', 'III', 'IV'][n - 1] + ' Periodo', abierto: true })) },
      pruebas: {}
    };
    VN.DB.TABLAS.forEach(t => { db[t] = []; });
    const id = t => VN.DB.siguienteId(db, t);

    db.anios.push({ id_anio: id('anios'), nombre: 'Año lectivo 2025', activo: false });
    db.anios.push({ id_anio: id('anios'), nombre: 'Año lectivo 2026', activo: true });

    ['Séptimo Grado', 'Octavo Grado', 'Noveno Grado', 'Décimo Grado', 'Undécimo Grado'].forEach(n => {
      const g = { id_grado: id('grados'), nombre_grado: n }; db.grados.push(g);
      ['1', '2'].forEach(s => db.secciones.push({ id_seccion: id('secciones'), id_grado: g.id_grado, nombre_seccion: s, etiqueta: n + ' · Sección ' + s }));
    });
    const seccion = (g, s) => db.secciones.find(x => x.id_grado === g && x.nombre_seccion === s).id_seccion;

    const usuario = (correo, nombre, rol, clave, debeCambiar) => {
      const sal = VN.seg.sal();
      const u = { id_usuario: id('usuarios'), nombre_usuario: nombre, correo, sal, hash: VN.seg.hash(clave, sal), rol, debe_cambiar: !!debeCambiar, activo: true, intentos: 0, bloqueado_hasta: null, creado: VN.ahora() };
      db.usuarios.push(u); return u;
    };
    usuario(VN.CREDENCIALES_DEMO.admin.correo, 'Administrador', 'Administrador', VN.CREDENCIALES_DEMO.admin.clave);

    const D = (correo, n, a, esp, tel, cp) => {
      const u = usuario(correo, VN.nombreCorto(n, a), 'Docente', VN.CREDENCIALES_DEMO.docente.clave);
      const d = { id_docente: id('docentes'), id_usuario: u.id_usuario, codigo: 'DOC-' + String(db.seq.docentes).padStart(4, '0'), nombres: n, apellidos: a, especialidad: esp, telefono: tel, correo_personal: cp, creado: VN.ahora() };
      db.docentes.push(d); return d;
    };
    const d1 = D(VN.CREDENCIALES_DEMO.docente.correo, 'Carlos Alberto', 'Mendoza Rizo', 'Matemáticas e Informática', '8845-1290', 'carlos.mendoza.rizo@gmail.com');
    const d2 = D('maria.lopez@' + C.DOMINIO, 'María Fernanda', 'López Castillo', 'Lengua y Literatura', '8731-4402', 'mfernanda.lopez@gmail.com');
    const d3 = D('jose.gutierrez@' + C.DOMINIO, 'José Ramón', 'Gutiérrez Pineda', 'Ciencias Naturales', '7822-9051', 'joseramon.gp@gmail.com');
    const d4 = D('ana.martinez@' + C.DOMINIO, 'Ana Lucía', 'Martínez Obando', 'Inglés', '8590-3318', 'analucia.martinez@outlook.com');

    const S = (correo, n, a, nac, sx, tel, dir, cp, sec) => {
      const u = usuario(correo, VN.nombreCorto(n, a), 'Estudiante', VN.CREDENCIALES_DEMO.estudiante.clave);
      const e = { id_estudiante: id('estudiantes'), id_usuario: u.id_usuario, codigo: 'EST-2026-' + String(db.seq.estudiantes).padStart(4, '0'), nombres: n, apellidos: a, fecha_nacimiento: nac, sexo: sx, telefono: tel, correo_personal: cp, direccion: dir, creado: VN.ahora() };
      db.estudiantes.push(e);
      db.matriculas.push({ id_matricula: id('matriculas'), id_estudiante: e.id_estudiante, id_seccion: sec, id_anio: 2, estado: 'Activa' });
      return e;
    };
    const s71 = seccion(1, '1'), s72 = seccion(1, '2'), s81 = seccion(2, '1'), s91 = seccion(3, '1');
    S(VN.CREDENCIALES_DEMO.estudiante.correo, 'Daniela Sofía', 'Pérez Rivas', '2013-04-18', 'F', '8812-3456', 'Barrio Altagracia, Managua', 'daniela.perez.r@gmail.com', s71);
    S('kevin.ortiz@' + C.DOMINIO, 'Kevin Josué', 'Ortiz Blandón', '2013-09-02', 'M', null, 'Residencial Las Colinas, Managua', 'kevin.ortiz.b@gmail.com', s71);
    S('valeria.cruz@' + C.DOMINIO, 'Valeria Sofía', 'Cruz Medina', '2013-01-27', 'F', '7745-2081', 'Reparto Schick, Managua', 'valeria.cruz.m@gmail.com', s71);
    S('marcos.silva@' + C.DOMINIO, 'Marcos Antonio', 'Silva Lara', '2012-11-09', 'M', '8654-7720', 'Barrio Monseñor Lezcano, Managua', 'marcos.silva.l@hotmail.com', s71);
    S('andrea.torres@' + C.DOMINIO, 'Andrea Michelle', 'Torres Navarro', '2013-06-30', 'F', null, 'Ciudad Sandino, Managua', 'andrea.torres.n@gmail.com', s71);
    S('luis.ramirez@' + C.DOMINIO, 'Luis Fernando', 'Ramírez Soza', '2013-03-14', 'M', '8403-9917', 'Villa Fontana, Managua', 'luis.ramirez.s@gmail.com', s71);
    S('camila.guzman@' + C.DOMINIO, 'Camila Alejandra', 'Guzmán Téllez', '2013-08-21', 'F', '8877-1043', 'Bello Horizonte, Managua', 'camila.guzman.t@gmail.com', s72);
    S('diego.aguilar@' + C.DOMINIO, 'Diego Armando', 'Aguilar Pérez', '2012-12-05', 'M', null, 'Barrio Larreynaga, Managua', 'diego.aguilar.p@gmail.com', s72);
    S('gabriela.mejia@' + C.DOMINIO, 'Gabriela Isabel', 'Mejía Lacayo', '2012-02-11', 'F', '7790-4455', 'Carretera Norte, Managua', 'gabriela.mejia.l@gmail.com', s81);
    S('josue.cano@' + C.DOMINIO, 'Josué David', 'Cano Espinoza', '2012-07-19', 'M', '8521-6038', 'Barrio Riguero, Managua', 'josue.cano.e@gmail.com', s81);
    S('fatima.rocha@' + C.DOMINIO, 'Fátima Nazareth', 'Rocha Zeledón', '2012-05-03', 'F', null, 'Reparto San Juan, Managua', 'fatima.rocha.z@gmail.com', s81);
    S('brayan.mora@' + C.DOMINIO, 'Brayan Alexander', 'Mora Díaz', '2012-10-26', 'M', '8366-2214', 'Barrio San Judas, Managua', 'brayan.mora.d@gmail.com', s81);
    S('stephanie.blandon@' + C.DOMINIO, 'Stephanie Paola', 'Blandón Ruiz', '2011-03-08', 'F', '7701-8826', 'Colonia Centroamérica, Managua', 'stephanie.blandon.r@gmail.com', s91);
    S('ricardo.herrera@' + C.DOMINIO, 'Ricardo Javier', 'Herrera Solís', '2011-09-15', 'M', '8488-3501', 'Barrio Domitila Lugo, Managua', 'ricardo.herrera.s@gmail.com', s91);

    ['Matemáticas', 'Lengua y Literatura', 'Ciencias Naturales', 'Estudios Sociales', 'Inglés', 'Informática', 'Educación Física']
      .forEach(n => db.asignaturas.push({ id_asignatura: id('asignaturas'), nombre: n, estado: true }));
    db.asignaturas.push({ id_asignatura: id('asignaturas'), nombre: 'Taller de Robótica', estado: false });
    const A = { mat: 1, len: 2, cie: 3, soc: 4, ing: 5, inf: 6 };
    const asig = (a, d, s) => { const x = { id_asignacion: id('asignaciones'), id_asignatura: a, id_docente: d.id_docente, id_seccion: s, id_anio: 2 }; db.asignaciones.push(x); return x; };
    [[A.mat, d1, s71], [A.len, d2, s71], [A.cie, d3, s71], [A.ing, d4, s71], [A.inf, d1, s71],
     [A.mat, d1, s72], [A.ing, d4, s72],
     [A.mat, d1, s81], [A.len, d2, s81], [A.cie, d3, s81], [A.ing, d4, s81],
     [A.mat, d1, s91], [A.soc, d3, s91]].forEach(x => asig(x[0], x[1], x[2]));

    /* notas: cada estudiante tiene un nivel base y cada evaluación varía alrededor de él */
    const nivel = {}; db.matriculas.forEach(m => { nivel[m.id_matricula] = 58 + rnd() * 37; });
    const ev = [[1, 'Examen parcial', '2026-03-20'], [1, 'Tarea integradora', '2026-04-10'], [2, 'Examen parcial', '2026-05-22'], [2, 'Proyecto de unidad', '2026-06-12'], [3, 'Quiz 1', '2026-08-14']];
    db.asignaciones.forEach(a => {
      db.matriculas.filter(m => m.id_seccion === a.id_seccion).forEach(m => {
        ev.forEach(e => {
          if (e[0] === 3 && a.id_seccion !== s71) return;
          const v = Math.max(35, Math.min(100, Math.round(nivel[m.id_matricula] + (rnd() - .5) * 22)));
          db.notas.push({ id_nota: id('notas'), id_matricula: m.id_matricula, id_asignacion: a.id_asignacion, id_periodo: e[0], titulo: e[1], valor: v, observacion: null, fecha: e[2], registrado_por: db.docentes.find(x => x.id_docente === a.id_docente).id_usuario, modificado_por: null, fecha_modificacion: null });
        });
      });
    });

    /* asistencia de los últimos días hábiles */
    const dias = []; for (let i = 0, f = new Date(); dias.length < 6 && i < 20; i++, f = new Date(f.getTime() - 86400000)) {
      const dow = f.getDay(); if (dow === 0 || dow === 6) continue;
      dias.push(new Date(f.getTime() - f.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
    }
    db.asignaciones.forEach(a => db.matriculas.filter(m => m.id_seccion === a.id_seccion).forEach(m => dias.forEach(f => {
      const r = rnd();
      db.asistencias.push({ id_asistencia: id('asistencias'), id_matricula: m.id_matricula, id_asignacion: a.id_asignacion, fecha: f, estado: r < .88 ? 'Presente' : r < .95 ? 'Ausente' : 'Permiso' });
    })));

    VN.DB.auditar(db, 'sistema', 'Inicialización', 'Base de datos', 'Datos de demostración cargados');
    return db;
  };

  VN.nombreCorto = (n, a) => ((n || '').split(' ')[0] + ' ' + (a || '').split(' ')[0]).trim();
})();
