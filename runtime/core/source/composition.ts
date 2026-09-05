import { console } from 'openspan'
import { Connector } from './connector.js'

export class Composition extends Connector {
  // eslint-disable-next-line max-params
  public constructor (expositions: Connector[], producers: Connector[],
    receivers: Connector[], tenants: Connector[]) {
    super()

    if (expositions.length > 0) this.depends(expositions)
    if (producers.length > 0) this.depends(producers)
    if (receivers.length > 0) this.depends(receivers)
    if (tenants.length > 0) this.depends(tenants)
  }

  protected override async open (): Promise<void> {
    console.info('Composition complete')
  }

  protected override async dispose (): Promise<void> {
    console.info('Composition shutdown complete')
  }
}
