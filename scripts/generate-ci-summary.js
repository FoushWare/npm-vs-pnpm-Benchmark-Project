#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const resultsDir = process.argv[2] || join(process.cwd(), 'results', 'ci');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           🏆 NPM VS PNPM BENCHMARK COMPARISON                ║');
console.log('║           ACROSS COLD/WARM & APPLICATION TYPES                ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log();

// Read all result files
const files = readdirSync(resultsDir).filter(f => f.endsWith('.json'));
const results = {};

files.forEach(file => {
  try {
    const data = JSON.parse(readFileSync(join(resultsDir, file), 'utf8'));
    const key = `${data.packageManager}-${data.project}-${data.scenario}`;
    results[key] = data;
  } catch (error) {
    // Skip invalid files
  }
});

// Project descriptions
const projectDescriptions = {
  'small-app': 'Vite + TypeScript (minimal)',
  'medium-app': 'Vite + React + TypeScript',
  'react-app': 'Production React/testing ecosystem',
  'next-app': 'Next.js framework',
  'node-api': 'Fastify + TypeScript API',
  'legacy-app': 'Older dependency patterns',
  'monorepo': 'Workspace-style multi-package (pnpm only)'
};

// Group by project
const projects = [...new Set(Object.values(results).map(r => r.project))].sort();

// Application type comparison table
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           📊 APPLICATION TYPE COMPARISON                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log();

projects.forEach(project => {
  const description = projectDescriptions[project] || project;
  console.log(`📁 ${project} - ${description}`);
  console.log('─────────────────────────────────────────────────────────────');

  const npmCold = results[`npm-${project}-cold`];
  const npmWarm = results[`npm-${project}-warm`];
  const pnpmCold = results[`pnpm-${project}-cold`];
  const pnpmWarm = results[`pnpm-${project}-warm`];

  // Cold comparison
  if (npmCold && pnpmCold) {
    const coldFaster = ((1 - pnpmCold.durationMs / npmCold.durationMs) * 100).toFixed(1);
    const coldTimeSaved = (npmCold.durationMs - pnpmCold.durationMs).toFixed(0);

    console.log(`❄️  COLD INSTALL:`);
    console.log(`   npm:   ${npmCold.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: ${pnpmCold.durationMs.toFixed(0)}ms`);
    console.log(`   🚀 pnpm is ${coldFaster}% faster (${coldTimeSaved}ms saved)`);

    // Visual bar
    const maxCold = Math.max(npmCold.durationMs, pnpmCold.durationMs);
    const npmColdBar = '█'.repeat(Math.round((npmCold.durationMs / maxCold) * 25));
    const pnpmColdBar = '█'.repeat(Math.round((pnpmCold.durationMs / maxCold) * 25));
    const npmColdSpaces = ' '.repeat(25 - Math.round((npmCold.durationMs / maxCold) * 25));
    const pnpmColdSpaces = ' '.repeat(25 - Math.round((pnpmCold.durationMs / maxCold) * 25));

    console.log(`   npm:   [${npmColdBar}${npmColdSpaces}] ${npmCold.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: [${pnpmColdBar}${pnpmColdSpaces}] ${pnpmCold.durationMs.toFixed(0)}ms`);
  } else if (pnpmCold) {
    console.log(`❄️  COLD INSTALL (pnpm only):`);
    console.log(`   pnpm: ${pnpmCold.durationMs.toFixed(0)}ms`);
  }

  // Warm comparison
  if (npmWarm && pnpmWarm) {
    const warmFaster = ((1 - pnpmWarm.durationMs / npmWarm.durationMs) * 100).toFixed(1);
    const warmTimeSaved = (npmWarm.durationMs - pnpmWarm.durationMs).toFixed(0);

    console.log();
    console.log(`🔥 WARM CACHE:`);
    console.log(`   npm:   ${npmWarm.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: ${pnpmWarm.durationMs.toFixed(0)}ms`);
    console.log(`   🚀 pnpm is ${warmFaster}% faster (${warmTimeSaved}ms saved)`);

    // Visual bar
    const maxWarm = Math.max(npmWarm.durationMs, pnpmWarm.durationMs);
    const npmWarmBar = '█'.repeat(Math.round((npmWarm.durationMs / maxWarm) * 25));
    const pnpmWarmBar = '█'.repeat(Math.round((pnpmWarm.durationMs / maxWarm) * 25));
    const npmWarmSpaces = ' '.repeat(25 - Math.round((npmWarm.durationMs / maxWarm) * 25));
    const pnpmWarmSpaces = ' '.repeat(25 - Math.round((pnpmWarm.durationMs / maxWarm) * 25));

    console.log(`   npm:   [${npmWarmBar}${npmWarmSpaces}] ${npmWarm.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: [${pnpmWarmBar}${pnpmWarmSpaces}] ${pnpmWarm.durationMs.toFixed(0)}ms`);
  } else if (pnpmWarm) {
    console.log();
    console.log(`🔥 WARM CACHE (pnpm only):`);
    console.log(`   pnpm: ${pnpmWarm.durationMs.toFixed(0)}ms`);
  }

  console.log();
});

// Cold vs Warm comparison for each package manager
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           📈 COLD VS WARM CACHE IMPACT                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log();

console.log('NPM Cache Impact:');
console.log('─────────────────────────────────────────────────────────────');
let npmCacheImprovements = [];
projects.forEach(project => {
  const npmCold = results[`npm-${project}-cold`];
  const npmWarm = results[`npm-${project}-warm`];

  if (npmCold && npmWarm) {
    const improvement = ((1 - npmWarm.durationMs / npmCold.durationMs) * 100).toFixed(1);
    const timeSaved = (npmCold.durationMs - npmWarm.durationMs).toFixed(0);
    npmCacheImprovements.push(parseFloat(improvement));

    console.log(`   ${project}: ${npmCold.durationMs.toFixed(0)}ms → ${npmWarm.durationMs.toFixed(0)}ms (${improvement}% faster, ${timeSaved}ms saved)`);
  }
});

if (npmCacheImprovements.length > 0) {
  const npmAvgImprovement = (npmCacheImprovements.reduce((a, b) => a + b, 0) / npmCacheImprovements.length).toFixed(1);
  console.log(`   Average cache improvement: ${npmAvgImprovement}%`);
}

console.log();
console.log('PNPM Cache Impact:');
console.log('─────────────────────────────────────────────────────────────');
let pnpmCacheImprovements = [];
projects.forEach(project => {
  const pnpmCold = results[`pnpm-${project}-cold`];
  const pnpmWarm = results[`pnpm-${project}-warm`];

  if (pnpmCold && pnpmWarm) {
    const improvement = ((1 - pnpmWarm.durationMs / pnpmCold.durationMs) * 100).toFixed(1);
    const timeSaved = (pnpmCold.durationMs - pnpmWarm.durationMs).toFixed(0);
    pnpmCacheImprovements.push(parseFloat(improvement));

    console.log(`   ${project}: ${pnpmCold.durationMs.toFixed(0)}ms → ${pnpmWarm.durationMs.toFixed(0)}ms (${improvement}% faster, ${timeSaved}ms saved)`);
  }
});

if (pnpmCacheImprovements.length > 0) {
  const pnpmAvgImprovement = (pnpmCacheImprovements.reduce((a, b) => a + b, 0) / pnpmCacheImprovements.length).toFixed(1);
  console.log(`   Average cache improvement: ${pnpmAvgImprovement}%`);
}

console.log();

// Overall summary
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           🏆 OVERALL WINNER SUMMARY                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log();

let npmColdTotal = 0;
let pnpmColdTotal = 0;
let npmWarmTotal = 0;
let pnpmWarmTotal = 0;
let npmColdCount = 0;
let pnpmColdCount = 0;
let npmWarmCount = 0;
let pnpmWarmCount = 0;

Object.values(results).forEach(result => {
  if (result.packageManager === 'npm' && result.scenario === 'cold') {
    npmColdTotal += result.durationMs;
    npmColdCount++;
  } else if (result.packageManager === 'pnpm' && result.scenario === 'cold') {
    pnpmColdTotal += result.durationMs;
    pnpmColdCount++;
  } else if (result.packageManager === 'npm' && result.scenario === 'warm') {
    npmWarmTotal += result.durationMs;
    npmWarmCount++;
  } else if (result.packageManager === 'pnpm' && result.scenario === 'warm') {
    pnpmWarmTotal += result.durationMs;
    pnpmWarmCount++;
  }
});

if (npmColdCount > 0 && pnpmColdCount > 0) {
  const npmColdAvg = npmColdTotal / npmColdCount;
  const pnpmColdAvg = pnpmColdTotal / pnpmColdCount;
  const coldFaster = ((1 - pnpmColdAvg / npmColdAvg) * 100).toFixed(1);
  const coldTimeSaved = (npmColdAvg - pnpmColdAvg).toFixed(0);

  console.log('❄️  COLD INSTALL PERFORMANCE:');
  console.log(`   npm average:   ${npmColdAvg.toFixed(0)}ms`);
  console.log(`   pnpm average: ${pnpmColdAvg.toFixed(0)}ms`);
  console.log(`   🏆 WINNER: pnpm is ${coldFaster}% faster (${coldTimeSaved}ms saved per project)`);
}

if (npmWarmCount > 0 && pnpmWarmCount > 0) {
  const npmWarmAvg = npmWarmTotal / npmWarmCount;
  const pnpmWarmAvg = pnpmWarmTotal / pnpmWarmCount;
  const warmFaster = ((1 - pnpmWarmAvg / npmWarmAvg) * 100).toFixed(1);
  const warmTimeSaved = (npmWarmAvg - pnpmWarmAvg).toFixed(0);

  console.log();
  console.log('🔥 WARM CACHE PERFORMANCE:');
  console.log(`   npm average:   ${npmWarmAvg.toFixed(0)}ms`);
  console.log(`   pnpm average: ${pnpmWarmAvg.toFixed(0)}ms`);
  console.log(`   🏆 WINNER: pnpm is ${warmFaster}% faster (${warmTimeSaved}ms saved per project)`);
}

console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ Benchmark Comparison Complete');
console.log('═══════════════════════════════════════════════════════════════');
