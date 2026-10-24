import { Connector, entities, exceptions } from '@toa.io/core'
import { Mismatch, project } from './contract.ts'
import type { Writer } from './Writer.ts'
import type { Row, State } from './Provider.ts'
import type { Contract } from '@toa.io/definitions/extensions.chronicles'
import type { Message } from '@toa.io/core/types'

/**
 * The consumer of one event the log is kept of: a row of `events` for an event a component declares
 * under `events`, and a state for the one it declares its `state`. A message carries what the event
 * rendered and its id, so what is said of the entity — which, its version, when — is read from
 * the payload, where the entity as it stands carries `id`, `VERSION` and `UPDATED`; what is written
 * of the payload is what the contract declares.
 */
export class Recorder extends Connector {
  private readonly label: string
  private readonly component: string
  private readonly kind: Kind
  private readonly identity: string | null
  private readonly contract: Contract
  private readonly writer: Writer

  /** `identity` is the property of the payload that names whose a row is, where the component has one */
  // eslint-disable-next-line max-params
  public constructor(
    label: string,
    kind: Kind,
    identity: string | null,
    contract: Contract,
    writer: Writer
  ) {
    super()

    this.label = label
    this.component = label.slice(0, label.lastIndexOf('.'))
    this.kind = kind
    this.identity = identity
    this.contract = contract
    this.writer = writer
  }

  public async receive(message: Message): Promise<void> {
    if (this.kind === 'state')
      await this.writer.write(
        [],
        [state(this.label, this.component, message, this.contract, this.identity)]
      )
    else
      await this.writer.write([
        row(this.label, this.component, message, this.contract, this.identity)
      ])
  }
}

// eslint-disable-next-line max-params
export function row(
  label: string,
  component: string,
  message: Message,
  contract: Contract,
  identity: string | null = null
): Row {
  const payload = object(message.payload)
  const { id, VERSION, UPDATED } = payload as Record<string, unknown>

  return {
    // a message from outside Toa carries no id, and is then the same message by what it says
    id: message.id ?? entities.derive(label, JSON.stringify(payload)),
    label,
    component,
    time: typeof UPDATED === 'number' ? UPDATED : Date.now(),
    entity: typeof id === 'string' ? id : null,
    version: typeof VERSION === 'number' ? VERSION : null,
    identity: whose(payload, identity),
    trace: message.telemetry ?? null,
    payload: declared(label, payload, contract)
  }
}

/**
 * The entity as its state event renders it. One that does not say which entity it is, and which
 * version, cannot be kept, and no delivery of it will say otherwise: refused as a contract the
 * component broke, so it is parked on its first delivery rather than retried.
 */
// eslint-disable-next-line max-params
export function state(
  label: string,
  component: string,
  message: Message,
  contract: Contract,
  identity: string | null = null
): State {
  const payload = object(message.payload)
  const { id, VERSION, UPDATED } = payload as Record<string, unknown>

  if (typeof id !== 'string' || typeof VERSION !== 'number')
    throw new exceptions.EntityContractException(
      `The state '${label}' is an entity as it stands, and its payload carries no 'id' and 'VERSION'`
    )

  return {
    component,
    entity: id,
    version: VERSION,
    identity: whose(payload, identity),
    time: typeof UPDATED === 'number' ? UPDATED : Date.now(),
    payload: declared(label, payload, contract)
  }
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
