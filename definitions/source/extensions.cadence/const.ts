import { environment } from '@toa.io/generic'
import { REGION } from '../extensions.convergence/const.js'

/** The component the extension ships to hold delayed calls. */
export const NAMESPACE = 'cadence'
export const COMPONENT = 'metronome'

/**
 * Constant, never configuration: a row carries its lane, so lowering this would leave rows in
 * lanes nobody reads any more. It is also the ceiling on replicas dispatching, and a power of
 * two so that the common replica counts divide evenly. The outbox says the same of its own.
 *
 * A scan asks for its lanes as a set and sorts on `due`, which is the index's second key, so
 * the plan that serves it explodes the set into one scan per lane and merges them in order.
 * MongoDB stops exploding past `internalQueryMaxScansToExplode`, 200 by default, and falls
 * back to sorting the whole result in memory — so this staying well under that is not
 * incidental.
 */
export const LANES = 128

/** seconds between passes over the calls waiting to be made, and how far ahead each reaches */
export const DISCRETENESS = 60

/** rows one scan brings back */
export const BATCH = 200

/** A number from the environment, where a deployment or a test suite states one. */
export function number(variable: string, fallback: number): number {
  const value = Number(environment.get(variable))

  return Number.isNaN(value) || value <= 0 ? fallback : value
}

/** What a deployment is given of the regions whose calls it makes. */
export const REGIONS = 'TOA_CADENCE_REGIONS'

/**
 * The ranks whose delayed calls this deployment makes.
 *
 * Its own by default — a row carries the region that wrote it, so a call is made by the region
 * that asked for it and by no other, however many hold the row. Naming another region's rank
 * is how a surviving region takes over the calls of one that is gone; two deployments naming
 * one rank make every call of it twice, and nothing detects that.
 *
 * A deployment that is no region at all reads the same as region zero, which is what its rows
 * carry.
 */
export function regions(): number[] {
  const declared = environment.get(REGIONS)

  if (declared === undefined) return [Number(environment.get(REGION) ?? 0)]

  return declared.split(' ').map(Number)
}
