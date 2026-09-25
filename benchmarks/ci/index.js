import { measureTime } from '../../scripts/measure-time.js';
import { execSync } from 'child_process';
import { join } from 'path';

export async function runCIBenchmark(projectPath, packageManager, scenario) {
  const scenarios = {
    'cold': async () => {
      // Simulate cold CI - clean install, build, test
      const installCmd = packageManager === 'npm' ? 'npm ci' : 'pnpm install --frozen-lockfile';
      const buildCmd = packageManager === 'npm' ? 'npm run build' : 'pnpm run build';
      const testCmd = packageManager === 'npm' ? 'npm run test -- --run' : 'pnpm run test -- --run';

      const installResult = await measureTime(async () => {
        execSync(installCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      const buildResult = await measureTime(async () => {
        execSync(buildCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      const testResult = await measureTime(async () => {
        execSync(testCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      return {
        installTimeMs: installResult.durationMs,
        buildTimeMs: buildResult.durationMs,
        testTimeMs: testResult.durationMs,
        totalTimeMs: installResult.durationMs + buildResult.durationMs + testResult.durationMs
      };
    },
    'warm': async () => {
      // Simulate warm CI with cache - install should be faster
      const installCmd = packageManager === 'npm' ? 'npm install' : 'pnpm install';
      const buildCmd = packageManager === 'npm' ? 'npm run build' : 'pnpm run build';
      const testCmd = packageManager === 'npm' ? 'npm run test -- --run' : 'pnpm run test -- --run';

      const installResult = await measureTime(async () => {
        execSync(installCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      const buildResult = await measureTime(async () => {
        execSync(buildCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      const testResult = await measureTime(async () => {
        execSync(testCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      return {
        installTimeMs: installResult.durationMs,
        buildTimeMs: buildResult.durationMs,
        testTimeMs: testResult.durationMs,
        totalTimeMs: installResult.durationMs + buildResult.durationMs + testResult.durationMs
      };
    },
    'no-deps-changed': async () => {
      // Simulate CI with no dependency changes - skip install
      const buildCmd = packageManager === 'npm' ? 'npm run build' : 'pnpm run build';
      const testCmd = packageManager === 'npm' ? 'npm run test -- --run' : 'pnpm run test -- --run';

      const buildResult = await measureTime(async () => {
        execSync(buildCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      const testResult = await measureTime(async () => {
        execSync(testCmd, { cwd: projectPath, stdio: 'inherit', timeout: 300000 });
      });

      return {
        installTimeMs: 0,
        buildTimeMs: buildResult.durationMs,
        testTimeMs: testResult.durationMs,
        totalTimeMs: buildResult.durationMs + testResult.durationMs
      };
    }
  };

  const scenarioFn = scenarios[scenario];
  if (!scenarioFn) {
    throw new Error(`Unknown CI scenario: ${scenario}`);
  }

  return await scenarioFn();
}