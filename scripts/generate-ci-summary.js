#!/usr/bin/env node

/**
 * CI Benchmark Summary Generator
 * 
 * This script generates a structured comparison summary from CI benchmark results,
 * displaying performance differences between npm and pnpm across projects and scenarios.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCENARIOS = ['cold', 'warm', 'no-deps-changed'];
const PROJECTS = ['small-app', 'medium-app', 'react-app', 'next-app', 'node-api', 'monorepo', 'legacy-app'];

function loadResults(resultsDir) {
  const results = {};
  
  for (const scenario of SCENARIOS) {
    results[scenario] = {};
    
    for (const project of PROJECTS) {
      for (const pm of ['npm', 'pnpm']) {
        const resultFile = path.join(resultsDir, `${pm}-${project}-${scenario}.json`);
        
        if (fs.existsSync(resultFile)) {
          try {
            const data = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
            results[scenario][project] = results[scenario][project] || {};
            results[scenario][project][pm] = data.duration_ms;
          } catch (e) {
            console.warn(`Failed to parse ${resultFile}:`, e.message);
          }
        }
      }
    }
  }
  
  return results;
}

function generateComparison(results) {
  let summary = '';
  
  summary += '════════════════════════════════════════════════════════════\n';
  summary += '📊 CI BENCHMARK COMPARISON SUMMARY\n';
  summary += '════════════════════════════════════════════════════════════\n';
  summary += '\n';
  
  for (const scenario of SCENARIOS) {
    const scenarioResults = results[scenario];
    if (!scenarioResults || Object.keys(scenarioResults).length === 0) continue;
    
    summary += `### Scenario: ${scenario}\n`;
    summary += '\n';
    summary += '| Project | npm (ms) | pnpm (ms) | Speedup | % Faster | Time Saved |\n';
    summary += '|---------|----------|-----------|---------|----------|------------|\n';
    
    for (const project of PROJECTS) {
      const projectResults = scenarioResults[project];
      if (!projectResults) continue;
      
      const npmTime = projectResults.npm;
      const pnpmTime = projectResults.pnpm;
      
      if (npmTime && pnpmTime && pnpmTime > 0) {
        const speedup = (npmTime / pnpmTime).toFixed(1);
        const percentFaster = ((1 - pnpmTime / npmTime) * 100).toFixed(1);
        const timeSaved = (npmTime - pnpmTime).toFixed(0);
        
        summary += `| ${project} | ${npmTime} | ${pnpmTime} | ${speedup}x | ${percentFaster}% | ${timeSaved}ms |\n`;
      }
    }
    
    summary += '\n';
  }
  
  // Calculate overall statistics
  let totalNpm = 0;
  let totalPnpm = 0;
  let count = 0;
  
  for (const scenario of SCENARIOS) {
    for (const project of PROJECTS) {
      const npmTime = results[scenario]?.[project]?.npm;
      const pnpmTime = results[scenario]?.[project]?.pnpm;
      
      if (npmTime && pnpmTime && pnpmTime > 0) {
        totalNpm += npmTime;
        totalPnpm += pnpmTime;
        count++;
      }
    }
  }
  
  if (count > 0) {
    const avgNpm = (totalNpm / count).toFixed(0);
    const avgPnpm = (totalPnpm / count).toFixed(0);
    const overallSpeedup = (totalNpm / totalPnpm).toFixed(1);
    const overallPercentFaster = ((1 - totalPnpm / totalNpm) * 100).toFixed(1);
    
    summary += '### Overall Statistics\n';
    summary += '\n';
    summary += `- **Average npm time:** ${avgNpm}ms\n`;
    summary += `- **Average pnpm time:** ${avgPnpm}ms\n`;
    summary += `- **Overall speedup:** ${overallSpeedup}x\n`;
    summary += `- **Overall % faster:** ${overallPercentFaster}%\n`;
    summary += `- **Total time saved:** ${(totalNpm - totalPnpm).toFixed(0)}ms across ${count} benchmarks\n`;
    summary += '\n';
    
    // Add conclusion
    summary += '### Conclusion\n';
    summary += '\n';
    if (parseFloat(overallSpeedup) > 2) {
      summary += '✅ **SIGNIFICANT ADVANTAGE: pnpm**\n';
      summary += `pnpm showed ${overallSpeedup}x faster performance overall (${overallPercentFaster}% faster).\n`;
      summary += 'This suggests pnpm\'s content-addressable storage is providing substantial benefits in the CI environment.\n';
    } else if (parseFloat(overallSpeedup) > 1.2) {
      summary += '⚡ **MODERATE ADVANTAGE: pnpm**\n';
      summary += `pnpm showed ${overallSpeedup}x faster performance overall (${overallPercentFaster}% faster).\n`;
      summary += 'pnpm\'s advantages are present but may depend on specific scenarios.\n';
    } else if (parseFloat(overallSpeedup) > 1) {
      summary += '📊 **SLIGHT ADVANTAGE: pnpm**\n';
      summary += `pnpm showed ${overallSpeedup}x faster performance overall (${overallPercentFaster}% faster).\n`;
      summary += 'The difference is minimal. Consider other factors like disk space and team preference.\n';
    } else {
      summary += '⚠️ **NO CLEAR ADVANTAGE**\n';
      summary += 'Performance was similar between npm and pnpm in this CI test.\n';
      summary += 'This could be due to cache state or project-specific factors.\n';
    }
  }
  
  summary += '\n';
  summary += '════════════════════════════════════════════════════════════\n';
  summary += '💡 Context matters: Results vary by cache state, project size,\n';
  summary += '   network conditions, and workflow patterns. Test multiple\n';
  summary += '   scenarios to get a complete picture for your use case.\n';
  summary += '════════════════════════════════════════════════════════════\n';
  
  return summary;
}

function main() {
  const resultsDir = process.argv[2] || 'results/ci';
  
  if (!fs.existsSync(resultsDir)) {
    console.error(`Results directory not found: ${resultsDir}`);
    process.exit(1);
  }
  
  const results = loadResults(resultsDir);
  const summary = generateComparison(results);
  
  console.log(summary);
  
  // Also write to file for GitHub Actions to pick up
  const summaryFile = path.join(resultsDir, 'comparison-summary.txt');
  fs.writeFileSync(summaryFile, summary);
  console.log(`\nSummary saved to: ${summaryFile}`);
}

main();