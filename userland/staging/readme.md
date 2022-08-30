# Toa integration tests framework

## TL;DR

```javascript

const component = await stage.component('dummies.dummy')

await stage.shutdown()
```

## Introduction

Staging is a Node.js framework. See [example](../example/test).

> Staging requires environment, that is, local RabbitMQ and used databases instances.

## Component

`async component(path: string): toa.core.Component`

Create an instance of [Component](/runtime/core/types/component.ts).

## Shutdown

`async sutdown(): void`

Shutdown all created components, compositions and services.
