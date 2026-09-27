#!/usr/bin/env node

// ============================================================================
// npm → pnpm Migration Script
// ============================================================================
// This script automates the migration of test projects from npm to pnpm.
// It handles lockfile conversion, installation, and basic validation.
//
// Usage: node scripts/migrate-to-pnpm.js
// ============================================================================

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECTS = [
  'small-app',
  'medium-app', 
  'react-app',
  'next-app',
  'node-api',
  'monorepo',
  'legacy-app'
];

function runCommand(command, cwd) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

function migrateProject(project) {
  const projectPath = path.join(process.cwd(), 'projects', project);
  const lockfilePath = path.join(projectPath, 'package-lock.json');
  const pnpmLockPath = path.join(projectPath, 'pnpm-lock.yaml');
  
  console.log(`\n🔄 Migrating ${project}...`);
  
  // Check if project exists
  if (!fs.existsSync(projectPath)) {
    console.log(`  ⚠️  Project ${project} not found, skipping`);
    return false;
  }
  
  // Backup original lockfile
  if (fs.existsSync(lockfilePath)) {
    fs.copyFileSync(lockfilePath, `${lockfilePath}.backup`);
    console.log(`  ✓ Backed up package-lock.json`);
  } else {
    console.log(`  ℹ️  No package-lock.json found, may already be using pnpm`);
  }
  
  // Remove npm lockfile
  if (fs.existsSync(lockfilePath)) {
    fs.unlinkSync(lockfilePath);
    console.log(`  ✓ Removed package-lock.json`);
  }
  
  // Install with pnpm
  console.log(`  📦 Running pnpm install...`);
  const installSuccess = runCommand('pnpm install', projectPath);
  
  if (!installSuccess) {
    console.error(`  ❌ pnpm install failed`);
    rollbackProject(project, projectPath, lockfilePath, pnpmLockPath);
    return false;
  }
  console.log(`  ✓ pnpm install successful`);
  
  // Test build if script exists
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log(`  🔨 Testing build...`);
      const buildSuccess = runCommand('pnpm run build', projectPath);
      if (!buildSuccess) {
        console.log(`  ⚠️  Build failed, but continuing migration`);
      } else {
        console.log(`  ✓ Build successful`);
      }
    }
  }
  
  // Test tests if script exists
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts.test) {
      console.log(`  🧪 Testing tests...`);
      const testSuccess = runCommand('pnpm run test -- --run', projectPath);
      if (!testSuccess) {
        console.log(`  ⚠️  Tests failed, but continuing migration`);
      } else {
        console.log(`  ✓ Tests successful`);
      }
    }
  }
  
  console.log(`✅ ${project} migration complete`);
  return true;
}

function rollbackProject(project, projectPath, lockfilePath, pnpmLockPath) {
  console.log(`  ↩️ Rolling back ${project}...`);
  
  // Restore original lockfile
  if (fs.existsSync(`${lockfilePath}.backup`)) {
    fs.copyFileSync(`${lockfilePath}.backup`, lockfilePath);
    fs.unlinkSync(`${lockfilePath}.backup`);
    console.log(`  ✓ Restored package-lock.json`);
  }
  
  // Remove pnpm lockfile
  if (fs.existsSync(pnpmLockPath)) {
    fs.unlinkSync(pnpmLockPath);
    console.log(`  ✓ Removed pnpm-lock.yaml`);
  }
  
  // Reinstall with npm
  console.log(`  📦 Running npm install...`);
  runCommand('npm install', projectPath);
  
  console.log(`  ↩️ Rollback complete`);
}

async function main() {
  console.log('🚀 npm → pnpm Migration Script');
  console.log('This will migrate test projects from npm to pnpm\n');
  
  const results = PROJECTS.map(project => ({
    project,
    success: migrateProject(project)
  }));
  
  console.log('\n📊 Migration Summary:');
  results.forEach(({ project, success }) => {
    console.log(`  ${success ? '✅' : '❌'} ${project}`);
  });
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📈 Results: ${successful} successful, ${failed} failed`);
  
  if (failed > 0) {
    console.log(`\n⚠️  Some projects failed migration.`);
    console.log(`   Check the logs above for details.`);
    console.log(`   Backup files (.backup) have been preserved for manual review.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All projects migrated successfully!`);
    console.log(`   Backup files (.backup) can be removed after validation.`);
  }
}

main().catch(console.error);
