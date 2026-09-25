import { execSync } from 'child_process';
import { measureTime } from '../../scripts/measure-time.js';

export async function runTestBenchmark(projectPath, packageManager) {
  const testCmd = packageManager === 'npm' 
    ? 'npm run test -- --run' 
    : 'pnpm run test -- --run';
  
  const result = await measureTime(async () => {
    execSync(testCmd, { 
      cwd: projectPath, 
      stdio: 'pipe',
      timeout: 300000
    });
  });

  return {
    durationMs: result.durationMs,
    success: result.success,
    error: result.error
  };
}