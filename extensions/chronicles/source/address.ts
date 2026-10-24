import { isIPv4, isIPv6 } from 'node:net'
import type { Address } from '@toa.io/definitions/extensions.chronicles'

/**
 * How much of a browser's address the log keeps. An address is personal data, and the log erases
 * nothing, so by default it keeps the network the address is in — a /24 of IPv4, a /48 of IPv6 —
 * which is as much as a question of where a client is asks for. What is not an address is not kept.
 */
export function keep(address: unknown, how: Address): string | null {
  if (typeof address !== 'string') return null

  if (isIPv4(address)) return how === 'full' ? address : address.replace(/\.\d+$/, '.0')

  if (isIPv6(address)) return how === 'full' ? address : network(address)

  return null
}

/** The first three groups of an IPv6 address, and none of the rest. */
function network(address: string): string {
  const [head, tail = ''] = address.split('::')
  const left = head === '' ? [] : head.split(':')
  const right = tail === '' ? [] : tail.split(':')
  const groups = [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]

  return (
    groups
      .slice(0, 3)
      .map((group) => group.replace(/^0+(?=.)/, ''))
      .join(':') + '::'
  )
}
