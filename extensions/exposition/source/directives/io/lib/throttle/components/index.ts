import { Path } from './Path'
import { IP } from './IP'
import { Route } from './Route'
import { Identity } from './Identity'
import { Segment } from './Segment'
import type { KeyComponentMethod } from '../Configuration'
import type { Component } from './Component'

type Constructor<T> = new (options: unknown, route: string) => T

export const Components: Record<KeyComponentMethod, Constructor<Component>> = {
  ip: IP,
  path: Path,
  route: Route,
  identity: Identity,
  segment: Segment
}

export type { Component }
