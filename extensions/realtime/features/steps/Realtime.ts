import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import tsflow from 'cucumber-tsflow'

import { Factory } from '../../source/index.js'
import type { Route } from '../../source/extension.js'

const { after, binding } = tsflow

@binding()
export class Realtime {
  private readonly routes: Route[] = []
  // the factory loads its binding, so the service is made when it is first served
  private service: Connector | undefined
  private connected = false

  @after()
  public async shutdown (): Promise<void> {
    this.connected = false

    await this.service?.disconnect()
  }

  public declare (event: string, properties: string[], expose?: string[]): void {
    this.routes.push({ event, properties, expose })
  }

  public async serve (): Promise<void> {
    if (this.connected)
      return

    process.env.TOA_REALTIME = JSON.stringify(this.routes)

    this.connected = true
    this.service = await new Factory(boot.host()).service()

    await this.service.connect()
  }
}
