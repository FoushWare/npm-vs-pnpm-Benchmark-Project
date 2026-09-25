# npm vs pnpm Benchmark

Compare npm and pnpm performance on your Mac.

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

| Operation | npm | pnpm | Why pnpm wins |
|-----------|-----|------|---------------|
| **Install (small)** | 29.1s | 0.4s | No duplicate downloads |
| **Install (medium)** | 2.5s | 0.3s | Uses hard links |
| **Build (small)** | 1.2s | 1.0s | Faster file access |
| **Build (medium)** | 1.0s | 0.4s | Less memory pressure |
| **Lint (small)** | 0.7s | 0.4s | Quicker file loading |
| **Lint (medium)** | 0.6s | 0.6s | Similar performance |

**Key insight**: pnpm is dramatically faster for installs (up to 73x faster) because it doesn't download duplicate packages.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all benchmarks (install + build + lint)
npm run benchmark:all

# Run individual benchmarks
npm run benchmark:install
npm run benchmark:build  
npm run benchmark:lint
```

## 💡 Why Use pnpm?

- **Faster installs**: Up to 73x faster (no duplicate downloads)
- **Less disk space**: Shared package store
- **Less memory**: Better for low-RAM systems (like your 8GB Mac)
- **Stricter**: Prevents phantom dependencies
- **Workspaces**: Better monorepo support

## 📋 What This Measures

- **Install**: Time to download and install dependencies
- **Build**: Time to compile/build projects  
- **Lint**: Time to analyze code quality

## ⚙️ System Requirements

- Node.js >= 22.21.1
- npm >= 9.0.0
- pnpm >= 8.0.0
- **8GB RAM minimum** (uses low-memory mode)

## 📁 Results

Results are saved to `results/raw/` after each benchmark run.

## 📝 License

MIT