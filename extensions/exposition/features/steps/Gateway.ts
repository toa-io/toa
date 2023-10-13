import { after, afterAll, binding, given } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { parse } from '@toa.io/yaml'
import { encode, timeout } from '@toa.io/generic'
import { Factory } from '../../source'
import * as syntax from '../../source/RTD/syntax'
import { shortcuts } from '../../source/Directive'

let instance: Connector | null = null

@binding()
export class Gateway {
  private default: boolean = true

  @given('the annotation:')
  public async annotate (yaml: string): Promise<void> {
    const annotation = parse(yaml)

    if ('/' in annotation) {
      const node = { '/': annotation['/'] }
      const tree = syntax.parse(node, shortcuts)

      process.env.TOA_EXPOSITION = encode(tree)
    }

    if (annotation.debug === true)
      process.env.TOA_EXPOSITION_DEBUG = '1'

    await Gateway.stop()

    this.default = false
  }

  @given('the `{word}` configuration:')
  public async configure (id: string, yaml: string): Promise<void> {
    const [name, namespace = 'default'] = id.split('.').reverse()
    const key = `TOA_CONFIGURATION_${namespace.toUpperCase()}_${name.toUpperCase()}`
    const def = DEFAULT_CONFIGURATION[id] ?? {}
    const patch: object = parse(yaml)
    const configuration = Object.assign({}, def, patch)

    process.env[key] = encode(configuration)

    await Gateway.stop()

    this.default = false
  }

  @given('the Gateway is running')
  public async start (): Promise<void> {
    if (instance !== null)
      return

    process.env.TOA_EXPOSITION ??= DEFAULT_ANNOTATION

    this.writeConfiguration()

    const factory = new Factory(boot)
    const service = factory.service()

    if (service === null)
      throw new Error('?')

    instance = service

    await service.connect()
    await timeout(50) // resource discovery
  }

  @after()
  public async cleanup (): Promise<void> {
    if (this.default)
      return

    delete process.env.TOA_EXPOSITION

    await Gateway.stop()
  }

  @afterAll()
  public static async stop (): Promise<void> {
    await instance?.disconnect()
    instance = null
  }

  private writeConfiguration (): void {
    for (const [id, configuration] of Object.entries(DEFAULT_CONFIGURATION)) {
      const [name, namespace = 'default'] = id.split('.').reverse()
      const key = `TOA_CONFIGURATION_${namespace.toUpperCase()}_${name.toUpperCase()}`

      process.env[key] ??= encode(configuration)
    }
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

const DEFAULT_CONFIGURATION: Record<string, object> = {
  'identity.tokens': {
    key0: 'k3.local.pIZT8-9Fa6U_QtfQHOSStfGtmyzPINyKQq2Xk-hd7vA'
  }
}
