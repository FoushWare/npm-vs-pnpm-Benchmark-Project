#!/usr/bin/env node

import { performance } from 'perf_hooks';

export async function measureTime(fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    return {
      durationMs: end - start,
      result,
      success: true
    };
  } catch (error) {
    const end = performance.now();
    return {
      durationMs: end - start,
      error: error.message,
      success: false
    };
  }
}

export function measureTimeSync(fn) {
  const start = performance.now();
  try {
    const result = fn();
    const end = performance.now();
    return {
      durationMs: end - start,
      result,
      success: true
    };
  } catch (error) {
    const end = performance.now();
    return {
      durationMs: end - start,
      error: error.message,
      success: false
    };
  }
}
