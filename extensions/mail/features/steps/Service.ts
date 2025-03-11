import { resolve } from 'node:path'
import { after, binding, given } from 'cucumber-tsflow'
import { load as parse } from 'js-yaml'
import { encode } from '@toa.io/generic'
import * as boot from '@toa.io/boot'
import { Factory } from '../../source'
import type { Connector } from '@toa.io/core'

@binding()
export class Service {
  private service: Connector | null = null
  private composition: Connector | null = null

  @given('the service is running')
  public async start (): Promise<void> {
    const factory = new Factory(boot)

    this.service = factory.service()

    await this.service.connect()
  }

  @given('the `{word}` configuration:')
  public async configure (id: string, yaml: string): Promise<void> {
    const [name, namespace = 'default'] = id.split('.').reverse()
    const key = `TOA_CONFIGURATION_${namespace.toUpperCase()}_${name.toUpperCase()}`
    const configuration = parse(yaml)

    process.env[key] = encode(configuration)
  }

  @given('the spam is running')
  public async runSpam (): Promise<void> {
    const spam = resolve(__dirname, './components/spam')

    this.composition = await boot.composition([spam])
    await this.composition.connect()
  }

  @after()
  public async stop (): Promise<void> {
    await this.service?.disconnect(true)
    await this.composition?.disconnect(true)
  }
}
