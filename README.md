# npm vs pnpm Install Benchmark

Educational benchmark comparing npm and pnpm install performance.

## 🎯 Why Focus on Install Speed?

npm and pnpm differ most significantly in how they install packages:

### npm (Traditional)
```
Project A: [node_modules]
  └── lodash (copy 1)
  └── axios (copy 1)

Project B: [node_modules]  
  └── lodash (copy 2) ← Duplicate!
  └── axios (copy 2) ← Duplicate!
```
**Problem**: Each project stores its own copies → Slower installs, more disk space

### pnpm (Modern)
```
[pnpm store] ← One copy of each package
  └── lodash (shared)
  └── axios (shared)

Project A: [node_modules]
  └── → lodash (hard link)
  └── → axios (hard link)

Project B: [node_modules]
  └── → lodash (hard link)  
  └── → axios (hard link)
```
**Solution**: Shared content-addressable store → Faster installs, less disk space

## 📊 Benchmark Results (Mac M2, 8GB RAM)

| Project | npm (mean) | pnpm (mean) | Speedup |
|---------|-----------|-------------|---------|
| **small-app** | 28.1s | 0.3s | **85x faster** |
| **medium-app** | 1.8s | 0.3s | **6x faster** |

**Why pnpm wins**: Content-addressable storage with hard links eliminates duplicate downloads and file copying.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run benchmark (low-memory mode for 8GB RAM)
npm run benchmark

# Run full benchmark (requires 16GB+ RAM)
npm run benchmark:full

# Show latest results with statistics
npm run results
```

## � Educational Concepts

This benchmark teaches several important computer science concepts:

- **Content-addressable storage**: Storing files by content hash instead of location
- **Hard links**: Multiple directory entries pointing to the same data on disk
- **Statistical analysis**: Using mean, median, and standard deviation for reliable measurements
- **Cache efficiency**: How package managers avoid redundant downloads
- **Resource management**: Memory and CPU optimization for constrained systems

## 💡 Why Install Speed Matters

Build and lint performance don't depend on the package manager - they measure your build tools and code quality. Install speed is the key differentiator because:

1. **Development workflow**: Faster installs = faster onboarding and dependency updates
2. **CI/CD pipelines**: Install time directly affects deployment speed
3. **Resource usage**: pnpm's efficient storage reduces memory and disk pressure
4. **Scalability**: Shared storage scales better with many projects

## 🔬 Benchmark Features

- **Statistical rigor**: Multiple runs with warm-up for reliable data
- **Low-memory mode**: Optimized for 8GB RAM systems
- **Incremental saving**: Results saved as they run (survives crashes)
- **Educational comments**: Code explanations for learning
- **Flexible configuration**: Customizable for different scenarios

## ⚙️ System Requirements

- Node.js >= 22.21.1
- npm >= 9.0.0
- pnpm >= 8.0.0
- **8GB RAM minimum** (uses low-memory mode)
- **16GB RAM recommended** for full benchmarks

## 📁 Results

Results are saved to `results/raw/` with statistical analysis (mean, median, standard deviation).

## 📝 License

MIT