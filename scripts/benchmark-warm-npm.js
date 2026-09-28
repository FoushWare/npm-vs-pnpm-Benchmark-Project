#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { saveResult, loadResult } from './save-result.js';

const program = new Command();

program
  .argument('[project]', 'Project to test (small-app, medium-app, react-app, next-app, node-api, monorepo, legacy-app)', 'small-app')
  .option('--runs <number>', 'Number of runs', '3')
  .parse(process.argv);

const [project] = program.args;
const { runs } = program.opts();

const projectPath = join(process.cwd(), 'projects', project);

// Skip monorepo for npm due to workspace limitations
if (project === 'monorepo') {
  console.log(chalk.yellow.bold('🔥 WARM CACHE BENCHMARK - npm'));
  console.log(chalk.yellow.bold('═'.repeat(60)));
  console.log(chalk.yellow(`📁 Project: ${project}`));
  console.log(chalk.yellow.bold('═'.repeat(60)));
  console.log(chalk.red('⚠️  Skipping monorepo for npm'));
  console.log(chalk.gray('   This monorepo configuration has workspace limitations with npm.'));
  console.log(chalk.gray('   pnpm handles this configuration successfully.'));
  console.log(chalk.gray('   Run: npm run benchmark:warm:pnpm -- monorepo'));
  console.log();
  process.exit(0);
}

console.log(chalk.yellow.bold('🔥 WARM CACHE BENCHMARK - npm'));
console.log(chalk.yellow.bold('═'.repeat(60)));
console.log(chalk.yellow(`📁 Project: ${project}`));
console.log(chalk.yellow(`🔢 Runs: ${runs}`));
console.log(chalk.yellow.bold('═'.repeat(60)));
console.log(chalk.gray('Note: Cache kept from previous installs, node_modules removed'));
console.log();

const durations = [];
let totalDiskMB = 0;

