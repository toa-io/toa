# Documentation Guide

This file records the editorial decisions that guide writing and reviewing Toa documentation.
Keep it updated as those decisions are made, so the same feedback does not have to be repeated
across documents. It is guidance for authors, not a chapter of the reader's introduction to Toa.

## Details belong where the reader needs them

Choose details according to the reader's current step in learning Toa. A detail belongs when it
helps them understand the idea being introduced, see its value, or connect it to something the
documentation has just explained.

For example, after saying that the runtime validates contracts, show an operation's input schema.
The schema makes that benefit concrete: the reader sees what the application declares and what
the runtime validates. Removing it breaks the connection between the promise and the example.
Contracts and schemas are central to understanding Toa, including in the introductory chapters.

Module formats, imports, generated type files, and build requirements do not help explain that
benefit. Introduce them when the reader reaches the task that needs them. The same applies to
extension settings and protocol details: an overview explains what a capability contributes to
the application; its own chapter explains how to configure and use it.

Examples serve the explanation. They may omit imports, type declarations, and setup needed to
run or typecheck them. Use meaningful types such as `Event<Order>` without defining them when
their names communicate what the reader needs. File-name comments are useful for distinguishing
Context and component manifests; operation examples do not need them.

When reviewing a passage, ask what the reader is learning at this point and how each detail
supports that understanding. Preserve examples that substantiate a benefit or explain a concept.
Defer details whose purpose only becomes relevant later. Apply this review across the document,
not just to the fragment that received feedback.

## Introduce capabilities before their implementation categories

Early chapters introduce what a reader can do with Toa: configure an application, expose an HTTP
API, schedule work, or inspect how components interact. Organize these explanations around those
capabilities. Calling them extensions introduces a platform concept the reader does not yet need.

Configuration is itself an extension, so placing a Configuration section beside an Extensions
section also suggests a distinction that does not exist. Use sections such as Configuration and
HTTP API instead. Introduce extensions as a mechanism when the reader reaches platform
extensibility, after they understand the capabilities it provides.
