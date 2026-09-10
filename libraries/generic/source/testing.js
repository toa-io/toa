import { environment } from './environment.js'

/**
 * An interval a suite may shorten, and nothing else may.
 *
 * These are the ones that are deliberately not configuration: how often a component
 * re-announces itself, how long a gateway leaves between knocks, what a halt waits before it
 * begins. No application should be choosing them — the value is a property of the design, and
 * one an application got wrong would be a fault nobody could see. But a suite cannot wait out
 * half an hour to watch a repeat happen, so it says so, in a variable no deployment sets.
 *
 * `TOA_TESTING_*` is that namespace, and it is the whole of what it means: if a variable of
 * this name is set anywhere but a suite, something is wrong.
 *
 * @param {string} name what follows `TOA_TESTING_`
 * @param {number} fallback the constant, which is what a deployment always gets
 * @returns {number}
 */
export function testing(name, fallback) {
  const value = Number(environment.get(PREFIX + name))

  return Number.isNaN(value) || value <= 0 ? fallback : value
}

const PREFIX = 'TOA_TESTING_'
