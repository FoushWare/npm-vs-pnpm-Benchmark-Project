#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.cyan.bold('🚀 COMPLETE BENCHMARK - ALL PROJECTS & SCENARIOS'));
console.log(chalk.cyan.bold('═'.repeat(60)));
console.log();

// Step 1: Clean everything
console.log(chalk.blue.bold('Step 1: Clean Everything'));
console.log(chalk.gray('─────────────────────────────────────────────'));
try {
  execSync('npm run clean:all', { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.red('❌ Clean failed'));
}
console.log();

// Step 2: Cold install benchmark
console.log(chalk.blue.bold('Step 2: Cold Install Benchmark'));
console.log(chalk.gray('─────────────────────────────────────────────'));
try {
  execSync('npm run benchmark:all:cold', { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.red('❌ Cold benchmark failed'));
}
console.log();

// Step 3: Warm cache benchmark
console.log(chalk.blue.bold('Step 3: Warm Cache Benchmark'));
console.log(chalk.gray('─────────────────────────────────────────────'));
try {
  execSync('npm run benchmark:all:warm', { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.red('❌ Warm benchmark failed'));
}
console.log();

// Step 4: Disk usage
console.log(chalk.blue.bold('Step 4: Disk Usage'));
console.log(chalk.gray('─────────────────────────────────────────────'));
try {
  execSync('npm run benchmark:disk', { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.red('❌ Disk check failed'));
}
console.log();

// Step 5: Launch live charts
console.log(chalk.blue.bold('Step 5: Launch Live Charts'));
console.log(chalk.gray('─────────────────────────────────────────────'));
console.log(chalk.green('✅ All benchmarks complete!'));
console.log(chalk.cyan('🌐 Starting live server with charts...'));
console.log();

try {
  // Kill any existing process on port 8080
  try {
    execSync('lsof -ti:8080 | xargs kill -9 2>/dev/null || true', { stdio: 'ignore' });
  } catch (error) {
    // Ignore if no process found
  }
  
  execSync('npm run charts:live', { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.red('❌ Live server failed'));
  console.log(chalk.gray('Run: npm run charts:live to start the server manually'));
}
