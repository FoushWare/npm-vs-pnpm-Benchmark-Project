import { measureTime } from '../../scripts/measure-time.js';
import { getDirectorySize } from '../../scripts/measure-disk.js';
import { getPackageCacheSize } from '../../scripts/measure-cache.js';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

export async function runMassProjectsBenchmark(packageManager, projectCount) {
  const massProjectsDir = join(process.cwd(), 'projects', 'mass-generated');
  
  // Generate mass projects if they don't exist
  let generationTimeMs = 0;
  if (!existsSync(join(massProjectsDir, 'package.json'))) {
    const generateResult = await measureTime(async () => {
      execSync(`node scripts/generate-projects.js --count ${projectCount}`, {
        cwd: process.cwd(),
        stdio: 'inherit',
        timeout: 600000
      });
    });
    generationTimeMs = generateResult.durationMs;
  }

  // Install all projects
  const installCmd = packageManager === 'npm' 
    ? 'npm install' 
    : 'pnpm install';
  
  const installResult = await measureTime(async () => {
    execSync(installCmd, {
      cwd: massProjectsDir,
      stdio: 'inherit',
      timeout: 600000
    });
  });

  // Measure total disk usage
  const diskUsage = getDirectorySize(massProjectsDir);
  
  // Measure cache size
  const cacheSize = getPackageCacheSize(packageManager);

  return {
    projectCount,
    generationTimeMs,
    installTimeMs: installResult.durationMs,
    totalDiskUsageBytes: diskUsage.totalBytes,
    totalDiskUsageMB: diskUsage.totalMB,
    cacheSizeBytes: cacheSize.totalBytes,
    cacheSizeMB: cacheSize.totalMB,
    success: installResult.success,
    error: installResult.error
  };
}