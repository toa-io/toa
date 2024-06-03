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
    for (const unit of this.units) {
      await this.execute(unit)

      if (this.interrupted)
        break
    }

    this.push(null)
  }

  private async execute (unit: Unit): Promise<void> {
    const promises = Object.entries(unit).map(async ([step, endpoint]) => {
      try {
        const result = await this.call(endpoint)

        this.report(step, null, result)
      } catch (e: any) {
        this.report(step, e)
        this.interrupted = true
      }
    })

    await Promise.all(promises)
  }

  private report (step: string, exception: any, result?: Maybe<unknown>): void {
    const report: Report = { step }

    if (exception === null) {
      report.status = 'completed'

      if (result instanceof Error) {
        report.error = result
        this.interrupted = true
      } else if (result !== undefined)
        report.output = result
    } else {
      report.status = 'exception'

      console.error(exception)
    }

    this.push(report)
  }

  private async call (endpoint: string): Promise<Maybe<unknown>> {
    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()
    const key = `${namespace}.${component}`

    this.components[key] ??= await this.discover(key, namespace, component)

    return this.components[key].invoke(operation, { input: this.context })
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

interface Report {
  step: string
  status?: 'completed' | 'exception'
  output?: unknown
  error?: Error
}
