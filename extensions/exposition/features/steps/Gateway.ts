import { after, afterAll, beforeAll, binding, given } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { parse } from '@toa.io/yaml'
import { encode } from '@toa.io/generic'
import { Factory } from '../../source'

@binding()
export class Gateway {
  private static instance: Connector | null = null

  @given('the annotation:')
  public async annotate (yaml: string): Promise<void> {
    const annotation = parse(yaml)

    process.env.TOA_EXPOSITION = encode(annotation)

    await Gateway.stop()
    await Gateway.start()
  }

  @after()
  public cleanup (): void {
    process.env.TOA_EXPOSITION = undefined
  }

  @beforeAll()
  public static async start (): Promise<void> {
    if (this.instance !== null) throw new Error('Gateway is already running')

    const factory = new Factory(boot)
    const service = factory.service('gateway')

    if (service === null) throw new Error('?')

    this.instance = service

    await service.connect()
  }

  @afterAll()
  public static async stop (): Promise<void> {
    await this.instance?.disconnect()
    this.instance = null
  }
}
