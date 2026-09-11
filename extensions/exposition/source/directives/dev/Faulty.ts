import { ServiceUnavailable } from '../../HTTP/index.ts'
import { cors } from '../cors/index.ts'
import type { Output } from '../../io.ts'
import type { Directive } from './types.ts'

export class Faulty implements Directive {
  private static readonly warned = false
  private readonly probability: number

  public constructor(probability: number) {
    if (typeof probability !== 'number')
      throw new Error('`dev:faulty` directive value must be a number')
    if (!(probability > 0 && probability <= 1))
      throw new Error('`dev:faulty` directive value must be in the range (0, 1]')

    this.probability = probability

    cors.allow('faulty')
  }

  public async apply(): Promise<Output> {
    if (Math.random() > this.probability) return null

    throw new ServiceUnavailable()
  }
}
