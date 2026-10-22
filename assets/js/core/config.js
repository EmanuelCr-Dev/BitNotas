/* VitNota - configuración global. Todo cuelga del espacio de nombres VN. */
window.VN = window.VN || {};
VN.CONFIG = {
  APP: 'VitNota',
  VERSION: '1.0.0',
  DOMINIO: 'vitnota.edu.ni',
  DB_KEY: 'vitnota.db.v1',
  SESION_KEY: 'vn',
  TEMA_KEY: 'vnt',
  DB_VERSION: 1,
  LATENCIA_MS: 70,          // simula el tiempo de respuesta de un servidor (0 para pruebas)
  MAX_INTENTOS: 5,          // intentos fallidos antes de bloquear la cuenta
  BLOQUEO_MIN: 5,           // minutos de bloqueo
  CODIGO_VENCE_MIN: 15,     // vigencia del código de recuperación
  INACTIVIDAD_MIN: 30,      // cierre de sesión por inactividad
  NOTA_MAX: 100,
  NOTA_MIN_DEFECTO: 60,
  FILAS_POR_PAGINA: 10,
  EDAD_MIN_ESTUDIANTE: 10,
  EDAD_MAX_ESTUDIANTE: 25
};
