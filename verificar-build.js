/**
 * Script para verificar que el build está listo para producción
 * Verifica que las variables de entorno estén configuradas correctamente
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verificando configuración de build...\n');

let errores = [];
let advertencias = [];

// 1. Verificar que existe el archivo .env.example
console.log('📋 Verificando .env.example...');
if (!existsSync(join(__dirname, '.env.example'))) {
  advertencias.push('⚠️  No existe .env.example (recomendado para documentación)');
} else {
  console.log('   ✅ .env.example encontrado\n');
}

// 2. Verificar que .env está en .gitignore
console.log('🔒 Verificando .gitignore...');
if (existsSync(join(__dirname, '.gitignore'))) {
  const gitignore = readFileSync(join(__dirname, '.gitignore'), 'utf-8');
  if (gitignore.includes('.env')) {
    console.log('   ✅ .env está en .gitignore\n');
  } else {
    errores.push('❌ .env NO está en .gitignore - PELIGRO: podrías subir secretos a git');
  }
} else {
  errores.push('❌ No existe archivo .gitignore');
}

// 3. Verificar configuración de Vite
console.log('⚙️  Verificando vite.config.js...');
if (existsSync(join(__dirname, 'vite.config.js'))) {
  const viteConfig = readFileSync(join(__dirname, 'vite.config.js'), 'utf-8');
  console.log('   ✅ vite.config.js encontrado\n');
} else {
  errores.push('❌ No existe vite.config.js');
}

// 4. Verificar package.json scripts
console.log('📦 Verificando package.json...');
if (existsSync(join(__dirname, 'package.json'))) {
  const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
  
  if (pkg.scripts && pkg.scripts.build) {
    console.log('   ✅ Script "build" configurado:', pkg.scripts.build);
  } else {
    errores.push('❌ No existe script "build" en package.json');
  }
  
  // Verificar dependencias críticas
  const depsCriticas = ['react', 'react-dom', '@supabase/supabase-js', 'vite'];
  depsCriticas.forEach(dep => {
    if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
      console.log(`   ✅ ${dep} instalado`);
    } else {
      errores.push(`❌ Falta dependencia crítica: ${dep}`);
    }
  });
  console.log('');
} else {
  errores.push('❌ No existe package.json');
}

// 5. Verificar que existe el directorio dist después del build
console.log('🏗️  Verificando build...');
if (existsSync(join(__dirname, 'dist'))) {
  console.log('   ✅ Directorio dist/ encontrado');
  
  // Verificar que existen archivos críticos
  const archivosCriticos = ['index.html'];
  archivosCriticos.forEach(archivo => {
    if (existsSync(join(__dirname, 'dist', archivo))) {
      console.log(`   ✅ dist/${archivo} encontrado`);
    } else {
      advertencias.push(`⚠️  dist/${archivo} no encontrado`);
    }
  });
  console.log('');
} else {
  advertencias.push('⚠️  Directorio dist/ no encontrado - ejecuta "npm run build" primero');
}

// 6. Verificar configuración de Supabase
console.log('🔌 Verificando configuración de Supabase...');
if (existsSync(join(__dirname, 'src', 'api', 'supabase.js'))) {
  const supabaseConfig = readFileSync(join(__dirname, 'src', 'api', 'supabase.js'), 'utf-8');
  
  if (supabaseConfig.includes('import.meta.env.VITE_SUPABASE_URL')) {
    console.log('   ✅ Usa import.meta.env.VITE_SUPABASE_URL');
  } else {
    errores.push('❌ No usa import.meta.env.VITE_SUPABASE_URL');
  }
  
  if (supabaseConfig.includes('import.meta.env.VITE_SUPABASE_ANON_KEY')) {
    console.log('   ✅ Usa import.meta.env.VITE_SUPABASE_ANON_KEY');
  } else {
    errores.push('❌ No usa import.meta.env.VITE_SUPABASE_ANON_KEY');
  }
  
  if (supabaseConfig.includes('throw new Error') && supabaseConfig.includes('VITE_SUPABASE_URL is required')) {
    console.log('   ✅ Valida variables de entorno requeridas');
  } else {
    advertencias.push('⚠️  No valida variables de entorno requeridas');
  }
  console.log('');
} else {
  errores.push('❌ No existe src/api/supabase.js');
}

// Resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(60) + '\n');

if (errores.length === 0 && advertencias.length === 0) {
  console.log('✅ ¡TODO ESTÁ CORRECTO!');
  console.log('\n🚀 Tu proyecto está listo para desplegar en Cloudflare Pages\n');
  console.log('Pasos siguientes:');
  console.log('1. Ejecuta: npm run build');
  console.log('2. Ve a https://dash.cloudflare.com/');
  console.log('3. Crea un nuevo proyecto Pages');
  console.log('4. Configura las variables de entorno:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - VITE_SUPABASE_ANON_KEY');
  console.log('5. Despliega tu aplicación\n');
} else {
  if (errores.length > 0) {
    console.log('❌ ERRORES CRÍTICOS:\n');
    errores.forEach(error => console.log('  ' + error));
    console.log('');
  }
  
  if (advertencias.length > 0) {
    console.log('⚠️  ADVERTENCIAS:\n');
    advertencias.forEach(adv => console.log('  ' + adv));
    console.log('');
  }
  
  if (errores.length > 0) {
    console.log('❌ Corrige los errores antes de desplegar\n');
    process.exit(1);
  } else {
    console.log('⚠️  Hay advertencias, pero puedes desplegar\n');
  }
}

console.log('📚 Para más información, revisa:');
console.log('   - DESPLIEGUE_CLOUDFLARE_PAGES.md');
console.log('   - GUIA_DESPLIEGUE_CLOUDFLARE.md\n');

