import { Path } from './Path.js'
import { IP } from './IP.js'
import { Route } from './Route.js'
import { Identity } from './Identity.js'
import { Segment } from './Segment.js'
import type { KeyComponentMethod } from '../Configuration.js'
import type { Component } from './Component.js'
import type { Address } from '../../../../../Annotation.js'

type Constructor<T> = new (options: unknown, route: string, address?: Address) => T

export const Components: Record<KeyComponentMethod, Constructor<Component>> = {
  ip: IP,
  path: Path,
  route: Route,
  identity: Identity,
  segment: Segment
}

export type { Component }
