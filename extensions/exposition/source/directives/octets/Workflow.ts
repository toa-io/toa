import { posix } from 'node:path'
import { promex } from '@toa.io/generic'
import { match } from 'matchacho'
import type { Input } from './types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes'

export class Workflow {
  private readonly units: Unit[]
  private readonly remotes: Remotes
  private readonly components: Record<string, Component> = {}
  private readonly discovery: Record<string, Promise<Component>> = {}

  public constructor (units: Unit[] | Unit, remotes: Remotes) {
    this.units = match<Unit[]>(units,
      Array, (units: Unit[]) => units,
      Object, (unit: Unit) => [unit])

    this.remotes = remotes
  }

  /* eslint-disable no-useless-return, max-depth */

  /**
   * Execute workflow units sequentially, steps within a unit in parallel.
   * Yield results as soon as they come.
   *
   * If you need to change this, it may take a while.
   */
  public async * execute (request: Input, storage: string, entry: Entry): AsyncGenerator {
    yield entry

    const path = posix.join(request.path, entry.id)
    let interrupted = false

    for (const unit of this.units) {
      if (interrupted)
        break

      const steps = Object.keys(unit)

      // unit result promises queue
      const results = Array.from(steps, promex<unknown>)
      let next = 0

      // execute steps in parallel
      for (const step of steps)
        // these promises are indirectly awaited in the yield loop
        void (async () => {
          const endpoint = unit[step]
          const context: Context = { storage, path, entry }
          const result = await this.call(endpoint, context)

          if (interrupted)
            return

          // as a result is received, resolve the next promise from the queue
          const promise = results[next++]

          if (result instanceof Error) {
            interrupted = true
            promise.resolve({ error: { step, ...result } })

            // cancel pending promises
            results[next]?.resolve(null)
          } else
            promise.resolve({ [step]: result ?? null })
        })().catch((e) => results[next].reject(e))

      // yield results from the queue as they come
      for (const promise of results) {
        const result = await promise

        if (result === null) // canceled promise
          break
        else
          yield result
      }
    }
  }

  private async call (endpoint: string, context: Context): Promise<Maybe<unknown>> {
    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()
    const key = `${namespace}.${component}`

    this.components[key] ??= await this.discover(key, namespace, component)

    return await this.components[key].invoke(operation, { input: context })
  }

  private async discover (key: string, namespace: string, component: string): Promise<Component> {
    if (this.discovery[key] === undefined)
      this.discovery[key] = this.remotes.discover(namespace, component)

    return await this.discovery[key]
  }
}

export type Unit = Record<string, string>

interface Context {
  storage: string
  path: string
  entry: Entry
}
