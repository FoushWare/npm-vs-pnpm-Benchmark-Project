# Migration Strategy: npm → pnpm

Even if benchmarks show favorable results for pnpm, the migration itself has costs and challenges. This document outlines a practical strategy for migrating from npm to pnpm, especially at scale.

## 🎯 The Migration Challenge

**For one project:** Migration is straightforward — install pnpm, convert lockfile, fix any issues.

**For 2,000 projects:** You need a systematic strategy to handle:
- Lockfile conversion at scale
- CI workflow updates
- Workspace and monorepo considerations
- Peer dependency resolution
- Script compatibility
- Legacy project peculiarities
- Rollback plans

## 📋 Migration Checklist

### 1. Preparation Phase

#### Environment Setup
- [ ] Install pnpm globally: `npm install -g pnpm`
- [ ] Configure pnpm store location (consider disk space)
- [ ] Set up pnpm在工作spaces中
- [ ] Document current npm version and configurations

#### Dependency Audit
- [ ] Audit all projects for phantom dependencies
- [ ] Identify projects with peer dependency issues
- [ ] Check for scripts that assume npm-specific behavior
- [ ] Document any custom npm configurations

#### CI Assessment
- [ ] Review all CI workflows (GitHub Actions, Jenkins, etc.)
- [ ] Document current caching strategies
- [ ] Identify npm-specific actions or plugins
- [ ] Plan equivalent pnpm caching

### 2. Lockfile Conversion

#### Single Project Conversion
```bash
# In each project directory
rm package-lock.json
pnpm install
```

#### Batch Conversion Strategy
For large-scale migrations, consider:

**Option A: Gradual Rollout**
```bash
# Convert projects in batches
for project in projects/*; do
  cd "$project"
  rm package-lock.json
  pnpm install
  cd -
done
```

**Option B: Automated Script**
```javascript
// scripts/migrate-to-pnpm.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projects = ['small-app', 'medium-app', 'react-app', /* ... */];

projects.forEach(project => {
  const projectPath = path.join('projects', project);
  const lockfilePath = path.join(projectPath, 'package-lock.json');
  
  if (fs.existsSync(lockfilePath)) {
    console.log(`Converting ${project}...`);
    fs.unlinkSync(lockfilePath);
    execSync(`cd ${projectPath} && pnpm install`, { stdio: 'inherit' });
    console.log(`✓ ${project} converted`);
  }
});
```

### 3. CI Workflow Updates

#### GitHub Actions Example

**Before (npm):**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22.21.1'
    cache: 'npm'

- name: Install dependencies
  run: npm ci
```

**After (pnpm):**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22.21.1'

- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Get pnpm store directory
  id: pnpm-cache
  shell: bash
  run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

- name: Setup pnpm cache
  uses: actions/cache@v3
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

#### Fair Comparison Notes
- Both workflows should use equivalent caching strategies
- Use same Node.js version
- Test same scenarios (cold, warm, no-deps-changed)
- Measure total pipeline time, not just install time

### 4. Workspace and Monorepo Considerations

#### pnpm Workspace Configuration
```json
// pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

#### Migration Differences
- **npm workspaces:** Uses `package.json` `workspaces` field
- **pnpm workspaces:** Uses separate `pnpm-workspace.yaml` file
- **Hoisting:** pnpm's strict hoisting may require dependency adjustments

#### Common Issues
- Phantom dependencies (packages not explicitly listed)
- Hoisting conflicts (different versions in different packages)
- Build tools that assume flat node_modules structure

### 5. Peer Dependency Resolution

#### pnpm's Strict Mode
pnpm is stricter about peer dependencies by default:

```bash
# pnpm will fail if peer dependencies are missing
pnpm install

# Use --strict-peer-dependencies=false to match npm behavior
pnpm install --strict-peer-dependencies=false
```

#### Resolution Strategy
1. **Audit peer dependencies:** Identify missing or conflicting peers
2. **Add explicit dependencies:** Install missing peer dependencies
3. **Version alignment:** Ensure compatible versions across packages
4. **Consider strict mode:** Decide whether to enforce strict peer dependencies

### 6. Script Compatibility

#### Common Script Issues

**npm-specific variables:**
```bash
# npm
npm run build -- --production

# pnpm (equivalent)
pnpm run build -- --production
```

**Lifecycle scripts:**
```json
{
  "scripts": {
    "preinstall": "echo 'Running preinstall'",
    "postinstall": "echo 'Running postinstall'"
  }
}
```
Both npm and pnpm support these, but execution order may differ.

**Environment variables:**
- `npm_config_*` variables may not work identically
- Test all scripts that use npm-specific environment variables

### 7. Legacy Project Considerations

#### Old Node.js Versions
- Some legacy projects may use older Node.js versions
- pnpm requires Node.js >= 14
- May need to upgrade Node.js or keep npm for legacy projects

