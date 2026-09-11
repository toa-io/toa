import { NotFound } from '../../HTTP/index.ts'
import * as schemas from './schemas.ts'
import { Workflow } from './workflows/index.ts'
import { Directive } from './Directive.ts'
import type { Unit, Location } from './workflows/index.ts'
import type { Input } from './types.ts'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io.ts'
import type { Remotes } from '../../Remotes.ts'
import type { Maybe } from '@toa.io/core/types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Parameter } from '../../RTD/index.ts'

export class WorkflowDirective extends Directive {
  public readonly targeted = true

  private readonly workflow: Workflow
  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor(
    units: Unit[] | Unit,
    discovery: Promise<Component>,
    remotes: Remotes
  ) {
    super()
    schemas.workflow.validate(units)

    this.workflow = new Workflow(units, remotes)
    this.discovery = discovery
  }

  public async apply(
    storage: string,
    input: Input,
    parameters: Parameter[]
  ): Promise<Output> {
    this.storage ??= await this.discovery

    const entry = await this.storage.invoke<Maybe<Entry>>('head', {
      input: {
        storage,
        path: input.request.url
      }
    })

    if (entry instanceof Error) throw new NotFound()

    const location: Location = {
      storage,
      authority: input.authority,
      path: input.request.url
    }

    return {
      status: 202,
      body: this.workflow.execute(location, entry, parameters)
    }
  }
}
