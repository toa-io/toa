import { shout } from '../lib/shout.ts'

interface Context {
  configuration: { foo: string }
}

export class Computation {
  #foo: string = ''

  async mount (context: Context): Promise<void> {
    this.#foo = context.configuration.foo
  }

  async execute (input: string): Promise<string> {
    return shout(input, this.#foo)
  }
}
