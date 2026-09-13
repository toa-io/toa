import type { type as Type } from './types/operations.ts'

/**
 * Whether an operation of this type is incapable of changing the State. What a readonly request may
 * reach, and nothing else; see `documentation/readonly.md`.
 *
 * Exhaustive on purpose, as the outcome of an exception code is: a type added later does not
 * compile until it says which it is, because a type nobody classified would otherwise be reachable
 * from a request that promised to read.
 */
const SAFE: Record<Type, boolean> = {
  transition: false,
  observation: true,
  assignment: false,
  computation: true,
  // the type for an operation that reaches outside; what it reaches is not the runtime's to read
  effect: false,
  // its scope is the driver's own handle, and the runtime sees nothing it does with one
  unmanaged: false
}

/**
 * Takes a `string` because it comes off a manifest: an operation of a type this does not know is
 * unsafe, which is what an endpoint nothing can classify has to be.
 */
export function safe(type: string): boolean {
  return SAFE[type as Type] === true
}
