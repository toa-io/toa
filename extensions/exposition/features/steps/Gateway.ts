import { binding, given, after } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { Factory } from '../../source'

@binding()
export class Gateway {
  private instance: Connector | null = null

  @given('the Gateway is running')
  public async run (): Promise<void> {
    if (this.instance !== null) throw new Error('Gateway is already running')

    const factory = new Factory(boot)
    const service = factory.service('gateway')

    if (service === null) throw new Error('?')

    this.instance = service

    await this.instance.connect()
  }

  @after()
  public async stop (): Promise<void> {
    await this.instance?.disconnect()
    this.instance = null
  }
}
