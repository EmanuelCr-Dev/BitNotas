# Genera assets/js/data/historias.js a partir del Excel de casos de prueba y del PERT.
import json, openpyxl

wb = openpyxl.load_workbook('/mnt/user-data/uploads/Casos_de_Prueba-Sistema-Academico.xlsx')
ws = wb.active
filas = {}
for row in ws.iter_rows(values_only=True):
    if row[1] and row[1] != 'ID Caso de Prueba':
        filas[str(row[1]).strip()] = [c for c in row[3:23]]
    elif row[1] == 'ID Caso de Prueba':
        ids = [c for c in row[3:23]]
print(len(ids), list(filas))

SPRINTS = [
    (1, '10 - 15 de Agosto', ['HU-001', 'HU-002']),
    (2, '18 - 26 de Agosto', ['HU-003', 'HU-004', 'HU-005']),
    (3, '26 de Agosto - 3 de Septiembre', ['HU-006', 'HU-007', 'HU-008', 'HU-009', 'HU-010']),
    (4, '4 - 11 de Septiembre', ['HU-011', 'HU-012', 'HU-013', 'HU-014', 'HU-015']),
    (5, '12 - 18 de Septiembre', ['HU-016', 'HU-017', 'HU-018']),
    (6, '26 de Septiembre - 3 de Octubre', ['HU-019', 'HU-020']),
]
sprint_de = {h: (n, f) for n, f, hs in SPRINTS for h in hs}

ROL = {i: 'Administrador' for i in range(1, 19)}
ROL[3] = 'Todos'
ROL[19] = 'Docente / Administrador'
ROL[20] = 'Docente / Administrador'

VISTA = {1: 'Configuración', 2: 'Historias de usuario', 3: 'Inicio'}
for i in range(4, 9): VISTA[i] = 'Estudiantes'
for i in range(9, 14): VISTA[i] = 'Docentes'
for i in range(14, 19): VISTA[i] = 'Cursos'
VISTA[19] = 'Calificaciones'; VISTA[20] = 'Calificaciones'

HIST = {
 1: ('Como equipo de desarrollo', 'contar con una base de datos diseñada e implementada', 'que el sistema almacene y consulte la información académica de forma consistente'),
 2: ('Como equipo de desarrollo', 'tener las historias de usuario redactadas y organizadas', 'guiar el alcance, los sprints y las pruebas del proyecto'),
 3: ('Como usuario del sistema', 'ver un panel de inicio con indicadores y accesos', 'conocer el estado académico de un vistazo según mi rol'),
 4: ('Como administrador', 'registrar un nuevo estudiante', 'que quede matriculado y con acceso al sistema'),
 5: ('Como administrador', 'editar los datos de un estudiante', 'mantener su información actualizada'),
 6: ('Como administrador', 'eliminar un estudiante', 'retirar registros que ya no corresponden'),
 7: ('Como administrador', 'buscar un estudiante', 'localizarlo rápidamente por nombre, código, correo o grado'),
 8: ('Como administrador', 'ver la lista de estudiantes', 'consultar quiénes están registrados'),
 9: ('Como administrador', 'registrar un nuevo docente', 'que pueda recibir cursos y acceder al sistema'),
 10: ('Como administrador', 'editar los datos de un docente', 'mantener su información actualizada'),
 11: ('Como administrador', 'eliminar un docente', 'retirar registros que ya no corresponden'),
 12: ('Como administrador', 'buscar un docente', 'localizarlo rápidamente por nombre, código o especialidad'),
 13: ('Como administrador', 'ver la lista de docentes', 'consultar quiénes están registrados'),
 14: ('Como administrador', 'registrar una nueva asignatura', 'ofrecerla y asignarla a un docente y una sección'),
 15: ('Como administrador', 'editar una asignatura', 'corregir su nombre o su estado'),
 16: ('Como administrador', 'eliminar una asignatura', 'retirar asignaturas que no se utilizan'),
 17: ('Como administrador', 'buscar una asignatura', 'localizarla rápidamente por nombre'),
 18: ('Como administrador', 'ver la lista de asignaturas', 'consultar el catálogo completo'),
 19: ('Como docente', 'registrar una nota de un estudiante de mis cursos', 'dejar constancia de su desempeño en el periodo'),
 20: ('Como docente', 'editar una nota ya registrada', 'corregir errores mientras el periodo siga abierto'),
}

def partir(txt):
    return [p.strip() for p in str(txt).split(';') if p.strip()]

out = []
for i in range(20):
    hu = f'HU-{i+1:03d}'
    cp = ids[i]
    assert cp == f'CP-{i+1:03d}', cp
    como, quiero, para = HIST[i+1]
    n, fechas = sprint_de[hu]
    out.append({
        'id': hu, 'cp': cp,
        'titulo': filas['Funcionalidad'][i],
        'sprint': n, 'fechas': fechas,
        'rol': ROL[i+1], 'vista': VISTA[i+1],
        'como': como, 'quiero': quiero, 'para': para,
        'descripcion': filas['Descripción'][i],
        'precondiciones': filas['Precondiciones'][i],
        'pasos': partir(filas['Pasos de Ejecución'][i]),
        'datos': filas['Datos de entrada'][i],
        'esperado': filas['Resultados Esperados'][i],
        'criterio': filas['Criterios de Aceptación'][i],
        'tecnica': filas['Técnica de Prueba'][i],
        'herramienta': filas['Herramienta'][i],
    })

sprints = [{'n': n, 'fechas': f, 'historias': hs} for n, f, hs in SPRINTS]
js = ('/* Generado desde Casos_de_Prueba-Sistema-Academico.xlsx y Diagrama_PERT. Ver tools/generar-historias.py */\n'
      'window.VN = window.VN || {};\n'
      'VN.HISTORIAS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'
      'VN.SPRINTS = ' + json.dumps(sprints, ensure_ascii=False, indent=1) + ';\n')
open('/home/claude/vitnota/assets/js/data/historias.js', 'w', encoding='utf-8').write(js)
print('ok', len(out))
