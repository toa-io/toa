# Stream utilities

## TL;DR

```typescript
import { map, filter } from '@toa.io/streams'

function* generate () {
  for (let i = 0; i < 10; i++)
    yield i
}

const stream = new Stream(generate())
const even = filter(stream, (x) => x % 2 === 0)
const doubled = map(even, (x) => x * 2)
```
