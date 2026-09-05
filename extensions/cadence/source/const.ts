/** The component the extension ships to hold delayed calls. */
export const NAMESPACE = 'cadence'
export const COMPONENT = 'metronome'

/**
 * Constant, never configuration: a row carries its lane, so lowering this would leave rows in
 * lanes nobody reads any more. It is also the ceiling on replicas dispatching, and a power of
 * two so that the common replica counts divide evenly. The outbox says the same of its own.
 */
export const LANES = 128

/** seconds between passes over the calls waiting to be made, and how far ahead each reaches */
export const DISCRETENESS = 60

/** rows one scan brings back */
export const BATCH = 200

/** A number from the environment, where a deployment or a test suite states one. */
export function number (variable: string, fallback: number): number {
  const value = Number(process.env[variable])

  return Number.isNaN(value) || value <= 0 ? fallback : value
}
