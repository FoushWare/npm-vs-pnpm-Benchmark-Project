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
npm run benchmark:cold:npm -- small-app --runs 3
npm run benchmark:cold:pnpm -- small-app --runs 3
npm run benchmark:cold:npm -- medium-app --runs 3
npm run benchmark:cold:pnpm -- medium-app --runs 3
npm run benchmark:cold:npm -- react-app --runs 3
npm run benchmark:cold:pnpm -- react-app --runs 3
npm run benchmark:cold:npm -- next-app --runs 3
npm run benchmark:cold:pnpm -- next-app --runs 3
npm run benchmark:cold:npm -- node-api --runs 3
npm run benchmark:cold:pnpm -- node-api --runs 3
npm run benchmark:cold:npm -- legacy-app --runs 3
npm run benchmark:cold:pnpm -- legacy-app --runs 3
npm run benchmark:cold:pnpm -- monorepo --runs 3
```

Tests package manager performance with no cache. Shows comparison charts after both tests.

### Step 3: Test Warm Cache (With Cache)

**Test single project:**
```bash
npm run benchmark:warm:npm -- small-app --runs 3
npm run benchmark:warm:pnpm -- small-app --runs 3
```

**Test all projects:**
```bash
npm run benchmark:warm:npm -- small-app --runs 3
npm run benchmark:warm:pnpm -- small-app --runs 3
npm run benchmark:warm:npm -- medium-app --runs 3
npm run benchmark:warm:pnpm -- medium-app --runs 3
npm run benchmark:warm:npm -- react-app --runs 3
npm run benchmark:warm:pnpm -- react-app --runs 3
npm run benchmark:warm:npm -- next-app --runs 3
npm run benchmark:warm:pnpm -- next-app --runs 3
npm run benchmark:warm:npm -- node-api --runs 3
npm run benchmark:warm:pnpm -- node-api --runs 3
npm run benchmark:warm:npm -- legacy-app --runs 3
npm run benchmark:warm:pnpm -- legacy-app --runs 3
npm run benchmark:warm:pnpm -- monorepo --runs 3
```

Tests package manager performance with cache populated. Shows comparison charts after both tests.

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
- `monorepo` - Workspace-style multi-package application (npm may have workspace limitations)
- `legacy-app` - Older dependency patterns

**Note:** The monorepo project may have npm workspace limitations. pnpm handles this configuration successfully.

## Additional Commands

```bash
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
