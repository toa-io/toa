'use strict'

/**
 * @typedef {(name: string, property: Object) => string} Ref
 */

/** @type {Ref} */
const id = (name) => `${name} char(32) primary key`

const refs = {
  'https://schemas.toa.io/0.0.0/definitions#/definitions/id': id
}

exports.refs = refs
