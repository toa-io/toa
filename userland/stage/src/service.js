'use strict'

const boot = require('@toa.io/boot')
const { state } = require('./state')
const { shortcuts } = require('@toa.io/norm')

const service = async (ref) => {
  const path = shortcuts.resolve(ref)
  const { Factory } = require(path)
  const factory = new Factory(boot)
  const service = factory.service()

  await service.connect()

  state.services.push(service)

  return service
}

exports.service = service
