const { Collection } = require('./state/collection')
const { Connector } = require('./connector')
const { Factory: EntityFactory } = require('./entities/factory')
const { Invocation } = require('./invocation')
const { Locator } = require('./locator')
const { Operation } = require('./operation')
const { Runtime } = require('./runtime')
const { Schema } = require('./schemas/schema')
const { Object } = require('./state/object')
const { Validator } = require('./schemas/validator')

exports.entities = { Factory: EntityFactory }
exports.schemas = { Schema, Validator }
exports.state = { Object, Collection }

exports.Connector = Connector
exports.Invocation = Invocation
exports.Locator = Locator
exports.Operation = Operation
exports.Runtime = Runtime
