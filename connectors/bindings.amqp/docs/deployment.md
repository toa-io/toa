# Deployment

AMQP binding requires RabbitMQ broker available from the cluster. As AMQP is a system binding, that
is being used by the runtime, so at least one broker must be provisioned.

AMQP deployment must be declared
by [proxy set annotation](/../../libraries/annotations/readme.md) with a `system` extension, which
value must be the host of the broker to be used by runtime. Either `system` or `default` hosts must
be defined.


