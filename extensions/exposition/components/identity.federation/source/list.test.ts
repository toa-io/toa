import { computation } from './list'

it('lists indexed credentials', async () => {
  const current = { id: 'credential', authority: 'nex', identity: 'identity', iss: 'apple', sub: '1', _created: 2 }

  const context = {
    local: {
      enumerate: jest.fn(async () => [current])
    }
  }

  await expect(computation({ authority: 'nex', identity: 'identity' }, context as never))
    .resolves.toEqual([current])
  expect(context.local.enumerate).toHaveBeenCalledWith({
    query: {
      criteria: 'authority==nex;identity==identity',
      projection: ['iss'],
      sort: ['_created:desc'],
      limit: 100
    }
  })
})
