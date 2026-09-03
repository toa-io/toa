import tsflow from 'cucumber-tsflow'

import * as boot from '@toa.io/boot'
import { type Connector } from '@toa.io/core'
import { load as parse } from 'js-yaml'
import { timeout } from '@toa.io/generic'
import { Factory } from '../../source/index.js'
import * as syntax from '../../source/RTD/syntax/index.js'
import { shortcuts } from '../../source/Directive.js'
import { manifests } from './map.js'
import type * as http from '../../source/HTTP/index.js'

const { after, afterAll, binding, given } = tsflow

let instance: Connector | null = null

@binding()
export class Gateway {
  private default: boolean = true
  private written: string[] = []

  @given('the annotation:')
  public async annotate (yaml: string): Promise<void> {
    const annotation = parse(yaml) as Partial<http.Options> & { '/'?: object }

    if (annotation['/'] !== undefined) {
      const tree = syntax.parse(annotation['/'], shortcuts)

      process.env.TOA_EXPOSITION = JSON.stringify(tree)
    }

    const { debug, authorities } = annotation
    const properties = Object.assign({}, DEFAULT_PROPERTIES)

    if (debug !== undefined)
      properties.debug = debug

    if (authorities !== undefined)
      properties.authorities = authorities

    process.env.TOA_EXPOSITION_PROPERTIES = JSON.stringify(properties)

    await Gateway.stop()

    this.default = false
  }

  /**
   * The routes of the introspection map, taken from its own manifests. `norm` runs the
   * exposition extension over them, so what lands here is what a deployment would carry.
   */
  @given('the annotation of the introspection map')
  public async annotateMap (): Promise<void> {
    await this.annotateMapUnder()
  }

  /** The same routes under a root of the scenario's own: what an application declares around the map. */
  @given('the annotation of the introspection map under:')
  public async annotateMapUnder (yaml?: string): Promise<void> {
    const tree: syntax.Node = yaml === undefined
      ? { routes: [], methods: [], directives: [] }
      : syntax.parse((parse(yaml) as { '/': object })['/'], shortcuts)

    for (const manifest of await manifests()) {
      const node = manifest.extensions?.[EXPOSITION] as syntax.Node | undefined

      if (node === undefined)
        throw new Error(`'${manifest.namespace}.${manifest.name}' declares no exposition`)

      tree.routes.push(...node.routes)
    }

    process.env.TOA_EXPOSITION = JSON.stringify(tree)
    process.env.TOA_EXPOSITION_PROPERTIES = JSON.stringify(DEFAULT_PROPERTIES)

    await Gateway.stop()

    this.default = false
  }

  @given('the `{word}` configuration:')
  public async configure (id: string, yaml: string): Promise<void> {
    const [name, namespace = 'default'] = id.split('.').reverse()
    const key = `TOA_CONFIGURATION_${namespace.toUpperCase()}_${name.toUpperCase()}`
    const def = DEFAULT_CONFIGURATION[id] ?? {}
    const patch = parse(yaml) as object
    const configuration = Object.assign({}, def, patch)

    // scenario-scoped, as the secrets it may refer to are: a configuration left behind
    // outlives the secrets it points at, and the next scenario cannot resolve them
    this.written.push(key)
    process.env[key] = JSON.stringify(configuration)

    await Gateway.stop()

    this.default = false
  }

  /** The secrets a scenario's configuration refers to. */
  @given('the configuration secrets:')
  public async secrets (yaml: string): Promise<void> {
    const secrets = parse(yaml) as Record<string, string>

    for (const [name, value] of Object.entries(secrets)) {
      this.written.push(SECRET + name)
      process.env[SECRET + name] = value
    }

    await Gateway.stop()

    this.default = false
  }

  @given('the branch TTL is {float} second(s)')
  public async setBranchTTL (seconds: number): Promise<void> {
    process.env.__TESTING_EXPOSITION_BRANCH_TTL = String(seconds * 1000)

    await Gateway.stop()

    this.default = false
  }

  @given('the Gateway is running')
  public async start (): Promise<void> {
    if (instance !== null)
      return

    process.env.TOA_EXPOSITION ??= DEFAULT_TREE
    process.env.TOA_EXPOSITION_PROPERTIES ??= JSON.stringify(DEFAULT_PROPERTIES)

    this.writeConfiguration()

    const factory = new Factory(boot)
    const service = await factory.service()

    if (service === null)
      throw new Error('?')

    instance = service

    await service.connect()
    await timeout(50) // resource discovery
  }

  @after()
  public async cleanup (): Promise<void> {
    delete process.env.__TESTING_EXPOSITION_BRANCH_TTL

    for (const key of this.written)
      delete process.env[key]

    this.written = []

    if (this.default)
      return

    delete process.env.TOA_EXPOSITION
    delete process.env.TOA_EXPOSITION_PROPERTIES

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

      process.env[key] ??= JSON.stringify(configuration)
    }

    for (const [name, value] of Object.entries(DEFAULT_SECRETS))
      process.env[SECRET + name] ??= value
  }
}

const EXPOSITION = '@toa.io/extensions.exposition'
const SECRET = 'TOA_CONFIGURATION__'

const DEFAULT_TREE = JSON.stringify({
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

const DEFAULT_PROPERTIES: Partial<http.Options> = {
  authorities: {
    nex: 'nex.toa.io'
  },
  // `npm run features:h2c` runs the whole suite over cleartext HTTP/2
  protocol: process.env.TOA_EXPOSITION_PROTOCOL === 'h2c' ? 'h2c' : 'h1'
}

// the identity components boot inside the gateway, and without a variable each would wait
// for the values service, which these features do not run
const DEFAULT_CONFIGURATION: Record<string, object> = {
  // a component declaring configuration waits for `configuration.values`, which these
  // features do not run; the variable is the local override that stands in for it
  'realtime.streams': {},
  'identity.basic': {},
  'identity.federation': {},
  'identity.otp': {},
  'identity.passkeys': {},
  'identity.tokens': {
    keys: [
      { id: 'key0', key: '$IDENTITY_TOKENS_KEY0' },
      { id: 'legacy0', key: '$IDENTITY_TOKENS_LEGACY0', format: 'paseto' }
    ]
  }
}

// a secret is given as a reference, and comes to the component as an object
const DEFAULT_SECRETS: Record<string, string> = {
  IDENTITY_TOKENS_KEY0: 'sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs',
  IDENTITY_TOKENS_LEGACY0: 'k3.local.pIZT8-9Fa6U_QtfQHOSStfGtmyzPINyKQq2Xk-hd7vA'
}
