# Toa Cache Extension

## TL;DR

```javascript
// operation `set`
async function transition (input, none, context) {
  context.cache.a = 1
}

// operation `get`
async function observation (input, none, context) {
  return context.cache.a // 1
}
```

## Definition

`Cache` is an initially empty object created when a component instance starts running. It is shared
across operations of that component *instance*[^1].

[^1]: it is **not** shared across component instances.
