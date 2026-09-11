/**
 * Every deployment states what it may take. One that states nothing is `BestEffort`: the
 * first evicted under memory pressure and the last given CPU under contention — which on
 * a busy node is slow enough for its own startup probe to kill it, in a loop, while the
 * chart reports nothing wrong. That is not a thing to find out in production.
 *
 * A deployment takes its own declaration, or the context's `resources` where it has none.
 * Deploying without any is a decision rather than an omission, and it is spelled
 * `resources: null` — at either place.
 */
export function resources(context, values) {
  for (const unit of units(values, evicted(context))) {
    // `null` is an answer and `undefined` is not one, so the fallback reads only the latter
    if (unit.deployment.resources === undefined)
      unit.deployment.resources = context.resources

    if (unit.deployment.resources === undefined)
      throw new Error(
        `${unit.subject} declares no resources. ` +
          "Declare them on it or as the context's 'resources', " +
          "or 'resources: null' to deploy it without any."
      )

    heap(unit.deployment)
  }
}

/**
 * The memory limit sizes the heap. Node reads the machine's memory rather than the
 * container's, so without this the heap grows past the limit and the pod is killed instead
 * of collected. What is left of the limit is the process itself: its code, its buffers and
 * its threads. A deployment that states `NODE_OPTIONS` of its own keeps them.
 */
function heap(deployment) {
  const limit = deployment.resources?.memory?.[1]

  if (limit === undefined) return

  deployment.variables ??= []

  if (deployment.variables.some((variable) => variable.name === NODE_OPTIONS)) return

  const megabytes = Math.floor((quantity(limit) * HEAP_SHARE) / 2 ** 20)

  deployment.variables.push({
    name: NODE_OPTIONS,
    value: `--max-old-space-size=${megabytes}`
  })
}

/**
 * A Kubernetes quantity, in bytes.
 *
 * @param {string | number} value
 * @returns {number}
 */
export function quantity(value) {
  const match = String(value).match(/^(\d+(?:\.\d+)?)([KMGTPE]i?|[kmun])?$/)

  if (match === null) throw new Error(`'${value}' is not a quantity`)

  const [, number, suffix = ''] = match
  const scale = SUFFIXES[suffix]

  if (scale === undefined) throw new Error(`'${value}' is not a memory quantity`)

  return Number(number) * scale
}

const NODE_OPTIONS = 'NODE_OPTIONS'
const HEAP_SHARE = 0.75

const SUFFIXES = {
  '': 1,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
  Pi: 2 ** 50,
  Ei: 2 ** 60
}

/**
 * The labels of the components the context evicts, whether or not the eviction was applied:
 * `toa env -c` does not apply it, since a local run of an evicted component still needs its
 * variables.
 *
 * @returns {Set<string>}
 */
function evicted(context) {
  const ids = new Set(context.evicted?.components ?? [])

  return new Set(
    (context.components ?? [])
      .filter(({ locator }) => ids.has(locator.id))
      .map(({ locator }) => locator.label)
  )
}

function* units(values, evicted) {
  if (values.mono !== undefined)
    yield { deployment: values.mono, subject: 'The mono deployment' }

  for (const composition of values.compositions ?? []) {
    // a composition of what the context evicts is here only for a local run of it, and Toa
    // deploys none of it, so nothing asks what it may take
    if (
      composition.components?.length > 0 &&
      composition.components.every((label) => evicted.has(label))
    )
      continue

    yield { deployment: composition, subject: `Composition '${composition.name}'` }
  }

  for (const service of values.services ?? []) {
    // a service a composition runs has no deployment of its own to size; the composition
    // it runs in states what the pod may take
    if (service.workload !== undefined) continue

    yield { deployment: service, subject: `Service '${service.name}'` }
  }
}
