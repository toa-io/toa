function transition(input, objects) {
  let total = 0

  for (const object of objects) {
    object.foo += input.foo
    total += object.foo
  }

  return { total }
}

module.exports = { transition }
