export const ast = {
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

export const criteria = {
  _id: { $eq: 100500 }
}
