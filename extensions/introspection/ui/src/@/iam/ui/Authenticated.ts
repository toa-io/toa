import type { Snippet } from 'svelte'
import type { AccountLike } from './AccountLike'
import type { Method } from '#/iam/index.js'

export interface Props {
  children: Snippet
  screen?: Snippet<[{ authentication: () => ReturnType<Snippet> }]>
  account?: AccountLike
  oncreate?: (account: AccountLike, method: Method) => void
}
