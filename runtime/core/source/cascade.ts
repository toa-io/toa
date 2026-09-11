import { Connector } from './connector.ts'
import type { Algorithm } from './types/bridges.ts'

export class Cascade extends Connector {
  readonly #last: Algorithm

  public constructor(bridges: Algorithm[], preflight?: Connector) {
    super()

    // this.#bridges = bridges
    this.#last = bridges[bridges.length - 1]

    if (preflight === undefined) this.depends(bridges)
    else this.depends(bridges).depends(preflight)
  }

  public async run(...args: [any, any?]): Promise<any> {
    // const reply = {}
    //
    // for (const bridge of this.#bridges) {
    //   const partial = await bridge.execute(...args)
    //
    //   if (partial.error) return { error: partial.error }
    //
    //   merge(reply, partial)
    // }
    //
    // return reply

    return this.#last.execute(...args)
  }
}
