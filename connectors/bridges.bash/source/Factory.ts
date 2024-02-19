import { join } from 'node:path'
import { Algorithm } from './Algorithm'
import { DIR, EXT } from './const'
import type { bridges } from '@toa.io/core'

export class Factory implements bridges.Factory {
  public algorithm (root: string, name: string): bridges.Algorithm {
    const path = join(root, DIR, name + EXT)

    return new Algorithm(path)
  }
}
