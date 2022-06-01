'use strict'

const { newid } = require('@toa.io/gears')

const id = () => {
  const id = newid()

  console.log(id)
}

exports.id = id
