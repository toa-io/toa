import { described, type Described } from './described.js'

/**
 * What a resource or a method is, in the words an application chooses for it — read by
 * everything that describes one: `OPTIONS`, discovery, and the tools MCP publishes.
 *
 * The operation states what it is too, and that is not this. An operation is written
 * without knowledge of any route, and a method is an operation and a route together — the
 * same operation mounted twice is two methods, and one sentence is not true of both.
 */
export class Help {
  /** `node` says what the resource is; `method` what one of its methods is. */
  public readonly subject: Subject
  public readonly title: string | undefined
  public readonly description: string | undefined

  /**
   * Whether the method is described at all. `help:method: null` takes it out of every
   * answer — `OPTIONS`, discovery and the tools MCP publishes — and leaves it as callable
   * as it was: a route something else reaches for, and nobody is meant to go looking for.
   */
  public readonly hidden: boolean

  public constructor(subject: Subject, value: unknown) {
    if (!(value !== null || subject === 'method'))
      throw new Error(`Directive help:${subject}: only a method is hidden`)

    if (value === null) {
      this.subject = subject
      this.hidden = true

      return
    }

    const stated: Described = described(`help:${subject}`, value)

    this.subject = subject
    this.hidden = false
    this.title = stated.title
    this.description = stated.description
  }
}

export type Subject = 'node' | 'method'
