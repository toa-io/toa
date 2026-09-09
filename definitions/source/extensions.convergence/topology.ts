import { CHANNEL } from './const.js'

/**
 * What a region's convergence broker must carry for the components a context converges, as
 * the broker's own definitions.
 *
 * A queue has to exist before the region it is for runs anything: federation propagates a
 * downstream binding up to the upstream, and until it does, what the other regions publish is
 * routed nowhere and dropped rather than held. So this is what an operator declares — when a
 * region is added, and before a converging component is deployed anywhere.
 *
 * The names are the binding's, and `connectors/bindings.amqp` asserts the same ones from the
 * same channel: a queue that already exists with other arguments makes that assertion fail,
 * which is why nothing here is settable.
 */
export function topology(labels: string[], vhost = DEFAULT): Topology {
  const exchanges = [INBOUND, OUTBOUND].map((name) => ({
    name,
    vhost,
    type: 'direct',
    durable: true,
    auto_delete: false,
    internal: false,
    arguments: {}
  }))

  const queues = labels.map((label) => ({
    name: queue(label),
    vhost,
    durable: true,
    auto_delete: false,
    arguments: {}
  }))

  const bindings = labels.map((label) => ({
    source: INBOUND,
    vhost,
    destination: queue(label),
    destination_type: 'queue',
    routing_key: label,
    arguments: {}
  }))

  return { exchanges, queues, bindings }
}

/**
 * The same thing as `rabbitmqadmin` invocations, for a broker whose management API is not
 * reachable. This is the tool's v1 grammar; v2, which ships with RabbitMQ 4, takes another
 * one entirely — which is why the definitions above are what this command answers with by
 * default, and these are asked for.
 */
export function commands(labels: string[], vhost = DEFAULT): string[] {
  const at = vhost === DEFAULT ? '' : ` --vhost=${vhost}`
  const lines: string[] = []

  for (const exchange of [INBOUND, OUTBOUND])
    lines.push(`rabbitmqadmin${at} declare exchange name=${exchange} type=direct durable=true`)

  for (const label of labels) {
    lines.push(`rabbitmqadmin${at} declare queue name=${queue(label)} durable=true`)

    lines.push(
      `rabbitmqadmin${at} declare binding source=${INBOUND} ` +
        `destination=${queue(label)} routing_key=${label}`
    )
  }

  return lines
}

/** The vhost of a broker the pointer names, which is where a definition goes. */
export function vhost(pointer: string | string[]): string {
  const uri = typeof pointer === 'string' ? pointer : pointer[0]
  const { pathname } = new URL(uri)

  // an AMQP URI names the vhost in its path, and one without a path is the default
  return pathname === '' ? DEFAULT : decodeURIComponent(pathname.slice(1))
}

/** The queue one component's records are consumed from. */
export function queue(label: string): string {
  return `${CHANNEL}.${label}`
}

export interface Topology {
  exchanges: object[]
  queues: object[]
  bindings: object[]
}

/** Where records from the other regions arrive, federated from each of their `out`. */
export const INBOUND = `${CHANNEL}.in`

/** Where a region publishes its own, and what the other regions federate from. */
export const OUTBOUND = `${CHANNEL}.out`

const DEFAULT = '/'
