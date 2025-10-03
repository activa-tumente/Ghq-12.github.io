/**
 * Script de prueba para verificar el mapeo de roles a áreas macro
 * Sistema de Evaluación Psicológica BAT-7
 */

// Función de mapeo (copiada de dashboardApi.js)
const mapRoleToMacroArea = (role) => {
  if (!role || typeof role !== 'string') return 'Sin especificar';
  
  const roleUpper = role.toUpperCase().trim();

  // Administración y Recursos Humanos
  if (roleUpper.includes('ADMINISTRACIÓN') || roleUpper.includes('ADMINISTRADOR') || 
      roleUpper.includes('RRHH') || roleUpper.includes('RECURSOS HUMANOS') || 
      roleUpper.includes('FINANZAS') || roleUpper.includes('CONTABILIDAD') ||
      roleUpper.includes('ASISTENTE ADMINISTRATIVO') || roleUpper.includes('SECRETARIA') ||
      roleUpper.includes('TESORERÍA') || roleUpper.includes('NÓMINA')) {
    return 'Administración y Recursos Humanos';
  }
  
  // Ingeniería y Proyectos
  if (roleUpper.includes('INGENIERO') || roleUpper.includes('INGENIERÍA') || 
      roleUpper.includes('PROYECTOS') || roleUpper.includes('COORDINADOR DE ÁREA') ||
      roleUpper.includes('DISEÑO') || roleUpper.includes('PLANIFICACIÓN') ||
      roleUpper.includes('DESARROLLO') || roleUpper.includes('TÉCNICO ESPECIALISTA')) {
    return 'Ingeniería y Proyectos';
  }
  
  // Operaciones y Mantenimiento
  if (roleUpper.includes('OPERACIÓN') || roleUpper.includes('OPERADOR') || 
      roleUpper.includes('MANTENIMIENTO') || roleUpper.includes('MECÁNICO') ||
      roleUpper.includes('ELECTRICISTA') || roleUpper.includes('AYUDANTE DE MÁQUINA') ||
      roleUpper.includes('SOLDADOR') || roleUpper.includes('TÉCNICO DE MANTENIMIENTO') ||
      roleUpper.includes('SUPERVISOR DE OPERACIONES') || roleUpper.includes('PRODUCCIÓN')) {
    return 'Operaciones y Mantenimiento';
  }

  // Seguridad, Salud y Medio Ambiente (HSE)
  if (roleUpper.includes('SEGURIDAD') || roleUpper.includes('HSE') || 
      roleUpper.includes('SALUD OCUPACIONAL') || roleUpper.includes('MEDIO AMBIENTE') ||
      roleUpper.includes('PREVENCIONISTA') || roleUpper.includes('INSPECTOR DE SEGURIDAD') ||
      roleUpper.includes('COORDINADOR DE SEGURIDAD') || roleUpper.includes('HIGIENE INDUSTRIAL')) {
    return 'Seguridad, Salud y Medio Ambiente (HSE)';
  }

  // Logística y Suministros
  if (roleUpper.includes('LOGÍSTICA') || roleUpper.includes('SUMINISTROS') || 
      roleUpper.includes('ALMACÉN') || roleUpper.includes('INVENTARIO') ||
      roleUpper.includes('COMPRAS') || roleUpper.includes('PROCUREMENT') ||
      roleUpper.includes('BODEGA') || roleUpper.includes('DISTRIBUCIÓN')) {
    return 'Logística y Suministros';
  }

  // Servicios y Soporte
  if (roleUpper.includes('VIGILANTE') || roleUpper.includes('CHOFER') || 
      roleUpper.includes('SERVICIOS') || roleUpper.includes('LIMPIEZA') ||
      roleUpper.includes('JARDINERÍA') || roleUpper.includes('COCINA') ||
      roleUpper.includes('MENSAJERÍA') || roleUpper.includes('RECEPCIÓN') ||
      roleUpper.includes('PORTERÍA') || roleUpper.includes('TRANSPORTE')) {
    return 'Servicios y Soporte';
  }

  // Calidad y Control
  if (roleUpper.includes('CALIDAD') || roleUpper.includes('CONTROL') || 
      roleUpper.includes('INSPECTOR') || roleUpper.includes('AUDITOR') ||
      roleUpper.includes('LABORATORIO') || roleUpper.includes('ENSAYOS') ||
      roleUpper.includes('CERTIFICACIÓN') || roleUpper.includes('METROLOGÍA')) {
    return 'Calidad y Control';
  }

  // Gerencia/Dirección
  if (roleUpper.includes('GERENTE') || roleUpper.includes('DIRECTOR') || 
      roleUpper.includes('JEFE') || roleUpper.includes('COORDINADOR GENERAL') ||
      roleUpper.includes('SUPERINTENDENTE') || roleUpper.includes('LÍDER') ||
      roleUpper.includes('SUPERVISOR GENERAL') || roleUpper.includes('EJECUTIVO')) {
    return 'Gerencia/Dirección';
  }
  
  // Si no coincide con ninguna categoría, devolver una categoría por defecto
  return 'Servicios y Soporte'; // Categoría por defecto para roles no clasificados
};

// Roles de ejemplo para probar el mapeo
const rolesEjemplo = [
  'VIGILANTE',
  'ADMINISTRADOR',
  'OPERADOR DE MÁQUINA',
  'INGENIERO DE PROYECTOS',
  'ASISTENTE ADMINISTRATIVO',
  'MECÁNICO',
  'ELECTRICISTA',
  'CHOFER',
  'INSPECTOR DE CALIDAD',
  'GERENTE DE OPERACIONES',
  'COORDINADOR DE SEGURIDAD',
  'TÉCNICO DE MANTENIMIENTO',
  'SUPERVISOR DE PRODUCCIÓN',
  'ANALISTA DE FINANZAS',
  'ESPECIALISTA EN RRHH',
  'ALMACENISTA',
  'SOLDADOR',
  'PREVENCIONISTA',
  'AUDITOR INTERNO',
  'JEFE DE TURNO'
];

// Función para probar el mapeo
export const testRoleMapping = () => {
  console.log('=== PRUEBA DE MAPEO DE ROLES A ÁREAS MACRO ===\n');
  
  const resultados = rolesEjemplo.map(role => ({
    rolOriginal: role,
    areaMacro: mapRoleToMacroArea(role)
  }));

  // Agrupar por área macro
  const agrupados = resultados.reduce((acc, item) => {
    if (!acc[item.areaMacro]) {
      acc[item.areaMacro] = [];
    }
    acc[item.areaMacro].push(item.rolOriginal);
    return acc;
  }, {});

  // Mostrar resultados agrupados
  Object.entries(agrupados).forEach(([area, roles]) => {
    console.log(`📋 ${area}:`);
    roles.forEach(role => console.log(`   • ${role}`));
    console.log('');
  });

  // Estadísticas
  console.log('=== ESTADÍSTICAS ===');
  console.log(`Total de roles probados: ${rolesEjemplo.length}`);
  console.log(`Áreas macro utilizadas: ${Object.keys(agrupados).length}`);
  console.log('Distribución por área:');
  Object.entries(agrupados).forEach(([area, roles]) => {
    console.log(`   ${area}: ${roles.length} roles`);
  });

  return agrupados;
};

// Ejecutar la prueba si se ejecuta directamente
if (typeof window === 'undefined') {
  testRoleMapping();
}

export { mapRoleToMacroArea };
