import { Path } from './Path'
import { IP } from './IP'
import type { KeyComponentMethod } from '../Configuration'
import type { Component } from './Component'

type Constructor<T> = new (options: unknown) => T

export const Components: Record<KeyComponentMethod, Constructor<Component>> = {
  ip: IP,
  path: Path
}

export type { Component }
