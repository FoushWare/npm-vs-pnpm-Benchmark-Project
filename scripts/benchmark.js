#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { default as ora } from 'ora';
import { runInstallBenchmark } from '../benchmarks/install/index.js';
import { runBuildBenchmark } from '../benchmarks/build/index.js';
import { runTestBenchmark } from '../benchmarks/test/index.js';
import { runLintBenchmark } from '../benchmarks/lint/index.js';
import { runMassProjectsBenchmark } from '../benchmarks/mass-projects/index.js';
import { runMigrationBenchmark } from '../benchmarks/migration/index.js';
import { clearPackageCache } from './measure-cache.js';
import { spawn } from 'child_process';
import { rmSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VALID_SCENARIOS = ['install', 'build', 'test', 'lint', 'mass', 'migration', 'all'];
const SCENARIO_RUNNERS = {
  install: (projectPath, pm, opts) =>
    runInstallBenchmark(projectPath, pm, opts.clean, opts.warm, opts.lowMemory),
  build: (projectPath, pm, opts) => runBuildBenchmark(projectPath, pm, opts.lowMemory),
  test: (projectPath, pm, opts) => runTestBenchmark(projectPath, pm, opts.lowMemory),
  lint: (projectPath, pm, opts) => runLintBenchmark(projectPath, pm, opts.lowMemory),
};

const LOW_MEMORY_DELAY_MS = 2000;
const LOW_MEMORY_PROJECT_DELAY_MS = 3000;
const DEFAULT_CONCURRENCY = 4;

const program = new Command();

program
  .name('benchmark')
  .description('Run npm vs pnpm benchmarks')
  .version('1.0.0')
  .option('--package-manager <type>', 'Package manager to benchmark (npm, pnpm, or both)', 'both')
  .option(
    '--projects <names>',
    'Comma-separated list of projects to benchmark',
    'small-app,medium-app,large-app,frontend-react,frontend-next,node-api,monorepo,legacy-app'
  )
  .option('--runs <number>', 'Number of runs per benchmark', '3')
  .option('--clean', 'Clean node_modules before benchmarking', false)
  .option('--warm', 'Use warm cache for benchmarking', false)
  .option('--mass-count <number>', 'Number of projects for mass benchmark', '100')
  .option('--scenario <type>', 'Benchmark scenario (install, build, test, lint, mass, migration, all)', 'all')
  .option('--validate', 'Run validation mode', false)
  .option('--low-memory', 'Enable low-memory mode for 8GB RAM systems', false)
  .option('--max-memory <number>', 'Max memory in MB per process (default: auto)', '0')
  .option('--sequential', 'Run benchmarks sequentially instead of parallel', false)
  .option('--concurrency <number>', 'Max parallel benchmark runs (ignored with --sequential)', String(DEFAULT_CONCURRENCY))
  .parse(process.argv);

const options = program.opts();

if (!VALID_SCENARIOS.includes(options.scenario)) {
  console.error(chalk.red(`Invalid --scenario "${options.scenario}". Expected one of: ${VALID_SCENARIOS.join(', ')}`));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

/** Runs a shell command async instead of blocking the event loop. */
function runCommandAsync(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...opts });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))));
  });
}

