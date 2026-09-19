import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Provider } from './secrets.ts'
import type { Annotation } from './Annotation.ts'
import type { Instance } from './deployment.ts'

const peers: Record<string, string> = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8')
).peerDependencies

/**
 * What each provider is written against, stated apart from the provider for the reason its
 * secrets are: so that a deploy installs the SDK without loading it, and an image carries no
 * SDK a declaration does not name. The versions are this package's optional peers, so a bump
 * is a change to its manifest alone. They are the extension's optional peers at the versions it
 * declares them — `packages.test.ts` is what keeps the two the same.
 */
export const packages: Record<Provider, Readonly<Record<string, string>>> = {
  s3: pin('@aws-sdk/client-s3', '@aws-sdk/lib-storage'),
  spaces: pin('@aws-sdk/client-s3', '@aws-sdk/lib-storage'),
  cloudinary: pin('cloudinary'),
  fs: {},
  tmp: {},
  test: {}
}

/**
 * What a deploy installs so that this component's storages run: the packages of the providers
 * of the storages it declares. A component that declares the extension and names no storage —
 * `storages: ~`, which is what `exposition.octets` declares — reaches every storage there is,
 * and takes every provider with it.
 *
 * A storage is a component's to declare, so there is nothing here for a workload that runs
 * this extension's service, which is what no instance means.
 */
export function installs(
  instance: Instance | undefined,
  annotation: unknown
): Record<string, string> {
  if (instance === undefined || !isAnnotation(annotation)) return {}

  const declared = instance.manifest ?? []
  const names = declared.length > 0 ? declared : Object.keys(annotation)
  const required: Record<string, string> = {}

  for (const name of names) {
    const declaration = annotation[name]

    if (declaration === undefined) continue

    Object.assign(required, packages[declaration.provider] ?? {})
  }

  return required
}

function isAnnotation(value: unknown): value is Annotation {
  return typeof value === 'object' && value !== null
}

function pin(...names: string[]): Record<string, string> {
  const pinned: Record<string, string> = {}

  for (const name of names) pinned[name] = peers[name]

  return pinned
}
