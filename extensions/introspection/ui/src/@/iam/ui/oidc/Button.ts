import type { ClassValue } from 'svelte/elements'
import type { Snippet } from 'svelte'
import type { AccountLike } from '../AccountLike'
import type { oidc } from '#/iam/index.js'

export interface Props {
  idp: oidc.IDP
  children?: Snippet
  account?: AccountLike
  class?: ClassValue
}
