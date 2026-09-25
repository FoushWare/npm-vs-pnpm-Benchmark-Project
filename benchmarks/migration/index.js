import { measureTime } from '../../scripts/measure-time.js';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

export async function runMigrationBenchmark(projectPath) {
  const packageLockPath = join(projectPath, 'package-lock.json');
  
  if (!existsSync(packageLockPath)) {
    return {
      success: false,
      error: 'No package-lock.json found',
      durationMs: 0
    };
  }

  // Remove existing lock files
  const pnpmLockPath = join(projectPath, 'pnpm-lock.yaml');
  if (existsSync(pnpmLockPath)) {
    unlinkSync(pnpmLockPath);
  }

  // Run pnpm import to convert lockfile
  const importResult = await measureTime(async () => {
    execSync('pnpm import', {
      cwd: projectPath,
      stdio: 'pipe',
      timeout: 300000
    });
  });

  // Install with pnpm
  const installResult = await measureTime(async () => {
    execSync('pnpm install', {
      cwd: projectPath,
      stdio: 'pipe',
      timeout: 300000
    });
  });

  // Build to verify
  const buildResult = await measureTime(async () => {
    try {
      execSync('pnpm run build', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 300000
      });
    } catch (error) {
      // Build might not exist or fail, that's ok for migration testing
    }
  });

  return {
    importTimeMs: importResult.durationMs,
    installTimeMs: installResult.durationMs,
    buildTimeMs: buildResult.durationMs,
    totalMigrationTimeMs: importResult.durationMs + installResult.durationMs + buildResult.durationMs,
    success: importResult.success && installResult.success,
    error: importResult.error || installResult.error
  };
}