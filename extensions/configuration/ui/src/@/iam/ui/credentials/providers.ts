import { Mail } from '@lucide/svelte'
import { icons } from '../oidc/icons'
import type { Component } from 'svelte'

/** Presentational descriptor for a provider row. Carries no behaviour. */
export interface Descriptor {
  id: 'email' | 'google' | 'apple'
  icon: Component
}

export const providers: readonly Descriptor[] = [
  { id: 'email', icon: Mail },
  { id: 'google', icon: icons.google },
  { id: 'apple', icon: icons.apple },
] as const
