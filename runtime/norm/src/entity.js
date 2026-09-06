/**
 * What a component declares about its records is a property map and a list of the properties a
 * whole one has. A validator wants a schema, so it is assembled here rather than declared: one
 * that a stored record must fit, and one for a changeset, which is whatever subset of the same
 * properties an assignment writes.
 */
export const schema = (entity) => entity.required === undefined
  ? changeset(entity)
  : { type: 'object', properties: entity.properties, required: entity.required }

export const changeset = (entity) => ({
  type: 'object',
  properties: entity.properties
})
