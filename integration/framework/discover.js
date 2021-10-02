'use strict'

const discovery = require('../../runtime/boot/src/discovery')

const discover = async (id) => discovery.explore(id)

exports.discover = discover
