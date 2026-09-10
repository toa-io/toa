/**
 * Whether any operation of this component declares `once`, which is what decides that a place
 * to record a call is made at all. Local to the manifest, unlike the events something consumes,
 * so there is no variable a deployment computes.
 *
 * @param {toa.norm.Component} manifest
 * @returns {boolean}
 */
export const inbox = (manifest) =>
  Object.values(manifest.operations ?? {}).some((definition) => definition.once === true)
