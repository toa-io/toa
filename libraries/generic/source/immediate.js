/**
 * @returns {Promise<void>}
 */
export const immediate = async () => {
  return new Promise((resolve) => setImmediate(resolve))
}
