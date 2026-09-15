import type { Contract, Manifest } from './component.d.ts'
import type { Context } from './context.d.ts'

export * as context from './context.d.ts'
export * as component from './component.d.ts'

export { Manifest, Contract } from './component.d.ts'
export * as entity from './entity.d.ts'

/** What a caller is given in order to call a component, of what its manifest holds. */
export function contract(component: Manifest): Contract

/** Every component a Context has, by id, with the contract of the version it runs. */
export function map(context: Context): Record<string, Contract>

export interface Definition {
  /** The package's name, or the reference where it has no package.json */
  name: string
  module: Record<string, any>
}

export function definition(reference: string): Promise<Definition>
