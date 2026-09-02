/**
 * @returns {Promise<void>}
 */
const immediate = async () => {
  return new Promise((resolve) => setImmediate(resolve))
}

export { immediate }
