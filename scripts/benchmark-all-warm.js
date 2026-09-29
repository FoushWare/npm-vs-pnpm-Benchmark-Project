#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';

const program = new Command();

program
  .option('--low-memory', 'Run in low-memory mode (1 run instead of 3, reduced projects)')
  .parse(process.argv);

const { lowMemory } = program.opts();

// In low-memory mode, test fewer projects
const allProjects = ['small-app', 'medium-app', 'react-app', 'next-app', 'node-api', 'legacy-app'];
const projects = lowMemory ? ['small-app', 'medium-app', 'react-app'] : allProjects;
const runs = lowMemory ? 1 : 3;

console.log(chalk.yellow.bold('🔥 WARM CACHE BENCHMARK - ALL PROJECTS'));
console.log(chalk.yellow.bold('═'.repeat(60)));
if (lowMemory) {
  console.log(chalk.yellow('⚡ Low Memory Mode: 1 run per project, reduced project set'));
}
console.log();

// Memory cleanup function
const cleanupMemory = () => {
  if (global.gc) {
    global.gc();
  }
};

for (const project of projects) {
  console.log(chalk.yellow(`\n📦 Testing ${project}...`));

  try {
    console.log(chalk.gray(`   npm run benchmark:warm:npm -- ${project} --runs ${runs}`));
    execSync(`npm run benchmark:warm:npm -- ${project} --runs ${runs}`, { stdio: 'inherit' });
    cleanupMemory();
  } catch (error) {
    console.log(chalk.red(`   ❌ npm warm failed for ${project}`));
  }

  try {
    console.log(chalk.gray(`   npm run benchmark:warm:pnpm -- ${project} --runs ${runs}`));
    execSync(`npm run benchmark:warm:pnpm -- ${project} --runs ${runs}`, { stdio: 'inherit' });
    cleanupMemory();
  } catch (error) {
    console.log(chalk.red(`   ❌ pnpm warm failed for ${project}`));
  }
}

// Test monorepo with pnpm only (skip in low-memory mode)
if (!lowMemory) {
  console.log(chalk.yellow(`\n📦 Testing monorepo (pnpm only)...`));
  try {
    console.log(chalk.gray(`   npm run benchmark:warm:pnpm -- monorepo --runs ${runs}`));
    execSync(`npm run benchmark:warm:pnpm -- monorepo --runs ${runs}`, { stdio: 'inherit' });
    cleanupMemory();
  } catch (error) {
    console.log(chalk.red(`   ❌ pnpm warm failed for monorepo`));
  }
}

console.log();
console.log(chalk.green.bold('✅ WARM CACHE BENCHMARK COMPLETE'));
console.log(chalk.gray('Run: npm run benchmark:disk to check disk usage'));
console.log(chalk.gray('Run: npm run benchmark:all to test everything'));
