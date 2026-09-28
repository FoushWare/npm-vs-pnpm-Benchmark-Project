#!/usr/bin/env node

import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const projects = ['small-app', 'medium-app', 'react-app', 'next-app', 'node-api', 'monorepo', 'legacy-app'];

console.log('🧹 CLEANING ALL CACHES AND NODE_MODULES');
console.log('═'.repeat(60));

// Clear npm cache
console.log('\n📦 Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleared');
} catch (error) {
  console.log('⚠️  npm cache clear failed (may not be critical)');
}

// Clear pnpm cache
console.log('\n📦 Clearing pnpm cache...');
try {
  execSync('pnpm store prune', { stdio: 'inherit' });
  console.log('✅ pnpm cache cleared');
} catch (error) {
  console.log('⚠️  pnpm cache clear failed (may not be critical)');
}

// Clean all projects
console.log('\n📁 Cleaning all projects...');
projects.forEach(project => {
  const projectPath = join(process.cwd(), 'projects', project);
  const nodeModulesPath = join(projectPath, 'node_modules');
  const packageLockPath = join(projectPath, 'package-lock.json');
  const pnpmLockPath = join(projectPath, 'pnpm-lock.yaml');
  const pnpmModulesPath = join(projectPath, '.pnpm');

  if (existsSync(nodeModulesPath)) {
    rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log(`✅ ${project}: node_modules removed`);
  }

  if (existsSync(packageLockPath)) {
    rmSync(packageLockPath, { force: true });
    console.log(`✅ ${project}: package-lock.json removed`);
  }

  if (existsSync(pnpmLockPath)) {
    rmSync(pnpmLockPath, { force: true });
    console.log(`✅ ${project}: pnpm-lock.yaml removed`);
  }

  if (existsSync(pnpmModulesPath)) {
    rmSync(pnpmModulesPath, { recursive: true, force: true });
    console.log(`✅ ${project}: .pnpm directory removed`);
  }
});

console.log('\n✅ All caches and node_modules cleaned!');
console.log('═'.repeat(60));
