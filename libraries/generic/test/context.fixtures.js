'use strict'

const { context } = require('../')

const increment = async (id) => {
  const storage = context(id)
  const value = storage.get()

  value.n++
}

exports.increment = increment
