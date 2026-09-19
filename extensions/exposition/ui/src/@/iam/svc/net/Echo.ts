import type { Grammar } from '$lib/intl'

/** What `GET /identity/` answers: the identity the credentials resolved to. */
export interface Echo {
  id: string
  roles: string[]
  scheme?: string
  provider?: string
  name?: string
  locale?: string
  grammar?: Grammar | null
}
