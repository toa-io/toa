import { after, binding, given } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { timeout } from '@toa.io/generic'
import { type Connector } from '@toa.io/core'
import { parse } from '@toa.io/yaml'
import { Workspace } from './Workspace'

@binding([Workspace])
export class Components {
  private readonly workspace: Workspace
  private composition: Connector | null = null

  public constructor (workspace: Workspace) {
    this.workspace = workspace
  }

  @given('the `{word}` is running with the following manifest:')
  public async run (name: string, yaml: string): Promise<void> {
    const manifest = parse(yaml)
    const path = await this.workspace.addComponent(name, manifest)

    this.composition = await boot.composition([path])

    await this.composition.connect()
    await timeout(200) // discovery
  }

  @after()
  public async stop (): Promise<void> {
    await this.composition?.disconnect()
  }
}
