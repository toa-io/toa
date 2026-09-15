import * as boot from '@toa.io/boot'
import { contract, type Contract } from '@toa.io/core'
import type { Manifest } from '@toa.io/norm'

/**
 * What this process is given about the components a scenario runs, as a deployment's map states
 * it. A scenario starts a service before the components it reaches — a receiver is bound at what
 * the map states, and a route is served whatever is running — so what a suite composes it states
 * here first.
 */
const map: Record<string, Contract> = {}

export function state(manifest: Manifest): void {
  map[manifest.locator.id] = contract.component(manifest)

  boot.map.use(map)
}

export function forget(): void {
  for (const id of Object.keys(map)) delete map[id]

  boot.map.use(undefined)
}