#### Custom npm Configurations
```bash
# Check for custom npm configurations
npm config list

# Equivalent pnpm configurations
pnpm config set store-dir /path/to/store
pnpm config set shamefully-hoist true
```

#### Build Tools
- Older build tools may assume flat node_modules
- Consider using `shamefully-hoist` for problematic projects
- Test builds thoroughly after migration

### 8. Rollback Strategy

#### Safe Migration Approach

**Phase 1: Parallel Operation**
- Keep both npm and pnpm configurations
- Run CI pipelines with both package managers
- Compare results and performance

**Phase 2: Gradual Switch**
- Switch low-risk projects first
- Monitor for issues
- Have rollback plan ready

**Phase 3: Full Migration**
- Switch remaining projects
- Remove npm configurations
- Archive old lockfiles

#### Rollback Plan
```bash
# Rollback to npm if needed
rm -rf node_modules pnpm-lock.yaml
git checkout package-lock.json
npm install
```

## 🚀 Migration Automation Script

For large-scale migrations, consider automation:

```javascript
// scripts/migrate-projects.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECTS = [
  'small-app',
  'medium-app', 
  'react-app',
  'next-app',
  'node-api',
  'monorepo',
  'legacy-app'
];

function migrateProject(project) {
  const projectPath = path.join('projects', project);
  const lockfilePath = path.join(projectPath, 'package-lock.json');
  const pnpmLockPath = path.join(projectPath, 'pnpm-lock.yaml');
  
  console.log(`\n🔄 Migrating ${project}...`);
  
  // Backup original lockfile
  if (fs.existsSync(lockfilePath)) {
    fs.copyFileSync(lockfilePath, `${lockfilePath}.backup`);
    console.log(`  ✓ Backed up package-lock.json`);
  }
  
  // Remove npm lockfile
  if (fs.existsSync(lockfilePath)) {
    fs.unlinkSync(lockfilePath);
    console.log(`  ✓ Removed package-lock.json`);
  }
  
  // Install with pnpm
  try {
    execSync(`cd ${projectPath} && pnpm install`, { stdio: 'inherit' });
    console.log(`  ✓ pnpm install successful`);
    
    // Test build
    execSync(`cd ${projectPath} && pnpm run build`, { stdio: 'inherit' });
    console.log(`  ✓ Build successful`);
    
    // Test tests
    execSync(`cd ${projectPath} && pnpm run test -- --run`, { stdio: 'inherit' });
    console.log(`  ✓ Tests successful`);
    
    console.log(`✅ ${project} migration complete`);
    return true;
  } catch (error) {
    console.error(`❌ ${project} migration failed:`, error.message);
    
    // Rollback
    if (fs.existsSync(`${lockfilePath}.backup`)) {
      fs.copyFileSync(`${lockfilePath}.backup`, lockfilePath);
      fs.unlinkSync(`${lockfilePath}.backup`);
    }
    if (fs.existsSync(pnpmLockPath)) {
      fs.unlinkSync(pnpmLockPath);
    }
    console.log(`  ↩️ Rolled back ${project}`);
    return false;
  }
}

// Run migration
const results = PROJECTS.map(project => ({
  project,
  success: migrateProject(project)
}));

console.log('\n📊 Migration Summary:');
results.forEach(({ project, success }) => {
  console.log(`  ${success ? '✅' : '❌'} ${project}`);
});

const failed = results.filter(r => !r.success);
if (failed.length > 0) {
  console.log(`\n⚠️  ${failed.length} projects failed migration`);
  process.exit(1);
}
```

## 📊 Decision Framework

### When to Migrate

**Migrate if:**
- You have many projects sharing dependencies
- Disk space is a constraint
- CI pipeline time is critical
- Team is comfortable with pnpm's strictness
- You can invest in migration upfront

**Stay with npm if:**
- You have few projects
- Legacy Node.js versions are required
- Team prefers npm's familiarity
- Migration cost outweighs benefits
- Complex peer dependency situations

### Hybrid Approach

Consider keeping both:
- Use npm for legacy/experimental projects
- Use pnpm for active, shared projects
- Gradually migrate as projects are updated

## 🔍 Post-Migration Validation

After migration, validate:

1. **Install Speed:** Compare install times
2. **Disk Usage:** Measure total footprint (node_modules + store)
3. **Build Success:** Ensure all builds pass
4. **Test Coverage:** Run full test suites
5. **CI Performance:** Compare CI pipeline times
6. **Developer Experience:** Gather team feedback

## 📚 Additional Resources

- [pnpm Documentation](https://pnpm.io/)
- [pnpm vs npm Feature Comparison](https://pnpm.io/comparison-with-npm)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Migrating from npm](https://pnpm.io/npm-vs-pnpm)

## 🎬 Context: Coffee Break Web Episode

This migration strategy accompanies the technical investigation in the "npm vs pnpm" episode, which explores whether pnpm is actually better at scale through real benchmarks rather than assumptions.

The key insight: **For one project, migration is simple. For 2,000 projects, you need a strategy.**
