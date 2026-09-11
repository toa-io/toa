import { packages } from '../digest/read.ts'

/**
 * What a deploy installs for the exposition.
 *
 * A component that declares the extension needs nothing of its own — what it reaches is the
 * gateway, in another process. The gateway is what brings packages with it: the identity
 * components run inside it, and each declares what it imports in its own manifest. Where the
 * gateway is a service of its own, its image installs them beside the components; where a
 * composition runs it, they are installed beside Toa, which is where the composition's
 * process resolves them from.
 */
export function installs(instance: unknown): Record<string, string> {
  if (instance !== undefined) return {}

  return packages('extensions.exposition')
}
