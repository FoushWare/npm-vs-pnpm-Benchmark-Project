#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const resultsDir = process.argv[2] || join(process.cwd(), 'results', 'ci');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           🏆 FINAL BENCHMARK COMPARISON SUMMARY               ║');
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

// Group by project
const projects = [...new Set(Object.values(results).map(r => r.project))];

projects.forEach(project => {
  console.log(`� Project: ${project}`);
  console.log('═══════════════════════════════════════════════════════════════');

  const npmCold = results[`npm-${project}-cold`];
  const npmWarm = results[`npm-${project}-warm`];
  const pnpmCold = results[`pnpm-${project}-cold`];
  const pnpmWarm = results[`pnpm-${project}-warm`];

  if (npmCold && pnpmCold) {
    console.log('❄️  COLD INSTALL:');
    console.log(`   npm:   ${npmCold.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: ${pnpmCold.durationMs.toFixed(0)}ms`);

    const diff = npmCold.durationMs - pnpmCold.durationMs;
    const faster = ((1 - pnpmCold.durationMs / npmCold.durationMs) * 100).toFixed(1);

    if (diff > 0) {
      console.log(`   🚀 pnpm is ${faster}% faster`);
    } else {
      console.log(`   🚀 npm is ${Math.abs(faster)}% faster`);
    }

    // Visual comparison
    const maxTime = Math.max(npmCold.durationMs, pnpmCold.durationMs);
    const npmBar = '█'.repeat(Math.round((npmCold.durationMs / maxTime) * 30));
    const pnpmBar = '█'.repeat(Math.round((pnpmCold.durationMs / maxTime) * 30));
    const npmSpaces = ' '.repeat(30 - Math.round((npmCold.durationMs / maxTime) * 30));
    const pnpmSpaces = ' '.repeat(30 - Math.round((pnpmCold.durationMs / maxTime) * 30));

    console.log(`   npm:   [${npmBar}${npmSpaces}] ${npmCold.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: [${pnpmBar}${pnpmSpaces}] ${pnpmCold.durationMs.toFixed(0)}ms`);
  }

  if (npmWarm && pnpmWarm) {
    console.log();
    console.log('🔥 WARM CACHE:');
    console.log(`   npm:   ${npmWarm.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: ${pnpmWarm.durationMs.toFixed(0)}ms`);

    const diff = npmWarm.durationMs - pnpmWarm.durationMs;
    const faster = ((1 - pnpmWarm.durationMs / npmWarm.durationMs) * 100).toFixed(1);

    if (diff > 0) {
      console.log(`   🚀 pnpm is ${faster}% faster`);
    } else {
      console.log(`   🚀 npm is ${Math.abs(faster)}% faster`);
    }

    // Visual comparison
    const maxTime = Math.max(npmWarm.durationMs, pnpmWarm.durationMs);
    const npmBar = '█'.repeat(Math.round((npmWarm.durationMs / maxTime) * 30));
    const pnpmBar = '█'.repeat(Math.round((pnpmWarm.durationMs / maxTime) * 30));
    const npmSpaces = ' '.repeat(30 - Math.round((npmWarm.durationMs / maxTime) * 30));
    const pnpmSpaces = ' '.repeat(30 - Math.round((pnpmWarm.durationMs / maxTime) * 30));

    console.log(`   npm:   [${npmBar}${npmSpaces}] ${npmWarm.durationMs.toFixed(0)}ms`);
    console.log(`   pnpm: [${pnpmBar}${pnpmSpaces}] ${pnpmWarm.durationMs.toFixed(0)}ms`);
  }

  console.log();
});

// Overall summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('🏆 OVERALL SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');

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

  console.log(`❄️  COLD INSTALL (Average):`);
  console.log(`   npm:   ${npmColdAvg.toFixed(0)}ms`);
  console.log(`   pnpm: ${pnpmColdAvg.toFixed(0)}ms`);
  console.log(`   🚀 pnpm is ${coldFaster}% faster on average`);
}

if (npmWarmCount > 0 && pnpmWarmCount > 0) {
  const npmWarmAvg = npmWarmTotal / npmWarmCount;
  const pnpmWarmAvg = pnpmWarmTotal / pnpmWarmCount;
  const warmFaster = ((1 - pnpmWarmAvg / npmWarmAvg) * 100).toFixed(1);

  console.log();
  console.log(`🔥 WARM CACHE (Average):`);
  console.log(`   npm:   ${npmWarmAvg.toFixed(0)}ms`);
  console.log(`   pnpm: ${pnpmWarmAvg.toFixed(0)}ms`);
  console.log(`   🚀 pnpm is ${warmFaster}% faster on average`);
}

console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ Benchmark Complete');
console.log('═══════════════════════════════════════════════════════════════');
