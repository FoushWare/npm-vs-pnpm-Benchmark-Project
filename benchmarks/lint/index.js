import { execSync } from 'child_process';
import { measureTime } from '../../scripts/measure-time.js';

export async function runLintBenchmark(projectPath, packageManager) {
  const lintCmd = packageManager === 'npm' 
    ? 'npm run lint' 
    : 'pnpm run lint';
  
  const result = await measureTime(async () => {
    try {
      execSync(lintCmd, { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 300000
      });
    } catch (error) {
      // Lint might fail due to linting errors, but we still want to measure time
      if (error.status !== 0) {
        // Treat lint errors as warnings, not failures
        // console.warn(`Lint completed with issues: ${error.message}`);
      }
    }
  });

  return {
    durationMs: result.durationMs,
    success: true, // Always successful for timing purposes
    error: result.error
  };
}