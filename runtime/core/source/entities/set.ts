import { SystemException } from '../exceptions.ts'
import type { Entity } from './entity.ts'
import type { Record } from '../types/storages.ts'
import type { Event } from '../types/state.ts'

export class EntitySet {
  /** what the algorithm receives, and once it has run, what of it is committed */
  #set: Entity[]

  public constructor(set: Entity[]) {
    this.#set = set
  }

  public get(): Record[] {
    return this.#set.map((entity) => entity.get())
  }

  public set(values: Record[]): void {
    if (values.length !== this.#set.length)
      throw new SystemException('Objects array must not be modified')

    // a discarded entity is left as it was read, and out of the commit
    this.#set = this.#set.filter((entity, index) => {
      const value = values[index]

      if (value.DISCARD === true) return false

      entity.set(value)

      return true
    })
  }

  public events(input?: object): Event[] {
    return this.#set.map((entity) => entity.event(input))
  }
}
