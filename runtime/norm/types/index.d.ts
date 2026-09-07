export * as context from './context.js'
export * as component from './component.js'

export { Manifest } from './component.js'
export * as entity from './entity.js'

export interface Definition {
  /** The package's name, or the reference where it has no package.json */
  name: string
  module: Record<string, any>
}

export function definition(reference: string): Promise<Definition>
