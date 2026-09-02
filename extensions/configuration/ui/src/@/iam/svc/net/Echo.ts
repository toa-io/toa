import type { Grammar } from '$lib/intl'

export interface Echo {
  id: string
  roles: string[]
  name?: string
  locale?: string
  grammar?: Grammar | null
}
