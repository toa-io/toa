import { environment } from '@toa.io/generic'
import { CHANNEL, DEAD, QUEUE } from '@toa.io/definitions/extensions.chronicles'

/**
 * What the binding names the channel's exchange and the queues on the broker, which ClickHouse
 * is configured with: `connectors/bindings.amqp/source/queues.js` scopes a name the same way,
 * so that processes of one context with different suffixes do not meet on a virtual host.
 */
export function names(): Names {
  return {
    exchange: scoped(CHANNEL + '.out'),
    queue: scoped(QUEUE),
    dead: scoped(DEAD)
  }
}

export interface Names {
  exchange: string
  queue: string
  dead: string
}

function scoped(name: string): string {
  return environment.suffix() === undefined ? name : environment.scope() + '.' + name
}
