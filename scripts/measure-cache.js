#!/usr/bin/env node

import { execSync } from 'child_process';
import { statSync } from 'fs';
import { join } from 'path';
import { getDirectorySize } from './measure-disk.js';

export function getPackageCacheSize(packageManager) {
  if (packageManager === 'npm') {
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
  } else if (packageManager === 'pnpm') {
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
  return {
    totalBytes: 0,
    totalMB: 0,
    fileCount: 0,
    dirCount: 0,
    error: 'Unknown package manager'
  };
}

export function clearPackageCache(packageManager) {
  if (packageManager === 'npm') {
    try {
      execSync('npm cache clean --force', { encoding: 'utf-8' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else if (packageManager === 'pnpm') {
    try {
      execSync('pnpm store prune', { encoding: 'utf-8' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Unknown package manager' };
}

export function getCacheInfo(packageManager) {
  if (packageManager === 'npm') {
    try {
      const cachePath = execSync('npm config get cache', { encoding: 'utf-8' }).trim();
      const size = getDirectorySize(cachePath);
      return {
        type: 'npm',
        path: cachePath,
        ...size
      };
    } catch (error) {
      return {
        type: 'npm',
        path: 'unknown',
        totalBytes: 0,
        totalMB: 0,
        fileCount: 0,
        dirCount: 0,
        error: error.message
      };
    }
  } else if (packageManager === 'pnpm') {
    try {
      const storePath = execSync('pnpm store path', { encoding: 'utf-8' }).trim();
      const size = getDirectorySize(storePath);
      return {
        type: 'pnpm',
        path: storePath,
        ...size
      };
    } catch (error) {
      return {
        type: 'pnpm',
        path: 'unknown',
        totalBytes: 0,
        totalMB: 0,
        fileCount: 0,
        dirCount: 0,
        error: error.message
      };
    }
  }
  return {
    type: 'unknown',
    path: 'unknown',
    totalBytes: 0,
    totalMB: 0,
    fileCount: 0,
    dirCount: 0,
    error: 'Unknown package manager'
  };
}