import { Transition } from './cls.ts'

export class ObjectTransitionFactory {
  create (): Transition {
    return new Transition()
  }
}
