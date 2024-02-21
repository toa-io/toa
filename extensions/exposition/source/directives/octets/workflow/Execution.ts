import { Readable } from 'stream'
import type { Unit } from './Workflow'
import type { Remotes } from '../../../Remotes'
import type { Component } from '@toa.io/core'
import type { Maybe } from '@toa.io/types'
import type { Entry } from '@toa.io/extensions.storages'

export class Execution extends Readable {
  private readonly units: Unit[]
  private readonly remotes: Remotes
  private readonly context: Context
  private readonly components: Record<string, Component> = {}
  private readonly discovery: Record<string, Promise<Component>> = {}

  public constructor (context: Context, units: Unit[], remotes: Remotes) {
    super({ objectMode: true })

    this.context = context
    this.units = units
    this.remotes = remotes

    void this.run()
  }

  public override _read (): void {
  }

  private async run (): Promise<void> {
    this.push(this.context.entry)

    for (const unit of this.units) {
      const ok = await this.execute(unit)

      if (!ok)
        break
    }

    this.push(null)
  }

  private async execute (unit: Unit): Promise<boolean> {
    for (const [step, endpoint] of Object.entries(unit)) {
      const result = await this.call(endpoint)

      if (result instanceof Error) {
        this.push({ error: { step, ...result } })

        return false
      } else
        this.push({ [step]: result ?? null })
    }

    return true
  }

  private async call (endpoint: string): Promise<Maybe<unknown>> {
    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()
    const key = `${namespace}.${component}`

    this.components[key] ??= await this.discover(key, namespace, component)

    return await this.components[key].invoke(operation, { input: this.context })
  }

  private async discover (key: string, namespace: string, component: string): Promise<Component> {
    if (this.discovery[key] === undefined)
      this.discovery[key] = this.remotes.discover(namespace, component)

    return await this.discovery[key]
  }
}

export interface Context {
  storage: string
  path: string
  entry: Entry
}
