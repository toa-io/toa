import { Nope, type Nopeable } from './index'

function divide (a: number, b: number): Nopeable<number> {
  if (b === 0)
    return new Nope(0, 'Cannot divide by zero')
  else
    return a / b
}

it('should run', async () => {
  expect(divide(4, 2)).toStrictEqual(2)
})

it('should return Nope', async () => {
  const result = divide(4, 0)

  expect(result).toBeInstanceOf(Nope)
})
