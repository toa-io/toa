# Cycle of Change

## TL;DR

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764528657645700&cot=14">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="4d-dark.png">
    <img alt="4D" width="400" height="455" src="4d-light.jpg">
  </picture>
</a>

- **Discussion**
    - Problem
    - Complexity
- **Documentation**
    - Manual
    - Scenarios
- **Decomposition**
    - Solution
    - Change Requests
- **Development**
    - Steps
    - Code

---

## Definition

> The goal of the Cycle is to help teams producing *simple[^1] non-broken[^2] software* in a fast
> and predictable way.

Cycle of making changes consists of four mandatory straight forward steps[^3]: discussion,
documentation, decomposition and development. Each iteration of the Cycle starts with the *input*,
which is a description of the customer needs, provided in arbitrary form.

[^1]: Meeting a common sense expectations.
[^2]: Meeting the requirements.
[^3]: Neither step may be skipped when going forward. Going backward is arbitrary.

## Discussion

Analyse the input to transform it into *correct*[^4], *consistent*[^5], *complete*[^6] and
*realizable*[^7] form, that is *strict* problem definition.

Discussion should have an artifact which is a document that should have the following sections:

<dl>
<dt>Abstract</dt>
<dd>
<i>Strict</i> abstract definition of <b>what</b> problem to be solved, and <b>how</b> it should be solved.
</dd>
<dt>Change Requests</dt>
<dd><i>Empty at this step.</i></dd>
<dt>Complexity</dt>
<dd>A number, which is abstract <a href="https://www.atlassian.com/agile/project-management/estimation">points estimation</a>.</dd>
<dt>Statements</dt>
<dd>List of <b>what is known</b>.</dd>
<dt>Questions</dt>
<dd>
List of <b>what is unknown</b>. At this step many questions may don't have an answer.
</dd>
<dt>Options</dt>
<dd><i>Empty at this step.</i></dd>
</dl>

> While given sequence of sections ensures comfortable reading later, it will be most likely hard or
> impossible to create the document in such order.

[^4]: Does not conflict with the input.
[^5]: Does not conflict with itself.
[^6]: Contains enough information for next steps of the Cycle.
[^7]: Able to be implemented.

## Documentation

Create the description from **end-user perspective**. Documentation must describe **how to use** the
feature yet to be implemented, not **how to implement** it.

Documentation step consists of two sequential processes: writing the user manual and scenarios.

### User Manual

Create or update User Manual. Form of this documentation part depends on type of software being
developed. In can be end-user manual, public API reference, interface of the library, etc.

The creation of the user manual is a crucial part of the Cycle. Note that at this point a concrete
solution is yet to be found, thus an author of the manual **is not bound to the upcoming
implementation complexity**.

Designing an end-user application interface without regard to the complexity of the implementation
is a key to producing a *simple software*. Thus, the end goal of writing user manual is to produce
a software that doesn't need a manual.

### Scenarios

Using the manual, describe expected software behaviour in
a [semi-formal format](https://en.wikipedia.org/wiki/Behavior-driven_development#Behavioral_specifications)
as a complete set of scenarios, using first-person narrative.

> ![Important](https://img.shields.io/badge/Important-red)<br/>
> Ensure the completeness of the set of scenarios as it is the iteration completion criteria.

At this point behaviour tests either failing or not executable due to missing implementation of new
steps.

> Failing or not executable behaviour tests are not the reason not to
> [commit](development.md#commits). Actually, failing behaviour tests is a permanent state of any
> feature branch until the iteration is completed.

## Decomposition

Find and describe the solution of the problem. As the result of decomposition discussion document
must be updated with:

- answers to all **questions**, and some answers should have become statements
- a list of considered **options**, starting with selected one and containing description of the
  selection criteria
- a list of **change requests**

### Change Requests

List of changes to be made at the most top-level available in the software being developed. Each
item basically should be the message for the future commit or pull request conforming the existent
commit message convention.

Example: `feat(cli): add option -e to toa export command`

## Development

### Implement Steps

Add missing step implementations until all new behaviour tests are executable and failing.

> ![Important](https://img.shields.io/badge/Important-red)<br/>
> Behaviour steps are programs, thus must be composed
> of [developer's units of work](development.md#unit-of-work).

### Write the Code

Add the implementation in compliance with the solution and according to the set of change
requests until scenarios are *green* and the feature branch is closed according to existent flow.

See [development requirements](development.md).

## Perfect Result

```gherkin
Feature: Confident Delivery
Given I am automatic workflow
  When changes have been pushed to a feature branch
  And all scenarios are green
  And there are no conflicts with default branch
  Then merge it to default branch
  And delete it
  And deploy default branch to production
```
