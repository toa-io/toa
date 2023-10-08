import { Duplex } from 'node:stream'

export class Stream extends Duplex {
  public constructor () {
    super({ objectMode: true })
  }

  public override _read (): void {
  }
}
