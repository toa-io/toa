'use strict'

/**
 * Tells each component which of its events something consumes. An event nobody consumes gets
 * no emitter, no exchange and no outbox row, and a component none of whose events are consumed
 * gets no outbox at all.
 *
 * A component that declares events always gets the variable, empty when nothing is consumed —
 * an absent variable means every event, which is what a run without a deployment gets.
 *
 * @param {toa.norm.Context} context
 * @param {toa.deployment.Dependency} dependency
 */
function events (context, dependency) {
  const components = deployed(context)
  const consumed = collect(components, context.events, dependency.events)

  for (const { locator, events } of components) {
    if (events === undefined) continue

    const labels = Object.keys(events)
      .filter((label) => consumed.has(locator.id + '.' + label))

    dependency.variables[locator.label] ??= []

    dependency.variables[locator.label].push({
      name: VARIABLE + locator.uppercase,
      value: labels.join(' ')
    })
  }
}

/**
 * Every component this context deploys, its own and those its extensions bring. `components`
 * holds only the former; the latter reach a deployment as instances of what they depend on,
 * which is also how they are given the rest of their variables.
 */
function deployed (context) {
  const components = new Map()

  for (const instances of Object.values(context.dependencies ?? {}))
    for (const { component } of instances)
      components.set(component.locator.id, component)

  return [...components.values()]
}

/**
 * Everything that consumes an event of this context: the receivers of its own components, what
 * a dependency declares it consumes, and what the context says is consumed outside it.
 */
function collect (components, declared, contributed) {
  const consumed = new Set(declared ?? [])

  for (const label of contributed ?? []) consumed.add(label)

  for (const { receivers } of components)
    for (const [label, receiver] of Object.entries(receivers ?? {}))
      // a receiver with a source consumes from a foreign broker, not from this context
      if (receiver.source === undefined) consumed.add(label)

  return consumed
}

const VARIABLE = 'TOA_EVENTS_'

exports.events = events
