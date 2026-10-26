import { Connector, entities, exceptions } from '@toa.io/core'
import { Mismatch, project } from './contract.ts'
import type { Publisher } from './Publisher.ts'
import type { Row, State } from './Provider.ts'
import type { Contract } from '@toa.io/definitions/extensions.chronicles'
import type { Message } from '@toa.io/core/types'

/**
 * The consumer of one event the log is kept of: a row of `events` for an event a component declares
 * under `events`, and a state for the one it declares its `state`. A message carries what the event
 * rendered, its id and when the change was made, so what is said of the entity — which, its
 * version — is read from the payload, where the entity as it stands carries `id` and `VERSION`;
 * when, from the property the component names, or the message; and what is written of the payload
 * is what the contract declares.
 */
export class Recorder extends Connector {
  private readonly label: string
  private readonly component: string
  private readonly kind: Kind
  private readonly of: Of
  private readonly publisher: Publisher

  // eslint-disable-next-line max-params
  public constructor(label: string, kind: Kind, of: Of, publisher: Publisher) {
    super()

    this.label = label
    this.component = label.slice(0, label.lastIndexOf('.'))
    this.kind = kind
    this.of = of
    this.publisher = publisher
  }

  public async receive(message: Message): Promise<void> {
    if (this.kind === 'state')
      await this.publisher.publish(
        [],
        [state(this.label, this.component, message, this.of)]
      )
    else await this.publisher.publish([row(this.label, this.component, message, this.of)])
  }
}

/** What a component declares of the payloads of a label. */
export interface Of {
  contract: Contract

  /** the property that names whose a row is; `null` where none does */
  identity: string | null

  /** the property that says when the change was made; `null` where none does */
  timestamp: string | null
}

// eslint-disable-next-line max-params
export function row(label: string, component: string, message: Message, of: Of): Row {
  const payload = object(message.payload)
  const { id, VERSION } = payload as Record<string, unknown>

  return {
    // a message from outside Toa carries no id, and is then the same message by what it says
    id: message.id ?? entities.derive(label, JSON.stringify(payload)),
    label,
    component,
    time: when(payload, message, of.timestamp),
    entity: typeof id === 'string' ? id : null,
    version: typeof VERSION === 'number' ? VERSION : null,
    identity: whose(payload, of.identity),
    trace: message.telemetry ?? null,
    payload: declared(label, payload, of.contract)
  }
}

/**
 * The entity as its state event renders it. One that does not say which entity it is, and which
 * version, cannot be kept, and no delivery of it will say otherwise: refused as a contract the
 * component broke, so it is parked on its first delivery rather than retried.
 */
// eslint-disable-next-line max-params
export function state(label: string, component: string, message: Message, of: Of): State {
  const payload = object(message.payload)
  const { id, VERSION } = payload as Record<string, unknown>

  if (typeof id !== 'string' || typeof VERSION !== 'number')
    throw new exceptions.EntityContractException(
      `The state '${label}' is an entity as it stands, and its payload carries no 'id' and 'VERSION'`
    )

  return {
    component,
    entity: id,
    version: VERSION,
    identity: whose(payload, of.identity),
    time: when(payload, message, of.timestamp),
    payload: declared(label, payload, of.contract)
  }
}

/**
 * When the change was made: what the payload says in the property the component names, or else
 * what the message says, which the process that made the change stamped as it made it. A message
 * of a process from before messages said so says nothing, and is when it is taken.
 */
function when(payload: object, message: Message, property: string | null): number {
  const said =
    property === null ? undefined : (payload as Record<string, unknown>)[property]

  if (typeof said === 'number') return said

  return message.time ?? Date.now()
}

/**
 * What the contract declares of a payload. One it does not admit is a contract the component broke,
 * which no delivery will mend: refused, so it is parked on its first delivery.
 */
function declared(label: string, payload: object, contract: Contract): object {
  try {
    return project(payload, contract.properties)
  } catch (exception) {
    if (exception instanceof Mismatch)
      throw new exceptions.EntityContractException(
        `The payload of '${label}' is not what its chronicles declare: ${exception.message}`
      )

    throw exception
  }
}

export type Kind = 'event' | 'state'

/** The identity a payload names in the property the component declares, where it is one. */
function whose(payload: object, property: string | null): string | null {
  if (property === null) return null

  const value = (payload as Record<string, unknown>)[property]

  return typeof value === 'string' ? value : null
}

function object(payload: unknown): object {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
    ? payload
    : { value: payload }
}
