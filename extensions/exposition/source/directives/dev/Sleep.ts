import assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'
import { console } from 'openspan'
import { cors } from '../cors'
import { BadRequest } from '../../HTTP'
import type { Directive } from './types'
import type { Input, Output } from '../../io'

export class Sleep implements Directive {
  private static warned = false
  private readonly maximum: number

  public constructor (value: number) {
    assert.ok(Number.isInteger(value), '`dev:sleep` directive value must be an integer')

    if (!Sleep.warned) {
      console.warn('Sleep directive is enabled', { maximum: value })
      Sleep.warned = true
    }

    cors.allow('sleep')
    this.maximum = value
  }

  public async apply (input: Input): Promise<Output> {
    const value = input.request.headers.sleep as string | undefined

    if (value === undefined)
      return null

    const [min, max] = this.parse(value)

    if (min < 0 || max < 0 || min > max || max > this.maximum)
      throw new BadRequest('Invalid sleep duration')

    const duration = Math.floor(Math.random() * (max - min)) + min

    await setTimeout(duration)

    return null
  }

  private parse (value: string): [number, number] {
    try {
      const pair = JSON.parse(value) as [number, number]

      if (!Array.isArray(pair) || pair.length !== 2)
        throw new Error()

      return pair
    } catch (error) {
      throw new BadRequest('Invalid sleep duration value')
    }
  }
}
