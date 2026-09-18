import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { environment } from '@toa.io/generic'

import { after, binding, given } from 'specumber'

import { Factory } from '../../source/index.ts'
import type { Route } from '@toa.io/definitions/extensions.realtime'

@binding()
export class Realtime {
  private readonly routes: Route[] = []
  // the factory loads its binding, so the service is made when it is first served
  private service: Connector | undefined
  private connected = false
  private configuration: string | undefined

  @given('the streams expire in {int} seconds')
  public expire(seconds: number): void {
    this.configuration = environment.get('TOA_CONFIGURATION_REALTIME_STREAMS')

    environment.set(
      'TOA_CONFIGURATION_REALTIME_STREAMS',
      JSON.stringify({ expire: seconds })
    )
  }

  @after()
  public async shutdown(): Promise<void> {
    await this.stop()

    this.routes.length = 0

    if (this.configuration !== undefined) {
      environment.set('TOA_CONFIGURATION_REALTIME_STREAMS', this.configuration)
      this.configuration = undefined
    }
  }

  public declare(
    event: string,
    properties: string[],
    expose?: string[],
    dynamic?: Route['dynamic']
  ): void {
    const route: Route = { event, properties, expose }

    if (dynamic !== undefined) route.dynamic = dynamic

    this.routes.push(route)
  }

  /** What `TOA_REALTIME` is for the scenario, which a replica of its own is given too. */
  public declaration(): string {
    return JSON.stringify(this.routes)
  }

  public async serve(): Promise<void> {
    if (this.connected) return

    environment.set('TOA_REALTIME', this.declaration())

    this.connected = true
    this.service = await new Factory(boot.host()).service()

    await this.service.connect()
  }

  public async restart(): Promise<void> {
    await this.stop()
    await this.serve()
  }

  private async stop(): Promise<void> {
    this.connected = false

    await this.service?.disconnect()
    this.service = undefined
  }
}
