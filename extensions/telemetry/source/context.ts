import type { Contribution } from '@toa.io/core/types'

/** What this extension puts on the context of every component, being declared for all. */
export function context (): Contribution[] {
  const imports = { '@toa.io/extensions.telemetry': ['Logs', 'Span'] }

  return [
    { name: 'logs', type: 'Logs', imports },
    { name: 'span', type: 'Span', imports }
  ]
}
