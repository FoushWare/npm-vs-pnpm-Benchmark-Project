#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue.bold('=== Running npm vs pnpm Benchmark ==='));
console.log();

// Focus on what actually matters: install speed and disk usage
console.log(chalk.yellow.bold('--- Install Speed Benchmark ---'));
console.log();

try {
  execSync(`node scripts/benchmark.js --scenario install --low-memory`, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  console.log();
  console.log(chalk.green('✓ Install benchmark completed'));
  console.log();
} catch (error) {
  console.log(chalk.red(`✗ Install benchmark failed: ${error.message}`));
  console.log();
}

console.log(chalk.blue.bold('=== Benchmark Completed ==='));
console.log();
console.log(chalk.yellow('Results saved to: results/raw/'));
console.log(chalk.yellow('Install speed is the key differentiator between npm and pnpm'));