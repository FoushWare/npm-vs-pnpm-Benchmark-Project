# npm vs pnpm Benchmark System

A comprehensive, reproducible benchmark system to scientifically compare npm and pnpm performance across multiple scenarios including install speed, disk usage, build performance, CI behavior, and multi-project dependency sharing.

## 🎯 Purpose

This benchmark system provides objective, data-driven comparisons between npm and pnpm package managers. It focuses on measuring real-world performance characteristics without declaring a "winner" - the data speaks for itself.

## 📋 Features

- **Multiple Test Projects**: 8 realistic projects of varying complexity
- **Comprehensive Scenarios**: Install, build, test, lint, CI, and migration benchmarks
- **Mass Project Testing**: Test with 10, 100, 500, or 2000+ projects
- **Disk Usage Analysis**: Measure storage efficiency and cache behavior
- **CI Pipeline Benchmarking**: GitHub Actions workflows for both package managers
- **Statistical Analysis**: Multiple runs with min, max, avg, median, and standard deviation
- **Visual Reports**: Generate charts and detailed markdown reports
- **Environment Tracking**: Capture and document all system specifications
- **Low-Memory Mode**: Optimized configuration for systems with 8GB RAM or less

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.21.1
- npm >= 9.0.0
- pnpm >= 8.0.0
- **Recommended**: 16GB+ RAM for full benchmarks
- **Minimum**: 8GB RAM with low-memory mode

### Installation

```bash
# Clone the repository
git clone git@github.com:FoushWare/npm-vs-pnpm-Benchmark-Project.git
cd npm-vs-pnpm-Benchmark-Project

# Install benchmark dependencies
npm install
```

### Running Benchmarks

```bash
# Run all benchmarks with both package managers
npm run benchmark:both

# Run benchmarks with specific package manager
npm run benchmark:npm
npm run benchmark:pnpm

# 🚀 Low-memory mode (optimized for 8GB RAM systems)
npm run benchmark:low-memory

# Run specific scenarios
node scripts/benchmark.js --scenario install
node scripts/benchmark.js --scenario build
node scripts/benchmark.js --scenario test

# Run with specific projects
node scripts/benchmark.js --projects small-app,medium-app

# Run with multiple runs for statistical significance
node scripts/benchmark.js --runs 5

# Clean install (removes node_modules before benchmarking)
node scripts/benchmark.js --clean

# Warm cache benchmark
node scripts/benchmark.js --warm

# Mass project benchmark
node scripts/benchmark.js --scenario mass --mass-count 100
```

### Low-Memory Mode

For systems with limited RAM (8GB or less), use the low-memory mode:

```bash
npm run benchmark:low-memory
```

**Low-memory optimizations:**
- Reduced project count (2 representative projects)
- Single run per benchmark
- Focused on install scenario (most critical comparison)
- Reduced mass projects count (10 instead of 100)
- Extended timeouts for slow operations
- Recovery delays between operations
- Optimized package manager flags for reduced overhead

**Manual low-memory configuration:**
```bash
node scripts/benchmark.js --package-manager both --low-memory
```

### Generating Reports

```bash
# Generate summary and markdown report
npm run benchmark:report

# Generate visual charts
npm run benchmark:charts

# Collect environment information
npm run benchmark:environment
```

## 📁 Project Structure

```
.
├── projects/                    # Test projects
│   ├── small-app/              # Minimal dependencies
│   ├── medium-app/             # React application
│   ├── large-app/              # Full-stack React app
│   ├── frontend-react/         # Production React app
│   ├── frontend-next/          # Next.js application
│   ├── node-api/               # Fastify API
│   ├── monorepo/               # Workspace setup
│   └── legacy-app/             # Older dependencies
├── benchmarks/                 # Benchmark modules
│   ├── install/                # Installation benchmarks
│   ├── build/                  # Build performance
│   ├── test/                   # Test execution
│   ├── lint/                   # Lint performance
│   ├── mass-projects/          # Multi-project benchmarks
│   ├── migration/              # Migration testing
│   └── ci/                     # CI scenario benchmarks
├── scripts/                    # Orchestration scripts
│   ├── benchmark.js            # Main CLI
│   ├── collect-environment.js  # Environment detection
│   ├── measure-time.js         # Timing utilities
│   ├── measure-disk.js         # Disk usage measurement
│   ├── measure-cache.js        # Cache measurement
│   ├── generate-projects.js    # Mass project generator
│   ├── generate-report.js      # Report generation
│   └── generate-charts.js      # Chart generation
├── results/                    # Benchmark results
│   ├── raw/                    # Raw JSON results
│   ├── charts/                 # Generated charts
│   ├── summary.json            # Aggregated statistics
│   └── report.md               # Human-readable report
├── .github/workflows/          # CI workflows
│   ├── benchmark-npm.yml       # npm CI benchmark
│   └── benchmark-pnpm.yml      # pnpm CI benchmark
└── package.json                # Root configuration
```

## 🧪 Test Projects

