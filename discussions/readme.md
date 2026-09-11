# Discussions

A discussion is the design of one change, in a document named after it. What is asked for is
analysed into a _correct_[^1], _consistent_[^2], _complete_[^3] and _realizable_[^4] form, that is
a _strict_ problem definition.

## Structure

1. **Design concept.** What changes, stated as what holds once it is done.
   - **Guarantees.** Numbered, grouped by what they are about, and ending with what is not promised.
     A guarantee that already holds is marked *(today)*.
   - **What a component author does differently.** What they declare and call, with an example.
2. **The changes, by area.** Numbered, one area each, documentation included.
3. **Decisions.** Each choice made, and what it was chosen over.
4. **Context.** What the change follows from, and the discussions it relates to.
5. **What happens today.** The behaviour the change replaces.
6. **Stages.** Numbered, in the order they are built.
7. **Verification.** The scenarios, each a requirement someone depends on.
8. **Compatibility.** On the wire, in types and in behaviour.
9. **References.** The patterns and standards the design uses.

A section with nothing to say is left out.

[^1]: Does not conflict with what is asked for.

[^2]: Does not conflict with itself.

[^3]: Contains enough information for the steps that follow.

[^4]: Can be implemented.
