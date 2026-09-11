import { environment } from '@toa.io/generic'
import { newid } from './entities/newid.ts'

const KEY = Symbol.for('toa.core.instance')

type Store = typeof globalThis & { [KEY]?: string }

// what a queue name may carry, short enough that one made of it stays within a broker's limit
const NAME = /^[\w.:-]{1,64}$/

const TIMEOUT = 5000

/**
 * The name this process answers addressed calls under, and what a call to one of its stateful
 * operations names: given by `TOA_INSTANCE`, or generated once.
 *
 * It is kept where every copy of this package reads it, because a binding and a component loaded
 * against two copies must agree on whose name a call carries.
 */
export function instance(): string {
  return ((globalThis as Store)[KEY] ??= named())
}

/** How long an addressed call waits where it names no timeout of its own, in milliseconds. */
export function timeout(): number {
  const value = Number(environment.get('TOA_ADDRESSED_TIMEOUT'))

  return Number.isInteger(value) && value > 0 ? value : TIMEOUT
}

function named(): string {
  const given = environment.get('TOA_INSTANCE')

  if (given === undefined) return newid()

  if (!NAME.test(given))
    throw new Error(
      `TOA_INSTANCE '${given}' must be 1 to 64 letters, digits, '_', '-', '.' or ':'`
    )

  return given
}
