import type { Contribution } from '@toa.io/core'

/** What this extension puts on the context of a component that declares it. */
export function context (declaration: string[]): Contribution | null {
  if (!Array.isArray(declaration) || declaration.length === 0) return null

  const names = declaration.map((name) => JSON.stringify(name)).join(' | ')

  return {
    name: 'storages',
    type: `Record<${names}, Storage>`,
    imports: { '@toa.io/extensions.storages': ['Storage'] }
  }
}
