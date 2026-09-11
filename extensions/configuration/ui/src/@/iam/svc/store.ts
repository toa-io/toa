import { derived, writable } from 'svelte/store'
import { value } from 'svas'
import type { IDP } from './oidc'
import type { Echo } from './net'

export type { Echo } from './net'

export const account = value<Echo>({
  persist: 'auth:account',
})

export const challenge = value<string>({
  persist: 'auth:challenge',
  bind: account,
})

export const method = value<Method>({
  persist: 'auth:method',
})

export const processing = writable(false)
export const greeting = writable(false)

export const authenticated = derived(
  [challenge, account, processing],
  ([$challenge, $account, $processing]) =>
    $challenge !== null && $account !== null && $processing === false,
)

export function iam(value: Echo) {
  if (account.extract()?.id !== value.id) account.set(null) // clear bound stores

  account.set(value)
}

export type Account = Echo
export type Method = 'passkey' | 'password' | IDP
