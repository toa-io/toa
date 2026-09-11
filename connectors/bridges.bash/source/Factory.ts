import { join } from 'node:path'
import { Algorithm } from './Algorithm.ts'
import { DIR, EXT } from '@toa.io/definitions/bridges.bash'
import type { bridges } from '@toa.io/core/types'

export class Factory implements bridges.Factory {
  public algorithm(root: string, name: string): bridges.Algorithm {
    const path = join(root, DIR, name + EXT)

    return new Algorithm(path)
  }
}
