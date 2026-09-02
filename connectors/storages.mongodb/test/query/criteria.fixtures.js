const ast = {
  left: {
    type: 'SELECTOR',
    selector: 'id'
  },
  type: 'COMPARISON',
  operator: '==',
  right: {
    type: 'VALUE',
    value: 100500
  }
}

const criteria = {
  _id: { $eq: 100500 }
}

export { ast, criteria }
