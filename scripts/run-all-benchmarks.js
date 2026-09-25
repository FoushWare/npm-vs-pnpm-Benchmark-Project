#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue.bold('=== Running All Benchmarks ==='));
console.log();

// Scenarios to run
const scenarios = ['install', 'build', 'lint'];

for (const scenario of scenarios) {
  console.log(chalk.yellow.bold(`--- ${scenario.toUpperCase()} Benchmark ---`));
  console.log();
  
  try {
    execSync(`node scripts/benchmark.js --scenario ${scenario} --low-memory`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    console.log();
    console.log(chalk.green(`✓ ${scenario} benchmark completed`));
    console.log();
  } catch (error) {
    console.log(chalk.red(`✗ ${scenario} benchmark failed: ${error.message}`));
    console.log();
  }
}

console.log(chalk.blue.bold('=== All Benchmarks Completed ==='));
console.log();
console.log(chalk.yellow('Results saved to: results/raw/'));
console.log(chalk.yellow('Generate reports with: npm run benchmark:report'));