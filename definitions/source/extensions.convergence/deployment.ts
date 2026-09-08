import { environment } from '@toa.io/generic'
import { createVariables, normalize } from '@toa.io/pointer'
import { BINDING, BROKERS, ID, REGION, SELECTOR } from './const.js'
import type { Declaration, Region } from './declaration.js'
import type { context } from '@toa.io/norm'
import type { Dependency, Variable } from '@toa.io/operations'

/**
 * One context declares every region there is, and a deployment is one of them. Which one is
 * read here and nowhere else: the runtime is told the rank to stamp and the brokers to carry
 * a channel over, and never the table.
 */
export function deployment(_: context.Dependency[], annotation: Declaration): Dependency {
  const regions = read(annotation)
  const name = environment.get(SELECTOR)

  if (name === undefined)
    throw new Error(
      `${SELECTOR} is not set. A context that declares convergence is deployed as one of ` +
        `its regions: ${quoted(regions)}.`
    )

  const region = regions.find((one) => one.region === name)

  if (region === undefined)
    throw new Error(
      `${SELECTOR} names '${name}', which the convergence declaration does not carry. ` +
        `It declares ${quoted(regions)}.`
    )

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

/**
 * The declaration, refused where it could not order the regions it names. Two regions of one
 * rank have no order between them, and two of one name are one region twice.
 */
function read(annotation: Declaration): Region[] {
  if (!Array.isArray(annotation) || annotation.length === 0)
    throw new Error('Convergence is declared as the list of regions there are.')

  const names = new Set<string>()
  const priorities = new Set<number>()

  for (const region of annotation) {
    if (typeof region?.region !== 'string' || region.region === '')
      throw new Error('A convergence region declares the name it is deployed as.')

    if (!Number.isInteger(region.priority) || region.priority < 0)
      throw new Error(
        `Convergence region '${region.region}' declares a priority, which is a rank: a ` +
          'whole number where zero outranks one.'
      )

    if (region.binding?.pointer === undefined)
      throw new Error(
        `Convergence region '${region.region}' declares the brokers it converges over.`
      )

    if (names.has(region.region))
      throw new Error(`Convergence declares the region '${region.region}' twice.`)

    if (priorities.has(region.priority))
      throw new Error(
        `Convergence declares the priority ${region.priority} twice, and two regions of one ` +
          'rank cannot be told apart where they write the same version of one record.'
      )

    names.add(region.region)
    priorities.add(region.priority)
  }

  return annotation
}

function provider(region: Region): string {
  const declared = region.binding.provider ?? AMQP

  return PROVIDERS[declared] ?? declared
}

function quoted(regions: Region[]): string {
  return regions.map((one) => `'${one.region}'`).join(', ')
}

const GLOBAL = 'global'
const AMQP = 'amqp'

/** RabbitMQ is the only binding that carries a channel. */
const PROVIDERS: Record<string, string> = { [AMQP]: '@toa.io/bindings.amqp' }
