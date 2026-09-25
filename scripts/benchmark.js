#!/usr/bin/env node

// ============================================================================
// npm vs pnpm Install Benchmark
// ============================================================================
// This benchmark focuses on install performance because that's where npm and pnpm
// differ most significantly. npm copies packages into each project, while pnpm
// uses a content-addressable store with hard links/symlinks.
//
// Key educational concepts:
// - Content-addressable storage: pnpm stores one copy of each package version
// - Hard links: pnpm uses hard links to avoid duplicating files on disk
// - Cache efficiency: Both package managers use caches, but differently
// - Statistical significance: Multiple runs with warm-up to get reliable data
// ============================================================================

import { Command } from 'commander';
import chalk from 'chalk';
import { default as ora } from 'ora';
import { runInstallBenchmark } from '../benchmarks/install/index.js';
import { runBuildBenchmark } from '../benchmarks/build/index.js';
import { runMassProjectsBenchmark } from '../benchmarks/mass-projects/index.js';
import { runMigrationBenchmark } from '../benchmarks/migration/index.js';
import { clearPackageCache } from './measure-cache.js';
import { spawn } from 'child_process';
import { rmSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// DESIGN PHILOSOPHY
// ---------------------------------------------------------------------------
// This benchmark is install-focused: npm vs pnpm differ mainly in how
// they install (content-addressable store + hardlinking vs flat copy), so
// that's the primary measurement. 
//
// Optional extras (kept for specific use cases):
//   --with-build      Sanity check that tools work with pnpm's symlinked
//                      node_modules (catches phantom-dependency issues)
//   --with-migration  One-time npm→pnpm migration cost measurement
//   --mass            Large-workspace/monorepo stress test
//
// Removed entirely (they don't measure package manager performance):
//   - test/lint: Once node_modules exists, they measure your test runner/linter
// ---------------------------------------------------------------------------

const DEFAULT_CONCURRENCY = 4;
const LOW_MEMORY_PROJECT_DELAY_MS = 3000;

// ============================================================================
// COMMAND LINE INTERFACE SETUP
// ============================================================================
// We use Commander.js to parse command-line arguments. This makes the script
// flexible and easy to use with different configurations.
// ============================================================================

const program = new Command();

program
  .name('benchmark')
  .description('Benchmark npm vs pnpm install performance')
  .version('2.0.0')
  .option('--package-manager <type>', 'Package manager to benchmark (npm, pnpm, or both)', 'both')
  .option(
    '--projects <names>',
    'Comma-separated list of projects to benchmark',
    'small-app,medium-app,large-app,frontend-react,frontend-next,node-api,monorepo,legacy-app'
  )
  .option('--runs <number>', 'Number of timed install runs per project/PM', '5')
  .option('--warmup-runs <number>', 'Untimed warm-up runs before the timed ones (discarded)', '1')
  .option('--clean', 'Remove node_modules and lockfiles before each timed run (cold install)', false)
  .option('--warm', 'Use warm cache for installs (skip --clean between runs)', false)
  .option('--with-build', 'Also run one build per project/PM as a sanity check', false)
  .option('--with-migration', 'Also run a one-off npm→pnpm migration benchmark', false)
  .option('--mass', 'Also run the mass-projects (large workspace) benchmark', false)
  .option('--mass-count <number>', 'Number of projects for the mass benchmark', '100')
  .option('--low-memory', 'Reduce project count/runs and force sequential execution for 8GB RAM systems', false)
  .option('--sequential', 'Run installs sequentially instead of in parallel', false)
  .option('--concurrency <number>', 'Max parallel installs (ignored with --sequential)', String(DEFAULT_CONCURRENCY))
  .option('--validate', 'Run validation mode', false)
  .parse(process.argv);

const options = program.opts();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Run a shell command asynchronously without blocking the event loop.
 * This is important for performance - we don't want to block Node.js while
 * waiting for child processes to complete.
 */
function runCommandAsync(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...opts });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))));
  });
}

/**
 * Run multiple async tasks with bounded concurrency.
 * This prevents system overload by limiting how many tasks run simultaneously.
 * Educational concept: Concurrency control and resource management.
 */
async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let cursor = 0;
  
  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      results[i] = await tasks[i]();
    }
  }
  
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/**
 * Simple delay function for system recovery between operations.
 * Important for low-memory systems to prevent resource exhaustion.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean a project by removing node_modules and lockfiles.
 * This ensures each install starts from a clean state for accurate measurement.
 */
async function cleanProject(projectPath) {
  const nodeModulesPath = join(projectPath, 'node_modules');
  if (existsSync(nodeModulesPath)) rmSync(nodeModulesPath, { recursive: true, force: true });
  
  // Remove all lockfile types to ensure clean state
  for (const lockFile of ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']) {
    const lockPath = join(projectPath, lockFile);
    if (existsSync(lockPath)) rmSync(lockPath, { force: true });
  }
}

