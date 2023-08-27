import { after, afterAll, binding, given } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { parse } from '@toa.io/yaml'
import { encode } from '@toa.io/generic'
import { Factory } from '../../source'
import * as syntax from '../../source/RTD/syntax'
import { shortcuts } from '../../source/shortcuts'

@binding()
export class Gateway {
  private static instance: Connector | null = null

  public static async start (): Promise<void> {
    if (this.instance !== null)
      await Gateway.stop()

    process.env.TOA_EXPOSITION ??= DEFAULT_ANNOTATION

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
    const node = syntax.parse(annotation, shortcuts)

    process.env.TOA_EXPOSITION = encode(node)
  }

  @after()
  public async cleanup (): Promise<void> {
    delete process.env.TOA_EXPOSITION
    await Gateway.stop()
  }
}

const DEFAULT_ANNOTATION = encode({
  routes: [],
  methods: [],
  directives: [
    {
      family: 'auth',
      name: 'anonymous',
      value: true
    }
  ]
} satisfies syntax.Node)
