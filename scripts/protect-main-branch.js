#!/usr/bin/env node

/**
 * Script para implementar protecciones en la rama main
 * 
 * Este script configura un hook pre-push personalizado que evitará empujar cambios
 * directamente a la rama main si no provienen de ramas de tipo release/ o hotfix/
 */

const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process');

const hookContent = `#!/usr/bin/env node

// Pre-push hook para proteger la rama main
const { execSync } = require('child_process');

try {
  // Obtener la rama actual y la rama de destino
  const push = process.env.GIT_PUSH_OPTION_COUNT ? process.env.GIT_PUSH_OPTION_0 : '';
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  
  // Si estamos intentando empujar a main directamente desde una rama que no es release/ o hotfix/
  if (currentBranch === 'main' || (push && push.includes('main'))) {
    if (!currentBranch.startsWith('release/') && !currentBranch.startsWith('hotfix/')) {
      console.error('\\x1b[31mERROR: No se pueden empujar cambios directamente a la rama main.\\x1b[0m');
      console.error('\\x1b[33mSolo se permiten integraciones desde ramas release/ o hotfix/.\\x1b[0m');
      console.error('\\x1b[33mPor favor, usa el flujo de trabajo adecuado:\\x1b[0m');
      console.error('  1. Para nuevas características: feature → develop → release → main');
      console.error('  2. Para correcciones urgentes: hotfix → main (y luego a develop)');
      process.exit(1);
    }
  }
  
  process.exit(0);
} catch (error) {
  console.error('\\x1b[31mError en el hook pre-push: ' + error.message + '\\x1b[0m');
  process.exit(1);
}
`;

try {
  // Crear directorio .git/hooks si no existe
  const gitDir = path.join(process.cwd(), '.git');
  const hooksDir = path.join(gitDir, 'hooks');
  
  if (!fs.existsSync(gitDir)) {
    console.error('\x1b[31mERROR: No se encontró el directorio .git\x1b[0m');
    process.exit(1);
  }
  
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  // Escribir el hook pre-push
  const hookPath = path.join(hooksDir, 'pre-push');
  fs.writeFileSync(hookPath, hookContent);
  
  // Hacer el hook ejecutable
  fs.chmodSync(hookPath, '755');
  
  console.log('\x1b[32mProtección de rama main configurada exitosamente\x1b[0m');
  console.log('\x1b[33mAhora la rama main solo aceptará cambios desde ramas release/ y hotfix/\x1b[0m');
} catch (error) {
  console.error('\x1b[31mERROR al configurar la protección: ' + error.message + '\x1b[0m');
  process.exit(1);
}
