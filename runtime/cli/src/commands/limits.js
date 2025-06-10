'use strict'

const { limits } = require('../handlers/limits')

exports.command = 'limits'
exports.desc = 'Get resource limits for all pods in the current Kubernetes context'
exports.handler = limits
