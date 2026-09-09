import { Park } from 'comq'
import { exceptions } from '@toa.io/core'

/**
 * Refuses a message on behalf of a consumer that has nobody to answer to, by saying which
 * of the two kinds of failure it was.
 *
 * The runtime is the only one that can say. A code like `202` or `304` is core's vocabulary
 * and means nothing to a broker, while what a broker can do with a message is none of core's
 * business — so the classification is asked here and the carrying is left to the library.
 *
 * A transient exception is raised as it is: an unclassified rejection already means another
 * attempt, and the exception's own message is what the parking queue will carry if the
 * attempts run out. A permanent one is named, because a message parked on the first delivery
 * is read by a person who was given no other reason.
 *
 * @param {import('@toa.io/core/types').Exception} exception
 * @returns {never}
 */
export function refuse(exception) {
  if (!exceptions.permanent(exception)) throw exception

  const name = exceptions.names[exception.code]

  throw new Park(`${name}: ${exception.message}`, { cause: exception })
}
