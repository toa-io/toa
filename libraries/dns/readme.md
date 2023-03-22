# Toa DNS Tools

## Deduplication

`async dedupe(...addresses: string[]): string[]`

Resolves DNS names to IP addresses and returns an array of unique URLs.

### Example

```javascript
import { dedupe } from '@toa.io/dns'

const inputs = [
  'amqp://github.com/?test=true',
  'amqp://github.com/?test=true',
  'amqp://github.com:5672'
]

const urls = await dedupe(inputs)

console.log(urls)

//   [
//     'amqp://20.207.73.82/?test=true',
//     'amqp://20.207.73.82:5672'
//   ]
```
