'use strict'

const boot = require('../../runtime/boot/src/discovery')

const discover = async () => boot.discovery()

exports.discover = discover
