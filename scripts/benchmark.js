#!/usr/bin/env node

// ============================================================================
// npm vs pnpm Benchmark: A Technical Investigation
// ============================================================================
// This benchmark is a technical investigation comparing npm and pnpm performance
// across multiple scenarios. It's not a tutorial declaring a winner — it measures
// real performance to understand when and why differences matter.
//
// Key investigation principles:
// - Fair comparison: Equivalent conditions for both package managers
// - Multiple scenarios: Clean install, warm cache, CI pipelines, mass projects
// - Statistical rigor: Multiple runs with warm-up for reliable data
// - Context matters: Results depend on project size, cache state, workflow
//
// Educational concepts:
// - Content-addressable storage: pnpm stores one copy of each package version
// - Hard links: pnpm uses hard links to avoid duplicating files on disk
// - Cache efficiency: Both package managers use caches, but differently
// - Statistical significance: Multiple runs with warm-up to get reliable data
// ============================================================================

import { Command } from 'commander';
import chalk from 'chalk';
import { runInstallBenchmark, runLockfileInstallBenchmark } from '../benchmarks/install/index.js';
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
  .description('Technical investigation benchmark comparing npm vs pnpm performance across multiple scenarios')
  .version('2.0.0')
  .option('--package-manager <type>', 'Package manager to benchmark (npm, pnpm, or both)', 'both')
  .option(
    '--projects <names>',
    'Comma-separated list of projects to benchmark',
    'small-app,medium-app,react-app,next-app,node-api,legacy-app'
  )
  .option('--runs <number>', 'Number of timed install runs per project/PM', '3')
  .option('--warmup-runs <number>', 'Untimed warm-up runs before the timed ones (discarded)', '0')
  .option('--clean', 'Remove node_modules and lockfiles before each timed run (cold install)', true)
  .option('--warm', 'Also run warm cache installs after cold installs', true)
  .option('--with-build', 'Also run one build per project/PM as a sanity check', false)
  .option('--with-migration', 'Also run a one-off npm→pnpm migration benchmark', false)
  .option('--mass', 'Also run the mass-projects (large workspace) benchmark to test performance at scale', false)
  .option('--mass-count <number>', 'Number of projects for the mass benchmark (100, 500, or 2000)', '100')
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
 * Clean a project by removing node_modules but PRESERVING lockfiles.
 * This ensures fair comparison - both package managers use the same dependency resolution.
 *
 * FAIR COMPARISON PRINCIPLE:
 * - Keep lockfiles: npm uses package-lock.json, pnpm uses pnpm-lock.yaml
 * - Each package manager should use its own lockfile, not regenerate it
 * - This ensures identical dependency resolution for each package manager
 */
async function cleanProject(projectPath, packageManager) {
  const nodeModulesPath = join(projectPath, 'node_modules');
  if (existsSync(nodeModulesPath)) rmSync(nodeModulesPath, { recursive: true, force: true });

  // NOTE: We do NOT delete lockfiles
  // npm will use package-lock.json with 'npm ci'
  // pnpm will use pnpm-lock.yaml with 'pnpm install --frozen-lockfile'
  // This ensures fair comparison with identical dependency resolution
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
    // Include results even if they failed, as long as we have timing data
    // (npm may complete with errors but still provide valid timing)
    if (r.success === false && (!r.durationMs || r.durationMs === 0)) continue;
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
    console.log(chalk.red.bold('⚠️  DEVELOPMENT MODE - REDUCED BENCHMARK'));
    console.log(chalk.red('   This is NOT the full benchmark for video production.'));
    console.log(chalk.red('   Use "npm run benchmark" for the complete benchmark.'));
    console.log();
    console.log(chalk.yellow('Low-memory optimizations applied:'));
    config = {
      ...config,
      projects: ['small-app', 'medium-app'],  // Fewer projects
      runs: Math.min(config.runs, 3),        // Fewer runs
      warmupRuns: 0,                        // Skip warm-up to save time
      massCount: 10,                        // Fewer mass projects
      sequential: true,                     // Force sequential execution
    };
    console.log(chalk.yellow(`  - Projects: ${config.projects.join(', ')}`));
    console.log(chalk.yellow(`  - Runs: ${config.runs} (warm-up disabled)`));
    console.log(chalk.yellow(`  - Mass projects: ${config.massCount}`));
    console.log(chalk.yellow('  - Sequential execution: enabled'));
    console.log();
  }

  return config;
}

