#!/usr/bin/env node

/**
 * Terminal Chart Generator
 * 
 * This script generates ASCII art charts for displaying benchmark results
 * directly in the terminal without requiring external charting libraries.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const resultsDir = join(process.cwd(), 'results', 'raw');

function loadResults() {
  const files = readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  const allResults = [];
  
  for (const file of files) {
    try {
      const content = readFileSync(join(resultsDir, file), 'utf8');
      const results = JSON.parse(content);
      allResults.push(...results);
    } catch (error) {
      console.warn(`Failed to read ${file}:`, error.message);
    }
  }
  
  return allResults;
}

function groupResults(results) {
  const grouped = {};
  
  for (const result of results) {
    const key = `${result.packageManager}-${result.project}-${result.scenario}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(result);
  }
  
  return grouped;
}

function calculateAverage(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function drawBarChart(title, labels, npmData, pnpmData) {
  const maxVal = Math.max(...npmData, ...pnpmData);
  const barWidth = 40;
  const maxLabelWidth = Math.max(...labels.map(l => l.length)) + 5;
  
  console.log(chalk.bold.white(`\n${title}`));
  console.log(chalk.gray('─'.repeat(80)));
  
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const npmVal = npmData[i];
    const pnpmVal = pnpmData[i];
    
    // npm bar
    const npmBarLen = Math.round((npmVal / maxVal) * barWidth);
    const npmBar = chalk.red('█'.repeat(npmBarLen)) + chalk.gray('░'.repeat(barWidth - npmBarLen));
    
    // pnpm bar
    const pnpmBarLen = Math.round((pnpmVal / maxVal) * barWidth);
    const pnpmBar = chalk.blue('█'.repeat(pnpmBarLen)) + chalk.gray('░'.repeat(barWidth - pnpmBarLen));
    
    // Calculate speedup
    const speedup = (npmVal / pnpmVal).toFixed(1);
    const percentFaster = ((1 - pnpmVal / npmVal) * 100).toFixed(1);
    
    console.log(`${label.padEnd(maxLabelWidth)}`);
    console.log(`  ${chalk.red('npm:')}  ${npmBar} ${npmVal.toFixed(0).padStart(8)}ms`);
    console.log(`  ${chalk.blue('pnpm:')} ${pnpmBar} ${pnpmVal.toFixed(0).padStart(8)}ms`);
    console.log(`  ${chalk.gray('Speedup:')} ${speedup}x (${percentFaster}% faster)`);
    console.log();
  }
}

function drawComparisonTable(title, labels, npmData, pnpmData) {
  console.log(chalk.bold.white(`\n${title}`));
  console.log(chalk.gray('─'.repeat(80)));
  
  const maxLabelWidth = Math.max(...labels.map(l => l.length)) + 5;
  console.log(`${'Project'.padEnd(maxLabelWidth)} | ${'npm (ms)'.padStart(10)} | ${'pnpm (ms)'.padStart(10)} | ${'Speedup'.padStart(8)} | ${'% Faster'.padStart(10)}`);
  console.log(chalk.gray('─'.repeat(80)));
  
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const npmVal = npmData[i];
    const pnpmVal = pnpmData[i];
    const speedup = (npmVal / pnpmVal).toFixed(1);
    const percentFaster = ((1 - pnpmVal / npmVal) * 100).toFixed(1);
    
    console.log(`${label.padEnd(maxLabelWidth)} | ${npmVal.toFixed(0).padStart(10)} | ${pnpmVal.toFixed(0).padStart(10)} | ${speedup.padStart(8)}x | ${percentFaster.padStart(10)}%`);
  }
}

function drawDiskChart(labels, npmData, pnpmData) {
  const maxVal = Math.max(...npmData, ...pnpmData);
  const barWidth = 40;
  const maxLabelWidth = Math.max(...labels.map(l => l.length)) + 5;
  
  console.log(chalk.bold.white('\n📊 Disk Usage Comparison'));
  console.log(chalk.gray('─'.repeat(80)));
  
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const npmVal = npmData[i];
    const pnpmVal = pnpmData[i];
    
    // npm bar
    const npmBarLen = Math.round((npmVal / maxVal) * barWidth);
    const npmBar = chalk.red('█'.repeat(npmBarLen)) + chalk.gray('░'.repeat(barWidth - npmBarLen));
    
    // pnpm bar
    const pnpmBarLen = Math.round((pnpmVal / maxVal) * barWidth);
    const pnpmBar = chalk.blue('█'.repeat(pnpmBarLen)) + chalk.gray('░'.repeat(barWidth - pnpmBarLen));
    
    const savings = ((1 - pnpmVal / npmVal) * 100).toFixed(1);
    
    console.log(`${label.padEnd(maxLabelWidth)}`);
    console.log(`  ${chalk.red('npm:')}  ${npmBar} ${npmVal.toFixed(1).padStart(8)}MB`);
    console.log(`  ${chalk.blue('pnpm:')} ${pnpmBar} ${pnpmVal.toFixed(1).padStart(8)}MB`);
    console.log(`  ${chalk.green('Savings:')} ${savings}% disk space`);
    console.log();
  }
}

function main() {
  console.log(chalk.blue.bold('═'.repeat(80)));
  console.log(chalk.blue.bold('📊 TERMINAL CHART GENERATOR'));
  console.log(chalk.blue.bold('═'.repeat(80)));
  
  console.log('Loading benchmark results...');
  const results = loadResults();
  
  if (results.length === 0) {
    console.log(chalk.yellow('⚠️  No results found. Run benchmarks first.'));
    process.exit(1);
  }
  
  console.log(chalk.green(`✅ Found ${results.length} benchmark results`));
  
  const grouped = groupResults(results);
  const projects = [...new Set(results.map(r => r.project))];
  const scenarios = [...new Set(results.map(r => r.scenario))];
  
  // Generate install time charts
  if (scenarios.includes('install')) {
    const installLabels = [];
    const npmInstallData = [];
    const pnpmInstallData = [];
    
    for (const project of projects) {
      const npmKey = `npm-${project}-install`;
      const pnpmKey = `pnpm-${project}-install`;
      
      const npmGroup = grouped[npmKey] || [];
      const pnpmGroup = grouped[pnpmKey] || [];
      
      if (npmGroup.length > 0 || pnpmGroup.length > 0) {
        installLabels.push(project);
        npmInstallData.push(calculateAverage(npmGroup.map(r => r.durationMs)));
        pnpmInstallData.push(calculateAverage(pnpmGroup.map(r => r.durationMs)));
      }
    }
    
    if (installLabels.length > 0) {
      drawBarChart('📦 Install Time Comparison', installLabels, npmInstallData, pnpmInstallData);
      drawComparisonTable('📋 Install Time Comparison Table', installLabels, npmInstallData, pnpmInstallData);
    }
  }
  
  // Generate disk usage charts
  const diskLabels = [];
  const npmDiskData = [];
  const pnpmDiskData = [];
  
  for (const project of projects) {
    const npmKey = `npm-${project}-install`;
    const pnpmKey = `pnpm-${project}-install`;
    
    const npmGroup = grouped[npmKey] || [];
    const pnpmGroup = grouped[pnpmKey] || [];
    
    const npmDiskAvg = calculateAverage(npmGroup.map(r => r.diskUsageMB || 0));
    const pnpmDiskAvg = calculateAverage(pnpmGroup.map(r => r.diskUsageMB || 0));
    
    if (npmDiskAvg > 0 || pnpmDiskAvg > 0) {
      diskLabels.push(project);
      npmDiskData.push(npmDiskAvg);
      pnpmDiskData.push(pnpmDiskAvg);
    }
  }
  
  if (diskLabels.length > 0) {
    drawDiskChart(diskLabels, npmDiskData, pnpmDiskData);
  }
  
  console.log(chalk.blue.bold('═'.repeat(80)));
  console.log(chalk.gray('💡 Tip: Run "npm run charts:browser" to generate interactive HTML charts'));
  console.log(chalk.blue.bold('═'.repeat(80)));
}

main();