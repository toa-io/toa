import { EventEmitter, once } from 'node:events'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import * as assert from 'node:assert'
import { setTimeout as delay } from 'node:timers/promises'
import { after, binding, given, then, when } from 'specumber'

import { Redis } from 'ioredis'
import { environment, match } from '@toa.io/generic'
import { load as parse } from 'js-yaml'
import { Agent } from '@toa.io/agent'
import { EXPIRE, STREAMS } from '@toa.io/definitions/extensions.exposition/realtime'
import { Parameters } from './Parameters.ts'
import { Gateway } from './Gateway.ts'
import { Captures } from './Captures.ts'

/**
 * Realtime as a client sees it: a stream opened over HTTP, read part by part. A consumer is named;
 * the identity scenarios name one after the identity it is.
 */
@binding([Gateway, Parameters, Captures])
export class Realtime {
  private readonly gateway: Gateway
  private readonly agent: Agent
  private readonly origin: string
  private readonly captures: Captures
  private consumers: Record<string, Consumer> = {}
  private variables: string[] = []
  private stopped = false

  public constructor(gateway: Gateway, parameters: Parameters, captures: Captures) {
    this.gateway = gateway
    this.origin = parameters.origin
    this.captures = captures
    this.agent = new Agent(parameters.origin, captures)
  }

  /** What the `realtime` annotation gives the gateway. */
  @given('the realtime streams expire in {int} seconds')
  public expire(seconds: number): void {
    environment.set(EXPIRE, String(seconds))
    this.variables.push(EXPIRE)
  }

  /** What the `realtime` annotation gives every process: the components and the gateway. */
  @given('the realtime streams are kept in:')
  public shards(yaml: string): void {
    const addresses = parse(yaml) as string[]

    environment.set(STREAMS, addresses.join(' '))
    this.variables.push(STREAMS)
  }

  @then('the stream of `{}` is kept in `{}`')
  public async kept(key: string, address: string): Promise<void> {
    await this.redis(async (redis) => {
      assert.equal(await redis.exists(prefix() + key), 1, `'${key}' is not in ${address}`)
    }, address)
  }

  @given('the identity {word} is consuming realtime events')
  public async identity(name: string): Promise<void> {
    await this.gateway.start()

    const id = await this.createIdentity(name)

    await this.open(
      name,
      `
      GET /realtime/${id}/ HTTP/1.1
      authorization: Token \${{ ${name}.token }}
      accept: application/json
      `,
      name
    )
  }

  @when('{word} is consuming:')
  public async consuming(name: string, request: string): Promise<void> {
    await this.gateway.start()
    await this.open(name, request)
  }

  @when('{word} reconnects')
  public async reconnect(name: string): Promise<void> {
    const consumer = this.consumers[name]
    const token = consumer.tokens.at(-1)

    assert.ok(token !== undefined, `${name} was given no token`)

    consumer.agent.abort()

    const [line, ...rest] = consumer.request.trim().split('\n')
    const [verb, path, protocol] = line.trim().split(' ')
    const separator = path.includes('?') ? '&' : '?'
    const request = [
      `${verb} ${path}${separator}token=${token} ${protocol}`,
      ...rest
    ].join('\n')

    await this.open(name, request, consumer.identity, consumer)
  }

  @when('{word} disconnects')
  public disconnect(name: string): void {
    this.consumers[name].agent.abort()
  }

  @then('the following event `{word}` is received by {word}:')
  @then('{word} receives the event `{word}`:')
  public async received(a: string, b: string, yaml: string): Promise<void> {
    // the first phrasing names the event first
    const [label, name] = a in this.consumers ? [b, a] : [a, b]
    const consumer = this.consumers[name]
    const expected = parse(yaml)

    for (;;) {
      for (const event of consumer.events)
        if (event.event === label && match(event.data, expected)) return

      await once(consumer.arrivals, 'event', { signal: AbortSignal.timeout(WAIT) }).catch(
        () => {
          throw new Error(`${name} has not received a matching '${label}'`)
        }
      )
    }
  }

  @then('{word} receives exactly:')
  public async exactly(name: string, yaml: string): Promise<void> {
    const expected = parse(yaml) as Array<{ event: string; data: unknown }>

    await delay(SETTLE)

    const events = this.consumers[name].events

    assert.deepStrictEqual(events, expected)
  }

