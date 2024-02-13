import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { FileSystem } from './FileSystem'

export interface TemporaryOptions {
  prefix?: string
}

export class Temporary extends FileSystem {
  public constructor (props: TemporaryOptions) {
    super({ path: join(tmpdir(), props.prefix ?? '') })
  }
}
