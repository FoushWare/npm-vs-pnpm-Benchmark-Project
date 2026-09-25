#!/usr/bin/env node

import { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('generate-projects')
  .description('Generate mass projects for benchmarking')
  .option('--count <number>', 'Number of projects to generate', '100')
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

function generatePackageJson(projectId, profile) {
  return {
    name: `mass-project-${projectId}`,
    version: '1.0.0',
    description: `Generated project ${projectId} for mass benchmarking`,
    dependencies: profile.dependencies
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

  console.log(`Generating ${count} projects in ${outputDir}...`);

  mkdirSync(outputDir, { recursive: true });

  // Generate root package.json for workspaces
  const rootPackageJson = generateRootPackageJson(outputDir, count);
  writeFileSync(join(outputDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2));

  // Generate individual projects
  for (let i = 1; i <= count; i++) {
    const profile = dependencyProfiles[i % dependencyProfiles.length];
    generateProject(i, outputDir, profile);
    
    if (i % 100 === 0) {
      console.log(`Generated ${i}/${count} projects...`);
    }
  }

  console.log(`Successfully generated ${count} projects`);
}

main().catch(console.error);