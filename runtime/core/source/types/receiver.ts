import type { Connector } from '../connector.js'
import type { Message } from './message.js'

/**
 * What consumes an event of the context. Core ships one, and an extension may put its own
 * in its place, so what a binding is handed is this rather than core's class.
 */
export interface Receiver extends Connector {
  receive (message: Message): Promise<void>
}
