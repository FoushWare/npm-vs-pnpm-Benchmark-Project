#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const project = process.argv[2];
const scenario = process.argv[3] || 'cold';
const runs = parseInt(process.argv[4]) || 1;

const projectPath = join(process.cwd(), 'projects', project);
const resultsDir = join(process.cwd(), 'results', 'ci');
mkdirSync(resultsDir, { recursive: true });

console.log(`pnpm CI Benchmark: ${project} - ${scenario}`);
console.log('═'.repeat(60));

const durations = [];

for (let i = 1; i <= runs; i++) {
  console.log(`\nRun ${i}/${runs}...`);
  
  if (scenario === 'cold') {
    execSync('pnpm store prune', { stdio: 'inherit' });
  }
  
  execSync(`rm -rf ${join(projectPath, 'node_modules')}`, { stdio: 'inherit' });
  
  const start = Date.now();
  try {
    execSync('pnpm install --frozen-lockfile', { cwd: projectPath, stdio: 'inherit' });
    const duration = Date.now() - start;
    durations.push(duration);
    console.log(`✅ Run ${i}: ${duration}ms`);
  } catch (error) {
    console.log(`❌ Run ${i} failed: ${error.message}`);
    throw error; // Fail fast in CI - real CI behavior
  }
}

const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

const result = {
  packageManager: 'pnpm',
  project,
  scenario,
  durationMs: avgDuration,
  runs: durations.length,
  individualRuns: durations
};

const resultFile = join(resultsDir, `pnpm-${project}-${scenario}.json`);
writeFileSync(resultFile, JSON.stringify(result, null, 2));

console.log('\n✅ Benchmark complete');
console.log(`Average: ${avgDuration.toFixed(0)}ms`);
console.log(`Result saved to: ${resultFile}`);
