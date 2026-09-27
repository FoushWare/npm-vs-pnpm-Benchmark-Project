#!/usr/bin/env node

/**
 * Browser Chart Generator
 * 
 * This script generates interactive HTML charts using Chart.js that can be
 * opened in a web browser for interactive exploration of benchmark results.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const resultsDir = join(process.cwd(), 'results', 'raw');
const chartsDir = join(process.cwd(), 'results', 'charts');

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

function generateHTML(labels, npmData, pnpmData, diskNpmData, diskPnpmData) {
  const installChartData = JSON.stringify({
    labels,
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
  });

  const diskChartData = JSON.stringify({
    labels,
    datasets: [
      {
        label: 'npm (MB)',
        data: diskNpmData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: 'pnpm (MB)',
        data: diskPnpmData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>npm vs pnpm Benchmark Results</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
        }
        .stat-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .legend {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            justify-content: center;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .color-box {
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 npm vs pnpm Benchmark Results</h1>
        <p>Interactive comparison of package manager performance across multiple projects and scenarios.</p>
        
        <div class="legend">
            <div class="legend-item">
                <div class="color-box" style="background: rgba(255, 99, 132, 0.6);"></div>
                <span>npm</span>
            </div>
            <div class="legend-item">
                <div class="color-box" style="background: rgba(54, 162, 235, 0.6);"></div>
                <span>pnpm</span>
            </div>
        </div>
        
        <h2>📦 Install Time Comparison</h2>
        <div class="chart-container">
            <canvas id="installChart"></canvas>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Average npm Time</h3>
                <div class="value">${(npmData.reduce((a,b) => a+b, 0) / npmData.length).toFixed(0)}ms</div>
            </div>
            <div class="stat-card">
                <h3>Average pnpm Time</h3>
                <div class="value">${(pnpmData.reduce((a,b) => a+b, 0) / pnpmData.length).toFixed(0)}ms</div>
            </div>
            <div class="stat-card">
                <h3>Overall Speedup</h3>
                <div class="value">${(npmData.reduce((a,b) => a+b, 0) / pnpmData.reduce((a,b) => a+b, 0)).toFixed(1)}x</div>
            </div>
            <div class="stat-card">
                <h3>% Faster</h3>
                <div class="value">${((1 - pnpmData.reduce((a,b) => a+b, 0) / npmData.reduce((a,b) => a+b, 0)) * 100).toFixed(1)}%</div>
            </div>
        </div>
        
        <h2>💾 Disk Usage Comparison</h2>
        <div class="chart-container">
            <canvas id="diskChart"></canvas>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Average npm Disk</h3>
                <div class="value">${(diskNpmData.reduce((a,b) => a+b, 0) / diskNpmData.length).toFixed(1)}MB</div>
            </div>
            <div class="stat-card">
                <h3>Average pnpm Disk</h3>
                <div class="value">${(diskPnpmData.reduce((a,b) => a+b, 0) / diskPnpmData.length).toFixed(1)}MB</div>
            </div>
            <div class="stat-card">
                <h3>Disk Savings</h3>
                <div class="value">${((1 - diskPnpmData.reduce((a,b) => a+b, 0) / diskNpmData.reduce((a,b) => a+b, 0)) * 100).toFixed(1)}%</div>
            </div>
        </div>
    </div>
    
    <script>
        // Install Time Chart
        const installCtx = document.getElementById('installChart').getContext('2d');
        new Chart(installCtx, {
            type: 'bar',
            data: ${installChartData},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Install Time by Project',
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
        });
        
        // Disk Usage Chart
        const diskCtx = document.getElementById('diskChart').getContext('2d');
        new Chart(diskCtx, {
            type: 'bar',
            data: ${diskChartData},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Disk Usage by Project',
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
        });
    </script>
</body>
</html>`;
}

async function main() {
  console.log('Loading benchmark results...');
  const results = loadResults();
  
  if (results.length === 0) {
    console.log('⚠️  No results found. Run benchmarks first.');
    process.exit(1);
  }
  
  console.log(`✅ Found ${results.length} benchmark results`);
  
  const grouped = groupResults(results);
  const projects = [...new Set(results.map(r => r.project))];
  const scenarios = [...new Set(results.map(r => r.scenario))];
  
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
  
  const html = generateHTML(installLabels, npmInstallData, pnpmInstallData, npmDiskData, pnpmDiskData);
  
  mkdirSync(chartsDir, { recursive: true });
  const htmlFile = join(chartsDir, 'benchmark-results.html');
  writeFileSync(htmlFile, html);
  
  console.log('✅ Interactive HTML chart generated!');
  console.log(`📁 File: ${htmlFile}`);
  console.log('🌐 Open this file in your browser to view interactive charts');
}

try {
  main();
} catch (error) {
  console.error('Error generating browser charts:', error.message);
  process.exit(1);
}