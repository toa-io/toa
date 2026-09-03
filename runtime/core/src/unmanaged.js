import { Operation } from './operation.js'

export class Unmanaged extends Operation {
  acquire (context) {
    context.state = this.scope.storage.raw
  }
}
