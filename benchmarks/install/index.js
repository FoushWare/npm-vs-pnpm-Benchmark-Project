import { execSync } from 'child_process';
import { measureTime } from '../../scripts/measure-time.js';
import { getNodeModulesSize } from '../../scripts/measure-disk.js';
import { join } from 'path';

export async function runInstallBenchmark(projectPath, packageManager, clean = false, warm = false, lowMemory = false) {
  let installCmd = packageManager === 'npm' 
    ? 'npm install' 
    : 'pnpm install';
  
  // Add low-memory optimizations
  if (lowMemory) {
    if (packageManager === 'npm') {
      installCmd += ' --prefer-offline --no-audit --no-fund';
    } else {
      installCmd += ' --prefer-offline';
    }
  }
  
  const result = await measureTime(async () => {
    execSync(installCmd, { 
      cwd: projectPath, 
      stdio: 'pipe',
      timeout: lowMemory ? 600000 : 300000 // Longer timeout for low-memory mode
    });
  });

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