'use strict'

const { newid } = require('@toa.io/libraries/generic')

const id = () => {
  const id = newid()

  console.log(id)
}

exports.id = id
