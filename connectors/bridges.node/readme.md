# Node.js Bridge

> Currently, Node.js bridge only
> supports [CommonJS modules](https://nodejs.org/api/modules.html#modules-commonjs-modules).

## Algorithm Definition

Operation's algorithms are defined as CommonJS modules in under `operations` directory in the
component root. Algorithm module must export a function which is Algorithm Function, Class or
Factory. Module file name without extension is an operation name (endpoint).

### Function

```javascript
// operations/create.js

function transition (input, object, context) {
  // ...

  return { output: { foo: 'bar' } }
}

exports.transition = transition
```

Return value must match [UCP Response](#). If return value is an object without neither `output`
nor `error` properties, then it is considered as the value of `output`.

Next two return values are equivalent.

```javascript
return { ok: 1 }

return { output: { ok: 1 } } 
```

Exported function's name defines operation `type` property, thus must be one of:
`transition`, `observation`, or `assignment`. Second (state) argument name must be `object`,
or `objects`, as it defines operation's `target` property.

Following function signature defines operation of `observation` type targeted to a set of `objects`.

```javascript
// operations/set.js

function observation (input, objects) {
  // ...
}
```

See [Operation properties](#).

### Class

```javascript
// operations/transit.js

class Transition {
  constructor (context) {}

  execute (input, state) {
    // ...

    return { output: { foo: 'bar' } }
  }
}

exports.Transition = Transition
```

Exported function (class) name must be one of: `Transition`, `Observation`, or `Assignment`, as it
defines operation's `type` property.

### Factory

```javascript
class TransitionFactory {
  constructor (context) {}

  create () {
    // ...
  }
}

exports.TransitionFactory = TransitionFactory
```

`create` should return instance of [algorithm class](#class).

Exported function (class) name must be one of: `TransitionFactory`, `ObservationFactory`,
or `AssignmentFactory`, as it defines operation's `type` property.

### Storing Context

> Algorithm definition should store reference to the `context` object without copying its value
> type variables as they may change over time.
