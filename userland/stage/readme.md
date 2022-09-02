# Toa integration tests framework

## TL;DR

```javascript

const component = await stage.component('dummies.dummy')

await stage.shutdown()
```

## Introduction

Stage is a Node.js framework. See [example](../example/tests).

> Stage requires environment, that is, local RabbitMQ and used databases instances.

## Component

`async component(path: string): toa.core.Component`

Boot Component.

> Components consuming events must be able to discover event sources, that is, either they must be
> booted after event sources are composed or within the same composition.

## Composition

`async composition(paths: string[]): void`

Boot Composition.

## Remote

`async component(paths: string[]): toa.core.Component`

Connect Remote.

## Shutdown

`async sutdown(): void`

Shutdown all components, compositions and services.