// ============================================================================
// PROJECT SIZE CLASSIFICATIONS
// ============================================================================

const PROJECT_SIZES = {
  'small-app': {
    size: 'Small',
    dependencies: 4,
    complexity: 'Very Low',
    techStack: 'Vite + TypeScript',
    description: 'Minimal dependencies (lodash, axios, zod, dayjs)'
  },
  'medium-app': {
    size: 'Medium',
    dependencies: 7,
    complexity: 'Medium',
    techStack: 'Vite + React + TypeScript',
    description: 'React ecosystem with state management'
  },
  'react-app': {
    size: 'Large',
    dependencies: 13,
    complexity: 'High',
    techStack: 'Production React + Testing',
    description: 'Full React ecosystem with comprehensive tooling'
  },
  'next-app': {
    size: 'Large',
    dependencies: 8,
    complexity: 'Very High',
    techStack: 'Next.js Framework',
    description: 'Full-stack framework with SSR/SSG'
  },
  'node-api': {
    size: 'Medium',
    dependencies: 6,
    complexity: 'Medium',
    techStack: 'Fastify + TypeScript',
    description: 'Server-side API with Fastify ecosystem'
  },
  'legacy-app': {
    size: 'Small',
    dependencies: 5,
    complexity: 'Low',
    techStack: 'Simple + Old Patterns',
    description: 'Outdated dependencies (lodash, moment, old axios)'
  }
};

function getProjectInfo(project) {
  return PROJECT_SIZES[project] || {
    size: 'Unknown',
    dependencies: 'Unknown',
    complexity: 'Unknown',
    techStack: 'Unknown',
    description: 'Custom project'
  };
}

// ============================================================================
// INSTALL BENCHMARK (CORE MEASUREMENT)
// ============================================================================

/**
 * Run a single install benchmark.
 * This is the core measurement - install speed is the key differentiator
// between npm and pnpm due to their different storage strategies.
 *
 * FAIR COMPARISON: Uses frozen lockfiles to ensure identical dependency resolution
 * - npm: uses 'npm ci' with package-lock.json
 * - pnpm: uses 'pnpm install --frozen-lockfile' with pnpm-lock.yaml
 */
async function runInstall(project, packageManager, runNumber, isWarmup, scenario = 'cold') {
  const projectPath = join(process.cwd(), 'projects', project);
  const projectInfo = getProjectInfo(project);

  const label = isWarmup
    ? `install (warm-up) · ${project} · ${packageManager}`
    : `install · ${project} · ${packageManager} (run ${runNumber})`;

  // Show project information before install
  console.log(chalk.gray(`   📦 ${projectInfo.size} Project | ${projectInfo.dependencies} deps | ${projectInfo.complexity} complexity`));
  console.log(chalk.gray(`   🛠️  ${projectInfo.techStack}`));
  console.log(chalk.gray(`   📝 ${projectInfo.description}`));

  // Show clear start message instead of spinner
  console.log(chalk.blue(`⏳  ${label}...`));

  try {
    // Clean up for cold install scenario - remove node_modules but keep lockfiles
    if (scenario === 'cold' && !isWarmup) {
      console.log(chalk.gray('   🧹 Cleaning node_modules (preserving lockfiles for fair comparison)...'));
      await cleanProject(projectPath, packageManager);
      console.log(chalk.gray('   ✅ Clean state ready'));
    }

    // Force garbage collection in low-memory mode to free up RAM
    if (options.lowMemory && global.gc) global.gc();

    // Use frozen lockfile install for fair comparison
    const result = await runLockfileInstallBenchmark(projectPath, packageManager);

    // Show completion message with timing
    console.log(chalk.green(`✅ ${label}: ${result.durationMs.toFixed(0)}ms`));

    // Force garbage collection again after the operation
    if (options.lowMemory && global.gc) global.gc();

    return { success: true, ...result };
  } catch (error) {
    console.log(chalk.red(`❌ ${label} failed: ${error.message}`));
    return { success: false, error: error.message, durationMs: 0 };
  }
}

