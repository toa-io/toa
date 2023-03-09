'use strict'

const { newid } = require('@toa.io/generic')

const id = () => {
  const id = newid()

  console.log(id)
}

exports.id = id
