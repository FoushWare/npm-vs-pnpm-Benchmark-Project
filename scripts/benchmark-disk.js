#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import { join } from 'path';

const projects = ['small-app', 'medium-app', 'react-app', 'next-app', 'node-api', 'monorepo', 'legacy-app'];

console.log(chalk.cyan.bold('💾 DISK USAGE MEASUREMENT'));
console.log(chalk.cyan.bold('═'.repeat(60)));
console.log(chalk.gray('Note: Shows disk usage for all projects'));
console.log(chalk.gray('For detailed disk comparison, run: npm run benchmark'));
console.log();

projects.forEach(project => {
  const projectPath = join(process.cwd(), 'projects', project);
  const nodeModulesPath = join(projectPath, 'node_modules');

  console.log(chalk.yellow(`📁 ${project}`));

  // npm disk usage
  try {
    const npmDu = execSync(`du -sh ${join(projectPath, 'node_modules')}`, { encoding: 'utf8' });
    console.log(chalk.gray(`   npm node_modules: ${npmDu.trim()}`));
  } catch (error) {
    console.log(chalk.gray(`   npm node_modules: Not installed`));
  }

  // pnpm disk usage
  try {
    const pnpmDu = execSync(`du -sh ${join(projectPath, 'node_modules')}`, { encoding: 'utf8' });
    console.log(chalk.gray(`   pnpm node_modules: ${pnpmDu.trim()}`));
  } catch (error) {
    console.log(chalk.gray(`   pnpm node_modules: Not installed`));
  }

  // pnpm store size
  try {
    const storePath = execSync('pnpm store path', { encoding: 'utf8' }).trim();
    const storeDu = execSync(`du -sh ${storePath}`, { encoding: 'utf8' });
    console.log(chalk.gray(`   pnpm store: ${storeDu.trim()}`));
  } catch (error) {
    console.log(chalk.gray(`   pnpm store: Not available`));
  }

  console.log();
});

console.log(chalk.green.bold('✅ DISK USAGE MEASUREMENT COMPLETE'));
console.log(chalk.cyan.bold('═'.repeat(60)));
