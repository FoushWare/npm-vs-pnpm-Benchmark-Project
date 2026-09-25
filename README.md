# npm vs pnpm Benchmark

Simple benchmark system to compare npm and pnpm performance.

## 📊 Latest Results (Mac M2, 8GB RAM)

| Project | npm | pnpm | Speed Improvement |
|---------|-----|------|-------------------|
| small-app | 26.6s | 0.3s | **89x faster** |
| medium-app | 1.8s | 0.3s | **6x faster** |
| mass-projects (10) | 0.7s | 0.2s | **3.5x faster** |

**System specs:** Apple M2, 8GB RAM, SSD, Node.js v22.21.1

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run benchmark (optimized for 8GB RAM)
npm run benchmark:low-memory

# Run full benchmark (requires 16GB+ RAM)
npm run benchmark:both
```

## 📋 What Gets Measured

- **Install Speed**: Time to install dependencies
- **Disk Usage**: Storage space consumed by node_modules
- **Cache Efficiency**: How well each package manager uses cache
- **Mass Projects**: Performance with multiple projects

## 🔧 Available Commands

```bash
# Low-memory mode (recommended for 8GB RAM)
npm run benchmark:low-memory

# Test specific package manager
npm run benchmark:npm
npm run benchmark:pnpm

# Test specific scenarios
node scripts/benchmark.js --scenario install
node scripts/benchmark.js --scenario build
node scripts/benchmark.js --scenario test

# Custom projects
node scripts/benchmark.js --projects small-app,medium-app

# Generate reports
npm run benchmark:report
npm run benchmark:charts
```

## 💡 Low-Memory Mode

For systems with 8GB RAM or less, use:

```bash
npm run benchmark:low-memory
```

This reduces the benchmark scope to prevent system freezing:
- 2 projects instead of 8
- 1 run instead of 3
- Install scenario only
- 10 mass projects instead of 100

## 📁 Project Structure

```
├── projects/           # Test projects of varying sizes
├── benchmarks/         # Benchmark implementations
├── scripts/            # Main benchmark script
├── results/            # Benchmark results
└── package.json        # Project configuration
```

## 🎯 Test Projects

- **small-app**: Minimal dependencies (lodash, axios, zod, dayjs)
- **medium-app**: React application (React, Router, Axios, Zustand)
- **large-app**: Enterprise React app (MUI, React Query, extensive tooling)
- **frontend-react**: Production React application
- **frontend-next**: Next.js application
- **node-api**: Fastify backend API
- **monorepo**: Workspace setup with multiple packages
- **legacy-app**: Older dependencies for migration testing

## 📈 Key Metrics

- **Duration (ms)**: Time taken for operation
- **Disk Usage (MB)**: Storage consumed
- **Cache Hit Rate**: Efficiency of cache usage

## ⚙️ Requirements

- Node.js >= 22.21.1
- npm >= 9.0.0
- pnpm >= 8.0.0
- **Recommended**: 16GB+ RAM for full benchmarks
- **Minimum**: 8GB RAM with low-memory mode

## 📝 License

MIT
