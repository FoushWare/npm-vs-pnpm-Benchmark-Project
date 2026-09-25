/**
 * Install Benchmark Module
 * 
 * This module measures package installation performance, which is the key
 * differentiator between npm and pnpm due to their different storage strategies:
 * 
 * npm: Copies packages into each project's node_modules (duplicates files)
 * pnpm: Uses content-addressable store with hard links (shares files)
 * 
 * The performance difference comes from:
 * 1. Network: pnpm downloads fewer packages (shared across projects)
 * 2. Disk: pnpm uses hard links instead of copying files
 * 3. Cache: pnpm's store is more efficient for deduplication
 */

import { execSync } from 'child_process';
import { measureTime } from '../../scripts/measure-time.js';
import { getNodeModulesSize } from '../../scripts/measure-disk.js';
import { join } from 'path';

/**
 * Run an install benchmark for a specific project and package manager.
 * 
 * @param {string} projectPath - Path to the project directory
 * @param {string} packageManager - 'npm' or 'pnpm'
 * @param {boolean} clean - Whether this is a clean install (no cache)
 * @param {boolean} warm - Whether to use warm cache
 * @param {boolean} lowMemory - Whether to apply low-memory optimizations
 * @returns {Object} Benchmark results with timing and disk usage
 */
export async function runInstallBenchmark(projectPath, packageManager, clean = false, warm = false, lowMemory = false) {
  // Build the install command based on package manager
  let installCmd = packageManager === 'npm' 
    ? 'npm install' 
    : 'pnpm install';
  
  // EDUCATIONAL: Low-memory optimizations
  // These flags reduce memory overhead during installation:
  // --prefer-offline: Use cached packages when possible (faster, less network)
  // --no-audit: Skip security audit (saves time and memory)
  // --no-fund: Skip funding message (reduces output processing)
  if (lowMemory) {
    if (packageManager === 'npm') {
      installCmd += ' --prefer-offline --no-audit --no-fund';
    } else {
      installCmd += ' --prefer-offline';
    }
  }
  
  // Measure the installation time
  const result = await measureTime(async () => {
    execSync(installCmd, { 
      cwd: projectPath, 
      stdio: 'pipe', // Suppress output during timing
      timeout: lowMemory ? 600000 : 300000 // Longer timeout for low-memory mode
    });
  });

  // Measure disk usage after installation
  // This helps show the storage efficiency differences
  const diskUsage = getNodeModulesSize(projectPath);

  return {
    durationMs: result.durationMs,
    success: result.success,
    error: result.error,
    diskUsageBytes: diskUsage.totalBytes,
    diskUsageMB: diskUsage.totalMB,
    clean,
    warm,
    lowMemory
  };
}

export async function runCleanInstallBenchmark(projectPath, packageManager) {
  return runInstallBenchmark(projectPath, packageManager, true, false);
}

export async function runWarmInstallBenchmark(projectPath, packageManager) {
  return runInstallBenchmark(projectPath, packageManager, false, true);
}

export async function runLockfileInstallBenchmark(projectPath, packageManager) {
  const installCmd = packageManager === 'npm' 
    ? 'npm ci' 
    : 'pnpm install --frozen-lockfile';
  
  const result = await measureTime(async () => {
    execSync(installCmd, { 
      cwd: projectPath, 
      stdio: 'inherit',
      timeout: 300000
    });
  });

  const diskUsage = getNodeModulesSize(projectPath);

  return {
    durationMs: result.durationMs,
    success: result.success,
    error: result.error,
    diskUsageBytes: diskUsage.totalBytes,
    diskUsageMB: diskUsage.totalMB,
    scenario: 'lockfile'
  };
}