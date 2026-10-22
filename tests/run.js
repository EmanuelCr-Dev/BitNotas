/* Ejecuta todas las pruebas: node tests/run.js  (o npm test) */
let ok = 0, mal = 0;
const t = async (nombre, fn) => { try { await fn(); ok++; console.log('  [OK]    ' + nombre); } catch (e) { mal++; console.log('  [FALLO] ' + nombre + '\n          ' + String(e.message).split('\n')[0]); } };
(async () => {
  console.log('\nCapa de datos y reglas de negocio'); await require('./api.test.js')(t);
  console.log('\nInterfaz (flujos de los casos de prueba CP-003 a CP-020)'); await require('./ui.test.js')(t);
  console.log('\nResultado: ' + ok + ' correctas, ' + mal + ' con fallo\n');
  process.exit(mal ? 1 : 0);
})();
