#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

const projects = ['small-app', 'medium-app', 'react-app', 'next-app', 'node-api', 'legacy-app'];
const runs = 3;

console.log(chalk.blue.bold('❄️  COLD INSTALL BENCHMARK - ALL PROJECTS'));
console.log(chalk.blue.bold('═'.repeat(60)));
console.log();

for (const project of projects) {
  console.log(chalk.yellow(`\n📦 Testing ${project}...`));
  
  try {
    console.log(chalk.gray(`   npm run benchmark:cold:npm -- ${project} --runs ${runs}`));
    execSync(`npm run benchmark:cold:npm -- ${project} --runs ${runs}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red(`   ❌ npm cold failed for ${project}`));
  }
  
  try {
    console.log(chalk.gray(`   npm run benchmark:cold:pnpm -- ${project} --runs ${runs}`));
    execSync(`npm run benchmark:cold:pnpm -- ${project} --runs ${runs}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red(`   ❌ pnpm cold failed for ${project}`));
  }
}

// Test monorepo with pnpm only
console.log(chalk.yellow(`\n📦 Testing monorepo (pnpm only)...`));
try {
  console.log(chalk.gray(`   npm run benchmark:cold:pnpm -- monorepo --runs ${runs}`));
  execSync(`npm run benchmark:cold:pnpm -- monorepo --runs ${runs}`, { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.red(`   ❌ pnpm cold failed for monorepo`));
}

console.log();
console.log(chalk.green.bold('✅ COLD INSTALL BENCHMARK COMPLETE'));
console.log(chalk.gray('Run: npm run benchmark:all-warm to test warm cache'));
console.log(chalk.gray('Run: npm run benchmark:all to test everything'));
