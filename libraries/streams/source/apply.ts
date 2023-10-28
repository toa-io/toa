import { type Readable, Transform, type TransformCallback } from 'node:stream'

export function apply<T = any, R = T | undefined>
(stream: Readable, callback: Callback<T, R>): Readable {
  const destination = new Pipeline(callback)

  stream.pipe(destination)

  return destination
}

class Pipeline<T, R> extends Transform {
  private readonly callback: Callback<T, R>

  public constructor (callback: Callback<T, R>) {
    super({ objectMode: true })

    this.callback = callback
  }

  public override _transform (chunk: T, _: unknown, callback: TransformCallback): void {
    const result = this.callback(chunk)

    if (result !== undefined)
      this.push(result)

    callback()
  }
}

export type Callback<T = any, R = T | undefined> = (item: T) => R
