import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The components an extension ships, as the digest of their manifests generated when this
 * package was built. A deploy reads them from here, because the extension is not installed
 * beside it; a running service reads them from the extension, where their code is.
 */
export function components(suffix: string, filter?: (label: string) => boolean): Components {
  const manifests = digest(suffix).filter((manifest) => filter?.(manifest.label) ?? true)

  return {
    labels: manifests.map((manifest) => manifest.label),
    manifests: manifests.map((manifest) => structuredClone(manifest.manifest))
  }
}

function digest(suffix: string): Entry[] {
  cache[suffix] ??= JSON.parse(readFileSync(resolve(ROOT, suffix + '.json'), 'utf8'))

  return cache[suffix]
}

const cache: Record<string, Entry[]> = {}

/** `transpiled/digest/read.js` → `digest/` */
const ROOT = resolve(import.meta.dirname, '../../digest')

export interface Components {
  /** what a chart names each component's workload by: `identity-basic` */
  labels: string[]
  /** the manifests as norm reads them, with `path` as a package-relative specifier */
  manifests: object[]
}

export interface Entry {
  label: string
  manifest: object
}
