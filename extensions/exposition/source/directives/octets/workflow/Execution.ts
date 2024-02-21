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
  private interrupted = false

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
      await this.execute(unit)

      if (this.interrupted)
        break
    }

    this.push(null)
  }

  private async execute (unit: Unit): Promise<void> {
    const promises = Object.entries(unit).map(async ([step, endpoint]) => {
      const result = await this.call(endpoint).catch((error: Error) => console.error(error))

      if (result instanceof Error) {
        this.push({ error: { step, ...result } })
        this.interrupted = true
      } else
        this.push({ [step]: result ?? null })
    })

    await Promise.all(promises)
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
  parameters: Record<string, string>
}
