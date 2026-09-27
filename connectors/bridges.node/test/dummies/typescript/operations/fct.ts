import { Transition } from './cls.ts'

export class EntryTransitionFactory {
  create(): Transition {
    return new Transition()
  }
}
