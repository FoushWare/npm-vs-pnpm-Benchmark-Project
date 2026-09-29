#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

const project = process.argv[2];
const scenario = process.argv[3] || 'cold';
const runs = parseInt(process.argv[4]) || 1;

const projectPath = join(process.cwd(), 'projects', project);
const resultsDir = join(process.cwd(), 'results', 'ci');
mkdirSync(resultsDir, { recursive: true });

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           📦 npm CI Benchmark Results                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log(`📁 Project: ${project}`);
console.log(`❄️  Scenario: ${scenario.toUpperCase()}`);
console.log(`🔢 Runs: ${runs}`);
console.log('═══════════════════════════════════════════════════════════════');

const durations = [];

for (let i = 1; i <= runs; i++) {
  console.log(`\n🚀 Run ${i}/${runs}...`);

  if (scenario === 'cold') {
    console.log('   🧹 Cleaning npm cache...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
  }

  console.log('   🧹 Removing node_modules...');
  execSync(`rm -rf ${join(projectPath, 'node_modules')}`, { stdio: 'inherit' });

  console.log('   📦 Installing dependencies with npm ci...');
  const start = Date.now();
  try {
    execSync('npm ci', { cwd: projectPath, stdio: 'inherit' });
    const duration = Date.now() - start;
    durations.push(duration);
    console.log(`   ✅ Run ${i} completed in ${duration}ms`);
  } catch (error) {
    console.log(`   ❌ Run ${i} failed: ${error.message}`);
    console.log(`   ⚠️  Continuing with benchmark to get partial results`);
    // Don't throw error - allow benchmark to continue for partial results
  }
}

const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

const result = {
  packageManager: 'npm',
  project,
  scenario,
  durationMs: avgDuration,
  runs: durations.length,
  individualRuns: durations
};

const resultFile = join(resultsDir, `npm-${project}-${scenario}.json`);
writeFileSync(resultFile, JSON.stringify(result, null, 2));

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📊 RESULTS SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`📦 Package Manager: npm`);
console.log(`📁 Project: ${project}`);
console.log(`❄️  Scenario: ${scenario.toUpperCase()}`);
console.log(`🔢 Runs: ${runs}`);
console.log(`⏱️  Average Time: ${avgDuration.toFixed(0)}ms`);
console.log(`📈 Individual Runs: ${durations.map(d => `${d}ms`).join(', ')}`);

// Visual bar chart
const maxDuration = Math.max(...durations);
const barLength = 40;
durations.forEach((duration, index) => {
  const bar = '█'.repeat(Math.round((duration / maxDuration) * barLength));
  const spaces = ' '.repeat(barLength - Math.round((duration / maxDuration) * barLength));
  console.log(`📊 Run ${index + 1}: [${bar}${spaces}] ${duration}ms`);
});

// Compare with pnpm if results exist
try {
  const pnpmResultFile = join(resultsDir, `pnpm-${project}-${scenario}.json`);
  const pnpmResult = JSON.parse(readFileSync(pnpmResultFile, 'utf8'));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('⚡ COMPARISON WITH PNPM');
  console.log('═══════════════════════════════════════════════════════════════');

  const npmTime = avgDuration;
  const pnpmTime = pnpmResult.durationMs;
  const timeDiff = npmTime - pnpmTime;
  const timeSpeedup = (npmTime / pnpmTime).toFixed(2);
  const timeFaster = ((1 - pnpmTime / npmTime) * 100).toFixed(1);

  console.log(`⏱️  npm:    ${npmTime.toFixed(0)}ms`);
  console.log(`⏱️  pnpm:  ${pnpmTime.toFixed(0)}ms`);

  if (timeDiff > 0) {
    console.log(`🚀 pnpm is ${timeFaster}% faster (${timeSpeedup}x speedup)`);
  } else {
    console.log(`🚀 npm is ${Math.abs(timeFaster)}% faster (${(pnpmTime / npmTime).toFixed(2)}x speedup)`);
  }

  // Visual comparison
  const maxTime = Math.max(npmTime, pnpmTime);
  const npmBar = '█'.repeat(Math.round((npmTime / maxTime) * 30));
  const pnpmBar = '█'.repeat(Math.round((pnpmTime / maxTime) * 30));
  const npmSpaces = ' '.repeat(30 - Math.round((npmTime / maxTime) * 30));
  const pnpmSpaces = ' '.repeat(30 - Math.round((pnpmTime / maxTime) * 30));

  console.log('\n📊 Visual Comparison:');
  console.log(`npm:   [${npmBar}${npmSpaces}] ${npmTime.toFixed(0)}ms`);
  console.log(`pnpm: [${pnpmBar}${pnpmSpaces}] ${pnpmTime.toFixed(0)}ms`);
} catch (error) {
  // pnpm results not available yet
  console.log('\n💡 Run pnpm benchmark to see comparison');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('✅ Benchmark Complete');
console.log(`📁 Result saved to: ${resultFile}`);
console.log('═══════════════════════════════════════════════════════════════');
