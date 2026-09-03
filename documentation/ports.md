# Reserved Ports

A port is claimed by one service only. `toa export` fails when two claim the same one:

```
Port 8001 is claimed by both the readiness probe and the readiness probe of 'exposition-gateway'
```

In Kubernetes these are separate pods and would not collide, but `toa mono` and a local run put
every service in one process.

| Port   | Claimed by                                    |
|--------|-----------------------------------------------|
| `8000` | Exposition gateway                            |
| `8001` | Telemetry readiness probe                     |
| `8002` | Introspection UI                              |
| `8003` | Configuration UI                              |
| `8004` | Exposition readiness probe                    |

The Exposition gateway answers its own probe, rather than the Telemetry one, because that probe
tracks the composition nested in the gateway process, which connects before route discovery has
settled. It is on a port of its own because kubelet speaks HTTP/1.1 and a gateway serving `h2c`
answers nothing else on the port it serves traffic on — see [protocol support](../extensions/exposition/documentation/protocol.md).

An extension of your own that runs a service picks a port not listed here.
