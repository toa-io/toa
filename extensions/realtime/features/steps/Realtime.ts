import * as boot from '@toa.io/boot'
import { encode } from '@toa.io/generic'
import { type Connector } from '@toa.io/core'
import { after, binding } from 'cucumber-tsflow'
import { Factory } from '../../source'
import type { Route } from '../../source/extension'

@binding()
export class Realtime {
  private readonly routes: Route[] = []
  private readonly service: Connector
  private connected = false

  public constructor () {
    this.service = new Factory(boot).service()
  }

  @after()
  public async shutdown (): Promise<void> {
    this.connected = false

    await this.service.disconnect()
  }

  public declare (event: string, properties: string[], expose?: string[]): void {
    this.routes.push({ event, properties, expose })
  }

  public async serve (): Promise<void> {
    if (this.connected)
      return

    process.env.TOA_REALTIME = encode(this.routes)

    this.connected = true

    await this.service.connect()
  }
}
