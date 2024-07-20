import { EventEmitter, once } from 'node:events'
import * as assert from 'node:assert'
import { after, binding, given, afterAll, then } from 'cucumber-tsflow'
import { Factory } from '@toa.io/extensions.realtime'
import * as boot from '@toa.io/boot'
import { encode, match } from '@toa.io/generic'
import { parse } from '@toa.io/yaml'
import { Agent } from '@toa.io/agent'
import { Parameters } from './Parameters'
import { Gateway } from './Gateway'
import { Captures } from './Captures'
import type { Connector } from '@toa.io/core'

@binding([Gateway, Parameters, Captures])
export class Realtime {
  private static instance: Connector | null = null
  private readonly gateway: Gateway
  private readonly agent: Agent
  private readonly events = new EventEmitter()
  private log: Record<string, unknown[]> = {}
  private aborted = false

  public constructor (gateway: Gateway, parameters: Parameters, captures: Captures) {
    this.gateway = gateway
    this.agent = new Agent(parameters.origin, captures)
  }

  @given('the Realtime is running with the following annotation:')
  public async start (yaml: string): Promise<void> {
    await Realtime.stop()

    const annotation = parse(yaml)
    const routes = []

    for (const [event, property] of Object.entries(annotation))
      routes.push({ event, properties: [property] })

    process.env.TOA_REALTIME = encode(routes)

    const factory = new Factory(boot)

    Realtime.instance = factory.service()

    void Realtime.instance.connect()
  }

  @given('the identity {word} is consuming realtime events')
  public async connect (name: string): Promise<void> {
    await this.gateway.start()

    const id = await this.createIdentity(name)

    const parts = await this.agent.parts(`
      GET /realtime/streams/\${{ ${name}.id }}/ HTTP/1.1
      authorization: Token \${{ ${name}.token }}
      accept: application/json
    `) as AsyncIterable<Uint8Array>

    void this.consume(id, parts).catch((e) => {
      if (!this.aborted)
        console.debug('Consumption interrupted', e)
    })
  }

  @then('the following event `{word}` is received by {word}:')
  public async received (label: string, name: string, yaml: string): Promise<void> {
    const id = this.agent.captures.get(`${name}.id`)
    const tag = `${id}:${label}`
    const expected = parse(yaml)

    if (this.log[tag] !== undefined)
      for (const data of this.log[tag])
        // eslint-disable-next-line max-depth
        if (match(data, expected))
          return

    const [event] = await once(this.events, tag)

    assert.ok(match(event, expected), 'Event does not match')
  }

  @after()
  public abort (): void {
    this.aborted = true
    this.agent.abort()
    this.log = {}
    this.events.removeAllListeners()
  }

  @afterAll()
  public static async stop (): Promise<void> {
    if (this.instance === null)
      return

    await this.instance.disconnect()

    this.instance = null
    process.env.TOA_REALTIME = undefined
  }

  private async createIdentity (name: string): Promise<string> {
    const password = Math.random().toString(36).slice(2)
    const username = name + Math.random().toString(36).slice(2)

    await this.agent.request(`
      POST /identity/basic/ HTTP/1.1
      accept: application/yaml
      content-type: application/yaml

      username: ${username}
      password: ${password}
    `)

    this.agent.responseIncludes(`
      201 Created
    `)

    const credentials = Buffer.from(`${username}:${password}`).toString('base64')

    await this.agent.request(`
      GET /identity/ HTTP/1.1
      authorization: Basic ${credentials}
      accept: application/yaml
    `)

    this.agent.responseIncludes(`
      200 OK
      authorization: Token \${{ ${name}.token }}

      id: \${{ ${name}.id }}
    `)

    return this.agent.captures.get(`${name}.id`)
  }

  private async consume (id: string, parts: any): Promise<void> {
    for await (const part of parts) {
      const text = Buffer.from(part.body).toString('utf8')
      const event = JSON.parse(text)

      if (typeof event === 'string')
        continue

      const tag = `${id}:${event.event}`

      this.events.emit(tag, event.data)
      this.log[tag] ??= []
      this.log[tag].push(event.data)
    }
  }
}
