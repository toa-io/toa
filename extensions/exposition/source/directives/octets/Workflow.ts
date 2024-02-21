import { NotFound } from '../../HTTP'
import * as schemas from './schemas'
import { Workflow } from './workflows'
import type { Unit } from './workflows'
import type { Directive, Input } from './types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Remotes } from '../../Remotes'
import type { Maybe } from '@toa.io/types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Parameter } from '../../RTD'

export class WorkflowDirective implements Directive {
  public readonly targeted = true

  private readonly workflow: Workflow
  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (units: Unit[] | Unit, discovery: Promise<Component>, remotes: Remotes) {
    schemas.workflow.validate(units)

    this.workflow = new Workflow(units, remotes)
    this.discovery = discovery
  }

  public async apply (storage: string, request: Input, parameters: Parameter[]): Promise<Output> {
    this.storage ??= await this.discovery

    const entry = await this.storage.invoke<Maybe<Entry>>('get',
      { input: { storage, path: request.url } })

    if (entry instanceof Error)
      throw new NotFound()

    return {
      status: 202,
      body: this.workflow.execute(request, storage, entry, parameters)
    }
  }
}
