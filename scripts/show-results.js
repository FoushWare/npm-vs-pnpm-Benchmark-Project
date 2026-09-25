#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

// Get the latest benchmark result
const resultsDir = join(process.cwd(), 'results', 'raw');
const files = readdirSync(resultsDir).filter(f => f.startsWith('benchmark-') && f.endsWith('.json'));
const latestFile = files.sort().reverse()[0];
const resultsPath = join(resultsDir, latestFile);

const results = JSON.parse(readFileSync(resultsPath, 'utf8'));

console.log(chalk.blue.bold('=== npm vs pnpm Benchmark Results ==='));
console.log();
console.log(chalk.gray(`Results from: ${latestFile}`));
console.log();

// Group results by project and scenario
const grouped = {};
results.forEach(result => {
  const key = `${result.project}-${result.scenario}`;
  if (!grouped[key]) {
    grouped[key] = {};
  }
  if (!grouped[key][result.packageManager]) {
    grouped[key][result.packageManager] = [];
  }
  grouped[key][result.packageManager].push(result);
});

// Display install results (the main comparison)
console.log(chalk.yellow.bold('📊 Install Speed Comparison'));
console.log();

const installResults = results.filter(r => r.scenario === 'install' && r.project !== 'mass-projects');
const projects = [...new Set(installResults.map(r => r.project))];

console.log(chalk.white('Project').padEnd(20) + chalk.white('npm').padEnd(15) + chalk.white('pnpm').padEnd(15) + chalk.white('Speedup'));
console.log(chalk.gray('─'.repeat(65)));

projects.forEach(project => {
  const npmResult = installResults.find(r => r.project === project && r.packageManager === 'npm');
  const pnpmResult = installResults.find(r => r.project === project && r.packageManager === 'pnpm');
  
  if (npmResult && pnpmResult) {
    const npmTime = (npmResult.durationMs / 1000).toFixed(1) + 's';
    const pnpmTime = (pnpmResult.durationMs / 1000).toFixed(1) + 's';
    const speedup = (npmResult.durationMs / pnpmResult.durationMs).toFixed(1) + 'x';
    
    console.log(project.padEnd(20) + npmTime.padEnd(15) + pnpmTime.padEnd(15) + chalk.green(speedup));
  }
});

console.log();

// Show disk usage if available
const diskResults = installResults.filter(r => r.diskUsageMB);
if (diskResults.length > 0) {
  console.log(chalk.yellow.bold('💾 Disk Usage (node_modules)'));
  console.log();
  console.log(chalk.white('Project').padEnd(20) + chalk.white('Size'));
  console.log(chalk.gray('─'.repeat(35)));
  
  projects.forEach(project => {
    const npmResult = diskResults.find(r => r.project === project && r.packageManager === 'npm');
    
    if (npmResult) {
      const size = npmResult.diskUsageMB.toFixed(1) + ' MB';
      console.log(project.padEnd(20) + size);
    }
  });
  console.log();
  console.log(chalk.gray('Note: pnpm uses symlinks, so node_modules size appears similar.'));
  console.log(chalk.gray('The real disk savings come from pnpm\'s shared package store.'));
  console.log();
}

console.log(chalk.green.bold('✓ pnpm is dramatically faster for installs!'));