import { $ } from './index'

jest.mock('node:child_process', () => ({
  exec: (command: string, callback: (...args: any[]) => any) => exec(command, callback)
}))

it('should call exec', async () => {
  await $`echo ok`

  expect(exec).toHaveBeenCalled()
  expect(exec.mock.calls[0][0]).toStrictEqual('echo ok')
})

it('should call exec with arguments', async () => {
  const c = 'echo'
  const a = 'ok'

  await $`${c} ${a}`

  expect(exec).toHaveBeenCalled()
  expect(exec.mock.calls[0][0]).toStrictEqual('echo ok')
})

// it('should pipe stdout and stderr', async () => {
//   await $`echo ok`
//
//   expect(stdout.pipe).toHaveBeenCalledWith(process.stdout)
//   expect(stderr.pipe).toHaveBeenCalledWith(process.stderr)
// })

const stdin = {
  write: jest.fn(),
  end: jest.fn()
}

const stdout = {
  pipe: jest.fn()
}

const stderr = {
  pipe: jest.fn()
}

const exec = jest.fn((command, callback) => {
  setImmediate(() => {
    callback(null)
  })

  return {
    stdin,
    stdout,
    stderr
  }
})
