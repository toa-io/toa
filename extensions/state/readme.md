# Toa State Extension

## TL;DR

```javascript
// operation `set`
async function transition (input, none, context) {
  context.state.a = 1
}

// operation `get`
async function observation (input, none, context) {
  return context.state.a // 1
}
```

## Definition

`State` is an initially empty object created when a Component instance starts running. It is shared
across Operations of that Component *instance*.
