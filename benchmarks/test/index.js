import { execSync } from 'child_process';
import { measureTime } from '../../scripts/measure-time.js';

export async function runTestBenchmark(projectPath, packageManager, lowMemory = false) {
  const testCmd = packageManager === 'npm' 
    ? 'npm run test -- --run' 
    : 'pnpm run test -- --run';
  
  const result = await measureTime(async () => {
    execSync(testCmd, { 
      cwd: projectPath, 
      stdio: 'pipe',
      timeout: lowMemory ? 600000 : 300000
    });
  });

  return {
    durationMs: result.durationMs,
    success: result.success,
    error: result.error,
    lowMemory
  };
}