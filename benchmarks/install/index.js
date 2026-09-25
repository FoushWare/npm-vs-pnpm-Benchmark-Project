import { execSync } from 'child_process';
import { measureTime } from '../../scripts/measure-time.js';
import { getNodeModulesSize } from '../../scripts/measure-disk.js';
import { join } from 'path';

export async function runInstallBenchmark(projectPath, packageManager, clean = false, warm = false) {
  const installCmd = packageManager === 'npm' 
    ? 'npm install' 
    : 'pnpm install';
  
  const result = await measureTime(async () => {
    execSync(installCmd, { 
      cwd: projectPath, 
      stdio: 'pipe',
      timeout: 300000 // 5 minute timeout
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
    warm
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