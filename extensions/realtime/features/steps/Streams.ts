import { type Readable } from 'node:stream'
import { after, binding, given, then } from 'cucumber-tsflow'
import { match } from '@toa.io/generic'

import { type Component } from '@toa.io/core'
import { parse } from '@toa.io/yaml'
import * as stage from '@toa.io/userland/stage'
import { Realtime } from './Realtime'

@binding([Realtime])
export class Streams {
  private readonly realtime: Realtime
  private remote: Component | null = null
  private streams: Record<string, Readable> = {}
  private events: Record<string, object[]> = {}

  public constructor (realtime: Realtime) {
    this.realtime = realtime
  }

  @given('the stream `{word}` is consumed')
  public async consume (key: string): Promise<void> {
    await this.realtime.serve()

    this.remote ??= await stage.remote('realtime.streams')
    this.events[key] = []
    this.streams[key] = await this.remote.invoke('create', { input: { key } })
    this.streams[key].on('data', (data: object) => this.events[key].push(data))
  }

  @then('an event is received from the stream `{word}`:')
  public received (key: string, yaml: string): void {
    const expected = parse<object>(yaml)

    for (const event of this.events[key])
      if (match(event, expected))
        return

    throw new Error('No matching event received')
  }

  @after()
  private shutdown (): void {
    for (const stream of Object.values(this.streams))
      stream.destroy()

    this.streams = {}
    this.events = {}
  }
}
