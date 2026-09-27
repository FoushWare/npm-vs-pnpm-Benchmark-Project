#!/usr/bin/env node

// ============================================================================
// Mass Project Generator for npm vs pnpm Benchmark
// ============================================================================
// This script generates multiple projects for testing package manager performance
// at scale. It's particularly useful for demonstrating pnpm's advantage when many
// projects share dependencies, as it uses content-addressable storage.
//
// Usage: node scripts/generate-projects.js --count 100
// ============================================================================

import { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('generate-projects')
  .description('Generate mass projects for benchmarking (100, 500, 2000 projects)')
  .option('--count <number>', 'Number of projects to generate (100, 500, or 2000)', '100')
  .option('--output <dir>', 'Output directory', 'projects/mass-generated')
  .parse(process.argv);

const options = program.opts();

const dependencyProfiles = [
  {
    name: 'minimal',
    dependencies: {
      'lodash': '^4.17.21',
      'axios': '^1.6.2'
    }
  },
  {
    name: 'react',
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'axios': '^1.6.2'
    }
  },
  {
    name: 'fullstack',
    dependencies: {
      'express': '^4.18.2',
      'mongoose': '^8.0.3',
      'jsonwebtoken': '^9.0.2',
      'bcrypt': '^5.1.1'
    }
  },
  {
    name: 'utility',
    dependencies: {
      'lodash': '^4.17.21',
      'moment': '^2.29.4',
      'axios': '^1.6.2',
      'date-fns': '^3.0.6'
    }
  }
];

// Shared dependencies that will demonstrate pnpm's advantage
// These are common across many projects, showing the benefit of content-addressable storage
const sharedDependencies = {
  'typescript': '^5.3.3',
  '@types/node': '^20.10.6',
  'eslint': '^8.56.0',
  'prettier': '^3.1.1'
};

function generatePackageJson(projectId, profile) {
  return {
    name: `mass-project-${projectId}`,
    version: '1.0.0',
    description: `Generated project ${projectId} for mass benchmarking`,
    dependencies: {
      ...profile.dependencies,
      ...sharedDependencies  // Include shared dependencies to demonstrate pnpm's advantage
    }
  };
}

function generateIndexJs(projectId) {
  return `// Mass project ${projectId}
console.log('Project ${projectId} initialized');
`;
}

function generateProject(projectId, outputDir, profile) {
  const projectDir = join(outputDir, `project-${projectId}`);
  mkdirSync(projectDir, { recursive: true });

  const packageJson = generatePackageJson(projectId, profile);
  writeFileSync(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  const indexJs = generateIndexJs(projectId);
  writeFileSync(join(projectDir, 'index.js'), indexJs);
}

function generateRootPackageJson(outputDir, projectCount) {
  const workspaces = [];
  for (let i = 1; i <= projectCount; i++) {
    workspaces.push(`project-${i}`);
  }

  return {
    name: 'mass-generated-projects',
    version: '1.0.0',
    private: true,
    workspaces: workspaces
  };
}

async function main() {
  const count = parseInt(options.count);
  const outputDir = join(process.cwd(), options.output);

  // Validate count parameter - recommend values from the video script
  const recommendedCounts = [100, 500, 2000];
  if (!recommendedCounts.includes(count)) {
    console.warn(`⚠️  Warning: ${count} is not a recommended count.`);
    console.warn(`   Recommended values for benchmarking: ${recommendedCounts.join(', ')}`);
    console.warn(`   Continuing with ${count} projects anyway...\n`);
  }

  console.log(`🏗️  Generating ${count} projects in ${outputDir}...`);
  console.log(`   This will demonstrate pnpm's advantage with shared dependencies at scale.\n`);

  mkdirSync(outputDir, { recursive: true });

  // Generate root package.json for workspaces
  const rootPackageJson = generateRootPackageJson(outputDir, count);
  writeFileSync(join(outputDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2));

  // Generate individual projects
  for (let i = 1; i <= count; i++) {
    const profile = dependencyProfiles[i % dependencyProfiles.length];
    generateProject(i, outputDir, profile);
    
    if (i % 100 === 0) {
      console.log(`   Generated ${i}/${count} projects...`);
    }
  }

  console.log(`\n✅ Successfully generated ${count} projects`);
  console.log(`   Each project includes shared dependencies (TypeScript, ESLint, Prettier)`);
  console.log(`   to demonstrate pnpm's content-addressable storage advantage.`);
}

main().catch(console.error);