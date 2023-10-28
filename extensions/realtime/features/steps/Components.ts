import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { after, before, binding, given, when } from 'cucumber-tsflow'
import { parse } from '@toa.io/yaml'
import * as stage from '@toa.io/userland/stage'
import { type Component, type Request } from '@toa.io/core'
import { timeout } from '@toa.io/generic'
import { Realtime } from './Realtime'

@binding([Realtime])
export class Components {
  private readonly realtime: Realtime
  private remotes: Record<string, Component> = {}

  public constructor (realtime: Realtime) {
    this.realtime = realtime
  }

  @given('the `{word}` component is running with routes:')
  public async run (component: string, yaml: string): Promise<void> {
    const routes = parse<Manifest>(yaml)
    const [name, namespace = 'default'] = component.split('.').reverse()

    for (const [event, value] of Object.entries(routes)) {
      const label = `${namespace}.${name}.${event}`
      const properties = Array.isArray(value) ? value : [value]

      this.realtime.declare(label, properties)
    }
  }

  @when('the `{word}` is called with:')
  public async call (endpoint: string, yaml: string): Promise<void> {
    const request = parse<Request>(yaml)
    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()
    const id = `${namespace}.${component}`

    this.remotes[id] ??= await stage.remote(id)

    await this.remotes[id].invoke(operation, request)
    await timeout(500)
  }

  @before()
  private async compose (): Promise<void> {
    const paths = componentPaths()

    await stage.compose(paths)
  }

  @after()
  private async shutdown (): Promise<void> {
    this.remotes = {}

    await stage.shutdown()
  }
}

function componentPaths (): string[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(ROOT, entry.name))
}

const ROOT = resolve(__dirname, 'components')

interface Manifest {
  realtime: Map<string, string | string[]>
}
