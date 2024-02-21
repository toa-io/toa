import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileSystem } from './FileSystem'
import type { ProviderSecrets } from '../Provider'

export interface TemporaryOptions {
  directory: string
}

export class Temporary extends FileSystem {
  public constructor (options: TemporaryOptions, secrets?: ProviderSecrets) {
    const path = join(tmpdir(), options.directory)

    super({ path }, secrets)
  }
}
