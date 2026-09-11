import { Connector } from './connector.ts'
import { TransmissionException } from './exceptions.ts'
import type { Consumer, Terms } from './types/bindings.ts'
import type { Request } from './types/request.ts'

export class Transmission extends Connector {
  readonly #bindings: Consumer[]

  public constructor(bindings: Consumer[]) {
    super()

    this.#bindings = bindings
    this.depends(bindings)
  }

  public async request(request: Request, terms?: Terms): Promise<any> {
    let reply: any = false
    let i = 0

    while (reply === false && i < this.#bindings.length) {
      const binding = this.#bindings[i]

      i++

      if (request?.task === true) {
        if (binding.task === undefined) continue

        await binding.task(request)
        reply = null
      } else reply = await binding.request(request, terms)
    }

    if (reply === false)
      throw new TransmissionException(`All (${this.#bindings.length}) bindings rejected.`)

    return reply
  }
}
