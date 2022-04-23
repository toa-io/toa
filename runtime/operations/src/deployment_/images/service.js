'use strict'

const { join } = require('node:path')
const { Image } = require('./image')

class Service extends Image {
  dockerfile = join(__dirname, '../assets/Dockerfile.service')

  #service

  constructor (context, process, service) {
    super(context, process)

    this.#service = service
  }
}

exports.Service = Service
