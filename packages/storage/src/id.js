'use strict'

const nanoid = require('nanoid')
const { alphanumeric } = require('nanoid-dictionary')

// noinspection JSCheckFunctionSignatures
const id = nanoid.customAlphabet(alphanumeric, 20)

exports.id = id