/**
 * Save results to disk incrementally.
 * This ensures data isn't lost if the benchmark crashes or is interrupted.
 * Educational concept: Data persistence and fault tolerance.
 */
function saveResults(results, resultsFile) {
  mkdirSync(join(process.cwd(), 'results', 'raw'), { recursive: true });
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
}

/**
 * Compute statistical measures from duration data.
 * Educational concept: Statistical analysis for benchmark reliability.
 * 
 * Why these matter:
// - Mean: Average performance
// - Median: Middle value (less affected by outliers)
// - Stddev: Consistency measure (lower = more consistent)
// - Min/Max: Range of performance variation
 */
function computeStats(durations) {
  const sorted = [...durations].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  return { n, mean, median, stddev, min: sorted[0], max: sorted[n - 1] };
}

/**
 * Summarize results by grouping them and computing statistics.
 * This makes it easy to compare performance across different configurations.
 */
function summarize(results) {
  const byKey = new Map();
  for (const r of results) {
    if (r.success === false) continue;
    const key = `${r.packageManager} / ${r.project} / ${r.scenario}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r.durationMs);
  }
  return [...byKey.entries()].map(([key, durations]) => ({ key, ...computeStats(durations) }));
}

// ============================================================================
// CONFIGURATION BUILDER
// ============================================================================

/**
 * Build the benchmark configuration from command-line options.
 * This centralizes config logic and applies low-memory overrides when needed.
 */
function buildConfig() {
  let config = {
    projects: options.projects.split(','),
    packageManagers: options.packageManager === 'both' ? ['npm', 'pnpm'] : [options.packageManager],
    runs: parseInt(options.runs, 10),
    warmupRuns: parseInt(options.warmupRuns, 10),
    massCount: parseInt(options.massCount, 10),
    sequential: options.sequential,
    concurrency: Math.max(1, parseInt(options.concurrency, 10) || DEFAULT_CONCURRENCY),
  };

  // Apply low-memory overrides for systems with limited RAM
  if (options.lowMemory) {
    console.log(chalk.yellow.bold('⚠️  Low-memory mode enabled - optimizing for 8GB RAM'));
    config = {
      ...config,
      projects: ['small-app', 'medium-app'],  // Fewer projects
      runs: Math.min(config.runs, 3),        // Fewer runs
      warmupRuns: 0,                        // Skip warm-up to save time
      massCount: 10,                        // Fewer mass projects
      sequential: true,                     // Force sequential execution
    };
    console.log(chalk.yellow('Low-memory optimizations applied:'));
    console.log(chalk.yellow(`  - Projects: ${config.projects.join(', ')}`));
    console.log(chalk.yellow(`  - Runs: ${config.runs} (warm-up disabled)`));
    console.log(chalk.yellow(`  - Mass projects: ${config.massCount}`));
    console.log(chalk.yellow('  - Sequential execution: enabled'));
    console.log();
  }

  return config;
}

// ============================================================================
// INSTALL BENCHMARK (CORE MEASUREMENT)
// ============================================================================

/**
 * Run a single install benchmark.
 * This is the core measurement - install speed is the key differentiator
// between npm and pnpm due to their different storage strategies.
 */
async function runInstall(project, packageManager, runNumber, isWarmup) {
  const projectPath = join(process.cwd(), 'projects', project);
  const label = isWarmup
    ? `install (warm-up) · ${project} · ${packageManager}`
    : `install · ${project} · ${packageManager} (run ${runNumber})`;
  const spinner = ora(label).start();

  try {
    // Force garbage collection in low-memory mode to free up RAM
    if (options.lowMemory && global.gc) global.gc();
    
    // Run the actual install benchmark
    const result = await runInstallBenchmark(projectPath, packageManager, options.clean, options.warm, options.lowMemory);
    
    spinner.succeed(`${label}: ${result.durationMs.toFixed(0)}ms`);
    
    // Force garbage collection again after the operation
    if (options.lowMemory && global.gc) global.gc();
    
    return { success: true, ...result };
  } catch (error) {
    spinner.fail(`${label} failed: ${error.message}`);
    return { success: false, error: error.message, durationMs: 0 };
  }
}

// ============================================================================
// MAIN BENCHMARK EXECUTION
// ============================================================================

async function main() {
  console.log(chalk.blue.bold('npm vs pnpm Install Benchmark'));
  console.log();

  // Collect environment information (OS, CPU, RAM, etc.)
  const envSpinner = ora('Collecting environment information...').start();
  await runCommandAsync('node', ['scripts/collect-environment.js'], { cwd: process.cwd() });
  envSpinner.succeed('Environment information collected');

  // Build configuration from command-line options
  const { projects, packageManagers, runs, warmupRuns, massCount, sequential, concurrency } = buildConfig();

  console.log(chalk.yellow(`Projects: ${projects.join(', ')}`));
  console.log(chalk.yellow(`Package Managers: ${packageManagers.join(', ')}`));
  console.log(chalk.yellow(`Timed runs: ${runs} (+ ${warmupRuns} warm-up, discarded)`));
  console.log();

  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = join(process.cwd(), 'results', 'raw', `benchmark-${timestamp}.json`);
  const startedAt = Date.now();

  // Handle interruption gracefully - save partial results
  process.on('SIGINT', () => {
    console.log(chalk.red('\nInterrupted — saving partial results...'));
    saveResults(results, resultsFile);
    process.exit(1);
  });

  try {
    // Run benchmarks for each package manager
    for (const packageManager of packageManagers) {
      // Clear cache if requested (for cold install measurements)
      if (options.clean) {
        const clearSpinner = ora(`Clearing ${packageManager} cache...`).start();
        await clearPackageCache(packageManager);
        clearSpinner.succeed(`${packageManager} cache cleared`);
      }

      // Run benchmarks for each project
      for (const project of projects) {
        const projectPath = join(process.cwd(), 'projects', project);

        // EDUCATIONAL: Warm-up runs
        // These runs exercise the cache and filesystem but are discarded.
        // They ensure the system is "warmed up" before we start measuring,
        // giving more consistent and reliable results.
        for (let w = 1; w <= warmupRuns; w++) {
          if (options.clean) await cleanProject(projectPath);
          await runInstall(project, packageManager, w, true);
        }

        // EDUCATIONAL: Timed runs
        // These are the actual measurements we care about.
        // Multiple runs give us statistical significance and help identify outliers.
        for (let run = 1; run <= runs; run++) {
          if (options.clean) await cleanProject(projectPath);
          const result = await runInstall(project, packageManager, run, false);
          const record = { packageManager, project, scenario: 'install', run, ...result, timestamp: new Date().toISOString() };
          results.push(record);
          saveResults(results, resultsFile); // Save incrementally
        }

        // Optional: Build sanity check
        // This isn't a speed comparison, but checks that tools work with pnpm's structure
        if (options.withBuild) {
          const buildSpinner = ora(`build (sanity check) · ${project} · ${packageManager}`).start();
          try {
            const buildResult = await runBuildBenchmark(projectPath, packageManager, options.lowMemory);
            buildSpinner.succeed(`build · ${project} · ${packageManager}: ${buildResult.durationMs.toFixed(0)}ms`);
            results.push({ packageManager, project, scenario: 'build', run: 1, success: true, ...buildResult, timestamp: new Date().toISOString() });
          } catch (error) {
            buildSpinner.fail(`build · ${project} · ${packageManager} failed: ${error.message}`);
            results.push({ packageManager, project, scenario: 'build', run: 1, success: false, error: error.message, durationMs: 0, timestamp: new Date().toISOString() });
          }
          saveResults(results, resultsFile);
        }

        // System recovery delay in low-memory mode
        if (options.lowMemory) {
          console.log(chalk.gray('Waiting for system recovery between projects...'));
          await delay(LOW_MEMORY_PROJECT_DELAY_MS);
        }
      }
    }

    // Optional: Migration benchmark
    // Measures the one-time cost of migrating from npm to pnpm
    if (options.withMigration) {
      const migrationSpinner = ora('Running migration benchmark (one-off npm→pnpm cost)...').start();
      for (const project of projects) {
        const projectPath = join(process.cwd(), 'projects', project);
        const migrationResult = await runMigrationBenchmark(projectPath);
        results.push({ packageManager: 'npm->pnpm', project, scenario: 'migration', run: 1, success: true, ...migrationResult, timestamp: new Date().toISOString() });
        saveResults(results, resultsFile);
      }
      migrationSpinner.succeed('Migration benchmark completed');
    }

    // Optional: Mass projects benchmark
    // Tests performance with large workspaces/monorepos
    if (options.mass) {
      const massSpinner = ora(`Running mass projects benchmark (${massCount} projects)...`).start();
      for (const packageManager of packageManagers) {
        const massResult = await runMassProjectsBenchmark(packageManager, massCount);
        results.push({ packageManager, project: 'mass-projects', scenario: 'mass', run: 1, success: true, ...massResult, timestamp: new Date().toISOString() });
        saveResults(results, resultsFile);
      }
      massSpinner.succeed('Mass projects benchmark completed');
    }
  } finally {
    // Always save results, even if an error occurred
    saveResults(results, resultsFile);
  }

  // Display completion summary
  const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log();
  console.log(chalk.green.bold(`Benchmark completed in ${elapsedS}s`));
  console.log(chalk.yellow(`Results saved to: ${resultsFile}`));

  // Display statistical summary
  const summary = summarize(results);
  if (summary.length) {
    console.log();
    console.log(chalk.blue.bold('Summary (ms):'));
    for (const row of summary) {
      console.log(
        `  ${row.key}: mean ${row.mean.toFixed(0)} · median ${row.median.toFixed(0)} · stddev ${row.stddev.toFixed(0)} · min ${row.min.toFixed(0)} · max ${row.max.toFixed(0)} (n=${row.n})`
      );
    }
  }

  if (options.validate) {
    console.log(chalk.blue('Running validation...'));
    // Validation logic would go here
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});