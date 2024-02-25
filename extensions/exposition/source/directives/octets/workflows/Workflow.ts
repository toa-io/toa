import { posix } from 'node:path'
import { match } from 'matchacho'
import { Execution } from './Execution'
import type { Context } from './Execution'
import type { Parameter } from '../../../RTD'
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

  // eslint-disable-next-line max-params
  public execute
  (input: Input, storage: string, entry: Entry, params: Parameter[]): Execution {
    const path = posix.join(input.request.url, entry.id)
    const parameters: Record<string, string> = {}

    for (const { name, value } of params)
      parameters[name] = value

    const context: Context = { storage, path, entry, parameters }

    return new Execution(context, this.units, this.remotes)
  }
}

export type Unit = Record<string, string>
