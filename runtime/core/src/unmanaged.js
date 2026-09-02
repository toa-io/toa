import { Operation } from './operation.js'

class Unmanaged extends Operation {
  acquire (context) {
    context.state = this.scope.storage.raw
  }
}

export { Unmanaged }
