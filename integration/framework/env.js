'use strict'

let origin

const env = (value) => {
  if (value === undefined) restore()
  else set(value)
}

const set = (value) => {
  origin = process.env.TOA_ENV
  process.env.TOA_ENV = value
}

const restore = () => {
  process.env.TOA_ENV = origin
}

exports.env = env
