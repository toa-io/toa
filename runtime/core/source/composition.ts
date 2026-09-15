import { console } from 'openspan'
import { Connector } from './connector.ts'

export class Composition extends Connector {
  public constructor(
    producers: Connector[],
    receivers: Connector[],
    tenants: Connector[]
  ) {
    super()

    if (producers.length > 0) this.depends(producers)
    if (receivers.length > 0) this.depends(receivers)
    if (tenants.length > 0) this.depends(tenants)
  }

  protected override async open(): Promise<void> {
    console.info('Composition complete')
  }

  protected override async dispose(): Promise<void> {
    console.info('Composition shutdown complete')
  }
}