### Small App
- **Dependencies**: lodash, axios, zod, dayjs
- **Purpose**: Minimal dependency set for baseline measurement
- **Use Case**: Simple utilities and data processing

### Medium App
- **Dependencies**: React, React Router, Axios, Zustand, date-fns, zod
- **Purpose**: Typical single-page application
- **Use Case**: React SPA with state management

### Large App
- **Dependencies**: React, MUI, React Query, Axios, extensive tooling
- **Purpose**: Complex production application
- **Use Case**: Enterprise-grade React application

### Frontend React
- **Dependencies**: React ecosystem with form handling, routing, queries
- **Purpose**: Realistic modern React application
- **Use Case**: E-commerce or SaaS frontend

### Frontend Next
- **Dependencies**: Next.js, React, server-side rendering stack
- **Purpose**: Full-stack Next.js application
- **Use Case**: SEO-optimized web application

### Node API
- **Dependencies**: Fastify, validation, logging, testing
- **Purpose**: Backend API server
- **Use Case**: RESTful API service

### Monorepo
- **Structure**: 3 apps + 3 packages with workspace configuration
- **Purpose**: Workspace dependency sharing
- **Use Case**: Multi-package projects

### Legacy App
- **Dependencies**: Older package versions (moment, bluebird, request)
- **Purpose**: Compatibility testing
- **Use Case**: Migration scenarios

## 📊 Benchmark Scenarios

### Installation Benchmarks
- **Clean Install**: Fresh installation with no cache
- **Warm Install**: Installation with existing cache
- **Lockfile Install**: `npm ci` vs `pnpm install --frozen-lockfile`
- **Repeated Install**: Multiple consecutive installations

### Build Benchmarks
- **Build Time**: Measure build execution time
- **Output Size**: Measure build output disk usage
- **Tool Overhead**: Distinguish package manager overhead from build time

### Test Benchmarks
- **Test Execution**: Measure test suite performance
- **Success Tracking**: Track test pass/fail rates

### Lint Benchmarks
- **Lint Time**: Measure linting performance
- **Tool Overhead**: Track package manager vs lint tool overhead

### Mass Project Benchmarks
- **Multi-Project Install**: Install 10-2000+ projects
- **Total Disk Footprint**: Measure aggregate disk usage
- **Cache Efficiency**: Compare cache/store behavior
- **Dependency Duplication**: Analyze shared dependencies

### CI Benchmarks
- **Cold CI**: Fresh CI environment (no cache)
- **Warm CI**: CI with cache restoration
- **No Dependency Changes**: Skip install step
- **Monorepo CI**: Workspace-specific CI behavior

### Migration Benchmarks
- **Lockfile Conversion**: npm to pnpm lockfile conversion
- **Post-Migration Validation**: Build and test after migration
- **Compatibility Detection**: Identify potential issues

## 📈 Interpreting Results

### Key Metrics

- **Duration (ms)**: Time taken for operation
- **Disk Usage (MB)**: Storage consumed
- **Success Rate**: Percentage of successful runs
- **Statistics**: Min, max, avg, median, standard deviation

### Factors Affecting Results

1. **Network Conditions**: Installation times vary with network speed
2. **Disk Type**: SSD vs HDD affects all operations
3. **CPU Performance**: Build and install times depend on CPU
4. **Memory**: Available RAM affects performance
5. **Cache State**: Warm vs cold cache significantly impacts results
6. **Project Complexity**: Dependency count and structure affect all metrics

### Best Practices

- Run multiple iterations (3-5) for statistical significance
- Compare similar scenarios (e.g., clean install vs clean install)
- Consider your specific use case when interpreting results
- Review the methodology document for detailed fairness guidelines

## 🔧 Configuration

### Environment Variables

No environment variables are required, but the system detects:
- Node.js version
- npm version
- pnpm version
- OS and hardware specifications
- Storage type (SSD/HDD)

### Customization

You can modify:
- Test project dependencies in `projects/*/package.json`
- Benchmark parameters in `scripts/benchmark.js`
- Chart styling in `scripts/generate-charts.js`
- CI workflow scenarios in `.github/workflows/`

## 🤝 Contributing

To ensure fair and reproducible benchmarks:

1. Document any changes to test projects
2. Maintain equivalent functionality across package managers
3. Run full validation after changes
4. Update methodology documentation if changing comparison approach

## 📄 Methodology

See [BENCHMARK-METHODOLOGY.md](BENCHMARK-METHODOLOGY.md) for detailed information about:
- Fairness rules and comparison methodology
- Reproducibility guidelines
- Measurement techniques
- Statistical analysis approach

## ⚠️ Limitations

1. **Network Variability**: Installation times can vary due to network conditions
2. **Platform Differences**: Results vary across operating systems
3. **Version Specific**: Results are specific to tested package manager versions
4. **Cache Behavior**: Cache effectiveness varies by usage patterns
5. **Project Specificity**: Results may not generalize to all project types

## 📝 License

MIT

## 🙏 Acknowledgments

This benchmark system is designed to provide objective, data-driven comparisons to help developers make informed decisions about package manager selection.