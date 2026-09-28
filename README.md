# npm vs pnpm Benchmark Scripts

Scripts for benchmarking npm vs pnpm performance across multiple scenarios.

## Installation

```bash
npm install
```

## System Requirements

- Node.js >= 22.21.1
- npm >= 9.0.0
- pnpm >= 8.0.0
- 8GB RAM minimum
- 16GB RAM recommended for full benchmarks

## Benchmark Steps

### Quick Start (All Tests)
```bash
npm run benchmark:all
```
Runs all benchmarks for all projects and launches live charts.

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

## License

MIT
