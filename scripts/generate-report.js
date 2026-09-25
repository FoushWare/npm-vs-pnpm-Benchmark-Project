#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const resultsDir = join(process.cwd(), 'results', 'raw');
const summaryFile = join(process.cwd(), 'results', 'summary.json');
const reportFile = join(process.cwd(), 'results', 'report.md');

function loadResults() {
  const files = readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  const allResults = [];
  
  for (const file of files) {
    const content = readFileSync(join(resultsDir, file), 'utf-8');
    const results = JSON.parse(content);
    allResults.push(...results);
  }
  
  return allResults;
}

function calculateStatistics(values) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return { min, max, avg, median, stdDev };
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

function extractDiskUsage(result) {
  // Convert everything to MB for consistency
  if (result.diskUsageMB) {
    return result.diskUsageMB;
  }
  if (result.diskUsageBytes) {
    return result.diskUsageBytes / (1024 * 1024);
  }
  return 0;
}

function generateSummary(results) {
  const grouped = groupResults(results);
  const summary = {
    timestamp: new Date().toISOString(),
    totalRuns: results.length,
    packageManagers: [...new Set(results.map(r => r.packageManager))],
    projects: [...new Set(results.map(r => r.project))],
    scenarios: [...new Set(results.map(r => r.scenario))],
    statistics: {}
  };
  
  for (const [key, group] of Object.entries(grouped)) {
    const durations = group.map(r => r.durationMs).filter(d => d > 0);
    const diskUsages = group.map(r => extractDiskUsage(r)).filter(d => d > 0);
    
    summary.statistics[key] = {
      duration: calculateStatistics(durations),
      diskUsage: calculateStatistics(diskUsages),
      successRate: group.filter(r => r.success).length / group.length,
      totalRuns: group.length
    };
  }
  
  return summary;
}

function generateMarkdownReport(summary) {
  let markdown = `# npm vs pnpm Benchmark Report\n\n`;
  markdown += `**Generated:** ${new Date(summary.timestamp).toLocaleString()}\n\n`;
  markdown += `**Total Runs:** ${summary.totalRuns}\n\n`;
  markdown += `**Package Managers:** ${summary.packageManagers.join(', ')}\n\n`;
  markdown += `**Projects:** ${summary.projects.join(', ')}\n\n`;
  markdown += `**Scenarios:** ${summary.scenarios.join(', ')}\n\n`;
  
  markdown += `## Performance Comparison\n\n`;
  
  // Group by scenario for comparison tables
  const scenarios = [...new Set(summary.scenarios)];
  const projects = [...new Set(summary.projects)];
  const packageManagers = [...new Set(summary.packageManagers)];
  
  for (const scenario of scenarios) {
    markdown += `### ${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Scenario\n\n`;
    
    markdown += `| Project | Package Manager | Avg Duration (ms) | Median Duration (ms) | Success Rate |\n`;
    markdown += `|---------|----------------|------------------|---------------------|--------------|\n`;
    
    for (const project of projects) {
      for (const pm of packageManagers) {
        const key = `${pm}-${project}-${scenario}`;
        const stats = summary.statistics[key];
        
        if (stats) {
          markdown += `| ${project} | ${pm} | ${stats.duration.avg.toFixed(2)} | ${stats.duration.median.toFixed(2)} | ${(stats.successRate * 100).toFixed(1)}% |\n`;
        }
      }
    }
    
    markdown += `\n`;
  }
  
  // Disk usage comparison
  markdown += `## Disk Usage Comparison\n\n`;
  markdown += `| Project | Package Manager | Avg Disk Usage (MB) | Median Disk Usage (MB) |\n`;
  markdown += `|---------|----------------|---------------------|----------------------|\n`;
  
  for (const project of projects) {
    for (const pm of packageManagers) {
      const installKey = `${pm}-${project}-install`;
      const stats = summary.statistics[installKey];
      
      if (stats && stats.diskUsage.avg > 0) {
        markdown += `| ${project} | ${pm} | ${stats.diskUsage.avg.toFixed(2)} | ${stats.diskUsage.median.toFixed(2)} |\n`;
      }
    }
  }
  
  markdown += `\n`;
  
  // Key findings
  markdown += `## Key Findings\n\n`;
  markdown += `- This report presents performance data without declaring a "winner"\n`;
  markdown += `- Results vary based on project size, dependency complexity, and system configuration\n`;
  markdown += `- Multiple runs were performed to account for variability\n`;
  markdown += `- Consider your specific use case and requirements when choosing a package manager\n\n`;
  
  markdown += `## Methodology\n\n`;
  markdown += `See [BENCHMARK-METHODOLOGY.md](../BENCHMARK-METHODOLOGY.md) for detailed methodology information.\n\n`;
  
  return markdown;
}

async function main() {
  console.log('Loading benchmark results...');
  const results = loadResults();
  
  if (results.length === 0) {
    console.log('No results found. Run benchmarks first.');
    process.exit(1);
  }
  
  console.log(`Found ${results.length} benchmark results`);
  
  console.log('Generating summary...');
  const summary = generateSummary(results);
  mkdirSync(join(process.cwd(), 'results'), { recursive: true });
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log('Generating markdown report...');
  const markdown = generateMarkdownReport(summary);
  writeFileSync(reportFile, markdown);
  
  console.log('Report generation complete!');
  console.log(`Summary: ${summaryFile}`);
  console.log(`Report: ${reportFile}`);
}

main().catch(console.error);