/** Runs async tasks with bounded concurrency, preserving input order in the results. */
async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarize(results) {
  const byKey = new Map();
  for (const r of results) {
    if (!r.success && r.success !== undefined) continue;
    const key = `${r.packageManager} / ${r.project} / ${r.scenario}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r.durationMs);
  }
  const rows = [];
  for (const [key, durations] of byKey) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    rows.push({ key, avg, min, max, n: durations.length });
  }
  return rows;
}

async function cleanProject(projectPath) {
  const nodeModulesPath = join(projectPath, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    rmSync(nodeModulesPath, { recursive: true, force: true });
  }
  for (const lockFile of ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']) {
    const lockPath = join(projectPath, lockFile);
    if (existsSync(lockPath)) rmSync(lockPath, { force: true });
  }
}

/** Writes the current results array to disk. Safe to call repeatedly (e.g. after each run). */
function saveResults(results, resultsFile) {
  mkdirSync(join(process.cwd(), 'results', 'raw'), { recursive: true });
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
}

// ---------------------------------------------------------------------------
// Benchmark execution
// ---------------------------------------------------------------------------

async function runBenchmark(project, packageManager, scenario, runNumber) {
  const projectPath = join(process.cwd(), 'projects', project);
  const spinner = ora(`${scenario} · ${project} · ${packageManager} (run ${runNumber})`).start();

  try {
    if (options.lowMemory && global.gc) global.gc();

    const runner = SCENARIO_RUNNERS[scenario];
    if (!runner) throw new Error(`Unknown scenario: ${scenario}`);
    const result = await runner(projectPath, packageManager, options);

    spinner.succeed(`${scenario} · ${project} · ${packageManager}: ${result.durationMs.toFixed(0)}ms`);

    if (options.lowMemory && global.gc) global.gc();

    return { success: true, ...result };
  } catch (error) {
    spinner.fail(`${scenario} · ${project} · ${packageManager} failed: ${error.message}`);
    return { success: false, error: error.message, durationMs: 0 };
  }
}

function applyLowMemoryOverrides(config) {
  console.log(chalk.yellow.bold('⚠️  Low-memory mode enabled - optimizing for 8GB RAM'));

  const overridden = {
    ...config,
    projects: ['small-app', 'medium-app'],
    runs: 1,
    scenarios: config.scenarioFlag === 'all' ? ['install'] : config.scenarios,
    massCount: 10,
    sequential: true,
  };

  console.log(chalk.yellow('Low-memory optimizations applied:'));
  console.log(chalk.yellow(`  - Projects: ${overridden.projects.join(', ')}`));
  console.log(chalk.yellow(`  - Runs: ${overridden.runs}`));
  console.log(chalk.yellow(`  - Scenarios: ${overridden.scenarios.join(', ')}`));
  console.log(chalk.yellow(`  - Mass projects: ${overridden.massCount}`));
  console.log(chalk.yellow('  - Sequential execution: enabled'));
  console.log();

  return overridden;
}

function buildConfig() {
  let config = {
    projects: options.projects.split(','),
    packageManagers: options.packageManager === 'both' ? ['npm', 'pnpm'] : [options.packageManager],
    runs: parseInt(options.runs, 10),
    scenarios: options.scenario === 'all' ? ['install', 'build', 'test', 'lint'] : [options.scenario],
    scenarioFlag: options.scenario,
    massCount: parseInt(options.massCount, 10),
    sequential: options.sequential,
    concurrency: Math.max(1, parseInt(options.concurrency, 10) || DEFAULT_CONCURRENCY),
  };

  if (options.lowMemory) config = applyLowMemoryOverrides(config);
  return config;
}

async function main() {
  console.log(chalk.blue.bold('npm vs pnpm Benchmark System'));
  console.log();

  const envSpinner = ora('Collecting environment information...').start();
  await runCommandAsync('node', ['scripts/collect-environment.js'], { cwd: process.cwd() });
  envSpinner.succeed('Environment information collected');

  const config = buildConfig();
  const { projects, packageManagers, runs, scenarios, massCount, sequential, concurrency } = config;

  console.log(chalk.yellow(`Projects: ${projects.join(', ')}`));
  console.log(chalk.yellow(`Package Managers: ${packageManagers.join(', ')}`));
  console.log(chalk.yellow(`Runs: ${runs}`));
  console.log(chalk.yellow(`Scenarios: ${scenarios.join(', ')}`));
  console.log();

  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = join(process.cwd(), 'results', 'raw', `benchmark-${timestamp}.json`);
  const startedAt = Date.now();

  // Save whatever we have so far even on failure/interruption.
  process.on('SIGINT', () => {
    console.log(chalk.red('\nInterrupted — saving partial results...'));
    saveResults(results, resultsFile);
    process.exit(1);
  });

  try {
    for (const packageManager of packageManagers) {
      if (options.clean) {
        const clearSpinner = ora(`Clearing ${packageManager} cache...`).start();
        await clearPackageCache(packageManager);
        clearSpinner.succeed(`${packageManager} cache cleared`);
      }

      for (const project of projects) {
        const projectPath = join(process.cwd(), 'projects', project);
        if (options.clean) await cleanProject(projectPath);

        // Build the list of (scenario, run) tasks for this project/PM combo.
        const tasks = [];
        for (const scenario of scenarios) {
          for (let run = 1; run <= runs; run++) {
            tasks.push(async () => {
              const result = await runBenchmark(project, packageManager, scenario, run);
              const record = { packageManager, project, scenario, run, ...result, timestamp: new Date().toISOString() };
              results.push(record);
              saveResults(results, resultsFile); // incremental save — survives crashes
              return record;
            });
          }
        }

        // Scenarios/runs for the SAME project can safely run in parallel unless
        // low-memory/--sequential is set, or the scenario itself needs isolation
        // (install mutates node_modules, so keep install sequential regardless).
        const hasInstall = scenarios.includes('install');
        if (sequential || hasInstall) {
          for (const task of tasks) await task();
        } else {
          await runWithConcurrency(tasks, concurrency);
        }

        if (options.lowMemory) {
          console.log(chalk.gray('Waiting for system recovery between projects...'));
          await delay(LOW_MEMORY_PROJECT_DELAY_MS);
        }
      }
    }

    if (options.scenario === 'mass' || options.scenario === 'all') {
      const massSpinner = ora(`Running mass projects benchmark (${massCount} projects)...`).start();
      const massTasks = packageManagers.map((pm) => async () => {
        const massResult = await runMassProjectsBenchmark(pm, massCount);
        const record = { packageManager: pm, project: 'mass-projects', scenario: 'mass', run: 1, ...massResult, timestamp: new Date().toISOString() };
        results.push(record);
        saveResults(results, resultsFile);
      });
      // Mass benchmarks are heavy — run sequentially regardless of concurrency setting.
      for (const task of massTasks) await task();
      massSpinner.succeed('Mass projects benchmark completed');
    }

    if (options.scenario === 'migration' || options.scenario === 'all') {
      const migrationSpinner = ora('Running migration benchmark...').start();
      for (const project of projects) {
        const projectPath = join(process.cwd(), 'projects', project);
        const migrationResult = await runMigrationBenchmark(projectPath);
        const record = { packageManager: 'npm->pnpm', project, scenario: 'migration', run: 1, ...migrationResult, timestamp: new Date().toISOString() };
        results.push(record);
        saveResults(results, resultsFile);
      }
      migrationSpinner.succeed('Migration benchmark completed');
    }
  } finally {
    saveResults(results, resultsFile);
  }

  const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log();
  console.log(chalk.green.bold(`Benchmark completed in ${elapsedS}s`));
  console.log(chalk.yellow(`Results saved to: ${resultsFile}`));

  const summary = summarize(results);
  if (summary.length) {
    console.log();
    console.log(chalk.blue.bold('Summary (ms):'));
    for (const row of summary) {
      console.log(`  ${row.key}: avg ${row.avg.toFixed(0)} · min ${row.min.toFixed(0)} · max ${row.max.toFixed(0)} (n=${row.n})`);
    }
  }

  if (options.validate) {
    console.log(chalk.blue('Running validation...'));
    // Validation logic would go here
  }
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});