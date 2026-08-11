import { Computation } from './list'

it('aggregates only public credential properties', async () => {
  const operation = new Computation()
  const input = { authority: 'nex', identity: 'identity' }

  const context = {
    remote: {
      identity: {
        basic: {
          info: jest.fn(async () => ({ username: 'user@example.com' }))
        },
        federation: {
          list: jest.fn(async () => [{
            id: 'federation',
            iss: 'https://accounts.google.com',
            sub: 'secret-subject',
            _created: 1
          }])
        },
        passkeys: {
          list: jest.fn(async () => [{
            id: 'passkey',
            aid: 'aaguid',
            synced: true,
            label: 'Phone',
            _created: 2,
            key: 'public-key',
            counter: 10
          }])
        }
      }
    }
  }

  operation.mount(context)

  await expect(operation.execute(input)).resolves.toEqual({
    basic: { username: 'user@example.com' },
    federation: [{ id: 'federation', iss: 'https://accounts.google.com', _created: 1 }],
    passkeys: [{ id: 'passkey', aid: 'aaguid', synced: true, label: 'Phone', _created: 2 }]
  })

  expect(context.remote.identity.basic.info).toHaveBeenCalledWith({ input })
  expect(context.remote.identity.federation.list).toHaveBeenCalledWith({ input })
  expect(context.remote.identity.passkeys.list).toHaveBeenCalledWith({ input })
})
