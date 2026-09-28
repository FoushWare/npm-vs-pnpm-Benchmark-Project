#!/usr/bin/env node

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const resultsDir = join(process.cwd(), 'results', 'manual');

export function saveResult(project, packageManager, scenario, durationMs, diskUsageMB) {
  mkdirSync(resultsDir, { recursive: true });

  const result = {
    project,
    packageManager,
    scenario,
    durationMs,
    diskUsageMB,
    timestamp: new Date().toISOString()
  };

  const file = join(resultsDir, `${project}-${packageManager}-${scenario}.json`);
  writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(`💾 Result saved to: ${file}`);
}

export function loadResult(project, packageManager, scenario) {
  const file = join(resultsDir, `${project}-${packageManager}-${scenario}.json`);
  if (!existsSync(file)) return null;

  try {
    const data = readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export function loadAllResults(project) {
  const results = {};
  const managers = ['npm', 'pnpm'];
  const scenarios = ['cold', 'warm'];

  managers.forEach(pm => {
    scenarios.forEach(scenario => {
      const result = loadResult(project, pm, scenario);
      if (result) {
        results[`${pm}-${scenario}`] = result;
      }
    });
  });

  return results;
}
