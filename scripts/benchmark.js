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
import { execSync } from 'child_process';
import { rmSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('benchmark')
  .description('Run npm vs pnpm benchmarks')
  .version('1.0.0');

program
  .option('--package-manager <type>', 'Package manager to benchmark (npm, pnpm, or both)', 'both')
  .option('--projects <names>', 'Comma-separated list of projects to benchmark', 'small-app,medium-app,large-app,frontend-react,frontend-next,node-api,monorepo,legacy-app')
  .option('--runs <number>', 'Number of runs per benchmark', '3')
  .option('--clean', 'Clean node_modules before benchmarking', false)
  .option('--warm', 'Use warm cache for benchmarking', false)
  .option('--mass-count <number>', 'Number of projects for mass benchmark', '100')
  .option('--scenario <type>', 'Benchmark scenario (install, build, test, lint, mass, migration, all)', 'all')
  .option('--validate', 'Run validation mode', false)
  .option('--low-memory', 'Enable low-memory mode for 8GB RAM systems', false)
  .option('--max-memory <number>', 'Max memory in MB per process (default: auto)', '0')
  .option('--sequential', 'Run benchmarks sequentially instead of parallel', false)
  .parse(process.argv);

const options = program.opts();

async function cleanProject(projectPath) {
  const nodeModulesPath = join(projectPath, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    rmSync(nodeModulesPath, { recursive: true, force: true });
  }
  
  const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
  lockFiles.forEach(lockFile => {
    const lockPath = join(projectPath, lockFile);
    if (existsSync(lockPath)) {
      rmSync(lockPath, { force: true });
    }
  });
}

async function runBenchmark(project, packageManager, scenario, runNumber) {
  const projectPath = join(process.cwd(), 'projects', project);
  const spinner = ora(`Running ${scenario} benchmark for ${project} with ${packageManager} (run ${runNumber})`).start();

  try {
    // Force garbage collection before each benchmark in low-memory mode
    if (options.lowMemory && global.gc) {
      global.gc();
    }

    let result;
    switch (scenario) {
      case 'install':
        result = await runInstallBenchmark(projectPath, packageManager, options.clean, options.warm, options.lowMemory);
        break;
      case 'build':
        result = await runBuildBenchmark(projectPath, packageManager, options.lowMemory);
        break;
      case 'test':
        result = await runTestBenchmark(projectPath, packageManager, options.lowMemory);
        break;
      case 'lint':
        result = await runLintBenchmark(projectPath, packageManager, options.lowMemory);
        break;
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    spinner.succeed(`${scenario} completed in ${result.durationMs.toFixed(2)}ms`);
    
    // Force garbage collection after each benchmark in low-memory mode
    if (options.lowMemory && global.gc) {
      global.gc();
    }
    
    return result;
  } catch (error) {
    spinner.fail(`${scenario} failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message, durationMs: 0 };
  }
}

async function main() {
  console.log(chalk.blue.bold('npm vs pnpm Benchmark System'));
  console.log();

  // Collect environment
  const envSpinner = ora('Collecting environment information...').start();
  execSync('node scripts/collect-environment.js', { cwd: process.cwd(), stdio: 'inherit' });
  envSpinner.succeed('Environment information collected');

  // Apply low-memory configuration
  let projects = options.projects.split(',');
  let packageManagers = options.packageManager === 'both' ? ['npm', 'pnpm'] : [options.packageManager];
  let runs = parseInt(options.runs);
  let scenarios = options.scenario === 'all' ? ['install', 'build', 'test', 'lint'] : [options.scenario];
  let massCount = parseInt(options.massCount);

  if (options.lowMemory) {
    console.log(chalk.yellow.bold('⚠️  Low-memory mode enabled - optimizing for 8GB RAM'));
    console.log();
    
    // Reduce project count to just 2 representative projects
    projects = ['small-app', 'medium-app'];
    
    // Reduce runs to 1 for quick testing
    runs = 1;
    
    // Focus on install scenario only (most critical)
    scenarios = ['install'];
    
    // Dramatically reduce mass projects count
    massCount = 10;
    
    // Force sequential execution
    options.sequential = true;
    
    console.log(chalk.yellow('Low-memory optimizations applied:'));
    console.log(chalk.yellow(`  - Projects: ${projects.join(', ')}`));
    console.log(chalk.yellow(`  - Runs: ${runs}`));
    console.log(chalk.yellow(`  - Scenarios: ${scenarios.join(', ')}`));
    console.log(chalk.yellow(`  - Mass projects: ${massCount}`));
    console.log(chalk.yellow(`  - Sequential execution: enabled`));
    console.log();
  }

  console.log(chalk.yellow(`Projects: ${projects.join(', ')}`));
  console.log(chalk.yellow(`Package Managers: ${packageManagers.join(', ')}`));
  console.log(chalk.yellow(`Runs: ${runs}`));
  console.log(chalk.yellow(`Scenarios: ${scenarios.join(', ')}`));
  console.log();

  const results = [];

  for (const packageManager of packageManagers) {
    if (options.clean) {
      const clearSpinner = ora(`Clearing ${packageManager} cache...`).start();
      await clearPackageCache(packageManager);
      clearSpinner.succeed(`${packageManager} cache cleared`);
    }

    for (const project of projects) {
      const projectPath = join(process.cwd(), 'projects', project);
      
      if (options.clean) {
        await cleanProject(projectPath);
      }

      for (const scenario of scenarios) {
        for (let run = 1; run <= runs; run++) {
          const result = await runBenchmark(project, packageManager, scenario, run);
          results.push({
            packageManager,
            project,
            scenario,
            run,
            ...result,
            timestamp: new Date().toISOString()
          });
          
          // Add delay between runs in low-memory mode to allow system to recover
          if (options.lowMemory && run < runs) {
            console.log(chalk.gray('Waiting 2 seconds for system recovery...'));
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // Add delay between projects in low-memory mode
      if (options.lowMemory) {
        console.log(chalk.gray('Waiting 3 seconds for system recovery between projects...'));
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // Handle mass projects benchmark
  if (options.scenario === 'mass' || options.scenario === 'all') {
    const massSpinner = ora(`Running mass projects benchmark (${massCount} projects)...`).start();
    
    for (const packageManager of packageManagers) {
      const massResult = await runMassProjectsBenchmark(packageManager, massCount);
      results.push({
        packageManager,
        project: 'mass-projects',
        scenario: 'mass',
        run: 1,
        ...massResult,
        timestamp: new Date().toISOString()
      });
    }
    
    massSpinner.succeed('Mass projects benchmark completed');
  }

  // Handle migration benchmark
  if (options.scenario === 'migration' || options.scenario === 'all') {
    const migrationSpinner = ora('Running migration benchmark...').start();
    
    for (const project of projects) {
      const projectPath = join(process.cwd(), 'projects', project);
      const migrationResult = await runMigrationBenchmark(projectPath);
      results.push({
        packageManager: 'npm->pnpm',
        project,
        scenario: 'migration',
        run: 1,
        ...migrationResult,
        timestamp: new Date().toISOString()
      });
    }
    
    migrationSpinner.succeed('Migration benchmark completed');
  }

  // Save results
  const resultsDir = join(process.cwd(), 'results', 'raw');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = join(resultsDir, `benchmark-${timestamp}.json`);
  
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  console.log();
  console.log(chalk.green.bold('Benchmark completed!'));
  console.log(chalk.yellow(`Results saved to: ${resultsFile}`));
  
  if (options.validate) {
    console.log(chalk.blue('Running validation...'));
    // Validation logic would go here
  }
}

main().catch(console.error);