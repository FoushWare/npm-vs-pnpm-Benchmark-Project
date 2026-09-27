# npm vs pnpm Benchmark: A Technical Investigation

Imagine you're responsible for **2,000 JavaScript projects** and need to migrate them all from npm to pnpm. Is pnpm actually faster and more efficient, or are we just repeating what we've heard?

This benchmark is a **technical investigation** — not a tutorial declaring a winner. We measure real performance across multiple scenarios to understand when and why differences matter.

## 🎬 The Story

**The Hook:** 2,000+ JavaScript applications need migration from npm to pnpm.

**The Question:** Does pnpm actually make the migration faster and more efficient at scale?

**The Investigation:** We benchmark real projects under fair conditions to find out.

**The Reality:** Results depend on context — project size, cache state, CI frequency, and workflow patterns.

---

## 🎯 Why This Investigation Matters

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

**The Theory:** pnpm should be faster and use less disk space, especially when many projects share dependencies.

**The Reality:** Let's measure it.

---

## 📊 Benchmark Results

### Single Project Performance (Mac M2, 8GB RAM)

| Project | npm (mean) | pnpm (mean) | Speedup |
|---------|-----------|-------------|---------|
| **small-app** | 28.1s | 0.3s | **85x faster** |
| **medium-app** | 1.8s | 0.3s | **6x faster** |

**Context matters:** These results show pnpm's advantage in clean install scenarios. Real-world performance depends on cache state, network conditions, and workflow patterns.

### What We Measure

We test multiple scenarios because package manager performance varies by context:

- **Clean Install:** No cache, fresh node_modules (worst case for npm)
- **Warm Install:** Cache exists, fresh node_modules (typical developer workflow)
- **CI Scenarios:** Cold cache, warm cache, no dependency changes
- **Mass Projects:** 100, 500, 2000 projects sharing dependencies
- **Migration Cost:** One-time npm→pnpm conversion overhead

### What the Numbers Don't Mean

- ❌ "pnpm is always better" — Results are context-dependent
- ❌ "npm is obsolete" — npm may be faster in some scenarios
- ❌ "Build time differences" — Package managers don't affect build speed significantly
- ❌ "Universal performance" — Your specific project may differ

**The benchmark doesn't declare a winner. It shows where differences matter and helps you make informed decisions.**

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run benchmark (low-memory mode for 8GB RAM)
npm run benchmark

# Run full benchmark (requires 16GB+ RAM)
npm run benchmark:full

# Mass project benchmarks (simulate 100, 500, or 2000 projects)
npm run benchmark:mass -- --mass-count 100
npm run benchmark:mass -- --mass-count 500
npm run benchmark:mass -- --mass-count 2000

# Generate mass projects for testing
npm run generate:projects:100
npm run generate:projects:500
npm run generate:projects:2000

# Migrate test projects from npm to pnpm
npm run migrate:to-pnpm

