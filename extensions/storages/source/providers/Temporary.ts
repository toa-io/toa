import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileSystem } from './FileSystem'

export interface TemporaryOptions {
  directory: string
}

export class Temporary extends FileSystem {
  public constructor (props: TemporaryOptions) {
    const path = join(tmpdir(), props.directory)

    super({ path })
  }
}
