#!/usr/bin/env node

/**
 * Browser Chart Generator
 *
 * This script generates interactive HTML charts using Chart.js that can be
 * opened in a web browser for interactive exploration of benchmark results.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, readFile } from 'fs';
import { join } from 'path';
import { createServer } from 'http';

const resultsDir = join(process.cwd(), 'results', 'manual');
const chartsDir = join(process.cwd(), 'results', 'charts');

// Check for --live-server flag
const isLiveServer = process.argv.includes('--live-server');
const PORT = 8080;

function loadResults() {
  const files = readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  const allResults = [];
  
  for (const file of files) {
    try {
      const content = readFileSync(join(resultsDir, file), 'utf8');
      const results = JSON.parse(content);
      // Handle both single objects and arrays
      if (Array.isArray(results)) {
        allResults.push(...results);
      } else {
        allResults.push(results);
      }
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

function generateHTML(coldLabels, npmColdData, pnpmColdData, warmLabels, npmWarmData, pnpmWarmData, diskLabels, npmDiskData, pnpmDiskData) {
  const coldChartData = JSON.stringify({
    labels: coldLabels,
    datasets: [
      {
        label: 'npm',
        data: npmColdData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: 'pnpm',
        data: pnpmColdData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  });

  const warmChartData = JSON.stringify({
    labels: warmLabels,
    datasets: [
      {
        label: 'npm',
        data: npmWarmData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: 'pnpm',
        data: pnpmWarmData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  });

  const diskChartData = JSON.stringify({
    labels: diskLabels,
    datasets: [
      {
        label: 'npm (MB)',
        data: npmDiskData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: 'pnpm (MB)',
        data: pnpmDiskData,
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
        
        <h2>❄️  Cold Install (No Cache)</h2>
        <div class="chart-container">
            <canvas id="coldChart"></canvas>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Average npm Time</h3>
                <div class="value">${npmColdData.length ? (npmColdData.reduce((a,b) => a+b, 0) / npmColdData.length).toFixed(0) : 'N/A'}ms</div>
            </div>
            <div class="stat-card">
                <h3>Average pnpm Time</h3>
                <div class="value">${pnpmColdData.length ? (pnpmColdData.reduce((a,b) => a+b, 0) / pnpmColdData.length).toFixed(0) : 'N/A'}ms</div>
            </div>
            <div class="stat-card">
                <h3>Speedup</h3>
                <div class="value">${npmColdData.length && pnpmColdData.length ? (npmColdData.reduce((a,b) => a+b, 0) / pnpmColdData.reduce((a,b) => a+b, 0)).toFixed(1) : 'N/A'}x</div>
            </div>
            <div class="stat-card">
                <h3>% Faster</h3>
                <div class="value">${npmColdData.length && pnpmColdData.length ? ((1 - pnpmColdData.reduce((a,b) => a+b, 0) / npmColdData.reduce((a,b) => a+b, 0)) * 100).toFixed(1) : 'N/A'}%</div>
            </div>
        </div>
        
        <h2>🔥 Warm Cache (With Cache)</h2>
        <div class="chart-container">
            <canvas id="warmChart"></canvas>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Average npm Time</h3>
                <div class="value">${npmWarmData.length ? (npmWarmData.reduce((a,b) => a+b, 0) / npmWarmData.length).toFixed(0) : 'N/A'}ms</div>
            </div>
            <div class="stat-card">
                <h3>Average pnpm Time</h3>
                <div class="value">${pnpmWarmData.length ? (pnpmWarmData.reduce((a,b) => a+b, 0) / pnpmWarmData.length).toFixed(0) : 'N/A'}ms</div>
            </div>
            <div class="stat-card">
                <h3>Speedup</h3>
                <div class="value">${npmWarmData.length && pnpmWarmData.length ? (npmWarmData.reduce((a,b) => a+b, 0) / pnpmWarmData.reduce((a,b) => a+b, 0)).toFixed(1) : 'N/A'}x</div>
            </div>
            <div class="stat-card">
                <h3>% Faster</h3>
                <div class="value">${npmWarmData.length && pnpmWarmData.length ? ((1 - pnpmWarmData.reduce((a,b) => a+b, 0) / npmWarmData.reduce((a,b) => a+b, 0)) * 100).toFixed(1) : 'N/A'}%</div>
            </div>
        </div>
        
        <h2>💾 Disk Usage</h2>
        <div class="chart-container">
            <canvas id="diskChart"></canvas>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Average npm Disk</h3>
                <div class="value">${npmDiskData.length ? (npmDiskData.reduce((a,b) => a+b, 0) / npmDiskData.length).toFixed(1) : 'N/A'}MB</div>
            </div>
            <div class="stat-card">
                <h3>Average pnpm Disk</h3>
                <div class="value">${pnpmDiskData.length ? (pnpmDiskData.reduce((a,b) => a+b, 0) / pnpmDiskData.length).toFixed(1) : 'N/A'}MB</div>
            </div>
            <div class="stat-card">
                <h3>Disk Savings</h3>
                <div class="value">${npmDiskData.length && pnpmDiskData.length ? ((1 - pnpmDiskData.reduce((a,b) => a+b, 0) / npmDiskData.reduce((a,b) => a+b, 0)) * 100).toFixed(1) : 'N/A'}%</div>
            </div>
        </div>
    </div>
    
    <script>
        // Cold Install Chart
        const coldCtx = document.getElementById('coldChart').getContext('2d');
        new Chart(coldCtx, {
            type: 'bar',
            data: ${coldChartData},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cold Install Time (No Cache)',
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
        
        // Warm Cache Chart
        const warmCtx = document.getElementById('warmChart').getContext('2d');
        new Chart(warmCtx, {
            type: 'bar',
            data: ${warmChartData},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Warm Cache Time (With Cache)',
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
  
  // Cold install data
  const coldLabels = [];
  const npmColdData = [];
  const pnpmColdData = [];
  
  for (const project of projects) {
    const npmKey = `npm-${project}-cold`;
    const pnpmKey = `pnpm-${project}-cold`;
    
    const npmGroup = grouped[npmKey] || [];
    const pnpmGroup = grouped[pnpmKey] || [];
    
    if (npmGroup.length > 0 || pnpmGroup.length > 0) {
      coldLabels.push(project);
      npmColdData.push(calculateAverage(npmGroup.map(r => r.durationMs)));
      pnpmColdData.push(calculateAverage(pnpmGroup.map(r => r.durationMs)));
    }
  }
  
  // Warm cache data
  const warmLabels = [];
  const npmWarmData = [];
  const pnpmWarmData = [];
  
  for (const project of projects) {
    const npmKey = `npm-${project}-warm`;
    const pnpmKey = `pnpm-${project}-warm`;
    
    const npmGroup = grouped[npmKey] || [];
    const pnpmGroup = grouped[pnpmKey] || [];
    
    if (npmGroup.length > 0 || pnpmGroup.length > 0) {
      warmLabels.push(project);
      npmWarmData.push(calculateAverage(npmGroup.map(r => r.durationMs)));
      pnpmWarmData.push(calculateAverage(pnpmGroup.map(r => r.durationMs)));
    }
  }
  
  // Disk usage data (use cold install disk measurements)
  const diskLabels = [];
  const npmDiskData = [];
  const pnpmDiskData = [];
  
  for (const project of projects) {
    const npmKey = `npm-${project}-cold`;
    const pnpmKey = `pnpm-${project}-cold`;
    
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
  
  const html = generateHTML(coldLabels, npmColdData, pnpmColdData, warmLabels, npmWarmData, pnpmWarmData, diskLabels, npmDiskData, pnpmDiskData);
  
  mkdirSync(chartsDir, { recursive: true });
  const htmlFile = join(chartsDir, 'benchmark-results.html');
  writeFileSync(htmlFile, html);

  console.log('✅ Interactive HTML chart generated!');
  console.log(`📁 File: ${htmlFile}`);
  console.log('🌐 Open this file in your browser to view interactive charts');

  // Start live server if requested
  if (isLiveServer) {
    console.log();
    console.log('🌐 Starting live server...');

    const server = createServer((req, res) => {
      if (req.url === '/' || req.url === '/index.html') {
        readFileSync(htmlFile, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      console.log();
      console.log('✅ Live server started!');
      console.log(`📱 Open in browser: http://localhost:${PORT}`);
      console.log('   Press Ctrl+C to stop the server');
    });

    process.on('SIGINT', () => {
      console.log();
      console.log('🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
      });
    });
  }
}

try {
  main();
} catch (error) {
  console.error('Error generating browser charts:', error.message);
  process.exit(1);
}