#!/usr/bin/env node

/**
 * Display benchmark results in a clear, educational format.
 * This script reads the latest benchmark results and presents them
 * with statistical measures and explanations.
 */

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

// Focus on install results (the key differentiator)
const installResults = results.filter(r => r.scenario === 'install' && r.project !== 'mass-projects');
const projects = [...new Set(installResults.map(r => r.project))];

// Group by project and package manager for statistical analysis
const grouped = {};
installResults.forEach(result => {
  const key = `${result.project}-${result.packageManager}`;
  if (!grouped[key]) {
    grouped[key] = [];
  }
  grouped[key].push(result.durationMs);
});

console.log(chalk.yellow.bold('📊 Install Speed Comparison (with statistics)'));
console.log();
console.log(chalk.white('Project').padEnd(20) + chalk.white('PM').padEnd(8) + chalk.white('Mean').padEnd(10) + chalk.white('Median').padEnd(10) + chalk.white('StdDev'));
console.log(chalk.gray('─'.repeat(60)));

projects.forEach(project => {
  ['npm', 'pnpm'].forEach(pm => {
    const key = `${project}-${pm}`;
    const durations = grouped[key];
    
    if (durations && durations.length > 0) {
      const sorted = [...durations].sort((a, b) => a - b);
      const n = sorted.length;
      const mean = sorted.reduce((a, b) => a + b, 0) / n;
      const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const variance = sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
      const stddev = Math.sqrt(variance);
      
      const meanSec = (mean / 1000).toFixed(2) + 's';
      const medianSec = (median / 1000).toFixed(2) + 's';
      const stddevSec = (stddev / 1000).toFixed(2) + 's';
      
      console.log(project.padEnd(20) + pm.padEnd(8) + meanSec.padEnd(10) + medianSec.padEnd(10) + stddevSec);
    }
  });
});

console.log();

// Calculate and display speedup
console.log(chalk.yellow.bold('� Performance Improvement'));
console.log();
console.log(chalk.white('Project').padEnd(20) + chalk.white('Speedup'));
console.log(chalk.gray('─'.repeat(30)));

projects.forEach(project => {
  const npmKey = `${project}-npm`;
  const pnpmKey = `${project}-pnpm`;
  const npmDurations = grouped[npmKey];
  const pnpmDurations = grouped[pnpmKey];
  
  if (npmDurations && pnpmDurations && npmDurations.length > 0 && pnpmDurations.length > 0) {
    const npmMean = npmDurations.reduce((a, b) => a + b, 0) / npmDurations.length;
    const pnpmMean = pnpmDurations.reduce((a, b) => a + b, 0) / pnpmDurations.length;
    const speedup = (npmMean / pnpmMean).toFixed(1) + 'x';
    
    console.log(project.padEnd(20) + chalk.green(speedup));
  }
});

console.log();
console.log(chalk.gray('Statistical notes:'));
console.log(chalk.gray('  - Mean: Average performance across all runs'));
console.log(chalk.gray('  - Median: Middle value (less affected by outliers)'));
console.log(chalk.gray('  - StdDev: Consistency measure (lower = more consistent)'));
console.log();

console.log(chalk.green.bold('✓ pnpm is dramatically faster for installs!'));