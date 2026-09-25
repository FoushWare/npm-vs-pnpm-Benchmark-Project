#!/usr/bin/env node

/**
 * Simple wrapper to run the install benchmark and show results.
 * This provides an easy entry point for students and users.
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue.bold('=== Running npm vs pnpm Install Benchmark ==='));
console.log();
console.log(chalk.gray('This benchmark measures install speed, which is the key'));
console.log(chalk.gray('differentiator between npm and pnpm due to their different'));
console.log(chalk.gray('package storage strategies.'));
console.log();

try {
  execSync(`node scripts/benchmark.js --low-memory`, {
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
console.log(chalk.yellow('Showing results...'));
console.log();

// Show the results
try {
  execSync(`node scripts/show-results.js`, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
} catch (error) {
  console.log(chalk.red(`Could not show results: ${error.message}`));
}