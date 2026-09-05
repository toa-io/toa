import { entry } from './map.js'

/**
 * The latest configuration created for the component and the epoch; the deployed
 * defaults when none was; `null` when the epoch is not the one deployed.
 */
export async function resolve (context: Context, component: string, epoch?: string): Promise<Value | null> {
  const known = entry(component)

  epoch ??= known?.epoch

  if (epoch === undefined)
    return null

  // one query per pair, so that a component's latest is never behind another's newer ones
  const query: Query = {
    criteria: `component=="${component}";epoch=="${epoch}"`,
    sort: ['CREATED:desc'],
    limit: 1
  }

  const objects = await context.local.enumerate({ query })

  if (objects.length > 0)
    return { configuration: objects[0].configuration, created: objects[0].CREATED }

  if (known !== undefined && known.epoch === epoch)
    return { configuration: known.defaults ?? {}, created: 0 }

  return null
}

/** A configuration and when it was created; `0` for the deployed defaults. */
export interface Value {
  configuration: object
  created: number
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
  CREATED: number
}
