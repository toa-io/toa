import { Readable } from 'node:stream'
import { join } from 'node:path'
import { buffer } from 'node:stream/consumers'
import * as assert from 'node:assert'

import { Provider } from '../Provider'

/**
 * In-memory provider
 */
export class InMemory extends Provider<void> {
  private readonly storage = new Map<string, Buffer>()

  public override async get (path: string): Promise<Readable | null> {
    const data = this.storage.get(path)

    if (data === undefined) return null

    return Readable.from(data)
  }

  public override async put (path: string, filename: string, stream: Readable): Promise<void> {
    this.storage.set(join(path, filename), await buffer(stream))
  }

  public override async delete (path: string): Promise<void> {
    for (const f of this.storage.keys())
      if (f.startsWith(path)) this.storage.delete(f)
  }

  public override async move (from: string, to: string): Promise<void> {
    assert.notEqual(from, to, 'Source and destination are the same')
    assert.ok(this.storage.has(from), `File not found: ${from}`)

    this.storage.set(to, this.storage.get(from)!)
    this.storage.delete(from)
  }
}
