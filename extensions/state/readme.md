# Toa State Extension

## TL;DR

```javascript
// Node.js Bridge
async function effect (input, context) {
  context.state.a = 1 // set value to the state
}

async function computation (input, context) {
  return context.state.a // get value from the state
}
```

## Definition

`State` is an initially empty object created when a Component instance starts running. It is shared
across Operations of that Component *instance*.
