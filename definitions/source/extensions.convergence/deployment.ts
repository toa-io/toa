import { createVariables, normalize } from '@toa.io/pointer'
import { BINDING, BROKERS, ID, REGION } from './const.js'
import type { Declaration } from './declaration.js'
import type { context } from '@toa.io/norm'
import type { Dependency, Variable } from '@toa.io/operations'

/**
 * A deployment is one region, and the environment is which one: what a context declares under
 * `convergence@eu` is what deploying `eu` reads, and the regions share nothing. So there is
 * no table here and none reaches the runtime — the rank to stamp, the binding, and this
 * region's brokers do, and a record says for itself which region wrote it.
 */
export function deployment(_: context.Dependency[], annotation: Declaration): Dependency {
  const region = read(annotation)

  const global: Variable[] = [
    { name: REGION, value: String(region.priority) },
    { name: BINDING, value: provider(region) }
  ]

  const variables = createVariables(ID, normalize({ [BROKERS]: region.binding.pointer }), [
    { group: GLOBAL, selectors: [BROKERS] }
  ])

  variables[GLOBAL] = (variables[GLOBAL] ?? []).concat(global)

  return { variables }
}

function read(annotation: Declaration): Declaration {
  if (!Number.isInteger(annotation?.priority) || annotation.priority < 0)
    throw new Error(
      'Convergence declares a priority, which is this region\'s rank: a whole number where ' +
        'zero outranks one, and the same in every region.'
    )

  if (annotation.binding?.pointer === undefined)
    throw new Error('Convergence declares the brokers this region converges over.')

  return annotation
}

function provider(region: Declaration): string {
  const declared = region.binding.provider ?? AMQP

  return PROVIDERS[declared] ?? declared
}

const GLOBAL = 'global'
const AMQP = 'amqp'

/** RabbitMQ is the only binding that carries a channel. */
const PROVIDERS: Record<string, string> = { [AMQP]: '@toa.io/bindings.amqp' }
