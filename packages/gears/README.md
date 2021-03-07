# Gears for Kookaburra

## yaml
Reads yaml file
```javascript
const { yaml } = require('@kookaburra/gears')

const object = yaml('./file.yaml')
```

## console
Console with levels and colors
```javascript
const { console } = require('@kookaburra/gears')

console.error('Something went wrong')
console.info('Printing information')

console.level('error')
console.debug('Starting with configuration', config) // won't log anything
```
