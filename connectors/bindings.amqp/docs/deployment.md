# Deployment

AMQP binding requires RabbitMQ broker available from the cluster. As AMQP is a system binding, that
is being used by the runtime, so at least one broker must be provisioned.

AMQP deployment must be declared
by [proxy set annotation](/../../libraries/annotations/readme.md) with a `system` extension, which
value must be the host of the broker to be used by runtime. Either `system` or `default` hosts must
be defined.

## Foreign Messages

*Foreign messages* are produced outside the context and thus may not conform
to [UCP](/../../documentation/communication/ucp.dm). As sources of foreign messages may not be
discovered, components consuming foreign messages must
define [receivers](/../../documentation/components/receivers.md) with explicit binding to prevent
discovery attempts.

