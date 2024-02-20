import { NotFound } from '../../HTTP'
import * as schemas from './schemas'
import { Workflow } from './workflow'
import type { Unit } from './workflow'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Directive, Input } from './types'
import type { Remotes } from '../../Remotes'
import type { Entry } from '@toa.io/extensions.storages'

export class Delete implements Directive {
  public readonly targeted = true

  private readonly workflow?: Workflow
  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (options: Options | null, discovery: Promise<Component>, remotes: Remotes) {
    schemas.remove.validate(options)

    if (options?.workflow !== undefined)
      this.workflow = new Workflow(options.workflow, remotes)

    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const entry = await this.storage.invoke<Maybe<Entry>>('get',
      { input: { storage, path: request.url } })

    if (entry instanceof Error)
      throw new NotFound()

    const output: Output = {}

    if (this.workflow !== undefined) {
      output.status = 202
      output.body = Readable.from(this.execute(request, storage, entry))
    } else
      await this.delete(storage, request)

    return output
  }

  private async delete (storage: string, request: Input): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.storage!.invoke('delete',
      { input: { storage, path: request.url } })
  }

  private async * execute (request: Input, storage: string, entry: Entry): AsyncGenerator {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    for await (const chunk of this.workflow!.execute(request, storage, entry)) {
      yield chunk

      if (typeof chunk === 'object' && chunk !== null && 'error' in chunk)
        return
    }

    await this.delete(storage, request)
  }
}

export interface Options {
  workflow?: Unit[] | Unit
}
