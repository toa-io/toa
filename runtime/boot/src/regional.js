import { Regional } from '@toa.io/core'

/**
 * Gives every destination that carries a change to other regions the others that write to
 * something each region keeps for itself. Neither knows what the other is: the carrier is given
 * what they export, and hands back what arrives.
 *
 * @param {import('@toa.io/core/types').outbox.Destination[]} destinations
 * @returns {void}
 */
export const regional = (destinations) => {
  const regionals = destinations.filter((destination) => Regional.is(destination))

  if (regionals.length === 0) return

  for (const destination of destinations)
    if (destination.carries === true) destination.regional = new Regional(regionals)
}
