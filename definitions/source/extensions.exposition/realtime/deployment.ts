import { createVariables, type URIMap } from '@toa.io/pointer'
import { parse, type Declaration, type Route } from './routes.ts'
import { ROUTES, STREAMS } from './const.ts'
import type { Dependency, Instances, Variables } from '@toa.io/operations'

/**
 * Every component has realtime, so a route the context declares may be any component's. The
 * routes of each — its manifest's, and the context's for its events — are given to that component
 * alone, with the address of the Redis it writes them to.
 */
// the arguments every definition's deployment is called with
// eslint-disable-next-line max-params
export function deployment(
  instances: Instances<Declaration | null>,
  annotation?: Annotation,
  _?: unknown,
  annotations?: Record<string, unknown>
): Dependency {
  const declared = annotated(annotation)
  const variables: Variables = {}

  for (const { locator, manifest } of instances) {
    const routes = manifest === null || manifest === undefined ? [] : parse(manifest)
    const context = declared.get(locator.id) ?? []

    declared.delete(locator.id)

    // the context annotation takes precedence over the manifest
    for (const route of context) {
      const at = routes.findIndex(({ event }) => event === route.event)

      if (at === -1) routes.push(route)
      else routes[at] = route
    }

    if (routes.length === 0) continue

    const stash = annotations?.[STASH] as URIMap | undefined

    if (stash === undefined || stash === null)
      throw new Error(
        `Component '${locator.id}' routes events to realtime streams, which are kept in the ` +
          'Redis the `stash` annotation names, and the context has none'
      )

    const request = { group: locator.label, selectors: [STREAMS] }
    const redis = createVariables('stash', stash, [request])[locator.label]

    variables[locator.label] = [
      { name: ROUTES + locator.uppercase, value: JSON.stringify(routes) },
      ...redis
    ]
  }

  for (const component of declared.keys())
    throw new Error(
      `The realtime annotation routes events of '${component}', which is not deployed`
    )

  return { variables }
}

/** The context's routes, by the component whose events they are. */
function annotated(annotation?: Annotation): Map<string, Route[]> {
  const routes = new Map<string, Route[]>()

  if (annotation === undefined) return routes

  if ('resources' in annotation)
    throw new Error(
      '`realtime.resources` sizes nothing: realtime streams are served by the exposition gateway'
    )

  for (const route of parse(annotation as Declaration)) {
    const at = route.event.lastIndexOf('.')
    const component = route.event.slice(0, at)
    const list = routes.get(component) ?? []

    list.push({ ...route, event: route.event.slice(at + 1) })
    routes.set(component, list)
  }

  return routes
}

type Annotation = Declaration & { resources?: unknown }

const STASH = '@toa.io/extensions.stash'
