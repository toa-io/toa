import {
  DEFAULT_INTERVAL,
  DEFAULT_THRESHOLD,
  DENIED,
  DURATION,
  ENV,
  QUIESCENCE
} from './const.ts'
import type { Bounds } from './const.ts'
import { environment as variables } from '@toa.io/generic'
import type { Resources } from '@toa.io/operations'

/** `context.toa.yaml` */
export type Annotation =
  | false
  | {
      /** Capture real payloads. Off by default: this is production data. */
      samples?: boolean
      /** Flush period, seconds. */
      interval?: number
      /** Flush as soon as this many distinct edges are buffered. */
      threshold?: number
      /** Publish the UI. On by default. */
      ui?: boolean

      /**
       * Accept halt signals. Off by default: a stop button for the whole deployment,
       * reachable over HTTP, is a thing an application asks for rather than inherits.
       *
       * `true` takes what the runtime holds a halt to; an object narrows it, because how long
       * a deployment needs to drain and how long it can afford to be down are its own.
       */
      halt?: boolean | Halt
      resources?: Resources
    }

/** What a halt of this deployment may ask for, seconds. */
export interface Halt {
  /** how long it may stay down */
  duration?: Bounds
  /** how long it may be given to go quiet before the map is read */
  quiescence?: Bounds
}

/** `manifest.toa.yaml` */
export type Declaration =
  | false
  | {
      samples?: boolean
    }

/** What `deployment()` encodes into the environment. */
export interface Options {
  samples: boolean
  interval: number
  threshold: number
  ui: boolean
  halt: boolean
  /** what a halt may ask to stay down for */
  duration: Bounds
  /** what it may ask to go quiet for */
  quiescence: Bounds
}

/** The effective per-component decision. */
export interface Settings {
  enabled: boolean
  samples: boolean
}

export const DISABLED: Settings = { enabled: false, samples: false }

export function options(annotation?: Annotation): Options {
  const declaration = annotation === undefined || annotation === false ? {} : annotation
  const halt = declaration.halt === undefined || declaration.halt === false ? {} : declaration.halt

  return {
    samples: declaration.samples === true,
    interval: declaration.interval ?? DEFAULT_INTERVAL,
    threshold: declaration.threshold ?? DEFAULT_THRESHOLD,
    ui: declaration.ui !== false,
    halt: declaration.halt !== undefined && declaration.halt !== false,
    duration: bounds(halt === true ? undefined : halt.duration, DURATION, 'duration'),
    quiescence: bounds(halt === true ? undefined : halt.quiescence, QUIESCENCE, 'quiescence')
  }
}

/**
 * What the deployment says a halt may ask for, or what the runtime holds one to. Checked here
 * rather than in the schema, which can say that a pair is two non-negative integers and cannot
 * say that the first is the smaller.
 */
function bounds(declared: Bounds | undefined, fallback: Bounds, name: string): Bounds {
  if (declared === undefined) return fallback

  const [min, max] = declared

  if (min >= max)
    throw new Error(`Invalid introspection annotation: 'halt.${name}' is [${min}, ${max}], ` +
      'and the first of a pair is the smaller')

  return [min, max]
}

/** Reads what `deployment()` has put into the environment. */
export function environment(): Options | null {
  const value = variables.get(ENV)

  if (value === undefined) return null

  return JSON.parse(value) as Options
}

export function component(declaration: Declaration | null | undefined): Declaration {
  if (declaration === false) return false

  // predefined extensions arrive as null for components that say nothing
  if (declaration === null || declaration === undefined) return {}

  return declaration.samples === undefined ? {} : { samples: declaration.samples }
}

/**
 * Both levels must agree, and either can veto: the context is the environment
 * ceiling, the manifest is the component's own call. A component handling
 * personal data opts out for good, and no context flag overrides that.
 */
export function settings(
  namespace: string,
  declaration: Declaration,
  opts: Options | null
): Settings {
  if (opts === null || declaration === false) return DISABLED

  const samples = opts.samples && declaration.samples !== false && !DENIED.has(namespace)

  return { enabled: true, samples }
}
