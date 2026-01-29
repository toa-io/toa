import assert from 'node:assert'
import type { Directive } from './types'
import { ServiceUnavailable } from '../../HTTP'
import { Output } from '../../io'
import { cors } from '../cors'

export class Faulty implements Directive {
  private static warned = false
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
