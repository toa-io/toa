import type { Contract } from '@toa.io/core'
import type { Context } from './context.d.ts'

export * as context from './context.d.ts'
export * as component from './component.d.ts'

export { Manifest } from './component.d.ts'
export * as entity from './entity.d.ts'

/** Every component a Context has, by id, with the contract of the version it runs. */
export function map(context: Context): Record<string, Contract>

export interface Definition {
  /** The package's name, or the reference where it has no package.json */
  name: string
  module: Record<string, any>
}

export function definition(reference: string): Promise<Definition>
