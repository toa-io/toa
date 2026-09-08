import { Readable } from 'node:stream'
import { console } from 'openspan'
import type { Unit } from './Workflow.js'
import type { Remotes } from '../../../Remotes.js'
import type { Component } from '@toa.io/core'
import type { Maybe } from '@toa.io/core/types'
import type { Entry } from '@toa.io/extensions.storages'

export class Execution extends Readable {
  private readonly units: Unit[]
  private readonly remotes: Remotes
  private readonly context: Context
  private readonly components: Record<string, Component> = {}
  private readonly discovery: Record<string, Promise<Component>> = {}

  /** The step streams being read, to be cut with the execution. */
  private readonly streams = new Set<Readable>()
  private interrupted = false

  public constructor(context: Context, units: Unit[], remotes: Remotes) {
    super({ objectMode: true })

    this.context = context
    this.units = units
    this.remotes = remotes

    void this.run()
  }

  public override _read(): void {}

  /**
   * Nobody reads the reports any more: the reply was destroyed, or the gateway is stopping.
   * The step in flight completes — an invocation is not cancelled — and no other starts.
   */
  public override _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    this.interrupted = true

    for (const stream of this.streams) stream.destroy()

    callback(error)
  }

  private async run(): Promise<void> {
    for (const unit of this.units) {
      await this.execute(unit)

      if (this.interrupted) break
    }

    if (!this.destroyed) this.push(null)
  }

  private async execute(unit: Unit): Promise<void> {
    const promises = Object.entries(unit).map(async ([step, endpoint]) => {
      try {
        const result = await this.call(endpoint)

        if (result instanceof Readable) return await this.stream(step, result)

        this.report(step, result)
      } catch (e: unknown) {
        this.exception(step, e)
      }
    })

    await Promise.all(promises)
  }

  private async stream(step: string, stream: Readable): Promise<void> {
    this.streams.add(stream)

    try {
      for await (const result of stream) this.report(step, result, false)

      this.report(step, undefined, true)
    } catch (e: unknown) {
      this.exception(step, e)
    } finally {
      this.streams.delete(stream)
    }
  }

  private report(step: string, result?: Maybe<unknown>, completed = true): void {
    if (this.destroyed) return

    const report: Report = { step }

    if (completed) report.status = 'completed'

    if (result instanceof Error) {
      // an Error cannot be serialized where it sits, and the encoders only unwrap
      // one they are handed directly — this one travels nested inside the report
      report.error = { ...result }
      this.interrupted = true
    } else if (result !== undefined) {
      report.output = result
      this.context.steps[step] = structuredClone(result)
    }

    this.push(report)
  }

  private exception(step: string, error: unknown): void {
    // a step stream cut by `_destroy` is not an exception of the step
    if (this.destroyed) return

    console.error('Workflow exception', error as Error)

    this.push({ step, status: 'exception' } satisfies Report)
    this.interrupted = true
  }

  private async call(endpoint: string): Promise<Maybe<unknown>> {
    const task = endpoint.startsWith('task:')

    if (task) endpoint = endpoint.slice(5)

    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()
    const key = `${namespace}.${component}`

    this.components[key] ??= await this.discover(key, namespace, component)

    return this.components[key].invoke(operation, { input: this.context, task })
  }

  private async discover(
    key: string,
    namespace: string,
    component: string
  ): Promise<Component> {
    if (this.discovery[key] === undefined)
      this.discovery[key] = this.remotes.discover(namespace, component)

    return await this.discovery[key]
  }
}

export interface Context {
  authority: string
  identity?: string
  storage: string
  path: string
  entry: Entry
  parameters: Record<string, string>
  steps: Record<string, unknown>
}

export interface Report {
  step: string
  status?: 'completed' | 'exception'
  output?: unknown
  error?: Record<string, unknown>
}
