# Benchmark Methodology

This document describes the methodology, fairness rules, and reproducibility guidelines for the npm vs pnpm benchmark system.

## 🎯 Objectives

1. **Objective Comparison**: Provide neutral, data-driven performance comparisons
2. **Reproducibility**: Enable others to reproduce results on their systems
3. **Fairness**: Ensure equivalent testing conditions for both package managers
4. **Transparency**: Document all assumptions, limitations, and measurement techniques

## ⚖️ Fairness Rules

### 1. Equivalent Functionality

Both package managers are tested with:
- **Identical Dependency Sets**: Same packages and versions in package.json
- **Equivalent Commands**: Using functionally equivalent commands (e.g., `npm ci` vs `pnpm install --frozen-lockfile`)
- **Same Project Structure**: Identical file organization and build configuration
- **Equal Resource Access**: Both run on the same hardware and OS

### 2. Measurement Consistency

- **Timing Method**: Use high-precision performance.now() for all timing measurements
- **Disk Measurement**: Use consistent directory traversal for disk usage calculation
- **Multiple Runs**: Perform 3-5 runs per scenario to account for variability
- **Statistical Analysis**: Report min, max, avg, median, and standard deviation

### 3. Scenario Equivalence

When comparing scenarios, ensure:
- **Clean State**: Both start from equivalent clean states
- **Cache State**: Both have equivalent cache conditions (cold vs warm)
- **Network Conditions**: Both operate under identical network conditions
- **System Load**: Both run under similar system load conditions

### 4. CI Workflow Equivalence

CI workflows are designed to be functionally equivalent:
- **Same Runner Type**: Both use identical GitHub Actions runner specifications
- **Same Node Version**: Both use the same Node.js version
- **Equivalent Caching**: Both use their respective package manager's caching strategy
- **Identical Scenarios**: Both test the same CI scenarios (cold, warm, no-deps-changed)

## 📏 Measurement Techniques

### Timing Measurements

```javascript
// High-precision timing using performance.now()
import { performance } from 'perf_hooks';

const start = performance.now();
// Execute operation
const end = performance.now();
const durationMs = end - start;
```

**Advantages**:
- Sub-millisecond precision
- Not affected by system clock changes
- Consistent across platforms

### Disk Usage Measurements

```javascript
// Recursive directory traversal
function getDirectorySize(dirPath) {
  let totalSize = 0;
  function traverse(currentPath) {
    const stats = statSync(currentPath);
    if (stats.isDirectory()) {
      // Recursively traverse
    } else {
      totalSize += stats.size;
    }
  }
  traverse(dirPath);
  return totalSize;
}
```

**Considerations**:
- Measures actual disk usage, not nominal package size
- Includes all files in directory (including hidden files)
- Platform-independent but may vary by filesystem

### Cache Measurements

- **npm Cache**: Measured at `npm config get cache` location
- **pnpm Store**: Measured at `pnpm store path` location
- **Scope**: Only measures package manager-specific cache/store

## 🔄 Scenario Definitions

### Installation Scenarios

#### Clean Install
- **Definition**: Install with no existing node_modules or cache
- **Preparation**: Remove node_modules and clear package manager cache
- **Commands**: `npm install` or `pnpm install`
- **Measures**: Cold installation performance

#### Warm Install
- **Definition**: Install with existing cache but fresh node_modules
- **Preparation**: Remove node_modules only, keep cache
- **Commands**: `npm install` or `pnpm install`
- **Measures**: Cache effectiveness

#### Lockfile Install
- **Definition**: Install using lockfile for deterministic builds
- **Commands**: `npm ci` or `pnpm install --frozen-lockfile`
- **Measures**: Deterministic installation performance

### Build Scenarios

#### Standard Build
- **Definition**: Run the project's build command
- **Commands**: `npm run build` or `pnpm run build`
- **Measures**: Build time and output size
- **Note**: Package manager overhead is minimal in this scenario

### Test Scenarios

#### Test Execution
- **Definition**: Run the project's test suite
- **Commands**: `npm run test -- --run` or `pnpm run test -- --run`
- **Measures**: Test execution time
- **Note**: Using `--run` to avoid watch mode

### CI Scenarios

#### Cold CI
- **Definition**: Simulate fresh CI environment with no cache
- **Steps**: Clean install → Build → Test
- **Measures**: Full CI pipeline time
- **Use Case**: First-time CI run or cache miss

#### Warm CI
- **Definition**: Simulate CI with cache restoration
- **Steps**: Install (with cache) → Build → Test
- **Measures**: Cached CI pipeline time
- **Use Case**: Typical CI run with cache hit

#### No Dependency Changes
- **Definition**: Skip install step when dependencies unchanged
- **Steps**: Build → Test (no install)
- **Measures**: CI time without dependency installation
- **Use Case**: Code-only changes

## 📊 Statistical Analysis

