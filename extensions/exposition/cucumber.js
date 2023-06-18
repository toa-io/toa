module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: ['./features/**/*.ts'],
    worldParameters: {
      origin: 'http://localhost:8000'
    }
  }
}