// ============================================================================
// MAIN BENCHMARK EXECUTION
// ============================================================================

async function main() {
  console.log(chalk.blue.bold('npm vs pnpm Benchmark: A Technical Investigation'));
  console.log(chalk.gray('Measuring real performance across multiple scenarios'));
  console.log();

  // Collect environment information (OS, CPU, RAM, etc.)
  console.log(chalk.blue('⏳  Collecting environment information...'));
  await runCommandAsync('node', ['scripts/collect-environment.js'], { cwd: process.cwd() });
  console.log(chalk.green('✅ Environment information collected'));

  // Build configuration from command-line options
  const { projects, packageManagers, runs, warmupRuns, massCount, sequential, concurrency } = buildConfig();
  const testedProjects = projects; // Store for summary

  console.log(chalk.blue.bold('═'.repeat(60)));
  console.log(chalk.blue.bold('⚙️  BENCHMARK CONFIGURATION'));
  console.log(chalk.blue.bold('═'.repeat(60)));
  console.log(chalk.yellow(`📁 Projects:      ${testedProjects.join(', ')}`));
  console.log(chalk.yellow(`📦 Package Mgr:   ${packageManagers.join(', ')}`));
  console.log(chalk.yellow(`🔢 Timed Runs:    ${runs} (+ ${warmupRuns} warm-up, discarded)`));
  console.log(chalk.yellow(`🚀 Execution:     ${sequential ? 'Sequential' : `Parallel (concurrency: ${concurrency})`}`));
  console.log(chalk.blue.bold('═'.repeat(60)));
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
      console.log();
      console.log(chalk.blue.bold(`📦 Testing ${packageManager.toUpperCase()}`));
      console.log(chalk.blue.bold('═'.repeat(60)));
      
      // Clear cache if requested (for cold install measurements)
      if (options.clean) {
        console.log(chalk.blue(`⏳  Clearing ${packageManager} cache...`));
        await clearPackageCache(packageManager);
        console.log(chalk.green(`✅ ${packageManager} cache cleared`));
      }

      // Run benchmarks for each project
      for (const project of testedProjects) {
        const projectPath = join(process.cwd(), 'projects', project);
        const projectInfo = getProjectInfo(project);
        
        console.log();
        console.log(chalk.yellow.bold(`🎯 ${project} (${projectInfo.size})`));
        console.log(chalk.gray('─'.repeat(60)));

        // EDUCATIONAL: Warm-up runs
        // These runs exercise the cache and filesystem but are discarded.
        // They ensure the system is "warmed up" before we start measuring,
        // giving more consistent and reliable results.
        for (let w = 1; w <= warmupRuns; w++) {
          if (options.clean) await cleanProject(projectPath);
          await runInstall(project, packageManager, w, true);
        }

        // EDUCATIONAL: Timed runs - COLD INSTALL
        // Clean install with no cache - worst case scenario
        // node_modules ❌, cache ❌
        console.log();
        console.log(chalk.cyan.bold('❄️  COLD INSTALL (No Cache)'));
        console.log(chalk.gray('   Cache cleared, node_modules removed'));
        console.log(chalk.gray('   Installing with frozen lockfile...'));

        for (let run = 1; run <= runs; run++) {
          const result = await runInstall(project, packageManager, run, false, 'cold');
          const record = { packageManager, project, scenario: 'cold', run, ...result, timestamp: new Date().toISOString() };
          results.push(record);
          saveResults(results, resultsFile); // Save incrementally
        }

        // EDUCATIONAL: Timed runs - CACHED CLEAN INSTALL
        // Install with cache but clean node_modules - typical CI workflow
        // node_modules ❌, cache ✅
        if (options.warm) {
          console.log();
          console.log(chalk.yellow.bold('🔥 CACHED CLEAN INSTALL (With Cache)'));
          console.log(chalk.gray('   Cache available, node_modules removed'));
          console.log(chalk.gray('   Installing with frozen lockfile...'));

          for (let run = 1; run <= runs; run++) {
            const result = await runInstall(project, packageManager, run, false, 'warm');
            const record = { packageManager, project, scenario: 'warm', run, ...result, timestamp: new Date().toISOString() };
            results.push(record);
            saveResults(results, resultsFile); // Save incrementally
          }
        }

        // Optional: Build sanity check
        // This isn't a speed comparison, but checks that tools work with pnpm's structure
        if (options.withBuild) {
          console.log(chalk.blue(`⏳  build (sanity check) · ${project} · ${packageManager}...`));
          try {
            const buildResult = await runBuildBenchmark(projectPath, packageManager, options.lowMemory);
            console.log(chalk.green(`✅ build · ${project} · ${packageManager}: ${buildResult.durationMs.toFixed(0)}ms`));
            results.push({ packageManager, project, scenario: 'build', run: 1, success: true, ...buildResult, timestamp: new Date().toISOString() });
          } catch (error) {
            console.log(chalk.red(`❌ build · ${project} · ${packageManager} failed: ${error.message}`));
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
      console.log(chalk.blue('⏳  Running migration benchmark (one-off npm→pnpm cost)...'));
      for (const project of testedProjects) {
        const projectPath = join(process.cwd(), 'projects', project);
        const migrationResult = await runMigrationBenchmark(projectPath);
        results.push({ packageManager: 'npm->pnpm', project, scenario: 'migration', run: 1, success: true, ...migrationResult, timestamp: new Date().toISOString() });
        saveResults(results, resultsFile);
      }
      console.log(chalk.green('✅ Migration benchmark completed'));
    }

    // Optional: Mass projects benchmark
    // Tests performance with large workspaces/monorepos
    if (options.mass) {
      console.log(chalk.blue(`⏳  Running mass projects benchmark (${massCount} projects)...`));
      for (const packageManager of packageManagers) {
        const massResult = await runMassProjectsBenchmark(packageManager, massCount);
        results.push({ packageManager, project: 'mass-projects', scenario: 'mass', run: 1, success: true, ...massResult, timestamp: new Date().toISOString() });
        saveResults(results, resultsFile);
      }
      console.log(chalk.green('✅ Mass projects benchmark completed'));
    }
  } finally {
    // Always save results, even if an error occurred
    saveResults(results, resultsFile);
  }

  // Display completion summary
  const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log();
  console.log(chalk.green.bold('═'.repeat(60)));
  console.log(chalk.green.bold('📊 BENCHMARK RESULTS SUMMARY'));
  console.log(chalk.green.bold('═'.repeat(60)));
  console.log(chalk.yellow(`⏱️  Total Time: ${elapsedS}s`));
  console.log(chalk.yellow(`📁 Results: ${resultsFile}`));
  console.log();

  // Display statistical summary in a structured table
  const summary = summarize(results);
  
  // Group by package manager for better comparison
  const npmResults = summary.filter(r => r.key.startsWith('npm / '));
  const pnpmResults = summary.filter(r => r.key.startsWith('pnpm / '));
  
  if (summary.length) {
    console.log(chalk.blue.bold('┌─────────────────────────────────────────────────────────────────┐'));
    console.log(chalk.blue.bold('│                    PERFORMANCE STATISTICS                    │'));
    console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
    
    // Display npm results
    if (npmResults.length) {
      console.log(chalk.blue.bold('│ 📦 npm Performance                                                   │'));
      console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
      for (const row of npmResults) {
        console.log(chalk.blue('│') + chalk.white(` ${row.key.padEnd(55)} │`));
        console.log(chalk.blue('│') + chalk.gray(`   Mean: ${row.mean.toFixed(0).padStart(8)}ms │ Median: ${row.median.toFixed(0).padStart(8)}ms │ StdDev: ${row.stddev.toFixed(0).padStart(6)}ms │`));
        console.log(chalk.blue('│') + chalk.gray(`   Min:  ${row.min.toFixed(0).padStart(8)}ms │ Max:    ${row.max.toFixed(0).padStart(8)}ms │ Runs:   ${row.n.toString().padStart(4)}      │`));
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
      }
    }
    
    // Display pnpm results
    if (pnpmResults.length) {
      console.log(chalk.blue.bold('│ 📦 pnpm Performance                                                  │'));
      console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
      for (const row of pnpmResults) {
        console.log(chalk.blue('│') + chalk.white(` ${row.key.padEnd(55)} │`));
        console.log(chalk.blue('│') + chalk.gray(`   Mean: ${row.mean.toFixed(0).padStart(8)}ms │ Median: ${row.median.toFixed(0).padStart(8)}ms │ StdDev: ${row.stddev.toFixed(0).padStart(6)}ms │`));
        console.log(chalk.blue('│') + chalk.gray(`   Min:  ${row.min.toFixed(0).padStart(8)}ms │ Max:    ${row.max.toFixed(0).padStart(8)}ms │ Runs:   ${row.n.toString().padStart(4)}      │`));
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
      }
    }
    
    // Calculate and display comparison
    console.log(chalk.blue.bold('│ ⚡ PERFORMANCE COMPARISON (COLD INSTALL)                           │'));
    console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
    
    for (const project of testedProjects) {
      const projectInfo = getProjectInfo(project);
      const npmRow = npmResults.find(r => r.key.includes(project) && r.key.startsWith('npm / ') && r.key.includes('cold'));
      const pnpmRow = pnpmResults.find(r => r.key.includes(project) && r.key.startsWith('pnpm / ') && r.key.includes('cold'));
      
      if (npmRow && pnpmRow) {
        const speedup = (npmRow.mean / pnpmRow.mean).toFixed(1);
        const timeSaved = (npmRow.mean - pnpmRow.mean).toFixed(0);
        const percentFaster = ((1 - pnpmRow.mean / npmRow.mean) * 100).toFixed(1);
        
        console.log(chalk.blue('│') + chalk.white(` ${project} (${projectInfo.size}):`));
        console.log(chalk.blue('│') + chalk.gray(`   npm:    ${npmRow.mean.toFixed(0).padStart(8)}ms │ pnpm:   ${pnpmRow.mean.toFixed(0).padStart(8)}ms │`));
        
        if (parseFloat(speedup) > 1) {
          console.log(chalk.blue('│') + chalk.green(`   ✅ pnpm is ${speedup}x faster (${percentFaster}% faster, ${timeSaved}ms saved)`));
        } else if (parseFloat(speedup) < 1) {
          console.log(chalk.blue('│') + chalk.yellow(`   ⚠️  npm is ${(1/speedup).toFixed(1)}x faster in this case`));
        } else {
          console.log(chalk.blue('│') + chalk.gray(`   ➡️  Performance is similar`));
        }
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
      }
    }
    
    // Display cold vs warm comparison
    console.log(chalk.blue.bold('│ ❄️  COLD vs WARM INSTALL COMPARISON                                  │'));
    console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
    
    for (const project of testedProjects) {
      const npmCold = npmResults.find(r => r.key.includes(project) && r.key.startsWith('npm / ') && r.key.includes('cold'));
      const npmWarm = npmResults.find(r => r.key.includes(project) && r.key.startsWith('npm / ') && r.key.includes('warm'));
      const pnpmCold = pnpmResults.find(r => r.key.includes(project) && r.key.startsWith('pnpm / ') && r.key.includes('cold'));
      const pnpmWarm = pnpmResults.find(r => r.key.includes(project) && r.key.startsWith('pnpm / ') && r.key.includes('warm'));
      
      if (npmCold && npmWarm) {
        const npmSpeedup = (npmCold.mean / npmWarm.mean).toFixed(1);
        console.log(chalk.blue('│') + chalk.white(` ${project} - npm:`));
        console.log(chalk.blue('│') + chalk.gray(`   Cold: ${npmCold.mean.toFixed(0).padStart(8)}ms │ Warm: ${npmWarm.mean.toFixed(0).padStart(8)}ms │ Cache: ${npmSpeedup}x faster`));
      }
      
      if (pnpmCold && pnpmWarm) {
        const pnpmSpeedup = (pnpmCold.mean / pnpmWarm.mean).toFixed(1);
        console.log(chalk.blue('│') + chalk.white(` ${project} - pnpm:`));
        console.log(chalk.blue('│') + chalk.gray(`   Cold: ${pnpmCold.mean.toFixed(0).padStart(8)}ms │ Warm: ${pnpmWarm.mean.toFixed(0).padStart(8)}ms │ Cache: ${pnpmSpeedup}x faster`));
      }
      console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
    }
    
    console.log(chalk.blue.bold('└─────────────────────────────────────────────────────────────────┘'));
  } else {
    console.log(chalk.yellow('⚠️  No results to display'));
  }

  // Display conclusion based on results
  console.log();
  console.log(chalk.blue.bold('═'.repeat(60)));
  console.log(chalk.blue.bold('🎯 RAW RESULTS (No Interpretation)'));
  console.log(chalk.blue.bold('═'.repeat(60)));

  if (npmResults.length > 0 && pnpmResults.length > 0) {
    // Filter for cold install results only for comparison
    const npmColdResults = npmResults.filter(r => r.key.includes('cold'));
    const pnpmColdResults = pnpmResults.filter(r => r.key.includes('cold'));

    const npmMean = npmColdResults.reduce((sum, r) => sum + r.mean, 0) / npmColdResults.length;
    const pnpmMean = pnpmColdResults.reduce((sum, r) => sum + r.mean, 0) / pnpmColdResults.length;
    const overallSpeedup = (npmMean / pnpmMean).toFixed(1);
    const overallPercentFaster = ((1 - pnpmMean / npmMean) * 100).toFixed(1);

    // Count wins/losses
    let npmWins = 0;
    let pnpmWins = 0;
    let ties = 0;

    for (const project of testedProjects) {
      const npmRow = npmResults.find(r => r.key.includes(project) && r.key.startsWith('npm / ') && r.key.includes('cold'));
      const pnpmRow = pnpmResults.find(r => r.key.includes(project) && r.key.startsWith('pnpm / ') && r.key.includes('cold'));

      if (npmRow && pnpmRow) {
        if (npmRow.mean < pnpmRow.mean) npmWins++;
        else if (pnpmRow.mean < npmRow.mean) pnpmWins++;
        else ties++;
      }
    }

    console.log();
    console.log(chalk.gray('📊 Performance Breakdown:'));
    console.log(chalk.gray(`   npm wins: ${npmWins} | pnpm wins: ${pnpmWins} | ties: ${ties}`));
    console.log();
    console.log(chalk.gray('📊 Overall Averages (Cold Install):'));
    console.log(chalk.gray(`   npm:    ${npmMean.toFixed(0)}ms`));
    console.log(chalk.gray(`   pnpm:   ${pnpmMean.toFixed(0)}ms`));
    console.log(chalk.gray(`   Difference: ${(npmMean - pnpmMean).toFixed(0)}ms`));
    console.log(chalk.gray(`   Speedup: ${overallSpeedup}x`));
    console.log(chalk.gray(`   % Faster: ${overallPercentFaster}%`));
  } else {
    console.log(chalk.yellow('⚠️  Insufficient data for comparison'));
    console.log(chalk.white('   Run benchmarks with both npm and pnpm to see comparison.'));
  }
  
  console.log();
  console.log(chalk.gray('💡 Context matters: Results vary by cache state, project size,'));
  console.log(chalk.gray('   network conditions, and workflow patterns. Test multiple'));
  console.log(chalk.gray('   scenarios to get a complete picture for your use case.'));
  console.log();
  console.log(chalk.blue.bold('═'.repeat(60)));
  
  // Automatically generate terminal charts after benchmark
  console.log();
  console.log(chalk.blue('⏳  Generating visual charts...'));
  try {
    await runCommandAsync('node', ['scripts/generate-terminal-charts.js'], { cwd: process.cwd() });
    console.log(chalk.green('✅ Terminal charts generated'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Terminal chart generation skipped (optional feature)'));
  }
  
  console.log();
  console.log(chalk.gray('💡 Tip: Run "npm run charts:browser" to generate interactive HTML charts'));
  console.log(chalk.blue.bold('═'.repeat(60)));

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