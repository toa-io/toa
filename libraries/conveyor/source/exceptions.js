export class ProcessorException extends Error {
  constructor () {
    super()

    this.message = 'Processor\'s result size doesn\'t match amount of units'
  }
}
