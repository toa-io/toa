import { type Readable, Transform, pipeline } from 'node:stream'
import { NotFound } from '../../HTTP/index.js'
import * as schemas from './schemas.js'
import { Workflow } from './workflows/index.js'
import { Directive } from './Directive.js'
import type { Parameter } from '../../RTD/index.js'
import type { Unit, Location, Report } from './workflows/index.js'
import type { Maybe } from '@toa.io/core/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io.js'
import type { Input } from './types.js'
import type { Remotes } from '../../Remotes.js'
import type { Entry } from '@toa.io/extensions.storages'

export class Delete extends Directive {
  public readonly targeted = true

  private readonly workflow?: Workflow
  private readonly discovery: Promise<Component>
  private storage!: Component

  public constructor(
    options: Options | null,
    discovery: Promise<Component>,
    remotes: Remotes
  ) {
    super()
    schemas.remove.validate(options)

    if (options?.workflow !== undefined)
      this.workflow = new Workflow(options.workflow, remotes)

    this.discovery = discovery
  }

  public async apply(
    storage: string,
    input: Input,
    parameters: Parameter[]
  ): Promise<Output> {
    this.storage ??= await this.discovery

    const output: Output = {}

    if (this.workflow !== undefined) {
      const entry = await this.storage.invoke<Maybe<Entry>>('head', {
        input: {
          storage,
          path: input.request.url
        }
      })

      if (entry instanceof Error) throw new NotFound()

      output.status = 202
      output.body = this.execute(input, storage, entry, parameters)
    } else await this.delete(storage, input)

    return output
  }

  private async delete(storage: string, input: Input): Promise<void> {
    await this.storage.invoke('delete', {
      input: {
        storage,
        path: input.request.url
      }
    })
  }

  /**
   * The reports, then the deletion once every step has completed. A reply destroyed before
   * that — the client gone, the gateway stopping — destroys the execution with it, and the
   * entry stays.
   */
  // eslint-disable-next-line max-params
  private execute(
    input: Input,
    storage: string,
    entry: Entry,
    parameters: Parameter[]
  ): Readable {
    const location: Location = {
      storage,
      authority: input.authority,
      path: input.request.url
    }

    let failed = false

    const reports = new Transform({
      objectMode: true,
      transform: (report: Report, _, callback) => {
        if (report.error !== undefined || report.status === 'exception') failed = true

        callback(null, report)
      },
      flush: (callback) => {
        if (failed) callback()
        else this.delete(storage, input).then(() => callback(), callback)
      }
    })

    // the error is the reply's, and the pipeline that writes the reply reports it
    pipeline(this.workflow!.execute(location, entry, parameters), reports, () => {})

    return reports
  }
}

export interface Options {
  workflow?: Unit[] | Unit
}
