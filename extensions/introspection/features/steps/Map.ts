import assert from 'node:assert'
import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { setTimeout } from 'node:timers/promises'
import { MongoClient } from 'mongodb'
import tsflow from 'cucumber-tsflow'

import { load as parse } from 'js-yaml'
import { match } from '@toa.io/generic'
import * as boot from '@toa.io/boot'
import { Locator } from '@toa.io/core'
import * as stage from '@toa.io/userland/stage'
import { Factory } from '../../source/index.js'
import type { Component, Connector, Request } from '@toa.io/core'

const { after, before, binding, then, when } = tsflow

@binding()
export class Map {
  private service: Connector | null = null
  private composition: Connector | null = null
  private remotes: Record<string, Component> = {}
  private unidentified: Component | null = null

  @when('the `{word}` is called with:')
  public async call (endpoint: string, yaml: string): Promise<void> {
    const request = parse(yaml) as Request
    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()

    // an operation may throw, and that is exactly what one of the scenarios is about
    await this.invoke(`${namespace}.${component}`, operation, request).catch(() => undefined)
  }

  /**
   * The stage names itself as the caller, as every entry point does; a call that names
   * nobody is made past it, straight through a remote of its own.
   */
  @when('the `{word}` is called by an unidentified caller with:')
  public async callUnidentified (endpoint: string, yaml: string): Promise<void> {
    const request = parse(yaml) as Request
    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()

    this.unidentified ??= await boot.remote(new Locator(component, namespace))

    await this.unidentified.connect()
    await this.unidentified.invoke(operation, request).catch(() => undefined)
  }

  @then('the map contains a node:')
  public async node (yaml: string): Promise<void> {
    await this.eventually('introspection.nodes', parse(yaml) as object)
  }

  @then('the map contains an edge:')
  public async edge (yaml: string): Promise<void> {
    await this.eventually('introspection.edges', parse(yaml) as object)
  }

  @then('the map contains no node:')
  public async noNode (yaml: string): Promise<void> {
    await this.never('introspection.nodes', parse(yaml) as object)
  }

  @then('the map contains no edge:')
  public async noEdge (yaml: string): Promise<void> {
    await this.never('introspection.edges', parse(yaml) as object)
  }

  @when('the components are stopped')
  public async stop (): Promise<void> {
    await this.composition?.disconnect()

    this.composition = null
  }

  @before('not @ui')
  public async run (): Promise<void> {
    await clean()

    this.service = (await new Factory(boot).service())!

    await this.service.connect()

    // booted here rather than through the stage, so that a scenario can stop it on its own
    this.composition = await boot.composition(components())

    await this.composition.connect()
  }

  @after('not @ui')
  public async shutdown (): Promise<void> {
    this.remotes = {}

    await this.unidentified?.disconnect()
    await this.composition?.disconnect()
    await stage.shutdown()
    await this.service?.disconnect()

    this.composition = null
    this.service = null
    this.unidentified = null
  }

  private async invoke (id: string, operation: string, request: Request): Promise<unknown> {
    this.remotes[id] ??= await stage.remote(id)

    return await this.remotes[id].invoke(operation, request)
  }

  /** The map is eventually consistent: the collector buffers, flushes, and the task is queued. */
  private async eventually (id: string, expected: object): Promise<void> {
    const deadline = Date.now() + DEADLINE

    let records: any[] = []

    while (Date.now() < deadline) {
      records = await this.list(id)

      if (records.some((record) => match(record, expected)))
        return

      await setTimeout(POLL)
    }

    assert.fail(`No record in '${id}' matches\n${JSON.stringify(expected, null, 2)}\n\n` +
      `Present:\n${JSON.stringify(records, null, 2)}`)
  }

  /** Absence has to outlive a flush, otherwise it only proves the map is slow. */
  private async never (id: string, expected: object): Promise<void> {
    await setTimeout(SETTLE)

    const records = await this.list(id)
    const found = records.find((record) => match(record, expected))

    assert.equal(found, undefined,
      `Unexpected record in '${id}':\n${JSON.stringify(found, null, 2)}`)
  }

  private async list (id: string): Promise<any[]> {
    return await this.invoke(id, 'enumerate', { query: { limit: 100 } }) as any[]
  }
}

async function clean (): Promise<void> {
  const client = new MongoClient(URL)

  await client.connect()

  const db = client.db(DB)

  await Promise.all([
    db.collection('introspection_nodes').deleteMany({}),
    db.collection('introspection_edges').deleteMany({})
  ])

  await client.close()
}

function components (): string[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(ROOT, entry.name))
}

const ROOT = resolve(import.meta.dirname, 'components')
const URL = 'mongodb://developer:secret@localhost:27017'
const DB = 'toa-dev'
const DEADLINE = 20_000
const POLL = 250
const SETTLE = 4_000
