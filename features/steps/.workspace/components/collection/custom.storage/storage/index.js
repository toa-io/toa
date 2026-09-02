class Factory {
  /**
   *
   * @returns {toa.core.Connector}
   */
  storage () {
    return {
      id: '',
      connected: false,
      connect: () => undefined,
      disconnect: () => undefined,
      open: () => undefined,
      close: () => undefined,
      dispose: () => undefined,
      link: () => undefined,
      depends: () => undefined
    }
  }
}



export const deployment = (_, value) => {
  return {
    variables: {
      global: [{
        name: 'TOA_TEST_CUSTOM_STORAGE',
        value
      }]
    }
  }
}

export { Factory }
