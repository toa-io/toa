import { transformations as image } from './image'

export const transformations = {
  image,
  video: [() => null] // not implemented
} as const
