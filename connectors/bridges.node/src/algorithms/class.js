'use strict'

/** @type {toa.node.define.algorithms.Constructor} */
const create = (Class, context) => new Class(context)

exports.create = create
