function transition (input, object) {
  Object.assign(object, input)
  object._deleted = null

  return object
}

exports.transition = transition
