import { dirname, join } from 'node:path'
import type { Manifest } from '@toa.io/norm'

const PACKAGE = '@toa.io/extensions.introspection'
const COMPONENTS = ['introspection.nodes', 'introspection.edges']

/**
 * The map's own components, as the introspection package ships them. Mounted rather
 * than copied on purpose: a scenario about a manifest must read that manifest.
 */
export function components (): string[] {
  const root = dirname(require.resolve(PACKAGE + '/package.json'))

  return COMPONENTS.map((name) => join(root, 'components', name))
}

/** `norm` declares `component` as a namespace of types; the runtime export is a function. */
export async function manifests (): Promise<Manifest[]> {
  const { component } = require('@toa.io/norm') as Norm

  return await Promise.all(components().map(async (path) => await component(path)))
}

interface Norm {
  component: (path: string) => Promise<Manifest>
}
