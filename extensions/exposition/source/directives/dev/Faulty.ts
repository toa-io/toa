import assert from 'node:assert'
import { ServiceUnavailable } from '../../HTTP'
import { cors } from '../cors'
import type { Output } from '../../io'
import type { Directive } from './types'

export class Faulty implements Directive {
  private static readonly warned = false
  private readonly probability: number

  public constructor (probability: number) {
    assert.ok(typeof probability === 'number', '`dev:faulty` directive value must be a number')
    assert.ok(probability > 0 && probability <= 1, '`dev:faulty` directive value must be in the range (0, 1]')

    this.probability = probability

    cors.allow('faulty')
  }

  public async apply (): Promise<Output> {
    if (Math.random() > this.probability)
      return null

    throw new ServiceUnavailable()
  }
}
