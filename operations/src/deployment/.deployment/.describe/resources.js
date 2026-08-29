'use strict'

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
function resources (context, values) {
  for (const unit of units(values)) {
    // `null` is an answer and `undefined` is not one, so the fallback reads only the latter
    if (unit.deployment.resources === undefined)
      unit.deployment.resources = context.resources

    if (unit.deployment.resources === undefined)
      throw new Error(`${unit.subject} declares no resources. ` +
        'Declare them on it or as the context\'s \'resources\', ' +
        'or \'resources: null\' to deploy it without any.')
  }
}

function * units (values) {
  if (values.mono !== undefined)
    yield { deployment: values.mono, subject: 'The mono deployment' }

  for (const composition of values.compositions ?? [])
    yield { deployment: composition, subject: `Composition '${composition.name}'` }

  for (const service of values.services ?? [])
    yield { deployment: service, subject: `Service '${service.name}'` }
}

exports.resources = resources
