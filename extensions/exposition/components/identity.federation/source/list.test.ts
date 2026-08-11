import { computation } from './list'

it('lists indexed credentials and a legacy associated credential', async () => {
  const current = { id: 'credential', authority: 'nex', identity: 'identity', iss: 'apple', sub: '1', _created: 2 }
  const legacy = { id: 'identity', authority: 'nex', iss: 'google', sub: '2', _created: 1 }

  const context = {
    local: {
      enumerate: jest.fn(async () => [current]),
      observe: jest.fn(async () => legacy)
    }
  }

  await expect(computation({ authority: 'nex', identity: 'identity' }, context as never))
    .resolves.toEqual([current, legacy])
  expect(context.local.enumerate).toHaveBeenCalledWith({
    query: {
      criteria: 'authority==nex;identity==identity',
      projection: ['iss'],
      sort: ['_created:desc']
    }
  })
})
