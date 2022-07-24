'use strict'

class CapacityException extends Error {
  constructor () {
    super()

    this.message = 'Conveyor capacity exceeded'
  }
}

class ProcessorException extends Error {
  constructor () {
    super()

    this.message = 'Processor\'s result size doesn\'t match amount of units'
  }
}

exports.CapacityException = CapacityException
exports.ProcessorException = ProcessorException
