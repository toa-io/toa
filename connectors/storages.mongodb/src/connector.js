'use strict'

const { Storage } = require('@kookaburra/storage')
const { console } = require('@kookaburra/gears')

class Connector extends Storage {
  static name = 'MongoDB'

  async connection () {
    console.info(`Storage '${Connector.name}' connected`)
  }

  async disconnection () {
    console.info(`Storage '${Connector.name}' disconnected`)
  }

  async get () {
    return { _id: '123', _created: 1, _updated: 1, _deleted: 1, _version: 0, name: 'test' }
  }

  async find () {
    return [{ _id: '123', _created: 1, _updated: 1, _deleted: 1, _version: 0, name: 'test' }]
  }

  async persist (document) {
    console.log('persist', document)
    return true
  }
}

exports.Connector = Connector