### Multiple Runs

Each scenario is run 3-5 times to:
- Account for system variability
- Identify outliers
- Calculate meaningful statistics

### Statistical Measures

- **Min**: Fastest run (best case)
- **Max**: Slowest run (worst case)
- **Average**: Mean performance
- **Median**: Middle value (robust to outliers)
- **Standard Deviation**: Measure of variability

### Interpretation Guidelines

- **Low Standard Deviation**: Consistent performance
- **High Standard Deviation**: Variable performance (may indicate external factors)
- **Median vs Average**: Large differences indicate skew or outliers

## 🌐 Reproducibility Guidelines

### Environment Documentation

Every benchmark run captures:
- Node.js version
- npm version
- pnpm version
- OS and version
- CPU model
- RAM amount
- Storage type (SSD/HDD)
- Timestamp

### Version Pinning

- Node.js: Pinned to specific version in package.json
- npm: Use installed version (documented in environment)
- pnpm: Use installed version (documented in environment)
- Dependencies: Pinned to specific versions in test projects

### Run Documentation

Each benchmark result includes:
- Package manager used
- Project tested
- Scenario executed
- Run number
- Duration in milliseconds
- Success/failure status
- Disk usage (if applicable)
- Timestamp

### Sharing Results

To enable reproducibility:
1. Share the raw JSON results from `results/raw/`
2. Include the environment.json file
3. Document any custom modifications
4. Specify the commit hash of the benchmark code

## ⚠️ Limitations and Caveats

### Network Variability

- **Issue**: Installation times vary with network speed and registry latency
- **Mitigation**: Use multiple runs and report median values
- **Note**: Cache scenarios are less affected by network variability

### Platform Differences

- **Issue**: Different operating systems have different filesystem characteristics
- **Mitigation**: Document platform in environment.json
- **Note**: Results may not be directly comparable across platforms

### Cache Behavior

- **Issue**: Cache effectiveness depends on usage patterns and project history
- **Mitigation**: Test both cold and warm scenarios
- **Note**: Real-world cache behavior may differ from benchmark conditions

### Project Specificity

- **Issue**: Results may not generalize to all project types
- **Mitigation**: Test multiple project types and sizes
- **Note**: Consider your specific project when interpreting results

### Version Specificity

- **Issue**: Results are specific to tested package manager versions
- **Mitigation**: Document versions in environment.json
- **Note**: Different versions may yield different results

### Measurement Overhead

- **Issue**: Measurement code itself adds small overhead
- **Mitigation**: Overhead is consistent across both package managers
- **Note**: Overhead is negligible compared to operation times

## 🔍 Distinguishing Performance Factors

### Installation vs Build vs CI

This benchmark system distinguishes between:

1. **Installation Performance**: Pure dependency installation time
2. **Build Performance**: Build tool execution time (minimal package manager overhead)
3. **CI Performance**: End-to-end CI pipeline time (includes installation + build + test)

### Package Manager Overhead

Package manager overhead is most significant in:
- Installation operations
- Cache management
- Workspace operations

Package manager overhead is minimal in:
- Build execution (after dependencies are installed)
- Test execution (after dependencies are installed)
- Lint execution (after dependencies are installed)

## 📈 Result Interpretation

### What the Numbers Mean

- **Faster Installation**: Indicates better dependency resolution and download performance
- **Lower Disk Usage**: Indicates more efficient storage (especially important for pnpm's content-addressable store)
- **Higher Success Rate**: Indicates better compatibility and reliability
- **Lower Variability**: Indicates more consistent performance

### What the Numbers Don't Mean

- **"Better Package Manager"**: Performance is just one factor
- **Universal Superiority**: Results are context-dependent
- **Future Performance**: Current results don't predict future versions
- **All Use Cases**: Your specific use case may differ

### Context Matters

Consider:
- **Team Size**: Larger teams may benefit more from certain features
- **Project Type**: Monorepos vs single repos have different needs
- **CI Frequency**: Frequent CI runs prioritize install speed
- **Disk Constraints**: Limited storage prioritizes disk efficiency
- **Tooling Ecosystem**: Integration with other tools varies

## 🔄 Continuous Improvement

This methodology is intended to evolve:

1. **Review Periodically**: Re-evaluate fairness rules as package managers evolve
2. **Add Scenarios**: Add new scenarios as use cases emerge
3. **Update Projects**: Refresh test projects to reflect current practices
4. **Improve Measurements**: Enhance measurement techniques as needed

## 📝 Contributing to Methodology

When proposing methodology changes:

1. **Explain Rationale**: Why is this change needed?
2. **Maintain Fairness**: Does it preserve fair comparison?
3. **Document Impact**: How does it affect result interpretation?
4. **Update Documentation**: Keep this document in sync

---

This methodology document is part of the npm vs pnpm benchmark system. For implementation details, see the README.md and source code.