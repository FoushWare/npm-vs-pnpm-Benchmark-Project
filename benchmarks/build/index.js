import { execSync } from 'child_process';
import { measureTime } from '../../scripts/measure-time.js';
import { getDirectorySize } from '../../scripts/measure-disk.js';
import { join } from 'path';

export async function runBuildBenchmark(projectPath, packageManager, lowMemory = false) {
  const buildCmd = packageManager === 'npm' 
    ? 'npm run build' 
    : 'pnpm run build';
  
  const result = await measureTime(async () => {
    execSync(buildCmd, { 
      cwd: projectPath, 
      stdio: 'pipe',
      timeout: lowMemory ? 600000 : 300000
    });
  });

  // Measure output size if dist directory exists
  let outputSize = { totalBytes: 0, totalMB: 0 };
  try {
    const distPath = join(projectPath, 'dist');
    outputSize = getDirectorySize(distPath);
  } catch (error) {
    // dist directory might not exist
  }

  return {
    durationMs: result.durationMs,
    success: result.success,
    error: result.error,
    outputSizeBytes: outputSize.totalBytes,
    outputSizeMB: outputSize.totalMB,
    lowMemory
  };
}