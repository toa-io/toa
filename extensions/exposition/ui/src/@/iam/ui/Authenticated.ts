import type { Snippet } from 'svelte'
import type { Method } from '@/iam'
import type { AccountLike } from './AccountLike'

export interface Props {
  children: Snippet
  screen?: Snippet<[{ authentication: () => ReturnType<Snippet> }]>
  account?: AccountLike
  oncreate?: (account: AccountLike, method: Method) => void
}