  @then('{word} receives no event `{word}`')
  public async none(name: string, label: string): Promise<void> {
    await delay(SETTLE)

    const events = this.consumers[name].events.filter(({ event }) => event === label)

    assert.equal(events.length, 0, `${name} received ${events.length} of '${label}'`)
  }

  @then('the stream of `{}` does not exist')
  public async absent(key: string): Promise<void> {
    await this.redis(async (redis) => {
      assert.equal(await redis.exists(prefix() + this.captures.substitute(key)), 0)
    })
  }

  @then('the stream of `{}` holds {int} event(s)')
  public async holds(key: string, count: number): Promise<void> {
    await this.redis(async (redis) => {
      const entries = await redis.xrange(
        prefix() + this.captures.substitute(key),
        '-',
        '+'
      )
      const events = entries.filter(([, fields]) => fields[1] !== 'connect')

      assert.equal(events.length, count)
    })
  }

  @when('the realtime Redis is stopped')
  public stop(): void {
    this.stopped = true
    compose('stop')
  }

  @when('the realtime Redis is started')
  public async start(): Promise<void> {
    compose('start')
    this.stopped = false

    // what reconnects does so on its own schedule
    await delay(3000)
  }

  @after()
  public async cleanup(): Promise<void> {
    for (const consumer of Object.values(this.consumers)) consumer.agent.abort()

    this.consumers = {}

    for (const variable of this.variables) environment.delete(variable)

    this.variables = []

    if (this.stopped) {
      compose('start')
      this.stopped = false
    }

    // the streams a scenario left would be found by the next one
    for (const address of REDISES)
      await this.redis(async (redis) => {
        const keys = await redis.keys(prefix() + '*')

        if (keys.length > 0) await redis.del(...keys)
      }, address)
  }

  private async open(
    name: string,
    request: string,
    identity?: string,
    previous?: Consumer
  ): Promise<void> {
    // an agent of its own, so ending this stream ends no other
    const agent = new Agent(this.origin, this.captures)
    const parts = (await agent.parts(request)) as unknown as AsyncIterable<{
      body: Uint8Array
    }>

    const consumer: Consumer = previous ?? {
      events: [],
      tokens: [],
      arrivals: new EventEmitter(),
      agent,
      request,
      identity
    }

    consumer.agent = agent
    this.consumers[name] = consumer

    void this.consume(consumer, parts).catch(() => undefined)

    // the stream is ready once it gave its first token
    const first = consumer.tokens.length

    for (let i = 0; i < 100 && consumer.tokens.length === first; i++) await delay(20)
  }

  private async consume(
    consumer: Consumer,
    parts: AsyncIterable<{ body: Uint8Array }>
  ): Promise<void> {
    for await (const part of parts) {
      const event = JSON.parse(Buffer.from(part.body).toString('utf8'))

      if (typeof event === 'string') continue

      if (event.event === 'token') consumer.tokens.push(event.data)
      else consumer.events.push(event)

      consumer.arrivals.emit('event')
    }
  }

  private async createIdentity(name: string): Promise<string> {
    const password = randomBytes(16).toString('hex')
    const username = name + randomBytes(8).toString('hex')

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

    return this.agent.captures.get(`${name}.id`) as string
  }

  private async redis(
    action: (redis: Redis) => Promise<void>,
    address = REDIS
  ): Promise<void> {
    const redis = new Redis(address, { lazyConnect: true })

    await redis.connect()

    try {
      await action(redis)
    } finally {
      redis.disconnect()
    }
  }
}

interface Consumer {
  events: Array<{ event: string; data: unknown }>
  tokens: string[]
  arrivals: EventEmitter
  agent: Agent
  request: string
  identity?: string
}

function prefix(): string {
  return `${environment.scope()}:realtime:`
}

function compose(command: string): void {
  execFileSync('docker', ['compose', '-f', COMPOSE, command, 'redis0'], {
    stdio: 'ignore'
  })
}

const COMPOSE = resolve(import.meta.dirname, '../../../../docker-compose.yaml')
const REDIS = 'redis://localhost:31040'
const REDISES = [REDIS, 'redis://localhost:31041']
const WAIT = 5000
const SETTLE = 500
