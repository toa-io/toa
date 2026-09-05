# Writing the guide

The rules every page follows. They exist so that a page is written once, in one way, and a
reader who has read one page knows how to read the next.

## A page answers one question

The question is the page's line in the [contents](readme.md), and the one place the guide speaks
for the reader: "How do I call another component?" The first paragraph of the page answers it;
the rest is what a reader needs to act on the answer. What does not serve the question belongs to
the page whose question it serves, or nowhere.

## A paragraph does one job

Its first sentence is the claim. The sentences after it are what the claim needs to be acted on:
a limit, a default, a consequence. A paragraph that only leads to the next one is deleted.
Nothing is told as a story: no history, no "first we", no "imagine".

## A page says how to use, not how it works

What to declare, what to call, what comes back, what has to be handled. A guarantee is written as
what it means for the code someone writes: "a missed interval is not made up, so select what is
still due rather than everything in its share". The mechanism it follows from, the names of what
runs inside, the state it keeps, belong beside the code.

A reason survives where it says what the reader decides. "There is no default: only the caller
knows whether a late call is still the right call" tells the reader what to state. A reason that
leaves them nothing to do is cut.

## Words

- The reader is not addressed. No "you", no "we", no "let's". The subject is the component, the
  operation, the application, the runtime, or the developer.
- Present tense, active voice. "The runtime persists the state", not "the state will be
  persisted".
- The [glossary](8-reference/glossary.md) names things. **Context**, capitalised, is the
  application `context.toa.yaml` declares; `context`, in code font, is the object an operation
  receives. The manifest key is `operations`; what it declares are operations; the directory is
  `operations/`.
- Everything literal is in code font: keys, values, file names, commands, variables, identifiers.
  A term is bold once, where it is defined. Italic marks one emphasised word, rarely.
- No filler: "simply", "just", "basically", "note that", "in order to". No praise: nothing is
  "powerful", "easy" or "flexible".
- "May" states a possibility the reader has to handle. "Should" does not appear: a rule is stated
  as what is, a recommendation as what ignoring it costs.

## Shape

```
# Title

The answer, in one paragraph.

## Section

## Section
```

The title is the thing, a noun phrase, not the question. A section is named after the thing it
covers or the claim it makes, in sentence case. `###` is the deepest level. No section is called
"Overview", "Introduction", "Summary", "Notes" or "See also".

Every page but the root ends with a footer after a `---` rule:

```
[← Entity](02-entity.md) · [Components](readme.md) · [Operations →](03-operations.md)
```

Previous, up, next. The first page of a part has the part's `readme.md` as previous; the last has
the next part's as next. The titles are the pages' own.

## Code

A declaration or a call is shown before it is explained: the block first, the prose after it.
The first line of a block names the file:

```yaml
# manifest.toa.yaml
operations:
  quote:
    output:
      type: number
```

A shell block shows the prompt and, where it matters, the output:

```shell
$ toa call orders.pricing.quote "{ input: { price: 12.5, quantity: 3 } }"
37.5
```

Every example runs as written. Examples share one domain, a shop taking orders, with components
in the `orders` namespace, so a name met on one page means the same on the next.

Prose names a file, a key or a command only where the reader has to go there. A list of options
is a table.

## Tables

A table lists things of one kind: keys, options, codes. It has a header row; the first column is
the name, in code font; the second says what it does, in one sentence.

## Links

Relative, to a guide page or to a file in the repository. The first mention of another page's
subject links to it, once per page; after that it is plain text. Link text is the subject, never
"here" or "this page". A file in the repository is linked where quoting it would be longer than
reading it.

## Lines

Hard-wrapped at 100 characters, as the repository is. A table row and a footer are one line
whatever their length. One blank line between blocks. A list item is one or two sentences; longer
is a paragraph.
