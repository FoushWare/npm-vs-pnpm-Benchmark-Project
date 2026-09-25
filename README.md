# npm vs pnpm Benchmark

Compare npm and pnpm install performance.

## 🎯 npm vs pnpm - What's the Difference?

### npm (Traditional)
```
Project A: [node_modules]
  └── lodash (copy 1)
  └── axios (copy 1)

Project B: [node_modules]  
  └── lodash (copy 2) ← Duplicate!
  └── axios (copy 2) ← Duplicate!
```
**Problem**: Each project stores its own copies → Uses more disk space and memory

### pnpm (Modern)
```
[pnpm store] ← One copy of each package
  └── lodash (shared)
  └── axios (shared)

Project A: [node_modules]
  └── → lodash (symlink)
  └── → axios (symlink)

Project B: [node_modules]
  └── → lodash (symlink)  
  └── → axios (symlink)
```
**Solution**: Shared content-addressable store → Uses less space and memory

## 📊 Benchmark Results (Mac M2, 8GB RAM)

| Project | npm | pnpm | Speedup |
|---------|-----|------|---------|
| **small-app** | 29.1s | 0.4s | **73x faster** |
| **medium-app** | 2.5s | 0.3s | **8x faster** |

**Why pnpm wins**: No duplicate downloads - uses shared package store

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run benchmark
npm run benchmark
```

## 💡 Why Use pnpm?

- **Faster installs**: Up to 73x faster (no duplicate downloads)
- **Less disk space**: Shared package store
- **Less memory**: Better for low-RAM systems (like your 8GB Mac)
- **Stricter**: Prevents phantom dependencies
- **Workspaces**: Better monorepo support

## 📋 What This Measures

**Install speed only** - this is the key differentiator between npm and pnpm.

Build and lint performance don't depend on the package manager - they depend on the build tool, linter, and your code.

## ⚙️ System Requirements

- Node.js >= 22.21.1
- npm >= 9.0.0
- pnpm >= 8.0.0
- **8GB RAM minimum** (uses low-memory mode)

## 📁 Results

Results are saved to `results/raw/` after each benchmark run.

## 📝 License

MIT