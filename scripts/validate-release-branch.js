#!/usr/bin/env node

/**
 * Script para validar que se está realizando una integración desde una rama release/
 * Este script previene integraciones no autorizadas a la rama main
 */

const { execSync } = require('child_process');

try {
  // Obtener la rama actual
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  
  // Verificar si estamos en una rama de release
  if (!currentBranch.startsWith('release/')) {
    console.error('\x1b[31mERROR: Solo las ramas de tipo "release/*" pueden ser integradas a main.\x1b[0m');
    console.error('\x1b[33mEstás intentando integrar desde la rama: ' + currentBranch + '\x1b[0m');
    console.error('\x1b[33mPor favor, crea una rama de release usando: pnpm release:prepare\x1b[0m');
    process.exit(1);
  }
  
  // Verificar que la versión en package.json coincide con el nombre de la rama
  const packageVersion = require('../package.json').version;
  const expectedBranchName = `release/${packageVersion}`;
  
  if (currentBranch !== expectedBranchName) {
    console.error('\x1b[31mERROR: El nombre de la rama no coincide con la versión en package.json\x1b[0m');
    console.error(`\x1b[33mRama actual: ${currentBranch}`);
    console.error(`Nombre esperado: ${expectedBranchName}\x1b[0m`);
    console.error('\x1b[33mPor favor, actualiza la versión en package.json con: pnpm version:bump\x1b[0m');
    process.exit(1);
  }
  
  // Verificar que no hay cambios sin commitear
  const status = execSync('git status --porcelain').toString().trim();
  if (status !== '') {
    console.error('\x1b[31mERROR: Hay cambios sin commitear en tu rama\x1b[0m');
    console.error('\x1b[33mPor favor, haz commit de todos los cambios antes de finalizar el release\x1b[0m');
    process.exit(1);
  }
  
  console.log('\x1b[32mValidación exitosa: La rama release está lista para ser integrada a main\x1b[0m');
} catch (error) {
  console.error('\x1b[31mERROR durante la validación: ' + error.message + '\x1b[0m');
  process.exit(1);
}
