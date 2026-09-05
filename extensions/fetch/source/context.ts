import type { Contribution } from '@toa.io/core/types'

/** What this extension puts on the context of every component, being declared for all. */
export function context (): Contribution {
  return {
    name: 'fetch',
    type: '(input: string | URL | Request, init?: FetchInit) => Promise<Response>',
    imports: { '@toa.io/extensions.fetch': ['FetchInit'] }
  }
}
