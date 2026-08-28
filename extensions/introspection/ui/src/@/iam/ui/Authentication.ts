import type { ClassValue } from 'svelte/elements'
import type { Method } from '@/iam'
import type { AccountLike } from './AccountLike'

export interface Props {
  account?: AccountLike
  class?: ClassValue
  oncreate?: (account: AccountLike, method: Method) => void
}
