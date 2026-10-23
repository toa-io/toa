import { createVariables, normalize } from '@toa.io/pointer'
import { components } from './components.ts'
import { version } from '../version.ts'
import { BROKER, ID, INGEST, NAMESPACE, SERVICE, SETTINGS } from './const.ts'
import * as schemas from './schemas.ts'
import type { Annotation, Settings } from './types.ts'
import type { context } from '@toa.io/norm'
import type { Dependency, Service, Variable } from '@toa.io/operations'

/**
 * Every composition is given the broker it publishes to; the service that provisions ClickHouse
 * and serves the log is given ClickHouse as well, and its credentials go nowhere else.
 */
export function deployment(
  instances: context.Dependency[],
  annotation: Annotation | undefined
): Dependency {
  if (annotation === undefined) {
    // the components the extension ships are among them, and are not what declared anything
    const declaring = instances
      .filter((instance) => instance.locator.namespace !== NAMESPACE)
      .map((instance) => instance.locator.id)
      .join("', '")

    throw new Error(
      `Chronicles are declared by '${declaring}', and the context has no 'chronicles' annotation.`
    )
  }

  if (Array.isArray(annotation.broker))
    throw new Error(
      `Chronicles are carried by one broker, and the annotation names ${annotation.broker.length}.`
    )

  schemas.annotation.validate<Annotation>(annotation, 'Invalid chronicles annotation')

  const settings = read(annotation)

  const variables = createVariables(ID, normalize({ [BROKER]: annotation.broker }), [
    { group: GLOBAL, selectors: [BROKER] }
  ])

  const labels = components().labels.filter(
    (label) => settings.ingest || label !== `${NAMESPACE}-${INGEST}`
  )

  const service: Service = {
    group: NAMESPACE,
    name: SERVICE,
    version,
    components: labels,
    variables: [{ name: SETTINGS, value: JSON.stringify(settings) }, ...credentials()]
  }

  return { services: [service], variables }
}

/** The extension is deployed for the sake of the annotation, which a component need not name. */
export const standalone = true

function read(annotation: Annotation): Settings {
  const clickhouse =
    typeof annotation.clickhouse === 'string'
      ? { url: annotation.clickhouse }
      : annotation.clickhouse

  if (new URL(clickhouse.url).pathname.replace(/\//g, '') === '')
    throw new Error(
      'The ClickHouse address of chronicles names no database: its path is the database.'
    )

  return {
    clickhouse: { url: clickhouse.url, broker: clickhouse.broker ?? annotation.broker },
    retention: annotation.retention,
    ingest: annotation.ingest === true
  }
}

/** The writer, which provisions and defines views, and the password of the reader it creates. */
function credentials(): Variable[] {
  return KEYS.map((key) => ({
    name: `${SETTINGS}_CLICKHOUSE_${key.toUpperCase()}`,
    secret: { name: `toa-${ID}-clickhouse`, key }
  }))
}

const GLOBAL = 'global'
const KEYS = ['username', 'password', 'reader']
