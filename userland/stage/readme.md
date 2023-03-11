# Toa integration tests framework

## TL;DR

```javascript
const stage = require('@toa.io/userland/stage')

const component = await stage.component('dummies.dummy')
const reply = await component.invoke('do', { input: 'foo' })

await stage.shutdown()
```

See [examples](../example/stage).

## Component

`async component(path: string): toa.core.Component`

Boot the component.

> Components consuming events must be able to discover event sources, that is, either they must be
> booted after event sources are composed or within the same composition.

## Composition

`async composition(paths: string[]): void`

Boot the composition.

## Remote

`async remote(paths: string[]): toa.core.Component`

Connect the remote.

## Shutdown

`async sutdown(): void`

Shutdown all components, compositions and services.