for (let i = 1; i <= runs; i++) {
  console.log(chalk.yellow(`\n📦 Run ${i}/${runs}...`));
  console.log(chalk.gray('   🧹 Cleaning node_modules (keeping cache and lockfile)...'));

  const nodeModulesPath = join(projectPath, 'node_modules');
  const packageLockPath = join(projectPath, 'package-lock.json');

  if (existsSync(nodeModulesPath)) {
    rmSync(nodeModulesPath, { recursive: true, force: true });
  }

  console.log(chalk.gray('   ✅ Clean state ready'));

  // Use npm ci if lockfile exists, otherwise npm install
  // Fall back to npm install if npm ci fails (common with workspaces)
  let command = 'npm install';
  if (existsSync(packageLockPath)) {
    console.log(chalk.gray('   📦 Running npm ci (with frozen lockfile)...'));
    command = 'npm ci';
  } else {
    console.log(chalk.gray('   📦 Running npm install (generating lockfile)...'));
  }

  const start = Date.now();
  try {
    execSync(command, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
    const duration = Date.now() - start;
    durations.push(duration);
    console.log(chalk.green(`   ✅ Run ${i}: ${duration}ms`));

    // Measure disk usage
    const duResult = execSync(`du -sk ${join(projectPath, 'node_modules')}`, { encoding: 'utf8' });
    const diskKB = parseInt(duResult.trim().split('\t')[0]);
    const diskMB = (diskKB / 1024).toFixed(1);
    totalDiskMB = parseFloat(diskMB);
    console.log(chalk.gray(`   💾 Disk: ${diskMB}MB`));
  } catch (error) {
    // If npm ci fails, try npm install as fallback
    if (command === 'npm ci') {
      console.log(chalk.yellow(`   ⚠️  npm ci failed, trying npm install...`));
      try {
        const start2 = Date.now();
        execSync('npm install', { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
        const duration = Date.now() - start2;
        durations.push(duration);
        console.log(chalk.green(`   ✅ Run ${i}: ${duration}ms (npm install)`));

        // Measure disk usage
        const duResult = execSync(`du -sk ${join(projectPath, 'node_modules')}`, { encoding: 'utf8' });
        const diskKB = parseInt(duResult.trim().split('\t')[0]);
        const diskMB = (diskKB / 1024).toFixed(1);
        totalDiskMB = parseFloat(diskMB);
        console.log(chalk.gray(`   💾 Disk: ${diskMB}MB`));
      } catch (error2) {
        console.log(chalk.red(`   ❌ Run ${i} failed: ${error2.message}`));
      }
    } else {
      console.log(chalk.red(`   ❌ Run ${i} failed: ${error.message}`));
    }
  }
}

// Calculate average
const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

// Save result
saveResult(project, 'npm', 'warm', avgDuration, totalDiskMB);

console.log();
console.log(chalk.green.bold('✅ WARM CACHE BENCHMARK COMPLETE'));
console.log(chalk.yellow.bold('═'.repeat(60)));

// Show summary
console.log();
console.log(chalk.yellow.bold('📊 RESULT SUMMARY'));
console.log(chalk.yellow.bold('═'.repeat(60)));
console.log(chalk.white(`📦 Package Manager: npm`));
console.log(chalk.white(`📁 Project: ${project}`));
console.log(chalk.white(`🔥 Scenario: Warm Cache`));
console.log(chalk.white(`🔢 Runs: ${runs}`));
console.log(chalk.white(`⏱️  Average Time: ${avgDuration}ms`));
console.log(chalk.white(`💾 Disk Usage: ${totalDiskMB}MB`));

// Load pnpm result for comparison
const pnpmResult = loadResult(project, 'pnpm', 'warm');
if (pnpmResult) {
  console.log();
  console.log(chalk.cyan.bold('⚡ COMPARISON WITH PNPM'));
  console.log(chalk.cyan.bold('═'.repeat(60)));

  const npmTime = avgDuration;
  const pnpmTime = pnpmResult.durationMs;
  const npmDisk = totalDiskMB;
  const pnpmDisk = pnpmResult.diskUsageMB;

  const timeDiff = npmTime - pnpmTime;
  const timeSpeedup = (npmTime / pnpmTime).toFixed(2);
  const timeFaster = ((1 - pnpmTime / npmTime) * 100).toFixed(1);

  const diskDiff = npmDisk - pnpmDisk;
  const diskSavings = ((1 - pnpmDisk / npmDisk) * 100).toFixed(1);

  console.log();
  console.log(chalk.white('⏱️  Install Time:'));
  console.log(chalk.red(`   npm: ${npmTime}ms`));
  console.log(chalk.blue(`   pnpm: ${pnpmTime}ms`));
  if (timeDiff > 0) {
    console.log(chalk.green(`   🚀 pnpm is ${timeFaster}% faster (${timeSpeedup}x)`));
  } else {
    console.log(chalk.green(`   🚀 npm is ${Math.abs(timeFaster)}% faster (${(pnpmTime / npmTime).toFixed(2)}x)`));
  }

  console.log();
  console.log(chalk.white('💾 Disk Usage:'));
  console.log(chalk.red(`   npm: ${npmDisk}MB`));
  console.log(chalk.blue(`   pnpm: ${pnpmDisk}MB`));
  if (diskDiff > 0) {
    console.log(chalk.green(`   💰 pnpm saves ${diskSavings}% disk space`));
  } else {
    console.log(chalk.green(`   💰 npm saves ${Math.abs(diskSavings)}% disk space`));
  }

  // Simple bar chart
  console.log();
  console.log(chalk.white('📊 Visual Comparison:'));
  const maxTime = Math.max(npmTime, pnpmTime);
  const npmBar = Math.round((npmTime / maxTime) * 30);
  const pnpmBar = Math.round((pnpmTime / maxTime) * 30);

  console.log(chalk.red(`   npm: ${'█'.repeat(npmBar)}${'░'.repeat(30 - npmBar)} ${npmTime}ms`));
  console.log(chalk.blue(`   pnpm: ${'█'.repeat(pnpmBar)}${'░'.repeat(30 - pnpmBar)} ${pnpmTime}ms`));

  const maxDisk = Math.max(npmDisk, pnpmDisk);
  const npmDiskBar = Math.round((npmDisk / maxDisk) * 30);
  const pnpmDiskBar = Math.round((pnpmDisk / maxDisk) * 30);

  console.log(chalk.red(`   npm: ${'█'.repeat(npmDiskBar)}${'░'.repeat(30 - npmDiskBar)} ${npmDisk}MB`));
  console.log(chalk.blue(`   pnpm: ${'█'.repeat(pnpmDiskBar)}${'░'.repeat(30 - pnpmDiskBar)} ${pnpmDisk}MB`));
} else {
  console.log();
  console.log(chalk.gray('💡 Run pnpm warm cache benchmark to see comparison'));
}

console.log();
console.log(chalk.yellow.bold('═'.repeat(60)));

