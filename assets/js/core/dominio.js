/* VitNota - reglas de negocio académicas compartidas por la capa de datos y las pantallas. */
(function () {
  const VN = window.VN;
  VN.dom = {
    /* Escala cualitativa: AA 90-100, AS 76-89, AF desde la nota mínima de aprobación, AI por debajo */
    escala(valor, notaMin) {
      if (valor == null || isNaN(valor)) return { codigo: '-', nombre: 'Sin notas', tono: 'plain' };
      const min = notaMin == null ? VN.CONFIG.NOTA_MIN_DEFECTO : notaMin;
      if (valor >= 90) return { codigo: 'AA', nombre: 'Aprendizaje Avanzado', tono: 'ok' };
      if (valor >= 76) return { codigo: 'AS', nombre: 'Aprendizaje Satisfactorio', tono: 'ok' };
      if (valor >= min) return { codigo: 'AF', nombre: 'Aprendizaje Fundamental', tono: 'warn' };
      return { codigo: 'AI', nombre: 'Aprendizaje Inicial', tono: 'bad' };
    },
    estado(valor, notaMin) {
      if (valor == null) return 'Sin notas';
      return valor >= notaMin ? 'Aprobado' : 'Reprobado';
    },
    /* Promedio de cada periodo (solo periodos con notas) y promedio final = media de esos periodos */
    promedios(notas) {
      const porPeriodo = {};
      notas.forEach(n => { (porPeriodo[n.id_periodo] = porPeriodo[n.id_periodo] || []).push(n.valor); });
      const res = {};
      Object.keys(porPeriodo).forEach(p => { res[p] = VN.redondear(VN.promedio(porPeriodo[p])); });
      const vals = Object.keys(res).map(k => res[k]);
      return { porPeriodo: res, final: vals.length ? VN.redondear(VN.promedio(vals)) : null };
    }
  };
})();
