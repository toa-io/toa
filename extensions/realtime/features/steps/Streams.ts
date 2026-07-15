import * as assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'
import { after, binding, given, then } from 'cucumber-tsflow'
import { match } from '@toa.io/generic'
import { parse } from '@toa.io/yaml'
import * as stage from '@toa.io/userland/stage'
import { Realtime } from './Realtime'
import type { Readable } from 'node:stream'
import type { Component } from '@toa.io/core'

@binding([Realtime])
export class Streams {
  private readonly realtime: Realtime
  private remote: Component | null = null
  private streams: Record<string, Readable> = {}
  private events: Record<string, Event[]> = {}

  public constructor (realtime: Realtime) {
    this.realtime = realtime
  }

  @given('the stream `{word}` is consumed', { timeout: 30_000 })
  public async consume (key: string): Promise<void> {
    await this.realtime.serve()

    this.remote ??= await stage.remote('realtime.streams')
    this.events[key] = []

    await this.createStream(key)
  }

  @then('an event is received from the stream `{word}`:')
  public async received (key: string, yaml: string): Promise<void> {
    await setTimeout(100)

    const expected = parse<object>(yaml)

    for (const event of this.events[key])
      if (match(event, expected))
        return

    throw new Error('No matching event received')
  }

  @then('the consumer `{word}` is disconnected')
  public disconnected (key: string): void {
    this.streams[key]?.destroy()
    delete this.streams[key]
  }

  @then('the consumer `{word}` is reconnected')
  public async reconnected (key: string): Promise<void> {
    const last = this.events[key].findLast((event) => event.event === 'token')

    assert.ok(last, `No last event found for stream ${key}`)

    await this.createStream(key, last.data as string)
  }

  @after()
  public async shutdown (): Promise<void> {
    for (const stream of Object.values(this.streams))
      stream.destroy()

    this.streams = {}
    this.events = {}

    await setTimeout(100)
  }

  private async createStream (key: string, token?: string): Promise<void> {
    this.streams[key] = await this.remote!.invoke('create', { input: { key, token } })
    this.streams[key].on('data', (event: Event) => {
      console.log('[TEST] Received event', event)
      this.events[key]?.push(event)
    })
  }
}

interface Event {
  key: string
  token: string
  event: string
  data?: unknown
}
