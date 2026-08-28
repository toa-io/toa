import { decode } from '@toa.io/generic'
import { DEFAULT_INTERVAL, DEFAULT_THRESHOLD, DENIED, ENV } from './const'
import type { Resources } from '@toa.io/operations'

/** `context.toa.yaml` */
export type Annotation = false | {
  /** Capture real payloads. Off by default: this is production data. */
  samples?: boolean
  /** Flush period, seconds. */
  interval?: number
  /** Flush as soon as this many distinct edges are buffered. */
  threshold?: number
  /** Publish the UI. On by default. */
  ui?: boolean
  resources?: Resources
}

/** `manifest.toa.yaml` */
export type Declaration = false | {
  samples?: boolean
}

/** What `deployment()` encodes into the environment. */
export interface Options {
  samples: boolean
  interval: number
  threshold: number
  ui: boolean
}

/** The effective per-component decision. */
export interface Settings {
  enabled: boolean
  samples: boolean
}

export const DISABLED: Settings = { enabled: false, samples: false }

export function options (annotation?: Annotation): Options {
  const declaration = annotation === undefined || annotation === false ? {} : annotation

  return {
    samples: declaration.samples === true,
    interval: declaration.interval ?? DEFAULT_INTERVAL,
    threshold: declaration.threshold ?? DEFAULT_THRESHOLD,
    ui: declaration.ui !== false
  }
}

/** Reads what `deployment()` has put into the environment. */
export function environment (): Options | null {
  const value = process.env[ENV]

  if (value === undefined)
    return null

  return decode<Options>(value)
}

export function component (declaration: Declaration | null | undefined): Declaration {
  if (declaration === false)
    return false

  // predefined extensions arrive as null for components that say nothing
  if (declaration === null || declaration === undefined)
    return {}

  return declaration.samples === undefined ? {} : { samples: declaration.samples }
}

/**
 * Both levels must agree, and either can veto: the context is the environment
 * ceiling, the manifest is the component's own call. A component handling
 * personal data opts out for good, and no context flag overrides that.
 */
export function settings (namespace: string, declaration: Declaration, opts: Options | null): Settings {
  if (opts === null || declaration === false)
    return DISABLED

  const samples = opts.samples && declaration.samples !== false && !DENIED.has(namespace)

  return { enabled: true, samples }
}
