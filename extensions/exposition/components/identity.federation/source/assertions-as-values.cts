import * as assert from 'node:assert'

/**
 * Wrapping function that returns assertion errors as function return value
 */
export function assertionsAsValues<T extends (...args: any[]) => Promise<any>> (
  fn: T
) {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | Error> => {
    try {
      return await fn(...args)
    } catch (err) {
      console.error(err)

      if (err instanceof assert.AssertionError) return err

      throw err
    }
  }
}
