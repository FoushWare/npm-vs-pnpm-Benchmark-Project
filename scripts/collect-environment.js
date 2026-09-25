#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getCommandOutput(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function getCpuInfo() {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      return getCommandOutput('sysctl -n machdep.cpu.brand_string');
    } else if (platform === 'linux') {
      const model = getCommandOutput('cat /proc/cpuinfo | grep "model name" | head -n 1');
      return model.split(':')[1]?.trim() || 'unknown';
    } else if (platform === 'win32') {
      return getCommandOutput('wmic cpu get name');
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

function getMemoryInfo() {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      const mem = getCommandOutput('sysctl -n hw.memsize');
      return `${Math.round(parseInt(mem) / (1024 * 1024 * 1024))} GB`;
    } else if (platform === 'linux') {
      const mem = getCommandOutput('free -b | grep Mem | awk \'{print $2}\'');
      return `${Math.round(parseInt(mem) / (1024 * 1024 * 1024))} GB`;
    } else if (platform === 'win32') {
      const mem = getCommandOutput('wmic OS get TotalVisibleMemorySize');
      return `${Math.round(parseInt(mem) / (1024 * 1024))} GB`;
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

function getStorageType() {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      const diskInfo = getCommandOutput('diskutil info / | grep "Solid State"');
      return diskInfo.includes('Yes') ? 'SSD' : 'HDD';
    } else if (platform === 'linux') {
      const diskInfo = getCommandOutput('lsblk -d -o rota | tail -n 1');
      return diskInfo.trim() === '0' ? 'SSD' : 'HDD';
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

const environment = {
  node: process.version,
  npm: getCommandOutput('npm --version'),
  pnpm: getCommandOutput('pnpm --version'),
  os: process.platform,
  osRelease: process.release?.os || getCommandOutput('uname -r'),
  cpu: getCpuInfo(),
  memory: getMemoryInfo(),
  storage: getStorageType(),
  architecture: process.arch,
  timestamp: new Date().toISOString(),
  hostname: getCommandOutput('hostname')
};

// Ensure benchmark directory exists
const benchmarkDir = join(__dirname, '..', 'benchmark');
mkdirSync(benchmarkDir, { recursive: true });

const envFile = join(benchmarkDir, 'environment.json');
writeFileSync(envFile, JSON.stringify(environment, null, 2));

console.log('Environment information collected:');
console.log(JSON.stringify(environment, null, 2));
console.log(`\nSaved to: ${envFile}`);
