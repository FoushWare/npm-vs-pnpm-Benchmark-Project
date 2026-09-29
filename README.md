# npm vs pnpm Benchmark Scripts

Scripts for benchmarking npm vs pnpm performance across multiple scenarios.

## Installation

```bash
npm install
```

## System Requirements

- Node.js >= 22.0.0
- npm >= 9.0.0
- pnpm >= 8.0.0
- 8GB RAM minimum
- 16GB RAM recommended for full benchmarks
- **For filming with OBS:** Use low-memory mode to reduce RAM usage

## Benchmark Steps

### Quick Start (All Tests)
```bash
npm run benchmark:all
```
Runs all benchmarks for all projects and launches live charts.

### Low Memory Mode (For Filming with OBS)
```bash
npm run benchmark:all:low-memory
```
Runs benchmarks with reduced memory usage:
- 1 run per project instead of 3
- Tests only 3 projects (small-app, medium-app, react-app) instead of 6
- Includes memory cleanup between operations
- Still launches live charts for demonstration

**Use this when filming with OBS to prevent RAM exhaustion.**

### Step 1: Clean Everything
```bash
npm run clean:all
```
Clears npm cache, pnpm cache, all node_modules, and all lockfiles.

### Step 2: Test Cold Install (No Cache)

**Test single project:**
```bash
npm run benchmark:cold:npm -- small-app --runs 3
npm run benchmark:cold:pnpm -- small-app --runs 3
```

**Test all projects:**
```bash
npm run benchmark:all:cold
```
Tests cold install for all projects (npm and pnpm, monorepo pnpm only).

### Step 3: Test Warm Cache (With Cache)

**Test single project:**
```bash
npm run benchmark:warm:npm -- small-app --runs 3
npm run benchmark:warm:pnpm -- small-app --runs 3
```

**Test all projects:**
```bash
npm run benchmark:all:warm
```
Tests warm cache for all projects (npm and pnpm, monorepo pnpm only).

### Step 4: Check Disk Usage
```bash
npm run benchmark:disk
```
Shows disk usage for npm and pnpm.

### Step 5: View Live Charts
```bash
npm run charts:live
```
Starts a local server at http://localhost:8080 with interactive charts.

## Available Projects

- `small-app` - Vite + TypeScript
- `medium-app` - Vite + React + TypeScript
- `react-app` - Production React/testing ecosystem
- `next-app` - Next.js framework
- `node-api` - Fastify + TypeScript
- `monorepo` - Workspace-style multi-package application (pnpm only)
- `legacy-app` - Older dependency patterns

**Note:** The monorepo only works with pnpm due to workspace configuration limitations with npm.

## Additional Commands

```bash
# Run all benchmarks (cold, warm, disk, charts)
npm run benchmark:all

# Run all benchmarks in low-memory mode (for filming with OBS)
npm run benchmark:all:low-memory

# Run cold install for all projects
npm run benchmark:all:cold

# Run warm cache for all projects
npm run benchmark:all:warm

# Run full automated benchmark
npm run benchmark

# Mass project benchmarks
npm run benchmark:mass -- --mass-count 100
npm run benchmark:mass -- --mass-count 500
npm run benchmark:mass -- --mass-count 2000

# Generate mass projects
npm run generate:projects:100
npm run generate:projects:500
npm run generate:projects:2000

# Migrate test projects
npm run migrate:to-pnpm

# Show results
npm run results
```

## What the Scripts Measure

- **Cold Install:** No cache, fresh node_modules
- **Warm Cache:** Cache exists, fresh node_modules
- **Disk Usage:** How much space each package manager uses
- **Multiple Projects:** How performance scales with shared dependencies

## Output

Each benchmark shows:
- Average install time
- Disk usage
- Comparison with other package manager (if tested)
- Visual bar charts in terminal

## Memory Optimization Tips

When filming with OBS or running on memory-constrained systems:

1. **Use low-memory mode:** `npm run benchmark:all:low-memory`
   - Reduces runs from 3 to 1 per project
   - Tests only 3 projects instead of 6
   - Includes memory cleanup between operations

2. **Run Node.js with garbage collection enabled:**
   ```bash
   node --expose-gc scripts/benchmark-all.js --low-memory
   ```

3. **Close unnecessary applications** while running benchmarks

4. **Monitor memory usage** with Activity Monitor (macOS) or Task Manager (Windows)

## License

MIT
