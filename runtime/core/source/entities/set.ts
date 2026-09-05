import { SystemException } from '../exceptions.js'
import type { Entity } from './entity.js'
import type { Record } from '../types/storages.js'
import type { Event } from '../types/state.js'

export class EntitySet {
  readonly #set: Entity[]

  public constructor (set: Entity[]) {
    this.#set = set
  }

  public get (): Record[] {
    return this.#set.map((entity) => entity.get())
  }

  public set (values: Record[]): void {
    if (values.length !== this.#set.length)
      throw new SystemException('Objects array must not be modified')

    values.forEach((value, index) => this.#set[index].set(value))
  }

  public events (input?: object): Event[] {
    return this.#set.map((entity) => entity.event(input))
  }
}
