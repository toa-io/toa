import { Connector, entities } from '@toa.io/core'
import type { Writer } from './Writer.ts'
import type { Row } from './Provider.ts'
import type { Message } from '@toa.io/core/types'

/**
 * The consumer of one event the log is kept of. A message carries what the event rendered and
 * its id, so what the row says of the record — which, its version, when — is read from the
 * payload where the payload carries it: the record as it stands does, and a payload that keeps
 * `id`, `VERSION` and `UPDATED` does.
 */
export class Recorder extends Connector {
  private readonly label: string
  private readonly component: string
  private readonly writer: Writer

  public constructor(label: string, writer: Writer) {
    super()

    this.label = label
    this.component = label.slice(0, label.lastIndexOf('.'))
    this.writer = writer
  }

  public async receive(message: Message): Promise<void> {
    await this.writer.write([row(this.label, this.component, message)])
  }
}

export function row(label: string, component: string, message: Message): Row {
  const payload = isObject(message.payload) ? message.payload : { value: message.payload }
  const { id, VERSION, UPDATED } = payload as Record<string, unknown>

  return {
    // a message from outside Toa carries no id, and is then the same message by what it says
    id: message.id ?? entities.derive(label, JSON.stringify(payload)),
    label,
    component,
    time: typeof UPDATED === 'number' ? UPDATED : Date.now(),
    entity: typeof id === 'string' ? id : null,
    version: typeof VERSION === 'number' ? VERSION : null,
    trace: message.telemetry ?? null,
    payload
  }
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
