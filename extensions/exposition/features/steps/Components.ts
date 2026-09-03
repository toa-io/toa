import { createRequire } from 'node:module'
import * as assert from 'node:assert'
import { dirname, join } from 'node:path'
import tsflow from 'cucumber-tsflow'

import * as boot from '@toa.io/boot'
import { timeout } from '@toa.io/generic'
import { type Connector } from '@toa.io/core'
import { load as parse } from 'js-yaml'
import { Gateway } from './Gateway.js'
import { Workspace } from './Workspace.js'
import { components as map } from './map.js'

const { after, binding, given } = tsflow

const require = createRequire(import.meta.url)

const MAP = 'introspection'
const VALUES = 'configuration'

@binding([Workspace, Gateway])
export class Components {
  private readonly workspace: Workspace
  private readonly gateway: Gateway
  private compositions: Record<string, Connector> = {}

  public constructor (workspace: Workspace, gateway: Gateway) {
    this.workspace = workspace
    this.gateway = gateway
  }

  @given('the `{word}` is running')
  public async run (name: string): Promise<void> {
    await this.runComponent(name)
  }

  @given('the `{word}` is running with the following manifest:')
  public async patchAndRun (name: string, yaml: string): Promise<void> {
    const manifest = parse(yaml) as object

    await this.runComponent(name, manifest)
  }

  /** One composition, as the explorer hosts them. */
  @given('the introspection components are running')
  public async runMap (): Promise<void> {
    assert.ok(!(MAP in this.compositions), `Composition '${MAP}' is already running`)

    this.compositions[MAP] = await boot.composition(map())

    await this.compositions[MAP].connect()
    await timeout(50) // discovery
  }

  /** The values component, as the configuration extension ships it; the service hosts it alone. */
  @given('the configuration values are running')
  public async runValues (): Promise<void> {
    assert.ok(!(VALUES in this.compositions), `Composition '${VALUES}' is already running`)

    await this.gateway.start()

    this.compositions[VALUES] = await boot.composition([values()])

    await this.compositions[VALUES].connect()
    await timeout(50) // discovery
  }

  /** What the deployment would tell the values service, as the scenario needs it. */
  @given('the configuration values are deployed:')
  public deployValues (yaml: string): void {
    process.env.TOA_CONFIGURATION_VALUES = JSON.stringify(parse(yaml))
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

    delete process.env.TOA_CONFIGURATION_VALUES
  }

  private async runComponent (name: string, manifest?: object): Promise<void> {
    assert.ok(!(name in this.compositions), `Composition '${name}' is already running`)

    // the gateway first: a component announces itself when it opens, and that only
    // reaches a gateway that is already listening. Started the other way round, the
    // component waits for a knock, which the request that follows does not.
    await this.gateway.start()

    const path = await this.workspace.addComponent(name, manifest)

    this.compositions[name] = await boot.composition([path])

    await this.compositions[name].connect()
    await timeout(50) // discovery
  }
}

function values (): string {
  const root = dirname(require.resolve('@toa.io/extensions.configuration/package.json'))

  return join(root, 'components', 'configuration.values')
}
