export function to (entity) {
  const { id, ...rest } = entity

  return /** @type {toa.mongodb.Record} */ { _id: id, ...rest }
}

export function from (record) {
  if (record === undefined || record === null)
    return null

  const { _id, ...rest } = record

  return { id: _id, ...rest }
}
