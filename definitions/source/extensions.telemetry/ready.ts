export function normalizeAnnotation(
  ready: ReadyAnnotation | undefined
): ReadyConfig | false {
  if (ready === false) return false

  if (ready === undefined) return { enabled: true, ...DEFAULT_ANNOTATION }

  return {
    enabled: true,
    path: ready.path ?? DEFAULT_ANNOTATION.path,
    port: ready.port ?? DEFAULT_ANNOTATION.port
  }
}

export const DEFAULT_ANNOTATION = {
  path: '/.ready',
  port: 8001
} as const

export type ReadyAnnotation =
  | false
  | {
      path?: string
      port?: number
    }

export type ReadyConfig =
  | false
  | {
      enabled?: boolean
      path?: string
      port?: number
    }
