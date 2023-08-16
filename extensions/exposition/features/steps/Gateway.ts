import { binding, afterAll, beforeAll } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { Factory } from '../../source'

@binding()
export class Gateway {
  private static instance: Connector | null = null

  @beforeAll()
  public static async run (): Promise<void> {
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
  }
}
