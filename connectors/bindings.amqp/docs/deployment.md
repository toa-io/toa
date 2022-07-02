# Deployment

AMQP binding requires RabbitMQ broker available from the cluster. Note, that AMQP is a system
binding, that is being used by the runtime.

> ![Warning](https://img.shields.io/badge/Warning-yellow)<br/>
> By default, a single instance of broker is deployed within the cluster which is strongly **not**
> recommended for production.

## External Brokers

AMQP deployment may be annotated with [proxies annotation](#).

