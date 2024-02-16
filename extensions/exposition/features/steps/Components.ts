import * as assert from 'node:assert'
import { after, binding, given } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { timeout } from '@toa.io/generic'
import { type Connector } from '@toa.io/core'
import { parse } from '@toa.io/yaml'
import { Workspace } from './Workspace'

@binding([Workspace])
export class Components {
  private readonly workspace: Workspace
  private compositions: Record<string, Connector> = {}

  public constructor (workspace: Workspace) {
    this.workspace = workspace
  }

  @given('the `{word}` is running')
  public async run (name: string): Promise<void> {
    await this.runComponent(name)
  }

  @given('the `{word}` is running with the following manifest:')
  public async patchAndRun (name: string, yaml: string): Promise<void> {
    const manifest = parse(yaml)

    await this.runComponent(name, manifest)
  }

  @given('the `{word}` is stopped')
  public async stop (name: string): Promise<void> {
    assert.ok(name in this.compositions, `Composition '${name}' is not running`)

    await this.compositions[name].disconnect()
    delete this.compositions[name]
  }

  @after()
  public async shutdown (): Promise<void> {
    const promises = Object.values(this.compositions).map((composition) => composition.disconnect())

    await Promise.all(promises)
  }

  private async runComponent (name: string, manifest?: object): Promise<void> {
    assert.ok(!(name in this.compositions), `Composition '${name}' is already running`)

    const path = await this.workspace.addComponent(name, manifest)

    this.compositions[name] = await boot.composition([path])

    await this.compositions[name].connect()
    await timeout(50) // discovery
  }
}
