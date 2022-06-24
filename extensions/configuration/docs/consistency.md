# Configuration Consistency

## Problem Definition

At arbitrary moments when the configuration has changed, some distributed operations have started but haven't yet
finished. This leads to operations that start with certain configuration values but will finish with another, which may
result in logical problems.

Given that distributed operations may have arbitrary participants and last for an arbitrary period, there is no such
single moment when configuration can be safely changed. Thus, it must be a process.

## ~~Not a~~ Solution

1. Configuration is a single versioned object.
2. Configuration version value is included in the Uniform Communication Interface.
3. The first distributed operation participant (which is the one who has received a UCI without the configuration
   version value) must include in the outgoing UCI the configuration version value that it considers as current.
4. Non-first distributed operations participants (which is those who has received a UCI with the configuration version
   value) must use the configuration version specified in the UCI.
5. Non-first distributed operation participants must include in the outgoing UCI the same configuration version value as
   they received in the incoming.

## Restrictions

1. Configuration updates are always backward compatible.
2. Configuration updates are always being delivered before algorithm updates.
    1. Including federated deployment, that is: first deliver configuration to all facilities (data centers, zones,
       whatever), then deliver algorithm updates.
3. Configuration storage and access solution must provide the transactional updates, that is if any arbitrary
   participant observed a certain configuration version, then any other participant is guaranteed to be able to
   subsequently observe that version.
    1. Including federated deployment[^1].

## Solution

The configuration compatibility problem described above is a particular case of a common compatibility problem for
distributed operation participants. It is not the only configuration that may change while a distributed operation is
running, but participant algorithms themselves. This leads to the conclusion that this particular solution must be
propagated to algorithm versions, that is: which system (as a set of algorithms and configuration) version was used to
start the operation, and that system version must be used to finish the operation.

This kind of solution results in the need to run all versions of the system with appropriate message routing. The
implementation complexity of this solution and its operations costs are considered unreasonable. However, an attempt
will be made to implement this solution with a certain constraints [#147](https://github.com/toa-io/toa/issues/147).

The only *real* solution for the defined problem is to stick to forward- and backward-compatibility.

[^1]: Since it looks like there is no reasonable way to provide this kind of guarantee without significant performance
and/or availability impact, it may be implemented as a mechanism with read retries and with a timeout considered as
“enough for the most of fail-over scenarios”.
