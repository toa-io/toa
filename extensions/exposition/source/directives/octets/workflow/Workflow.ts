import { posix } from 'node:path'
import { match } from 'matchacho'
import { Execution } from './Execution'
import type { Input } from '../types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Remotes } from '../../../Remotes'

export class Workflow {
  private readonly units: Unit[]
  private readonly remotes: Remotes

  public constructor (units: Unit[] | Unit, remotes: Remotes) {
    this.units = match<Unit[]>(units,
      Array, (units: Unit[]) => units,
      Object, (unit: Unit) => [unit])

    this.remotes = remotes
  }

  public execute (request: Input, storage: string, entry: Entry): Execution {
    const path = posix.join(request.path, entry.id)
    const context = { storage, path, entry }

    return new Execution(context, this.units, this.remotes)
  }
}

export type Unit = Record<string, string>
