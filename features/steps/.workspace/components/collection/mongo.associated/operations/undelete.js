export function transition (input, object) {
  Object.assign(object, input)
  object.DELETED = null

  return object
}
