#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  let dirCount = 0;

  function traverse(currentPath) {
    const stats = statSync(currentPath);
    if (stats.isDirectory()) {
      dirCount++;
      const entries = readdirSync(currentPath);
      for (const entry of entries) {
        traverse(join(currentPath, entry));
      }
    } else {
      fileCount++;
      totalSize += stats.size;
    }
  }

  try {
    traverse(dirPath);
    return {
      totalBytes: totalSize,
      totalMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      fileCount,
      dirCount
    };
  } catch (error) {
    return {
      totalBytes: 0,
      totalMB: 0,
      fileCount: 0,
      dirCount: 0,
      error: error.message
    };
  }
}

export function getNodeModulesSize(projectPath) {
  const nodeModulesPath = join(projectPath, 'node_modules');
  return getDirectorySize(nodeModulesPath);
}

export function getPnpmStoreSize() {
  try {
    const storePath = execSync('pnpm store path', { encoding: 'utf-8' }).trim();
    return getDirectorySize(storePath);
  } catch (error) {
    return {
      totalBytes: 0,
      totalMB: 0,
      fileCount: 0,
      dirCount: 0,
      error: error.message
    };
  }
}

export function getNpmCacheSize() {
  try {
    const cachePath = execSync('npm config get cache', { encoding: 'utf-8' }).trim();
    return getDirectorySize(cachePath);
  } catch (error) {
    return {
      totalBytes: 0,
      totalMB: 0,
      fileCount: 0,
      dirCount: 0,
      error: error.message
    };
  }
}