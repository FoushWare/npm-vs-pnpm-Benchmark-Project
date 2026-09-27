#!/usr/bin/env node

/**
 * Time Measurement Module
 * 
 * EDUCATIONAL: Timing Methods Comparison
 * =======================================
 * 
 * 1. Date.now() - Millisecond precision, affected by system clock changes
 *    - Pros: Simple, widely available
 *    - Cons: Low precision, can be affected by system time adjustments
 *    - Use case: General timing where high precision isn't critical
 * 
 * 2. performance.now() - Microsecond precision, monotonic (always increases)
 *    - Pros: High precision, not affected by system clock changes
 *    - Cons: Node.js specific, measures time since process start
 *    - Use case: Performance measurement, benchmarking (OUR CHOICE)
 * 
 * 3. process.hrtime() - Nanosecond precision, monotonic
 *    - Pros: Highest precision, monotonic
 *    - Cons: More complex API (returns [seconds, nanoseconds])
 *    - Use case: Very precise measurements, network latency
 * 
 * WHY WE USE performance.now():
 * - High precision (microseconds) for accurate install time measurement
 * - Monotonic (always increases) - not affected by system clock changes
 * - Simple API (single number in milliseconds)
 * - Perfect for benchmarking package manager performance
 */

import { performance } from 'perf_hooks';

/**
 * Measure execution time of an async function.
 * 
 * @param {Function} fn - Async function to measure
 * @returns {Object} Object containing durationMs, result, success, and error (if failed)
 */
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

/**
 * Measure execution time of a synchronous function.
 * 
 * @param {Function} fn - Synchronous function to measure
 * @returns {Object} Object containing durationMs, result, success, and error (if failed)
 */
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
