import * as assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'
import { after, binding, given, then } from 'specumber'

import { match } from '@toa.io/generic'
import { load as parse } from 'js-yaml'
import * as stage from '@toa.io/userland/stage'
import { Realtime } from './Realtime.ts'
import type { Readable } from 'node:stream'
import type { Component } from '@toa.io/core'

/**
 * A consumer reads a stream by iterating it, as the broker does when it carries a stream to a
 * gateway: an iterator takes every value it reads, where a `data` listener would share them. A
 * consumer is named after the stream it reads, unless a scenario names it.
 */
@binding([Realtime])
export class Streams {
  private readonly realtime: Realtime
  private remote: Component | null = null
  private consumers: Record<string, Consumer> = {}

  public constructor(realtime: Realtime) {
    this.realtime = realtime
  }

  @given('the stream `{word}` is consumed', { timeout: 30_000 })
  public async consume(key: string): Promise<void> {
    await this.consumeAs(key, key)
  }

  @given('the stream `{word}` is consumed by `{word}`', { timeout: 30_000 })
  public async consumeAs(key: string, name: string): Promise<void> {
    await this.realtime.serve()

    this.remote ??= await stage.remote('realtime.streams')

    await this.connect(name, key)
  }

  @then('an event is received from the stream `{word}`:')
  public async received(key: string, yaml: string): Promise<void> {
    await this.receivedBy(key, yaml)
  }

  @then('an event is received by `{word}`:')
  public async receivedBy(name: string, yaml: string): Promise<void> {
    await setTimeout(100)

    const expected = parse(yaml) as object

    for (const event of this.consumers[name].events) if (match(event, expected)) return

    throw new Error(`No matching event received by '${name}'`)
  }

  @then('the consumer `{word}` is connected')
  public async connected(name: string): Promise<void> {
    await setTimeout(100)

    assert.ok(!this.consumers[name].ended, `The stream of '${name}' has ended`)
  }

  @then('the consumer `{word}` is disconnected')
  public disconnected(name: string): void {
    this.consumers[name].stream.destroy()
  }

  @then('the consumer `{word}` is reconnected')
  public async reconnected(name: string): Promise<void> {
    const { key, events } = this.consumers[name]
    const last = events.findLast((event) => event.event === 'token')

    assert.ok(last, `No last event found for stream ${key}`)

    await this.connect(name, key, last.data as string)
  }

  @after()
  public async shutdown(): Promise<void> {
    for (const consumer of Object.values(this.consumers)) consumer.stream.destroy()

    this.consumers = {}

    await setTimeout(100)
  }

  private async connect(name: string, key: string, token?: string): Promise<void> {
    const stream: Readable = await this.remote!.invoke('create', { input: { key, token } })
    const events = this.consumers[name]?.events ?? []
    const consumer: Consumer = { key, stream, events, ended: false }

    this.consumers[name] = consumer

    void (async () => {
      try {
        for await (const event of stream) events.push(event as Event)
      } catch {
        // destroyed by the scenario
      }

      consumer.ended = true
    })()
  }
}

interface Consumer {
  key: string
  stream: Readable
  events: Event[]
  ended: boolean
}

interface Event {
  key: string
  token: string
  event: string
  data?: unknown
}
