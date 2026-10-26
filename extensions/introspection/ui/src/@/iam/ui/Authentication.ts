import type { ClassValue } from 'svelte/elements'
import type { AccountLike } from './AccountLike'
import type { Method } from '#/iam/index.js'

export interface Props {
  account?: AccountLike
  class?: ClassValue
  oncreate?: (account: AccountLike, method: Method) => void
}
