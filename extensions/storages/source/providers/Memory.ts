import { Readable } from 'node:stream'
import { join, posix } from 'node:path'
import { buffer } from 'node:stream/consumers'
import * as assert from 'node:assert'

import { Provider } from '../Provider'

/**
 * In-memory provider
 */
export class InMemory extends Provider {
  private readonly storage = new Map<string, Buffer>()

  public async get (path: string): Promise<Readable | null> {
    const data = this.storage.get(path)

    if (data === undefined) return null

    return Readable.from(data)
  }

  public async list (path: string): Promise<string[]> {
    return Array.from(this.storage.keys())
      .filter((f) => posix.dirname(f) === path)
      .map((f) => posix.basename(f))
  }

  public async put (path: string, filename: string, stream: Readable): Promise<void> {
    this.storage.set(join(path, filename), await buffer(stream))
  }

  public async delete (path: string): Promise<void> {
    for (const f of this.storage.keys())
      if (f.startsWith(path)) this.storage.delete(f)
  }

  public async move (from: string, to: string): Promise<void> {
    const buf = this.storage.get(from)

    assert.ok(buf !== undefined, `File not found: ${from}`)

    this.storage.set(to, buf)
    this.storage.delete(from)
  }

  public async moveDir (from: string, to: string): Promise<void> {
    for (const f of this.storage.keys())
      if (f.startsWith(from)) {
        const toPath = to + f.slice(from.length)

        this.storage.set(toPath, this.storage.get(f)!)
        this.storage.delete(f)
      }
  }
}