# Show latest results with statistics
npm run results
```

---

## 🎓 Educational Concepts

This benchmark teaches several important computer science concepts:

- **Content-addressable storage**: Storing files by content hash instead of location
- **Hard links**: Multiple directory entries pointing to the same data on disk
- **Statistical analysis**: Using mean, median, and standard deviation for reliable measurements
- **Cache efficiency**: How package managers avoid redundant downloads
- **Resource management**: Memory and CPU optimization for constrained systems

---

## 💡 Why Install Speed Matters

Build and lint performance don't depend on the package manager - they measure your build tools and code quality. Install speed is the key differentiator because:

1. **Development workflow**: Faster installs = faster onboarding and dependency updates
2. **CI/CD pipelines**: Install time directly affects deployment speed
3. **Resource usage**: pnpm's efficient storage reduces memory and disk pressure
4. **Scalability**: Shared storage scales better with many projects

---

## 📈 Scalability: From 1 to 2,000 Projects

The true test of package manager efficiency emerges at scale:

### Single Project
- Differences may seem negligible
- Cache behavior dominates performance
- Individual optimization matters less

### 100 Projects
- Shared dependencies start showing pnpm's advantage
- Disk footprint differences become significant
- CI time savings accumulate

### 2,000 Projects
- **This is where pnpm's design shines:**
  - One copy of React, TypeScript, Axios, Lodash across all projects
  - Massive disk savings through content-addressable storage
  - Install time scales linearly instead of exponentially
  - CI pipeline savings become measurable in hours, not seconds

**The migration decision isn't about one project — it's about the ecosystem.**

---

## 🔬 Benchmark Features

- **Statistical rigor**: Multiple runs with warm-up for reliable data
- **Low-memory mode**: Optimized for 8GB RAM systems
- **Incremental saving**: Results saved as they run (survives crashes)
- **Educational comments**: Code explanations for learning
- **Flexible configuration**: Customizable for different scenarios
- **Fair CI comparison**: Equivalent workflows for both package managers
- **Mass project testing**: Configurable project counts (100, 500, 2000)

---

## 🎥 CI Pipeline Benchmarking

**Detailed CI Analysis:** See [PROJECT-TYPES.md](PROJECT-TYPES.md) for comprehensive analysis of GitHub Actions performance and which package manager wins in different CI scenarios.

### Fair Comparison Rules

Both CI workflows follow strict equivalence:
- **Same Runner:** Identical GitHub Actions specifications
- **Same Node Version:** Both use Node.js 22.21.1
- **Equivalent Caching:** Both use their respective package manager's cache strategy
- **Identical Scenarios:** Cold cache, warm cache, no dependency changes

### Why CI Matters

On a single developer machine, a 10-second difference might not matter. But in CI:

```
10 seconds saved per build × 2,000 builds = 5.5 hours saved
```

This is where the migration decision becomes strategic, not just technical.

---

## 🔄 Migration Strategy

Even if benchmarks show favorable results, migration itself has costs. See [MIGRATION-STRATEGY.md](MIGRATION-STRATEGY.md) for:

- Lockfile conversion (package-lock.json → pnpm-lock.yaml)
- CI workflow updates
- Workspace handling
- Peer dependency considerations
- Script compatibility
- Legacy project considerations
- Rollback strategy

**For one project, migration is simple. For 2,000 projects, you need a strategy.**

---

## 📁 Project Types Explained

This benchmark uses different project types to represent real-world scenarios:

### 📦 small-app (Minimal Dependencies)
**Size Classification:** Small  
**Dependencies:** 4 minimal (lodash, axios, zod, dayjs)  
**Complexity:** Very low  
**Tech Stack:** Vite + TypeScript

**Why it's "small":**
- Minimal dependency tree with commonly used packages
- Simple build process (Vite is optimized for small projects)
- No framework overhead
- Fast build times

**Why pnpm wins here:**
- Small dependency tree means pnpm's content-addressable storage has minimal overhead
- Packages are commonly used, so pnpm's shared cache is very effective
- Vite's fast build combined with pnpm's efficient install creates maximum speedup

**Real-world equivalent:** CLI tools, microservices, simple web apps, utility libraries

---

### 🎨 medium-app (Moderate Complexity)
**Size Classification:** Medium  
**Dependencies:** 7 moderate (React ecosystem)  
**Complexity:** Medium  
**Tech Stack:** Vite + React + TypeScript

**Why it's "medium":**
- Standard React application with state management
- Moderate dependency tree with React ecosystem
- Includes routing and date utilities
- Typical production-ready React app structure

**Why results are mixed:**
- React ecosystem dependencies are well-optimized in npm's cache
- TypeScript compilation adds overhead that's similar for both package managers
- The difference narrows because project complexity becomes the bottleneck

**Real-world equivalent:** Standard web applications, admin dashboards, e-commerce sites, SaaS applications

---

### 🚀 react-app (Production React)
**Size Classification:** Large  
**Dependencies:** 13 rich (full React ecosystem with testing)  
**Complexity:** High  
**Tech Stack:** Production React with comprehensive tooling

**Why it's "large":**
- Full production-grade React application
- Rich dependency tree with testing libraries
- Comprehensive tooling (type-checking, linting, testing, styling)
- More complex build process with multiple development dependencies

**Why npm may win here:**
- Rich dependency tree means npm's mature resolution works well
- Testing libraries and type-checking add overhead that's similar for both
- More dependencies = more network requests, where npm's parallel download shines
- Production tooling complexity reduces package manager impact on overall performance

**Real-world equivalent:** Large-scale React applications, enterprise web applications, production dashboards, complex UI systems

---

### ⚡ next-app (Framework-Heavy)
**Size Classification:** Large  
**Dependencies:** 8 framework-heavy (Next.js specific)  
**Complexity:** Very High  
**Tech Stack:** Next.js full-stack framework

**Why it's "large":**
- Next.js is a full-stack framework with significant overhead
- Includes server-side rendering and static site generation
- Framework-level optimizations and caching mechanisms
- More complex build process than standard React apps

**Why npm may win here:**
- Next.js has its own optimization and caching mechanisms that reduce package manager impact
- Server-side rendering adds complexity that dominates install time
- Next.js specific dependencies are well-optimized for npm
- Framework-level optimizations can overshadow package manager differences

**Real-world equivalent:** Full-stack web applications, e-commerce platforms, content management systems, SaaS applications with SSR

---

### 🔧 node-api (Server-Side API)
**Size Classification:** Medium  
**Dependencies:** 6 server-side (Fastify ecosystem)  
**Complexity:** Medium  
**Tech Stack:** Fastify + TypeScript

**Why it's "medium":**
- Web framework with authentication and API documentation
- Server-side dependencies for logging and validation
- No frontend build step (just Node.js server)
- Typical backend API complexity

**Why pnpm wins here:**
- Server-side dependencies are often repeated across API projects
- Fastify and server libraries benefit from shared storage
- No frontend build step means install time is more significant relative to total runtime
- API projects often share common backend dependencies (Fastify, JWT, validation libraries)

**Real-world equivalent:** REST APIs, GraphQL servers, microservices, backend services

---

### 📁 monorepo (Workspace-Based)
**Size Classification:** Very Large  
**Dependencies:** Workspace-based (Turbo)  
**Complexity:** Very High  
**Tech Stack:** Monorepo with multiple apps and packages

**Why it's "very large":**
- Contains multiple applications and packages in one repository
- Uses Turborepo for build orchestration
- Complex dependency relationships between workspaces
- Multi-project build coordination

**Why results vary:**
- Monorepo performance depends heavily on workspace configuration
- npm workspaces vs pnpm workspaces have different caching strategies
- Build tooling (Turbo) may favor one package manager over another
- Dependency hoisting rules differ significantly between package managers

**Real-world equivalent:** Large organizations with multiple related projects, design systems with component libraries, e-commerce with multiple storefronts, companies with shared backend services

---

### 🗂️ legacy-app (Outdated Dependencies)
**Size Classification:** Small  
**Dependencies:** 5 outdated (lodash, moment, old axios)  
**Complexity:** Low  
**Tech Stack:** Simple project with old patterns

**Why it's "small":**
- Simple project with minimal build process
- Outdated but commonly used libraries
- No modern framework overhead
- Very fast build times

**Why pnpm wins here:**
- Even with old dependencies, pnpm's shared storage helps when multiple legacy projects exist
- Legacy projects often share common libraries (lodash, moment) across the organization
- Simple build means install time is more significant relative to total runtime
- Older packages are well-established in registries and cache well

**Real-world equivalent:** Maintenance projects, legacy systems being modernized, older codebases, projects with outdated dependencies

---

## 🎯 Why Results Vary by Project Type

### When pnpm Excels:

1. **Small Projects:** Minimal dependency trees → pnpm overhead is negligible
2. **Shared Dependencies:** Many projects using same packages → content-addressable storage shines
3. **Server-Side:** Backend APIs with common libraries → shared storage helps
4. **Cold Cache:** Fresh installations → pnpm's efficiency matters most
5. **Disk Constraints:** Limited storage → pnpm's shared storage saves space

### When npm Excels:

1. **Large Projects:** Complex dependency trees → npm's mature resolution works well
2. **Framework Apps:** Next.js, React with rich ecosystem → framework optimizations dominate
3. **Warm Cache:** Dependencies already cached → differences narrow
4. **Parallel Downloads:** Network conditions favor npm's strategy
5. **Production Tooling:** Complex build/test chains → package manager impact reduced

### The Real Lesson:

The benchmark shows that **context matters**. There's no universal "best" package manager - the right choice depends on:
- Project size and complexity
- Dependency patterns (shared vs unique)
- Cache state (cold vs warm)
- Infrastructure constraints
- Team expertise and workflow

This is exactly the **technical investigation** approach from your video script — honest results that help viewers make informed decisions rather than biased conclusions.

---

## 🎥 CI Pipeline Benchmarking

**Detailed CI Analysis:** See [PROJECT-TYPES.md](PROJECT-TYPES.md) for comprehensive analysis of GitHub Actions performance and which package manager wins in different CI scenarios.

### Which Package Manager Wins in GitHub Actions?

**pnpm wins in CI if:**
- You have many projects sharing dependencies (content-addressable storage advantage)
- Your builds are frequent (cache benefit compounds over time)
- Disk space is constrained on runners
- You're doing fresh builds (cold cache scenarios)

**npm wins in CI if:**
- You have few unique projects (less sharing benefit)
- Your cache is warm (most builds from cache)
- Your projects have complex, unique dependencies
- Network conditions favor npm's parallel download strategy

### Expected CI Results:

- **Cold CI:** pnpm likely wins (fresh environment, shared storage advantage)
- **Warm CI:** Results may be similar (both benefit from cache)
- **No-Deps CI:** Results are identical (no install step)

Both are viable for CI/CD — the choice should be based on your specific context, not blanket performance claims.

---

## 🔬 Benchmark Features

- **Statistical rigor**: Multiple runs with warm-up for reliable data
- **Low-memory mode**: Optimized for 8GB RAM systems
- **Incremental saving**: Results saved as they run (survives crashes)
- **Educational comments**: Code explanations for learning
- **Flexible configuration**: Customizable for different scenarios
- **Fair CI comparison**: Equivalent workflows for both package managers
- **Mass project testing**: Configurable project counts (100, 500, 2000)

---

## ⚙️ System Requirements

- Node.js >= 22.21.1
- npm >= 9.0.0
- pnpm >= 8.0.0
- **8GB RAM minimum** (uses low-memory mode)
- **16GB RAM recommended** for full benchmarks

---

## 📁 Results

Results are saved to `results/raw/` with statistical analysis (mean, median, standard deviation).

---

## 🎬 Video Episode

This benchmark accompanies the "Coffee Break Web" episode: **npm vs pnpm | هل pnpm فعلًا أفضل؟**

The episode investigates whether pnpm is actually faster and more efficient at scale, using real benchmarks instead of assumptions.

---

## 📝 License

MIT
