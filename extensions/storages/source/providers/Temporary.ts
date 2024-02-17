import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { FileSystem } from './FileSystem'

export interface TemporaryOptions {
  directory?: string
}

export class Temporary extends FileSystem {
  public constructor (props: TemporaryOptions) {
    const directory = props.directory ?? Math.random().toString(36).substring(7)
    const path = join(tmpdir(), directory)

    super({ path })
  }
}
