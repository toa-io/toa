import { revision } from '@toa.io/definitions/extensions.configuration'
import { entry } from './map.ts'

/**
 * The latest configuration created for the component and the epoch; the deployed
 * defaults when none was, or when the latest is a reset; `null` when the epoch is not the one
 * deployed.
 */
export async function resolve(
  context: Context,
  component: string,
  epoch?: string
): Promise<Value | null> {
  const known = entry(component)

  epoch ??= known?.epoch

  if (epoch === undefined) return null

  // one query per pair, so that a component's latest is never behind another's newer ones
  const query: Query = {
    criteria: `component=="${component}";epoch=="${epoch}"`,
    sort: ['CREATED:desc'],
    limit: 1
  }

  const objects = await context.local.enumerate({ query })
  const latest = objects[0]

  if (latest !== undefined && (latest.revision ?? null) === null)
    return {
      configuration: latest.configuration,
      created: latest.CREATED,
      revision: null
    }

  // a reset stored the defaults of its deployment; those of this one are what it means
  if (known !== undefined && known.epoch === epoch)
    return {
      configuration: known.defaults ?? {},
      created: latest === undefined ? 0 : latest.CREATED,
      // what a component was deployed with tells this deployment's defaults from another's
      revision: revision(known.defaults)
    }

  return null
}

/**
 * A configuration and when it was created: `0` for the deployed defaults, unless a reset
 * brought them back. The defaults alone have a revision.
 */
export interface Value {
  configuration: object
  created: number
  revision: string | null
}

export interface Context {
  local: {
    enumerate: (request: { query: Query }) => Promise<Stored[]>
  }
}

interface Query {
  criteria: string
  sort: string[]
  limit: number
}

interface Stored {
  configuration: object
  revision?: string | null
  CREATED: number
}
