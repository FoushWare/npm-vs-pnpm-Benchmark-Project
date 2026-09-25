#!/usr/bin/env node

import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const resultsDir = join(process.cwd(), 'results', 'raw');
const chartsDir = join(process.cwd(), 'results', 'charts');

function loadResults() {
  const files = readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  const allResults = [];
  
  for (const file of files) {
    try {
      const content = readFileSync(join(resultsDir, file), 'utf-8');
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

async function generateBarChart(title, labels, npmData, pnpmData, filename) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  
  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'npm',
          data: npmData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'pnpm',
          data: pnpmData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16 }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time (ms)'
          }
        }
      }
    }
  };
  
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  mkdirSync(chartsDir, { recursive: true });
  writeFileSync(join(chartsDir, filename), image);
  console.log(`Generated chart: ${filename}`);
}

async function generateDiskUsageChart(labels, npmData, pnpmData, filename) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  
  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'npm (MB)',
          data: npmData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'pnpm (MB)',
          data: pnpmData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Disk Usage Comparison',
          font: { size: 16 }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Disk Usage (MB)'
          }
        }
      }
    }
  };
  
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  mkdirSync(chartsDir, { recursive: true });
  writeFileSync(join(chartsDir, filename), image);
  console.log(`Generated chart: ${filename}`);
}

async function main() {
  console.log('Loading benchmark results...');
  const results = loadResults();
  
  if (results.length === 0) {
    console.log('No results found. Run benchmarks first.');
    process.exit(1);
  }
  
  console.log(`Found ${results.length} benchmark results`);
  
  try {
    const grouped = groupResults(results);
    const projects = [...new Set(results.map(r => r.project))];
    const scenarios = [...new Set(results.map(r => r.scenario))];
    
    // Generate install time comparison chart
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
        await generateBarChart(
          'Clean Install Time Comparison',
          installLabels,
          npmInstallData,
          pnpmInstallData,
          'install-time-comparison.png'
        );
      }
    }
    
    // Generate build time comparison chart
    if (scenarios.includes('build')) {
      const buildLabels = [];
      const npmBuildData = [];
      const pnpmBuildData = [];
      
      for (const project of projects) {
        const npmKey = `npm-${project}-build`;
        const pnpmKey = `pnpm-${project}-build`;
        
        const npmGroup = grouped[npmKey] || [];
        const pnpmGroup = grouped[pnpmKey] || [];
        
        if (npmGroup.length > 0 || pnpmGroup.length > 0) {
          buildLabels.push(project);
          npmBuildData.push(calculateAverage(npmGroup.map(r => r.durationMs)));
          pnpmBuildData.push(calculateAverage(pnpmGroup.map(r => r.durationMs)));
        }
      }
      
      if (buildLabels.length > 0) {
        await generateBarChart(
          'Build Time Comparison',
          buildLabels,
          npmBuildData,
          pnpmBuildData,
          'build-time-comparison.png'
        );
      }
    }
    
    // Generate disk usage comparison chart
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
      await generateDiskUsageChart(
        diskLabels,
        npmDiskData,
        pnpmDiskData,
        'disk-usage-comparison.png'
      );
    }
    
    console.log('Chart generation complete!');
    console.log(`Charts saved to: ${chartsDir}`);
  } catch (error) {
    console.error('Chart generation failed:', error.message);
    console.log('Charts may not be available if chartjs-node-canvas is not properly installed.');
    console.log('The text-based report will still be available.');
  }
}

main().catch(console.error);