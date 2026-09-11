import { Path } from './Path.ts'
import { IP } from './IP.ts'
import { Route } from './Route.ts'
import { Identity } from './Identity.ts'
import { Segment } from './Segment.ts'
import type { KeyComponentMethod } from '../Configuration.ts'
import type { Component } from './Component.ts'
export type { Component } from './Component.ts'

type Constructor<T> = new (options: unknown, route: string) => T

export const Components: Record<KeyComponentMethod, Constructor<Component>> = {
  ip: IP,
  path: Path,
  route: Route,
  identity: Identity,
  segment: Segment
}
