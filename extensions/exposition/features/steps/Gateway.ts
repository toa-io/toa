import { after, afterAll, binding, given } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { parse } from '@toa.io/yaml'
import { encode } from '@toa.io/generic'
import { Factory } from '../../source'
import * as syntax from '../../source/RTD/syntax'

@binding()
export class Gateway {
  private static instance: Connector | null = null

  public static async start (): Promise<void> {
    if (this.instance !== null)
      return

    const factory = new Factory(boot)
    const service = factory.service('gateway')

    if (service === null)
      throw new Error('?')

    this.instance = service

    await service.connect()
  }

  @afterAll()
  public static async stop (): Promise<void> {
    await this.instance?.disconnect()
    this.instance = null
  }

  @given('the annotation:')
  public async annotate (yaml: string): Promise<void> {
    const annotation = parse(yaml)
    const node = syntax.parse(annotation)

    process.env.TOA_EXPOSITION = encode(node)
  }

  @after()
  public cleanup (): void {
    process.env.TOA_EXPOSITION = undefined
  }
}
