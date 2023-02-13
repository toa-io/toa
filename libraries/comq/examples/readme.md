# Examples

To run examples please start RabbitMQ server with `docker compose up -d` in the package root.

## RPC

Run in two terminals:

```shell
$ node exampels/rpc/producer
```

[source](rpc/producer.js)

```shell
$ node exampels/rpc/consumer
```

[source](rpc/consumer.js)

## Events

Run in multiple terminals:

```shell
$ node examples/events/consumer A
```

```shell
$ node examples/events/consumer B
```

```shell
$ node examples/events/producer
```

`A` and `B` are consumer groups.

> Try to run multiple instances with the same consumer group.
