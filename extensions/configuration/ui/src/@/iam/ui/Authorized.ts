import { dev } from '$app/environment'
import type { Snippet } from 'svelte'
import type { Echo } from '@/iam'

interface Checks {
  /** Development environment */
  dev?: boolean
  /** Beta domain */
  beta?: boolean
  /** `dev` or `beta` */
  debug?: boolean
  /** Required role */
  role?: string
}

export interface Props extends Checks {
  children: Snippet
  /**
   * What stands in place of the children when the checks say no. Without it the account
   * is told what it is missing and given its own id to ask with; a gate that guards a
   * control rather than a screen passes an empty snippet.
   */
  denied?: Snippet
}

type Principal = Pick<Echo, 'id' | 'roles'>

export function authorize(checks: Checks, principal: Principal | null): boolean {
  if (checks.dev !== undefined)
    if (checks.dev === dev)
      return true

  if (checks.beta !== undefined)
    if (checks.beta === beta())
      return true

  if (checks.debug !== undefined)
    if (checks.debug === debug())
      return true

  if (checks.role !== undefined && principal?.roles !== undefined)
    if (scoped(principal.roles, checks.role))
      return true

  return false
}

function beta(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.startsWith('beta.')
}

function debug(): boolean {
  return dev || beta()
}

/**
 * `app` role matches `app`, `app:codes` and all nested scope
 * `app:codes` role matches `app:codes` and all nested scopes, but not `app`
 */
function scoped(roles: string[], scope: string): boolean {
  for (const role of roles)
    if (role === scope || scope.startsWith(role + ':')) return true

  return false
}
