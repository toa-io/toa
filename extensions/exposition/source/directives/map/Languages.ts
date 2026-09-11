import { Property } from './Properties.ts'

export class Languages extends Property<'languages'> {
  public constructor(value: string[]) {
    if (!(Array.isArray(value) && value.length > 0))
      throw new Error('`map:languages` must be a non-empty array of strings')
    if (!value.every((language) => typeof language === 'string'))
      throw new Error('`map:languages` must be an array of strings')

    super('languages', value)
  }
}
