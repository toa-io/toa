import { generate } from 'randomstring'
import { split, type Annotation } from './annotation'

it('should split', async () => {
  const queue = 'amqp://' + generate()

  const annotation: Annotation = {
    '.props': { prop: true },
    queue
  }

  const { uris, properties } = split(annotation)

  expect(uris)
    .toStrictEqual({ queue })

  expect(properties)
    .toStrictEqual({ '.props': { prop: true } })
})
