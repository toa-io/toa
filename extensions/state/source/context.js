/**
 * What this extension puts on the context of a component that declares it. What a component
 * keeps there is its own, and nothing declares it.
 *
 * @returns {toa.core.extensions.Contribution}
 */
export function context () {
  return { name: 'state', type: 'Record<string, any>' }
}
