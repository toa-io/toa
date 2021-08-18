'use strict'

const db = require('./setup/db')

let lab

const setup = async () => {
  if (lab) return lab

  lab = {}
  lab.db = await db.setup()

  return lab
}

const teardown = async () => {
  await db.teardown()
}

exports.setup = setup
exports.teardown = teardown
